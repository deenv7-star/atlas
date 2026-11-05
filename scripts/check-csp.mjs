#!/usr/bin/env node
/**
 * CSP guard (audit 04.11 M5). The site's Content-Security-Policy in vercel.json allows inline scripts only by
 * sha256 hash. If an inline <script> in the built HTML changes (index.html, prerender.mjs) and its hash is not in
 * the policy, an ENFORCING policy blocks it in every browser: the landing entry loader, the font preloader and the
 * hero scroll script would silently stop running. This check runs after the prerender (npm run build) and fails the
 * build with the hash to add, so a stale policy can never ship. Usage: node scripts/check-csp.mjs [distDir]
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.resolve(process.argv[2] || path.join(ROOT, 'dist'));

function htmlFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...htmlFiles(p));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

export function inlineScriptHashes(dist = DIST) {
  const found = new Map(); // hash -> [files]
  const re = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g;
  for (const f of htmlFiles(dist)) {
    const html = fs.readFileSync(f, 'utf8');
    for (const m of html.matchAll(re)) {
      const attrs = m[1] || '';
      if (/type="application\/(ld\+)?json"/.test(attrs)) continue; // data blocks, not executed
      if (!m[2].trim()) continue;
      const h = `sha256-${crypto.createHash('sha256').update(m[2], 'utf8').digest('base64')}`;
      if (!found.has(h)) found.set(h, []);
      found.get(h).push(path.relative(dist, f));
    }
    const handlers = html.match(/\son[a-z]+="[^"]*"/g);
    if (handlers) found.set(`inline-handler:${handlers[0]}`, [path.relative(dist, f)]);
  }
  return found;
}

function policyHashes() {
  const v = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const out = {};
  // vercel.json uses `routes` (OPS-2: long cache only after a filesystem hit); older form had `headers`.
  const pairs = [
    ...(v.headers || []).flatMap((block) => (block.headers || []).map((h) => [h.key, h.value])),
    ...(v.routes || []).flatMap((r) => Object.entries(r.headers || {})),
  ];
  for (const [key, value] of pairs) {
    if (/^content-security-policy(-report-only)?$/i.test(key)) {
      const script = (value.match(/script-src([^;]*)/) || [])[1] || '';
      out[key] = new Set([...script.matchAll(/'(sha256-[^']+)'/g)].map((x) => x[1]));
    }
  }
  return out;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  if (!fs.existsSync(DIST)) { console.error(`[check-csp] no build at ${DIST}`); process.exit(1); }
  const found = inlineScriptHashes();
  const policies = policyHashes();
  const keys = Object.keys(policies);
  if (!keys.length) { console.error('[check-csp] no Content-Security-Policy in vercel.json'); process.exit(1); }
  let bad = 0;
  for (const key of keys) {
    for (const [h, files] of found) {
      if (h.startsWith('inline-handler:')) { console.error(`[check-csp] inline event handler ${h.slice(15)} in ${files[0]}: CSP blocks it, move it to a script`); bad++; continue; }
      if (!policies[key].has(h)) { console.error(`[check-csp] ${key}: add '${h}' to script-src in vercel.json (inline script in ${files.slice(0, 3).join(', ')}${files.length > 3 ? ` +${files.length - 3}` : ''})`); bad++; }
    }
    const unused = [...policies[key]].filter((h) => !found.has(h));
    if (unused.length) console.warn(`[check-csp] ${key}: hashes no inline script uses any more (safe to drop): ${unused.join(' ')}`);
  }
  if (bad) process.exit(1);
  console.log(`[check-csp] ok: ${found.size} inline script(s), every hash is in the policy (${keys.join(', ')})`);
}
