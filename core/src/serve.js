// @ts-check
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.webm': 'video/webm', '.mp4': 'video/mp4', '.woff2': 'font/woff2',
};

/**
 * A static file server for the demo houses and reports. Always bound to 127.0.0.1.
 * @param {string} root @param {number} [port] 0 picks a free port
 * @returns {Promise<{ url: string, port: number, close: () => Promise<void> }>}
 */
export function serveStatic(root, port = 0) {
  const base = path.resolve(root);
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      let file = path.join(base, decodeURIComponent(url.pathname));
      if (!file.startsWith(base)) { res.writeHead(403).end('Forbidden'); return; }
      const stat = await fs.stat(file).catch(() => null);
      if (stat?.isDirectory()) {
        if (!url.pathname.endsWith('/')) { res.writeHead(301, { location: `${url.pathname}/` }).end(); return; }
        file = path.join(file, 'index.html');
      }
      const body = await fs.readFile(file);
      res.writeHead(200, { 'content-type': TYPES[/** @type {keyof TYPES} */ (path.extname(file))] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const addr = /** @type {import('node:net').AddressInfo} */ (server.address());
      resolve({
        url: `http://127.0.0.1:${addr.port}/`,
        port: addr.port,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}
