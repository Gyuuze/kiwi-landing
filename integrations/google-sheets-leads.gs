const SHEET_NAME = 'leads';

function doPost(e) {
  const data = JSON.parse((e.postData && e.postData.contents) || '{}');
  const properties = PropertiesService.getScriptProperties();
  const expectedSecret = properties.getProperty('LEADS_WEBHOOK_SECRET');

  if (expectedSecret && data.webhookSecret !== expectedSecret) {
    return json({ ok: false, message: 'Unauthorized' });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['createdAt', 'id', 'brand', 'instagram', 'referenceVideo', 'email', 'source', 'ip', 'userAgent']);
  }

  sheet.appendRow([
    data.createdAt || new Date().toISOString(),
    data.id || '',
    data.brand || '',
    data.instagram || '',
    data.referenceVideo || '',
    data.email || '',
    data.source || '',
    data.ip || '',
    data.userAgent || '',
  ]);

  const notified = notifyLeadOwner(data, properties);
  return json({ ok: true, notified });
}

function notifyLeadOwner(data, properties) {
  const recipients = properties.getProperty('LEAD_NOTIFICATION_EMAILS');
  if (!recipients) {
    return false;
  }

  const subject = `[kiwi] 새 숏폼 샘플 신청: ${data.brand || '브랜드명 없음'}`;
  const body = [
    '새 리드가 접수되었습니다.',
    '',
    `브랜드명: ${data.brand || '-'}`,
    `브랜드 SNS: ${data.instagram || '-'}`,
    `참고 영상: ${data.referenceVideo || '-'}`,
    `이메일: ${data.email || '-'}`,
    `접수 시간: ${data.createdAt || new Date().toISOString()}`,
    '',
    'Google Sheets에서 전체 신청 내역을 확인하세요.',
  ].join('\n');

  MailApp.sendEmail({
    to: recipients,
    subject,
    body,
    name: 'kiwi lead bot',
  });

  return true;
}

function json(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
