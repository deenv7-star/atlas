#!/usr/bin/env node
/**
 * Generates blog covers (public/blog/covers/<slug>.webp, 1200x675) and Open Graph images
 * (public/og/blog-<slug>.png, og-blog.png, og-default.png, 1200x630) from HTML/CSS mini-UI
 * compositions in the ATLAS palette. No stock photos, no AI images.
 *
 * Needs playwright-core and a Chromium binary:
 *   npm i -D playwright-core   (or use any local install)
 *   CHROME=/path/to/chrome node scripts/site-assets/gen-covers.mjs
 * Re-run after adding a post to src/site/content/posts.js (add its motif below).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { chromium } = await import(process.env.PLAYWRIGHT_CORE || 'playwright-core');
// fonts inlined as data: URLs (setContent pages cannot load file:// fonts)
const fontUrl = (file) => `data:font/woff2;base64,${fs.readFileSync(path.join(ROOT, 'public/fonts/heebo', file)).toString('base64')}`;
const FONT = (w) => fontUrl(`heebo-hebrew-${w}-normal.woff2`);
const FONT_L = (w) => fontUrl(`heebo-latin-${w}-normal.woff2`);

const postsSrc = fs.readFileSync(path.join(ROOT, 'src/site/content/posts.js'), 'utf8');
const POSTS = [...postsSrc.matchAll(/slug: '([^']+)',\s*\n\s*title: '((?:[^'\\]|\\.)+)'/g)].map((m) => ({ slug: m[1], title: m[2].replace(/\\'/g, "'") }));

const css = `
@font-face{font-family:H;font-weight:400;src:url(${FONT(400)})}@font-face{font-family:H;font-weight:500;src:url(${FONT(500)})}
@font-face{font-family:H;font-weight:700;src:url(${FONT(700)})}@font-face{font-family:H;font-weight:800;src:url(${FONT(800)})}
@font-face{font-family:H;font-weight:400;src:url(${FONT_L(400)});unicode-range:U+0000-00FF,U+2000-206F}
@font-face{font-family:H;font-weight:700;src:url(${FONT_L(700)});unicode-range:U+0000-00FF,U+2000-206F}
@font-face{font-family:H;font-weight:800;src:url(${FONT_L(800)});unicode-range:U+0000-00FF,U+2000-206F}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:H,sans-serif;direction:rtl;color:#1B2656;-webkit-font-smoothing:antialiased}
.stage{position:relative;overflow:hidden;width:1200px;height:675px;background:#EEF3FF}
.stage.og{height:630px}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(62,43,241,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(62,43,241,.07) 1px,transparent 1px);background-size:48px 48px}
.card{position:absolute;background:#fff;border-radius:22px;box-shadow:0 1px 2px rgba(27,38,86,.06),0 24px 48px -16px rgba(27,38,86,.22);padding:24px}
.chip{position:absolute;display:inline-flex;align-items:center;gap:10px;background:#fff;border-radius:999px;padding:12px 20px;font-weight:700;font-size:22px;box-shadow:0 12px 32px -8px rgba(27,38,86,.25)}
.chip.ind{background:#3E2BF1;color:#fff}
.dot{width:10px;height:10px;border-radius:3px;background:#F8B040;display:inline-block}
.t{font-weight:800}.m{color:#5D6787}
.wm{font-weight:800;font-size:30px;letter-spacing:.02em;direction:ltr;display:inline-flex;align-items:baseline;gap:3px}.wm i{width:9px;height:9px;border-radius:2px;background:#3E2BF1;display:inline-block}
.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-top:16px}.cal span{height:38px;border-radius:9px;background:#F1F2F7}
.b{background:#1B2656!important}.a{background:#EF5B5B!important}.d{background:#3E2BF1!important}
.row{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid #E7E9F1;font-size:22px}
.row:last-child{border-bottom:0}
.bar{position:absolute;bottom:0;width:56px;border-radius:12px 12px 0 0;background:#D9D5FD}
.bub{border-radius:20px;padding:16px 20px;font-size:21px;line-height:1.45;max-width:420px;margin-top:14px}
.ck{display:flex;gap:14px;align-items:center;font-size:23px;padding:12px 0;border-bottom:1px solid #E7E9F1}.ck b{width:28px;height:28px;border-radius:8px;background:#3E2BF1;flex:none;position:relative}.ck b::after{content:'';position:absolute;left:9px;top:4px;width:7px;height:14px;border:solid #fff;border-width:0 3px 3px 0;transform:rotate(45deg)}.ck.o b{background:#fff;border:3px solid #B7BDD3}.ck.o b::after{display:none}
`;

const M = {
  'ical-sync-booking-airbnb': `
    <div class="card" style="right:70px;top:90px;width:430px"><div style="display:flex;align-items:center;gap:10px;font-size:24px" class="t"><span style="background:#1B2656;color:#fff;border-radius:8px;padding:2px 9px;font-size:20px;direction:ltr">B.</span>Booking.com</div>
      <div class="cal">${'<span></span>'.repeat(3)}<span class="b"></span><span class="b"></span>${'<span></span>'.repeat(4)}<span class="a"></span><span class="a"></span><span class="a"></span>${'<span></span>'.repeat(6)}<span class="d"></span><span class="d"></span>${'<span></span>'.repeat(3)}</div></div>
    <div class="card" style="left:70px;top:190px;width:430px"><div style="display:flex;align-items:center;gap:10px;font-size:24px" class="t"><span style="width:26px;height:26px;border-radius:50%;background:#EF5B5B;display:inline-block"></span>Airbnb</div>
      <div class="cal">${'<span></span>'.repeat(3)}<span class="b"></span><span class="b"></span>${'<span></span>'.repeat(4)}<span class="a"></span><span class="a"></span><span class="a"></span>${'<span></span>'.repeat(6)}<span class="d"></span><span class="d"></span>${'<span></span>'.repeat(3)}</div></div>
    <div class="chip ind" style="left:470px;top:110px">⇄ iCal</div>
    <div class="chip" style="right:120px;bottom:70px"><span class="dot"></span>מתעדכן כל 2 עד 3 שעות</div>`,
  'dynamic-pricing-zimmer': `
    <div class="card" style="right:70px;top:80px;width:520px;height:500px">
      <div class="t" style="font-size:26px">מחיר ללילה</div><div class="m" style="font-size:20px;margin-top:4px">צימר זוגי עם ג׳קוזי</div>
      <div style="position:absolute;right:28px;left:28px;bottom:28px;height:300px">
        ${[[0, 120], [70, 140], [140, 190], [210, 210], [280, 270, 1], [350, 160], [420, 130]].map(([x, h, on]) => `<div class="bar" style="right:${x}px;height:${h}px;${on ? 'background:#3E2BF1' : ''}"></div>`).join('')}
      </div></div>
    <div class="card" style="left:70px;top:150px;width:470px">
      ${[['שלישי בינואר', '₪650'], ['שישי רגיל', '₪990'], ['חמישי באוגוסט', '₪1,090'], ['ערב ראש השנה', '₪1,450']].map(([a, b], i) => `<div class="row"><span>${a}</span><span class="t" style="${i === 3 ? 'color:#3E2BF1' : ''}">${b}</span></div>`).join('')}
    </div>
    <div class="chip" style="left:110px;bottom:60px"><span class="dot"></span>חגים 2027 כבר בלוח</div>`,
  'whatsapp-guest-messages': `
    <div class="card" style="right:110px;top:60px;width:520px;height:560px;padding:28px">
      <div style="display:flex;align-items:center;gap:12px"><span style="width:52px;height:52px;border-radius:50%;background:#E4E1FD;display:inline-flex;align-items:center;justify-content:center" class="t">נ</span><div><div class="t" style="font-size:24px">נועה לוי</div><div class="m" style="font-size:18px">סוויטת הזית · מחר 15:00</div></div></div>
      <div class="bub" style="background:#F1EFFE">היי נועה, מחכים לכם מחר! הקוד לדלת: 4821. החניה מימין לשער.</div>
      <div class="bub" style="background:#F7F8FB;margin-inline-start:auto">תודה! נגיע בסביבות 16:00</div>
      <div class="bub" style="background:#F1EFFE">מעולה. הג׳קוזי יהיה מוכן.</div>
    </div>
    <div class="card" style="left:80px;top:150px;width:400px">
      ${['אישור הזמנה', 'תזכורת יתרה', 'הוראות הגעה', 'ברוכים הבאים', 'בקשת ביקורת'].map((t, i) => `<div class="ck ${i > 2 ? 'o' : ''}"><b></b>${t}</div>`).join('')}
    </div>`,
  'zimmer-income-expenses-vat': `
    <div class="card" style="right:70px;top:70px;width:600px">
      <div class="t" style="font-size:26px;margin-bottom:6px">דוח חודשי · אוגוסט</div>
      ${[['Booking.com', '₪14,000'], ['Airbnb', '₪9,000'], ['ישיר', '₪7,000'], ['עמלות', '−₪3,450'], ['ניקיון וכביסה', '−₪2,800'], ['נטו לפני מס', '₪21,650']].map(([a, b], i) => `<div class="row"><span>${a}</span><span class="t" style="direction:ltr;${i === 5 ? 'color:#3E2BF1;font-size:28px' : ''}">${b}</span></div>`).join('')}
    </div>
    <div class="chip ind" style="left:90px;top:170px">מע״מ 18%</div>
    <div class="chip" style="left:120px;top:270px"><span class="dot"></span>מספר הקצאה מעל ₪5,000</div>
    <div class="chip" style="left:80px;top:370px">עוסק פטור: ‏₪122,833</div>`,
  'direct-bookings-no-commission': `
    <div class="card" style="right:80px;top:70px;width:600px;height:400px;padding:0;overflow:hidden">
      <div style="height:48px;background:#F7F8FB;display:flex;align-items:center;gap:8px;padding:0 20px"><span style="width:12px;height:12px;border-radius:50%;background:#E7E9F1"></span><span style="width:12px;height:12px;border-radius:50%;background:#E7E9F1"></span><span style="flex:1;height:26px;border-radius:8px;background:#fff;margin-right:12px"></span></div>
      <div style="padding:28px"><div class="t" style="font-size:34px">סוויטת הזית</div><div class="m" style="font-size:20px;margin-top:6px">נוף לגליל · ג׳קוזי · עד 2 אורחים</div>
      <div style="display:flex;gap:12px;margin-top:24px">${'<span style="flex:1;height:120px;border-radius:14px;background:#E4E1FD"></span>'.repeat(3)}</div>
      <div style="margin-top:24px;display:inline-flex;background:#3E2BF1;color:#fff;border-radius:12px;padding:14px 26px;font-weight:800;font-size:22px">הזמנה ישירה</div></div></div>
    <div class="card" style="left:70px;top:330px;width:440px">
      <div class="t" style="font-size:22px">מאיפה ההכנסה</div>
      <div style="display:flex;height:26px;border-radius:9px;overflow:hidden;margin-top:16px"><span style="width:47%" class="b"></span><span style="width:30%" class="a"></span><span style="width:23%" class="d"></span></div>
      <div class="m" style="display:flex;gap:18px;font-size:18px;margin-top:12px"><span>Booking 47%</span><span>Airbnb 30%</span><span style="color:#3E2BF1;font-weight:700">ישיר 23%</span></div></div>`,
  'cleaning-turnover-checklist': `
    <div class="card" style="right:90px;top:60px;width:520px">
      <div class="t" style="font-size:26px;margin-bottom:6px">ניקיון · סוויטת האלון</div>
      ${['מצעים ומגבות', 'מטבחון', 'חדר רחצה', 'רצפה', 'ג׳קוזי', 'סיבוב אחרון'].map((t, i) => `<div class="ck ${i > 3 ? 'o' : ''}"><b></b>${t}</div>`).join('')}
    </div>
    <div class="chip ind" style="left:110px;top:140px">יציאה 11:00</div>
    <div class="chip" style="left:150px;top:240px"><span class="dot"></span>כניסה 15:00</div>
    <div class="card" style="left:80px;top:360px;width:380px"><div class="m" style="font-size:20px">ג׳קוזי</div><div class="t" style="font-size:30px;margin-top:6px">pH 7.2 עד 7.8</div><div class="m" style="font-size:20px;margin-top:4px">כלור חופשי 3 עד 10 ppm</div></div>`,
  'guest-reviews': `
    <div class="card" style="right:90px;top:80px;width:430px;text-align:center;padding:36px">
      <div style="display:inline-flex;background:#1B2656;color:#fff;border-radius:16px 16px 16px 4px;padding:16px 22px;font-weight:800;font-size:52px;direction:ltr">9.4</div>
      <div class="t" style="font-size:30px;margin-top:16px">מצוין</div><div class="m" style="font-size:20px">לפי 128 ביקורות לדוגמה</div>
      <div style="margin-top:20px;display:grid;gap:10px;text-align:right">${[['ניקיון', 96], ['נוחות', 92], ['תמורה למחיר', 84]].map(([a, w]) => `<div style="font-size:19px">${a}<div style="height:10px;border-radius:6px;background:#F1F2F7;margin-top:6px"><div style="height:10px;border-radius:6px;background:#3E2BF1;width:${w}%"></div></div></div>`).join('')}</div></div>
    <div class="card" style="left:70px;top:200px;width:520px">
      <div style="font-size:26px;letter-spacing:4px;color:#3E2BF1">★★★★★</div>
      <div style="font-size:22px;line-height:1.5;margin-top:10px">״הכול היה מוכן כשהגענו, נקי ושקט. נחזור.״</div>
      <div class="bub" style="background:#F1EFFE;font-size:19px;margin-top:16px">תגובת המארח: תודה רבה! מחכים לכם בפעם הבאה.</div></div>`,
  'zimmer-licensing-israel': `
    <div class="card" style="right:110px;top:50px;width:480px;height:570px;padding:32px">
      <div class="t" style="font-size:26px">רשימת בדיקה</div><div class="m" style="font-size:19px;margin:4px 0 10px">לפני שפותחים צימר</div>
      ${['מהנדס הרשות המקומית', 'היתר בנייה ושימוש', 'רשות מקרקעי ישראל', 'מעל 4 יחידות?', 'בריכה וג׳קוזי', 'ביטוח ורואה חשבון'].map((t, i) => `<div class="ck ${i > 2 ? 'o' : ''}"><b></b>${t}</div>`).join('')}
    </div>
    <div style="position:absolute;left:150px;top:150px;width:230px;height:230px;border-radius:50%;border:6px solid #3E2BF1;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(-8deg);background:#fff;box-shadow:0 24px 48px -16px rgba(27,38,86,.22)">
      <div class="m" style="font-size:20px">פריט</div><div class="t" style="font-size:64px;color:#3E2BF1;line-height:1">7.1ב</div><div class="m" style="font-size:18px">רישוי עסקים</div></div>
    <div class="chip" style="left:110px;bottom:90px"><span class="dot"></span>יותר מ-4 יחידות אירוח</div>`,
};

function ogHtml(title, kicker) {
  return `<div class="stage og" style="background:#3E2BF1;color:#fff">
    <div class="grid" style="background-image:linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px)"></div>
    <div style="position:absolute;right:80px;left:80px;top:70px"><span class="wm" style="color:#fff">ATLAS<i style="background:#fff"></i></span></div>
    ${kicker ? `<div style="position:absolute;right:80px;top:180px;font-size:26px;font-weight:700;color:#DCD9FF">${kicker}</div>` : ''}
    <div style="position:absolute;right:80px;left:80px;top:230px;font-size:${title.length > 60 ? 54 : 62}px;line-height:1.12;font-weight:800;letter-spacing:-.01em">${title}</div>
    <div style="position:absolute;right:80px;bottom:64px;font-size:24px;color:#DCD9FF">atlas-il.com</div>
  </div>`;
}

const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 675 }, deviceScaleFactor: 1 });
fs.mkdirSync(path.join(ROOT, 'public/blog/covers'), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'public/og'), { recursive: true });

async function shot(html, h, out, fmt) {
  await page.setViewportSize({ width: 1200, height: h });
  await page.setContent(`<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const buf = await page.screenshot({ type: 'png' });
  if (fmt === 'webp') await sharp(buf).webp({ quality: 82 }).toFile(out);
  else await sharp(buf).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(out);
  console.log('wrote', path.relative(ROOT, out));
}

for (const p of POSTS) {
  if (!M[p.slug]) { console.warn('no motif for', p.slug); continue; }
  await shot(`<div class="stage"><div class="grid"></div>${M[p.slug]}</div>`, 675, path.join(ROOT, `public/blog/covers/${p.slug}.webp`), 'webp');
  await shot(ogHtml(p.title, 'בלוג ATLAS'), 630, path.join(ROOT, `public/og/blog-${p.slug}.png`), 'png');
}
await shot(ogHtml('מדריכים מעשיים לבעלי צימרים ומתחמי נופש', 'בלוג ATLAS'), 630, path.join(ROOT, 'public/og/og-blog.png'), 'png');
await shot(ogHtml('מערכת ניהול בעברית לצימרים ומתחמי נופש', 'לוח אחד לכל הערוצים · וואטסאפ לאורחים · מקדמות ויתרות'), 630, path.join(ROOT, 'public/og/og-default.png'), 'png');
await browser.close();
