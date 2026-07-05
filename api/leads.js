const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const MAX_BODY_BYTES = 32 * 1024;
const LOCAL_LEADS_FILE = process.env.LEADS_FILE || path.join(process.cwd(), 'data', 'leads.jsonl');

module.exports = async function handler(req, res) {
  const originAllowed = setJsonHeaders(req, res);

  if (!originAllowed) {
    sendJson(res, 403, { ok: false, message: '허용되지 않은 도메인입니다.' });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, message: 'POST 요청만 지원합니다.' });
    return;
  }

  try {
    const payload = await readPayload(req);
    const lead = normalizeLead(payload || {});

    if (lead.website) {
      sendJson(res, 200, { ok: true });
      return;
    }

    const record = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      brand: lead.brand,
      instagram: lead.instagram,
      referenceVideo: lead.referenceVideo,
      email: lead.email,
      source: 'kiwi-landing',
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
    };

    await saveLead(record);
    sendJson(res, 201, { ok: true, id: record.id });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    sendJson(res, statusCode, {
      ok: false,
      message: statusCode >= 500
        ? '신청 정보를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.'
        : error.message,
    });
  }
};

async function saveLead(record) {
  if (process.env.LEADS_WEBHOOK_URL) {
    await sendWebhook(record);
    return;
  }

  if (process.env.VERCEL) {
    const error = new Error('LEADS_WEBHOOK_URL 환경 변수가 필요합니다.');
    error.statusCode = 500;
    throw error;
  }

  await appendLocalLead(record);
}

async function sendWebhook(record) {
  const body = { ...record };
  if (process.env.LEADS_WEBHOOK_SECRET) {
    body.webhookSecret = process.env.LEADS_WEBHOOK_SECRET;
  }

  const response = await fetch(process.env.LEADS_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const responseBody = await response.json().catch(() => null);

  if (!response.ok || (responseBody && responseBody.ok === false)) {
    const error = new Error('리드 저장 웹훅 호출에 실패했습니다.');
    error.statusCode = 502;
    throw error;
  }
}

async function appendLocalLead(record) {
  await fs.promises.mkdir(path.dirname(LOCAL_LEADS_FILE), { recursive: true });
  await fs.promises.appendFile(LOCAL_LEADS_FILE, `${JSON.stringify(record)}\n`, 'utf8');
}

async function readPayload(req) {
  const contentType = req.headers['content-type'] || '';

  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (req.body && typeof req.body === 'string') {
    return parseRawPayload(req.body, contentType);
  }

  const rawBody = await readRawBody(req);

  if (!rawBody) {
    const error = new Error('입력값이 비어 있습니다.');
    error.statusCode = 400;
    throw error;
  }

  return parseRawPayload(rawBody, contentType);
}

function parseRawPayload(rawBody, contentType) {
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(rawBody);
    } catch (parseError) {
      const error = new Error('JSON 형식이 올바르지 않습니다.');
      error.statusCode = 400;
      throw error;
    }
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(rawBody));
  }

  const error = new Error('지원하지 않는 제출 형식입니다.');
  error.statusCode = 415;
  throw error;
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let body = '';

    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      size += Buffer.byteLength(chunk);
      if (size > MAX_BODY_BYTES) {
        const error = new Error('입력값이 너무 큽니다.');
        error.statusCode = 413;
        reject(error);
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function normalizeLead(payload) {
  const lead = {
    brand: clean(payload.brand),
    instagram: clean(payload.instagram),
    referenceVideo: clean(payload.reference_video || payload.referenceVideo),
    email: clean(payload.email),
    website: clean(payload.website),
  };

  assertRequired(lead.brand, '브랜드명을 입력해 주세요.');
  assertRequired(lead.instagram, '브랜드 SNS 링크를 입력해 주세요.');
  assertRequired(lead.email, '이메일을 입력해 주세요.');
  assertLength(lead.brand, 120, '브랜드명이 너무 깁니다.');
  assertLength(lead.instagram, 500, '브랜드 SNS 링크가 너무 깁니다.');
  assertLength(lead.referenceVideo, 500, '참고 영상 링크가 너무 깁니다.');
  assertLength(lead.email, 254, '이메일이 너무 깁니다.');

  if (!isValidUrl(lead.instagram)) {
    throwBadRequest('브랜드 SNS 링크 형식을 확인해 주세요.');
  }

  if (lead.referenceVideo && !isValidUrl(lead.referenceVideo)) {
    throwBadRequest('참고 영상 링크 형식을 확인해 주세요.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    throwBadRequest('이메일 형식을 확인해 주세요.');
  }

  return lead;
}

function clean(value) {
  return String(value || '').trim();
}

function assertRequired(value, message) {
  if (!value) {
    throwBadRequest(message);
  }
}

function assertLength(value, max, message) {
  if (value && value.length > max) {
    throwBadRequest(message);
  }
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function throwBadRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : '';
}

function setJsonHeaders(req, res) {
  const requestOrigin = req.headers.origin || '';
  const allowedOrigins = getAllowedOrigins();

  if (allowedOrigins.length && requestOrigin && !allowedOrigins.includes(requestOrigin)) {
    return false;
  }

  if (requestOrigin) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return true;
}

function getAllowedOrigins() {
  return String(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      try {
        return new URL(origin).origin;
      } catch (error) {
        return origin;
      }
    });
}

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.end(JSON.stringify(body));
}
