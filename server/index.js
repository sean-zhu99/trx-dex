import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const port = Number(process.env.PORT || 3001);

const OKX_BASE_URL = process.env.OKX_BASE_URL || 'https://web3.okx.com';
const OKX_CHAIN_INDEX = '195';
const OKX_TRX_ADDRESS = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb';

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const loadEnvFile = () => {
  const envPath = path.join(projectRoot, '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const index = trimmed.indexOf('=');
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
    process.env[key] ??= value;
  }
};

loadEnvFile();

const getJsonBody = async (request) => {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
};

const sendJson = (response, status, payload) => {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
};

const okxHeaders = (method, requestPath, body = '') => {
  const apiKey = process.env.OKX_API_KEY;
  const secretKey = process.env.OKX_SECRET_KEY;
  const passphrase = process.env.OKX_API_PASSPHRASE;

  if (!apiKey || !secretKey || !passphrase) {
    throw new Error('Missing OKX_API_KEY / OKX_SECRET_KEY / OKX_API_PASSPHRASE.');
  }

  const timestamp = new Date().toISOString();
  const prehash = `${timestamp}${method}${requestPath}${body}`;
  const sign = crypto.createHmac('sha256', secretKey).update(prehash).digest('base64');
  const headers = {
    'Content-Type': 'application/json',
    'OK-ACCESS-KEY': apiKey,
    'OK-ACCESS-SIGN': sign,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': passphrase,
  };

  if (process.env.OKX_PROJECT_ID) {
    headers['OK-ACCESS-PROJECT'] = process.env.OKX_PROJECT_ID;
  }

  return headers;
};

const okxGet = async (pathname, params) => {
  const query = new URLSearchParams(params);
  const requestPath = `${pathname}?${query.toString()}`;
  const response = await fetch(`${OKX_BASE_URL}${requestPath}`, {
    method: 'GET',
    headers: okxHeaders('GET', requestPath),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.code !== '0') {
    throw new Error(data.msg || `OKX request failed: ${response.status}`);
  }

  return data.data?.[0] ?? data.data;
};

const normalizeTokenAddress = (token) => (token === 'TRX' ? OKX_TRX_ADDRESS : token);

const createApproveTransaction = async ({ fromToken, amount }) => {
  if (fromToken === 'TRX') return null;

  return okxGet('/api/v5/dex/aggregator/approve-transaction', {
    chainIndex: OKX_CHAIN_INDEX,
    tokenContractAddress: normalizeTokenAddress(fromToken),
    approveAmount: amount,
  }).catch((error) => ({
    error: error.message,
  }));
};

const createSwapTransaction = async ({ fromToken, toToken, amount, userAddress, slippageBps }) => {
  const slippage = String(Number(slippageBps || 50) / 10000);

  return okxGet('/api/v5/dex/aggregator/swap', {
    chainIndex: OKX_CHAIN_INDEX,
    fromTokenAddress: normalizeTokenAddress(fromToken),
    toTokenAddress: normalizeTokenAddress(toToken),
    amount,
    slippage,
    userWalletAddress: userAddress,
  });
};

const handleTronSwap = async (request, response) => {
  try {
    const body = await getJsonBody(request);
    const { fromToken, toToken, amount, userAddress, slippageBps } = body;

    if (!fromToken || !toToken || !amount || !userAddress) {
      sendJson(response, 400, { error: 'Missing fromToken, toToken, amount, or userAddress.' });
      return;
    }

    const [approve, swap] = await Promise.all([
      createApproveTransaction({ fromToken, amount }),
      createSwapTransaction({ fromToken, toToken, amount, userAddress, slippageBps }),
    ]);

    sendJson(response, 200, {
      approveTransaction: approve?.tx ?? approve,
      transactionRequest: swap?.tx ?? swap?.transaction ?? swap,
      routerResult: swap?.routerResult ?? swap,
    });
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'OKX swap request failed.',
    });
  }
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
  if (request.method === 'POST' && request.url === '/api/tron/swap') {
    void handleTronSwap(request, response);
    return;
  }

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
