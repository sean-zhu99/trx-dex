import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const port = Number(process.env.PORT || 3001);

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const sendJson = (response, status, payload) => {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
};

const serveStatic = (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host}`);
  const safePath = path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, '');
  const requestedPath = safePath === '/' ? '/index.html' : safePath;
  const filePath = path.join(distDir, requestedPath);
  const fallbackPath = path.join(distDir, 'index.html');
  const targetPath = fs.existsSync(filePath) && fs.statSync(filePath).isFile() ? filePath : fallbackPath;
  const ext = path.extname(targetPath);

  fs.readFile(targetPath, (error, content) => {
    if (error) {
      sendJson(response, 404, { error: 'Not found.' });
      return;
    }

    response.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    });
    response.end(content);
  });
};

const server = http.createServer((request, response) => {
  if (request.method === 'GET' && request.url === '/api/health') {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === 'GET' || request.method === 'HEAD') {
    serveStatic(request, response);
    return;
  }

  sendJson(response, 405, { error: 'Method not allowed.' });
});

server.listen(port, () => {
  console.log(`TRX Swap server listening on http://localhost:${port}`);
});
