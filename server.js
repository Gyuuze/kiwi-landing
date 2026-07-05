const http = require('http');
const fs = require('fs');
const path = require('path');
const leadsHandler = require('./api/leads');

const rootDir = __dirname;
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  if (req.url && req.url.startsWith('/api/leads')) {
    leadsHandler(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(port, () => {
  console.log(`kiwi landing running at http://localhost:${port}`);
});

function serveStatic(req, res) {
  const pathname = getSafePathname(req.url || '/');
  if (!pathname) {
    res.statusCode = 400;
    res.end('Bad request');
    return;
  }

  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.normalize(path.join(rootDir, requestedPath));

  if (!filePath.startsWith(rootDir)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.statusCode = error.code === 'ENOENT' ? 404 : 500;
      res.end(error.code === 'ENOENT' ? 'Not found' : 'Server error');
      return;
    }

    res.setHeader('Content-Type', mimeTypes[path.extname(filePath)] || 'application/octet-stream');
    res.end(content);
  });
}

function getSafePathname(url) {
  try {
    return decodeURIComponent(new URL(url, 'http://localhost').pathname);
  } catch (error) {
    return null;
  }
}
