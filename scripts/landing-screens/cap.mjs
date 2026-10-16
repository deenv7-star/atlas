// usage: node cap.mjs <width> <height> <outdir> route1 route2 ...
import fs from 'node:fs';
import pw from 'playwright'; // npm i -D playwright (not a project dependency)
import { buildSeed } from './seed.mjs';

const [W, H, OUT, ...routes] = process.argv.slice(2);
const BASE = process.env.BASE || 'http://localhost:5173';
fs.mkdirSync(OUT, { recursive: true });
const seed = buildSeed();
const br = await pw.chromium.launch({ args: ['--no-proxy-server', '--no-sandbox'] });
const mobile = Number(W) < 600;
const ctx = await br.newContext({ viewport: { width: Number(W), height: Number(H) }, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile, locale: 'he-IL', timezoneId: 'Asia/Jerusalem', reducedMotion: 'reduce' });
await ctx.addInitScript((s) => {
  if (sessionStorage.getItem('seeded')) return;
  localStorage.clear();
  for (const [k, v] of Object.entries(s)) localStorage.setItem(k, JSON.stringify(v));
  localStorage.setItem('atlas_cookie_consent', 'accepted');
  sessionStorage.setItem('seeded', '1');
}, seed);
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
for (const spec of routes) {
  const [r, clickText, nameOverride, scrollY] = spec.split('|');
  await page.goto(BASE + r, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(2500);
  if (clickText) { await page.getByText(clickText).first().click().catch((e) => console.log('click fail', e.message)); await page.waitForTimeout(1200); }
  if (scrollY) { await page.evaluate((y) => { const m = document.querySelector('main') ; window.scrollTo(0, y); if (m) m.scrollTop = y; document.querySelectorAll('*').forEach((el) => { if (!el.closest('aside,nav') && el.scrollHeight > el.clientHeight + 50 && getComputedStyle(el).overflowY.match(/auto|scroll/)) el.scrollTop = y; }); }, Number(scrollY)); await page.waitForTimeout(500); }
  await page.addStyleTag({ content: '*{caret-color:transparent!important} [data-sonner-toaster],[role=status],[aria-label^="עוזר חכם"]{display:none!important}' });
  const name = nameOverride || r.replace(/\W+/g, '_').replace(/^_|_$/g, '') || 'root';
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('shot', r, page.url());
}
console.log('errors', JSON.stringify(errs.slice(0, 5)));
await br.close();
