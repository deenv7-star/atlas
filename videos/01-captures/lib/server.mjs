// Tiny static server for the production build with SPA fallback (no API: the app falls back to local demo mode).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.json': 'application/json', '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json', '.txt': 'text/plain', '.xml': 'application/xml',
};

/** Serve the build through Playwright request interception under a given origin (e.g. https://atlas-il.com). */
export async function routeBuild(ctx, root, origin) {
  await ctx.route(`${origin}/**`, async (route) => {
    const u = new URL(route.request().url());
    const url = decodeURIComponent(u.pathname);
    if (url.startsWith('/api/')) return route.fulfill({ status: 404, contentType: 'text/plain', body: 'no api' });
    let file = path.join(root, url);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      const asIndex = path.join(file, 'index.html');
      file = fs.existsSync(asIndex) ? asIndex : path.join(root, 'index.html');
    }
    return route.fulfill({ status: 200, contentType: TYPES[path.extname(file)] || 'application/octet-stream', body: fs.readFileSync(file) });
  });
}

export function startServer(root, port = 4917) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let file = path.join(root, url);
    if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
    if (url.startsWith('/api/')) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('no api'); return; }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      const asIndex = path.join(file, 'index.html');
      file = fs.existsSync(asIndex) ? asIndex : path.join(root, 'index.html');
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}
