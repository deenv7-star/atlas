#!/usr/bin/env node
/**
 * Builds the support bot knowledge base from the codebase.
 *
 *   node scripts/support-kb/build-kb.mjs [--level=7] [--check]
 *
 * 1. Generates kb/generated/*.md straight from the code, so they can never drift:
 *      app-map.md   every route, nav label, "עוד" group and mobile tab (src/config/navigation.js, src/utils)
 *      pricing.md   plans and prices (src/config/pricing.js)
 *      features.md  which DB-gated screens are live at the given schema level (src/config/dbFeatures.js)
 * 2. Splits curated (hand-written, reviewed) + generated markdown into retrieval chunks → kb/kb.json,
 *    which the Edge Function imports.
 * 3. Drift check: every **bold UI label** in the curated files must exist as a string somewhere in src/.
 *    Missing labels are printed as warnings (--check makes them fatal, for CI).
 *
 * --level = the live VITE_DB_SCHEMA_LEVEL (default: env VITE_DB_SCHEMA_LEVEL, else 7, the live DB today).
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const KB = path.join(ROOT, 'supabase/functions/support-chat/kb');
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const LEVEL = Number(args.level || process.env.VITE_DB_SCHEMA_LEVEL || 15); // live DB is at 015 (src/config/dbFeatures.js LIVE_LEVEL)
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

/* ── 1. generated files ─────────────────────────────────────────────────── */
function parseNav() {
  const src = read('src/config/navigation.js');
  const groups = [];
  const re = /\{\s*id:\s*'(\w+)',\s*label:\s*(null|'[^']*'),\s*items:\s*\[([\s\S]*?)\n\s{4}\],/g;
  let m;
  while ((m = re.exec(src))) {
    const items = [...m[3].matchAll(/page:\s*'(\w+)',\s*label:\s*'([^']+)'/g)].map((x) => ({ page: x[1], label: x[2], gated: /DB_FEATURES\.\w+\s*\?\s*\[\{\s*page:\s*'/.test(m[3]) && m[3].includes(`page: '${x[1]}'`) && /\.\.\.\(DB_FEATURES/.test(m[3].split(`page: '${x[1]}'`)[0].split('\n').pop() || '') }));
    groups.push({ id: m[1], label: m[2] === 'null' ? null : m[2].slice(1, -1), items });
  }
  const fin = [...(src.match(/FINANCE_TABS = \[([\s\S]*?)\];/)?.[1] || '').matchAll(/page:\s*'(\w+)',\s*label:\s*'([^']+)'/g)].map((x) => ({ page: x[1], label: x[2] }));
  const tabs = (src.match(/TAB_BAR = \[([^\]]*)\]/)?.[1] || '').match(/'[^']+'/g)?.map((s) => s.slice(1, -1)) || [];
  return { groups, fin, tabs };
}
function parsePaths() {
  const src = read('src/utils/index.ts');
  return Object.fromEntries([...src.matchAll(/^\s+(\w+):\s*'([^']+)'/gm)].map((m) => [m[1], m[2]]));
}
function parseGates() {
  const src = read('src/config/dbFeatures.js');
  return [...src.matchAll(/(\w+):\s*!?isSupabaseConfigured\s*(?:\|\||&&)\s*LEVEL\s*>=\s*(\d+)/g)].map((m) => ({ key: m[1], level: Number(m[2]) }));
}
const FEATURE_HE = {
  guestPages: 'דף אורח אישי לכל הזמנה (עוד ← דף אורח והזמנה ישירה)',
  directBooking: 'דף הזמנה ישירה לאורחים',
  expenses: 'מעקב הוצאות (כספים ← הוצאות)',
  orgSettings: 'שמירת הגדרות העסק מההקמה (שעות כניסה, חתימת וואטסאפ, מקדמה) בחשבון, כך שהן זהות בכל מכשיר',
};

let ROUTES = [];
async function generate() {
  const nav = parseNav();
  const paths = parsePaths();
  const gates = parseGates();
  const { PRICING_PLANS, INCLUDED_FEATURES = [], TRIAL_DAYS = 14 } = await import(pathToFileURL(path.join(ROOT, 'src/config/pricing.js')).href);
  const out = path.join(KB, 'generated');
  fs.mkdirSync(out, { recursive: true });
  const hdr = (title, kw) => `---\ntitle: ${title}\nkeywords: ${kw}\ngenerated: true\n---\n`;

  const label = (p) => nav.groups.flatMap((g) => g.items).find((i) => i.page === p)?.label || p;
  const primary = nav.groups[0]?.items || [];
  let a = hdr('מפת המסכים והתפריטים (נוצר מהקוד)', 'מפה, מסכים, תפריט, כתובת, קישור, נתיב, איפה נמצא, עוד');
  a += '# מפת המסכים (נוצר אוטומטית מהקוד)\n\n## התפריט הראשי (במחשב, בצד ימין)\n';
  for (const i of primary) a += `- **${i.label}**: ${paths[i.page] || ''}\n`;
  a += '- **עוד**: פותח את שאר המסכים\n\n## הסרגל התחתון בטלפון\n';
  a += nav.tabs.map((t) => `- ${t === '__new__' ? '**+** (הזמנה חדשה)' : t === '__more__' ? '**עוד**' : `**${label(t)}**`}`).join('\n') + '\n';
  a += `\nבטלפון, ${primary.filter((i) => !nav.tabs.includes(i.page)).map((i) => i.label).join(', ')} נמצאים תחת **עוד**.\n\n## מה יש תחת "עוד"\n`;
  for (const g of nav.groups.slice(1)) a += `- **${g.label}**: ${g.items.map((i) => `${i.label} (${paths[i.page] || ''})`).join(', ')}\n`;
  a += `\n## לשוניות במסך כספים\n${nav.fin.map((f) => `- ${f.label} (${paths[f.page] || ''})`).join('\n')}\n`;
  a += '\n## קישורים שימושיים\n- כניסה: /login · הרשמה: /register · איפוס סיסמה: /reset-password\n- הגדרת העסק מחדש: /onboarding?again=1\n- הזמנה: /booking/<מזהה> · ליד: /lead/<מזהה>\n';
  fs.writeFileSync(path.join(out, 'app-map.md'), a);

  // Whitelist of in-app links the bot may show as buttons (anything else is dropped server-side).
  const seen = new Set();
  const add = (p0, l) => { if (p0 && !seen.has(p0)) { seen.add(p0); ROUTES.push({ path: p0, label: l }); } };
  for (const g of nav.groups) for (const i of g.items) add(paths[i.page], i.label);
  for (const f2 of nav.fin) add(paths[f2.page], `כספים · ${f2.label}`);
  add('/settings?tab=profile', 'הגדרות · פרופיל');
  add('/settings?tab=organization', 'הגדרות · ארגון');
  add('/settings?tab=notifications', 'הגדרות · התראות');
  add('/settings?tab=security', 'הגדרות · אבטחה');
  add('/onboarding?again=1', 'הגדרת העסק');
  add('/integrations?tab=calendars', 'ערוצים וחיבורים · יומנים');
  add('/integrations?tab=payments', 'ערוצים וחיבורים · תשלומים');
  add('/integrations?tab=messaging', 'ערוצים וחיבורים · הודעות');
  add('/reset-password', 'איפוס סיסמה');

  let p = hdr('מחירים ומסלולים (נוצר מהקוד)', 'מחיר, מחירים, כמה עולה, מסלול, מסלולים, תוכנית, שנתי, חודשי, Starter, Pro, Business, מתחיל, מקצועי, עסקי');
  p += '# מחירים ומסלולים (מתוך src/config/pricing.js)\nכל המחירים בשקלים, לחודש. בתשלום שנתי המחיר החודשי נמוך יותר.\n';
  const byComplex = PRICING_PLANS.some((pl) => 'complexes' in pl);
  if (byComplex) p += 'המסלולים נבדלים רק במספר המתחמים (מקומות אירוח נפרדים), לא במספר היחידות או החדרים. מתחם אחד עם כמה צימרים או חדרים = מתחם אחד. כל המסלולים כוללים את כל המערכת.\n';
  p += '\n';
  const limit = (pl) => (byComplex ? (pl.complexes == null ? 'מתחמים ללא הגבלה' : pl.complexes === 1 ? 'מתחם אחד' : `עד ${pl.complexes} מתחמים`) : (pl.properties ? `עד ${pl.properties} נכסים` : 'נכסים ללא הגבלה'));
  for (const pl of PRICING_PLANS) {
    p += `## ${pl.nameHe} (${pl.name})\n- ‏₪${pl.price} לחודש, או ‏₪${pl.priceYearly} לחודש בתשלום שנתי\n- ${limit(pl)}\n- ${pl.desc}\n- כולל: ${pl.features.join(', ')}\n${pl.popular ? '- המסלול הנבחר ביותר\n' : ''}\n`;
  }
  if (INCLUDED_FEATURES.length) p += `## מה כלול בכל מסלול\n${INCLUDED_FEATURES.map((x) => `- ${x}`).join('\n')}\n\n`;
  p += `כל המסלולים מתחילים ב-${TRIAL_DAYS} ימי ניסיון חינם, בלי כרטיס אשראי.\n`;
  fs.writeFileSync(path.join(out, 'pricing.md'), p);

  let f = hdr('אילו מסכים פעילים בחשבונות היום (נוצר מהקוד)', 'בקרוב, פעיל, לא פעיל, עוד לא, מסד נתונים, עדכון, הוצאות, דף אורח, הזמנה ישירה');
  f += `# מסכים שתלויים בעדכון מסד הנתונים\nרמת מסד הנתונים בחשבונות כרגע: ${LEVEL}.\n\n`;
  for (const g of gates) f += `- ${FEATURE_HE[g.key] || g.key}: ${LEVEL >= g.level ? '**פעיל**' : `**עוד לא פעיל** (נפתח אחרי עדכון ${String(g.level).padStart(3, '0')} בצד שלנו; המסך מציג "בקרוב")`}\n`;
  fs.writeFileSync(path.join(out, 'features.md'), f);
}

/* ── 2. chunks ──────────────────────────────────────────────────────────── */
function frontMatter(s) {
  const m = s.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return [{}, s];
  const fm = Object.fromEntries(m[1].split('\n').map((l) => { const i = l.indexOf(':'); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
  return [fm, s.slice(m[0].length)];
}
function chunk() {
  const files = ['curated', 'generated'].flatMap((d) => fs.readdirSync(path.join(KB, d)).filter((x) => x.endsWith('.md')).sort().map((x) => `${d}/${x}`));
  const chunks = [];
  for (const rel of files) {
    const [fm, body] = frontMatter(fs.readFileSync(path.join(KB, rel), 'utf8'));
    let h1 = fm.title || '';
    let cur = null;
    const flush = () => { if (cur && cur.text.trim()) chunks.push({ ...cur, text: cur.text.trim() }); };
    for (const line of body.split('\n')) {
      const h = line.match(/^(#{1,2})\s+(.*)/);
      if (h) {
        flush();
        if (h[1] === '#') h1 = h[2];
        cur = { id: `${rel.replace(/\.md$/, '')}#${chunks.length}`, file: rel, doc: fm.title || h1, heading: h[1] === '#' ? h[2] : `${h1} › ${h[2]}`, keywords: fm.keywords || '', text: `${line}\n` };
      } else {
        if (!cur) cur = { id: `${rel.replace(/\.md$/, '')}#${chunks.length}`, file: rel, doc: fm.title || '', heading: fm.title || '', keywords: fm.keywords || '', text: '' };
        cur.text += `${line}\n`;
      }
    }
    flush();
  }
  return { files, chunks };
}

/* ── 3. drift check ─────────────────────────────────────────────────────── */
function driftCheck() {
  const srcText = execSync(`grep -rhoP "[\\x{0590}-\\x{05FF}A-Za-z0-9][^<>{}\\"'\\\`]{0,80}" src --include=*.jsx --include=*.js --include=*.tsx --include=*.ts`, { cwd: ROOT, maxBuffer: 64 << 20 }).toString();
  // Labels that live outside ATLAS (Booking/Airbnb/phone UI) or in the support widget itself (this PR).
  const ignore = new Set(['עוד', '+', 'Ctrl+K', '⌘K', 'Extranet', 'Booking.com', 'Airbnb', 'אחר כך', 'הוספה למסך הבית', 'הוסף למסך הבית', 'תעריפים וזמינות', 'סנכרון לוחות שנה', 'ייצוא', 'זמינות', 'חיבור לוחות שנה', 'ייצוא לוח שנה', 'דבר עם נציג', 'עזרה']);
  const missing = [];
  for (const rel of fs.readdirSync(path.join(KB, 'curated')).filter((x) => x.endsWith('.md'))) {
    const s = fs.readFileSync(path.join(KB, 'curated', rel), 'utf8');
    for (const m of s.matchAll(/\*\*([^*]+)\*\*/g)) {
      const parts = m[1].split(/\s*←\s*/).map((x) => x.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
      for (const label of parts) {
        if (ignore.has(label) || /^[\d\s.,₪-]+$/.test(label) || label.length < 2) continue;
        if (!/[\u0590-\u05FF]/.test(label)) continue;          // only check Hebrew UI labels
        if (!srcText.includes(label)) missing.push(`${rel}: "${label}"`);
      }
    }
  }
  return [...new Set(missing)];
}

await generate();
const { files, chunks } = chunk();
let sha = 'unknown';
try { sha = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch { /* not a git checkout */ }
const kb = { built_at: new Date().toISOString(), git: sha, db_level: LEVEL, routes: ROUTES, files, chunks };
fs.writeFileSync(path.join(KB, 'kb.json'), JSON.stringify(kb));
// Same data as a TS module for the Edge Function bundle (no JSON import attributes needed at deploy).
fs.writeFileSync(path.join(KB, 'kb.ts'), `// GENERATED by scripts/support-kb/build-kb.mjs. Do not edit; edit kb/curated/*.md and rebuild.\n// deno-lint-ignore-file\nconst kb = ${JSON.stringify(kb)};\nexport default kb;\n`);
const chars = chunks.reduce((s, c) => s + c.text.length, 0);
console.log(`kb.json: ${files.length} files, ${chunks.length} chunks, ${chars} chars (~${Math.round(chars / 2.2)} tokens), db level ${LEVEL}, git ${sha}`);
const missing = driftCheck();
if (missing.length) {
  console.warn(`drift check: ${missing.length} bold labels not found in src/ (rename in KB or confirm they are not UI strings):\n  ${missing.join('\n  ')}`);
  if (args.check) process.exit(1);
} else console.log('drift check: every bold UI label in the curated KB exists in src/');
