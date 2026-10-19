#!/usr/bin/env node
/**
 * Prerender the public site (blog, legal and trust pages) to static HTML, after `vite build`.
 *
 *  1. SSR-builds src/site/entry-server.jsx into .ssr/
 *  2. Renders every route from siteRoutes() into dist/<route>/index.html, using dist/index.html
 *     as the template (so the SPA still boots on top), with the route's own <head>:
 *     title, description, canonical, hreflang, Open Graph, Twitter and JSON-LD
 *  3. Writes dist/404.html, dist/sitemap.xml, dist/llms.txt, dist/llms-full.txt
 *  4. Adds the landing's Organization / WebSite / SoftwareApplication / FAQPage JSON-LD to dist/index.html
 *  5. Prerenders the lean pages "/" and /pricing (src/RootTree.jsx) into dist/index.html and
 *     dist/pricing/index.html, hydrated by main.jsx; their CSS / JS chunks are linked in <head> from the Vite
 *     manifest. The plain SPA shell (every other URL) moves to dist/app.html; /register and /login get the
 *     shell with their own <head> (title, description, canonical) in dist/<route>/index.html
 *  6. Lists legal placeholders that still need Deen's details (src/config/legal.js)
 *
 * Usage: node scripts/prerender.mjs   (runs automatically from `npm run build`)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SSR_OUT = path.join(ROOT, '.ssr');
const ORIGIN = 'https://atlas-il.com';

function log(...a) { console.log('[prerender]', ...a); }

async function buildSsr() {
  await build({
    configFile: false,
    root: ROOT,
    logLevel: 'warn',
    plugins: [react()],
    resolve: { alias: { '@': path.join(ROOT, 'src') } },
    build: {
      ssr: 'src/site/entry-server.jsx',
      outDir: SSR_OUT,
      emptyOutDir: true,
      minify: false,
      rollupOptions: { output: { format: 'esm', entryFileNames: 'entry-server.mjs' } },
    },
    ssr: { noExternal: ['lucide-react'] },
  });
  return import(pathToFileURL(path.join(SSR_OUT, 'entry-server.mjs')).href);
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ldScript = (data, id) => `<script type="application/ld+json"${id ? ` id="${id}"` : ''}>${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

function minifyCss(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}').trim();
}

function activeDesign() {
  const idx = fs.readFileSync(path.join(ROOT, 'src/site/design/index.js'), 'utf8');
  const m = idx.match(/from '\.\/(\w+)'/);
  return m ? m[1] : 'a';
}

function siteCss() {
  const d = activeDesign();
  const base = fs.readFileSync(path.join(ROOT, 'src/site/site-base.css'), 'utf8');
  const design = fs.readFileSync(path.join(ROOT, `src/site/design/${d}/site-${d}.css`), 'utf8');
  return minifyCss(base + '\n' + design);
}

// Google Search Console ownership tag: every prerendered page keeps it (removing it un-verifies the property)
const GSC_VERIFY = '<meta name="google-site-verification" content="UPKPNchNAYTlhNJG2i4zZ-6zdUGhDxsP0MgMSTIMUJY" />';

/** Replace the SPA template <head> SEO tags with the route's own. */
function headFor(template, meta) {
  let html = template;
  if (!html.includes('google-site-verification')) html = html.replace('<head>', `<head>\n    ${GSC_VERIFY}`);
  // drop every SEO tag the template carries; we add the route's own below
  html = html.replace(/<title>[\s\S]*?<\/title>/, '');
  html = html.replace(/\s*<meta name="(description|keywords|robots|twitter:[a-z:]+)"[^>]*>/g, '');
  html = html.replace(/\s*<meta property="og:[a-z:_]+"[^>]*>/g, '');
  html = html.replace(/\s*<link rel="canonical"[^>]*>/g, '');
  html = html.replace(/\s*<link rel="alternate" hreflang[^>]*>/g, '');
  html = html.replace(/\s*<!-- JSON-LD Schema -->/g, '');
  html = html.replace(/\s*<script type="application\/ld\+json"[\s\S]*?<\/script>/g, '');
  const tags = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<meta name="robots" content="${meta.robots || 'index,follow,max-image-preview:large'}" />`,
  ];
  if (meta.canonical) {
    tags.push(
      `<link rel="canonical" href="${meta.canonical}" />`,
      `<link rel="alternate" hreflang="he-IL" href="${meta.canonical}" />`,
      `<link rel="alternate" hreflang="x-default" href="${meta.canonical}" />`,
    );
  }
  tags.push(
    `<meta property="og:type" content="${meta.ogType || 'website'}" />`,
    `<meta property="og:site_name" content="atlas" />`,
    `<meta property="og:locale" content="he_IL" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    meta.canonical ? `<meta property="og:url" content="${meta.canonical}" />` : '',
    `<meta property="og:image" content="${meta.ogImage}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(meta.title)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:image" content="${meta.ogImage}" />`,
  );
  if (meta.article) {
    tags.push(
      `<meta property="article:published_time" content="${meta.article.published}" />`,
      `<meta property="article:modified_time" content="${meta.article.modified}" />`,
      `<meta property="article:section" content="${esc(meta.article.section)}" />`,
    );
  }
  if (meta.jsonLd) tags.push(ldScript(meta.jsonLd, 'ld-route'));
  return html.replace('</head>', `    ${tags.filter(Boolean).join('\n    ')}\n  </head>`);
}

function bodyFor(html, appHtml, css, extra = '') {
  const withCss = html.replace('</head>', `    <style id="site-css">${css}</style>\n  </head>`);
  // replace the SPA loading placeholder (everything inside #root, up to the next <style> / <script>)
  const start = withCss.indexOf('<div id="root">');
  if (start < 0) throw new Error('template has no #root');
  const after = withCss.slice(start);
  const end = after.search(/\n\s*<(style|script)/);
  if (end < 0) throw new Error('could not find the end of #root');
  return withCss.slice(0, start) + `<div id="root"><div data-ssr>${appHtml}</div></div>${extra}` + after.slice(end);
}

function outPath(route) {
  if (route === '/') return path.join(DIST, 'index.html');
  return path.join(DIST, route.replace(/^\//, ''), 'index.html');
}

function sitemap(routes, posts) {
  const lastmod = { '/': '2026-10-18' };
  posts.forEach((p) => { lastmod[`/blog/${p.slug}`] = p.updated; });
  const all = ['/', '/pricing', '/register', ...routes];
  const prio = (r) => (r === '/' ? '1.0' : r === '/blog' || r === '/pricing' ? '0.9' : r.startsWith('/blog/') ? '0.8' : r === '/register' ? '0.8' : '0.5');
  const urls = all.map((r) => [
    '  <url>',
    `    <loc>${ORIGIN}${r === '/' ? '/' : r}</loc>`,
    `    <lastmod>${lastmod[r] || '2026-10-18'}</lastmod>`,
    `    <priority>${prio(r)}</priority>`,
    '  </url>',
  ].join('\n'));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

function llms(mod) {
  const { POSTS, SITE_PAGES, ATLAS_ONE_LINER, FAQ, PRICING_PLANS } = mod;
  const plan = (p) => `- ${p.nameHe} (${p.name}): ‏₪${p.price} לחודש, או ‏₪${p.priceYearly} לחודש בתשלום שנתי. ${p.limit}.`;
  return [
    '# atlas',
    '',
    `> ${ATLAS_ONE_LINER}`,
    '',
    'atlas (atlas-il.com) is a Hebrew, right-to-left SaaS for owners of zimmers (צימרים), villas and small vacation complexes in Israel. It runs in the browser on desktop and mobile. Founder: Deen Vinokur.',
    '',
    '## עובדות',
    '- מה זה: מערכת ניהול (SaaS) לצימרים ומתחמי נופש בישראל, בעברית.',
    '- מה יש בה: לוח שנה אחד לכל היחידות, הזמנות לפי ערוץ (Booking.com, Airbnb, ישיר) עם התראה על חפיפה, לידים, מעקב מקדמות ויתרות, הודעות וואטסאפ לאורחים בנוסח מוכן שנשלחות בלחיצה מהוואטסאפ של המארח, משימות ניקיון, דוח חודשי לרואה החשבון (CSV / PDF).',
    '- מה אין בה (נכון ל-18.10.2026): סליקת כרטיסי אשראי, חשבוניות מס רשמיות עם מספר הקצאה, ערוץ מנהל (Channel Manager) מלא.',
    '- ניסיון: 14 ימים בחינם, בלי כרטיס אשראי.',
    '- אחסון נתונים: Supabase, שרתי AWS באזור eu-central-1 (פרנקפורט, גרמניה).',
    '- תמיכה: בוט עזרה בעברית עם נציג אנושי, וואטסאפ.',
    '',
    '## מחירים',
    ...PRICING_PLANS.map(plan),
    `- פרטים: ${ORIGIN}/pricing`,
    '',
    '## שאלות נפוצות (מדף הבית)',
    ...FAQ.slice(0, 5).map((f) => `- ${f.q} ${f.a}`),
    '',
    '## בלוג',
    ...POSTS.map((p) => `- [${p.title}](${ORIGIN}/blog/${p.slug}): ${p.description}`),
    '',
    '## עמודים',
    `- [דף הבית](${ORIGIN}/)`,
    `- [מחירים](${ORIGIN}/pricing)`,
    ...Object.entries(SITE_PAGES).map(([r, p]) => `- [${p.title}](${ORIGIN}${r}): ${p.description}`),
    '',
    '## Optional',
    `- [הטקסט המלא של כל המאמרים](${ORIGIN}/llms-full.txt)`,
    '',
  ].join('\n');
}

function llmsFull(mod) {
  const { POSTS, BODIES, mdToText } = mod;
  const parts = ['# atlas: בלוג, טקסט מלא', '', `מקור: ${ORIGIN}/blog`, ''];
  POSTS.forEach((p) => {
    parts.push(`## ${p.title}`, '', `כתובת: ${ORIGIN}/blog/${p.slug}`, `עודכן: ${p.updated}`, '', mdToText(BODIES[p.slug]), '', '### שאלות נפוצות');
    p.faq.forEach((f) => parts.push(`- ${f.q} ${f.a}`));
    parts.push('', '### מקורות', ...p.sources.map((s) => `- ${s.title}: ${s.url}`), '', '---', '');
  });
  return parts.join('\n');
}


/* ---------------- lean pages ("/", /pricing): prerendered + hydrated ---------------- */

const LANDING_OG = `${ORIGIN}/og-image.png?v=5`;

function readManifest() {
  const file = path.join(DIST, '.vite', 'manifest.json');
  if (!fs.existsSync(file)) throw new Error('dist/.vite/manifest.json missing (vite.config.js build.manifest)');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * The CSS and JS a lazy page chunk needs, in the order Vite's runtime loader would insert them
 * (imported chunks first, depth first, then the chunk's own CSS), minus the entry chunk (already in the page).
 * Linking them in <head> styles the prerendered HTML on its first paint; when the chunk is later imported,
 * Vite's loader finds the same hrefs already in the document and adds nothing, so the cascade is unchanged.
 */
function chunkAssets(manifest, key) {
  const css = []; const js = []; const seen = new Set();
  const visit = (k) => {
    const c = manifest[k];
    if (!c || seen.has(k) || c.isEntry) return;
    seen.add(k);
    (c.imports || []).forEach(visit);
    js.push(`/${c.file}`);
    (c.css || []).forEach((f) => { if (!css.includes(`/${f}`)) css.push(`/${f}`); });
  };
  if (!manifest[key]) throw new Error(`no manifest entry for ${key}`);
  visit(key);
  return { css, js };
}

function cssLinks({ css }) {
  return css.map((h) => `<link rel="stylesheet" crossorigin href="${h}">`).join('\n    ');
}

/* Reveal-on-scroll (src/components/landing/v5/motion.js useReveal) hides [data-reveal] blocks only once JS runs
   (.l4-reveal-on on the page root). The prerendered root carries it from the start, so blocks below the fold
   fade in on scroll exactly as before instead of showing and then hiding; without JS they stay visible. */
const REVEAL_NOSCRIPT = '<noscript><style>.l5.l4-reveal-on [data-reveal]{opacity:1;transform:none}</style></noscript>';
function withRevealOn(html) {
  const out = html.replace(/^((?:<!--[$]-->)*<div class="l5 l7 v8 lm)/, '$1 l4-reveal-on');
  if (out === html) throw new Error('lean page root not found (expected <div class="l5 l7 v8 lm …">)');
  return out;
}

/**
 * The prerendered page is complete HTML, so no JS is needed for its first paint. As a plain module script
 * the entry was fetched and run (and hydrated) before the browser painted, holding the headline back
 * behind the JS download and ~2 s of JS on a phone. Here nothing but the HTML, CSS, fonts and hero photo
 * competes for the first paint: right after the first contentful paint (Paint Timing; first frame where that is
 * not available), the entry and the page's chunks are
 * requested together (modulepreload, no waterfall) and the entry starts. Nothing on screen changes when it
 * does (hydration adopts the HTML). Hidden tabs (no frames) start at once; a 2.5 s timer is the safety net.
 */
function deferEntry(html, js) {
  const re = /<script type="module" crossorigin src="(\/assets\/[^"]+\.js)"><\/script>/;
  const m = html.match(re);
  if (!m) throw new Error('entry <script type="module"> not found in the template');
  const src = m[1];
  const pre = JSON.stringify(js);
  const boot = `<script>(function(){var d=0;function go(){if(d)return;d=1;var h=document.head;${pre}.forEach(function(u){var l=document.createElement('link');l.rel='modulepreload';l.crossOrigin='anonymous';l.href=u;h.appendChild(l)});var s=document.createElement('script');s.type='module';s.crossOrigin='anonymous';s.src=${JSON.stringify(src)};document.body.appendChild(s)}if(document.visibilityState!=='visible'||typeof requestAnimationFrame!=='function'){go();return}var later=function(){setTimeout(go,0)};try{if(PerformanceObserver.supportedEntryTypes.indexOf('paint')<0)throw 0;if(performance.getEntriesByName('first-contentful-paint').length){later()}else{new PerformanceObserver(function(l,o){if(l.getEntriesByName('first-contentful-paint').length){o.disconnect();later()}}).observe({type:'paint',buffered:true})}}catch(e){requestAnimationFrame(later)}setTimeout(go,2500)})()</script>`;
  return html.replace(re, '').replace('</body>', `    ${boot}\n  </body>`);
}

/** Put the prerendered tree inside #root (replacing the "טוען..." placeholder), marked for hydration. */
function leanBody(html, appHtml, assets) {
  const head = deferEntry(html, assets.js).replace('</head>', `    ${cssLinks(assets)}\n    ${REVEAL_NOSCRIPT}\n  </head>`);
  const start = head.indexOf('<div id="root">');
  if (start < 0) throw new Error('template has no #root');
  const after = head.slice(start);
  const end = after.search(/\n\s*<(style|script)/);
  if (end < 0) throw new Error('could not find the end of #root');
  return head.slice(0, start) + `<div id="root" data-hydrate>${appHtml}</div>` + after.slice(end);
}

function appMeta(mod, route) {
  const m = mod.appRouteMeta(route);
  return { title: m.title, description: m.description, canonical: `${ORIGIN}${route}`, ogImage: LANDING_OG };
}

/* src/ui-direction/flag.js sets <html data-ui> when the entry runs; on a prerendered page that attribute
   change restyled the whole painted document. Ship it in the HTML (same value), so setting it is a no-op. */
function withUiFlag(html) {
  const m = fs.readFileSync(path.join(ROOT, 'src/ui-direction/flag.js'), 'utf8').match(/DIRECTION = '(\w+)'/);
  if (!m) throw new Error('DIRECTION not found in src/ui-direction/flag.js');
  return html.replace('<html lang="he" dir="rtl">', `<html lang="he" dir="rtl" data-ui="${m[1]}">`);
}

/*
 * Landing only, until main.jsx hydrates (it removes html.atlas-prerender first): the parts below the hero
 * (which alone is 190svh tall, so none of them is on the first screen) are content-visibility: auto, so the
 * browser neither lays them out nor starts their ~450 KB of lazy images ahead of the headline (their lazy
 * loading distance reached them at once). Once the class is gone they are ordinary blocks, exactly as before.
 */
const DEFER_BELOW_FOLD = '<style id="atlas-prerender-css">html.atlas-prerender .lm.has-ph>main>:not(.ph-hero):not(script),html.atlas-prerender .lm.has-ph>.v8-credits,html.atlas-prerender .lm.has-ph>.l5-ftr{content-visibility:auto;contain-intrinsic-size:auto 900px}</style>';
const DEFER_NOSCRIPT = '<noscript><style>html.atlas-prerender .lm.has-ph *{content-visibility:visible!important}</style></noscript>';
function withBelowFoldDeferred(html) {
  const out = html.replace('<html lang="he" dir="rtl"', '<html class="atlas-prerender" lang="he" dir="rtl"')
    .replace('</head>', `    ${DEFER_BELOW_FOLD}\n    ${DEFER_NOSCRIPT}\n  </head>`);
  if (!out.includes('class="atlas-prerender"')) throw new Error('<html> tag not found');
  return out;
}

function prerenderLean(mod, template, index) {
  const manifest = readManifest();
  // every URL that is not a prerendered file gets the plain SPA shell (vercel.json / _redirects / netlify.toml)
  fs.writeFileSync(path.join(DIST, 'app.html'), index);

  const landing = withRevealOn(mod.renderLean('/'));
  fs.writeFileSync(path.join(DIST, 'index.html'), withBelowFoldDeferred(withUiFlag(leanBody(index, landing, chunkAssets(manifest, 'src/pages/Landing.jsx')))));

  const pricing = withRevealOn(mod.renderLean('/pricing'));
  const pricingHead = headFor(template, appMeta(mod, '/pricing'));
  fs.mkdirSync(path.join(DIST, 'pricing'), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'pricing', 'index.html'), withUiFlag(leanBody(pricingHead, pricing, chunkAssets(manifest, 'src/pages/PricingPlans.jsx'))));

  // SPA screens with their own <head> (the landing's canonical used to be on them for non-JS readers)
  for (const route of ['/register', '/login']) {
    fs.mkdirSync(path.join(DIST, route.slice(1)), { recursive: true });
    fs.writeFileSync(path.join(DIST, route.slice(1), 'index.html'), headFor(template, appMeta(mod, route)));
  }
  fs.rmSync(path.join(DIST, '.vite'), { recursive: true, force: true }); // build-time only, not deployed
  log('lean pages: / and /pricing prerendered (hydrated); app.html shell; /register, /login heads');
}

async function main() {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('dist/index.html missing: run `vite build` first');
  const mod = await buildSsr();
  const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  const css = siteCss();
  const routes = mod.siteRoutes();

  for (const route of routes) {
    const meta = mod.siteMeta(route);
    if (!meta) throw new Error(`no meta for ${route}`);
    const appHtml = mod.render(route);
    const slug = route.startsWith('/blog/') ? route.split('/')[2] : null;
    const extra = slug ? `\n    <script id="site-body" type="application/json" data-slug="${slug}">${JSON.stringify(mod.BODIES[slug]).replace(/</g, '\\u003c')}</script>` : '';
    const html = bodyFor(headFor(template, meta), appHtml, css, extra);
    const file = outPath(route);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
  }
  log(`${routes.length} pages`);

  // 404 (served by Vercel / Netlify for files that do not exist)
  fs.writeFileSync(path.join(DIST, '404.html'), bodyFor(headFor(template, mod.notFoundMeta()), mod.render404(), css));

  // landing JSON-LD (Organization + WebSite + SoftwareApplication + FAQPage from the visible landing FAQ)
  let index = template.replace(/\s*<!-- JSON-LD Schema -->/, '').replace(/\s*<script type="application\/ld\+json"[\s\S]*?<\/script>/g, '');
  index = index.replace('</head>', `    ${ldScript(mod.landingLd(), 'ld-landing')}\n    <link rel="alternate" hreflang="he-IL" href="${ORIGIN}/" />\n    <link rel="alternate" hreflang="x-default" href="${ORIGIN}/" />\n  </head>`);
  fs.writeFileSync(path.join(DIST, 'index.html'), index);
  prerenderLean(mod, template, index);

  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap(routes, mod.POSTS));
  fs.writeFileSync(path.join(DIST, 'llms.txt'), llms(mod));
  fs.writeFileSync(path.join(DIST, 'llms-full.txt'), llmsFull(mod));
  log('sitemap.xml, llms.txt, llms-full.txt, 404.html, landing JSON-LD');

  const missing = mod.missingLegalKeys();
  if (missing.length) {
    console.warn(`[prerender] legal placeholders still empty in src/config/legal.js (hidden or shown as "יעודכן בקרוב" on the site; run npm run check:legal): ${missing.join(', ')}`);
  }
  fs.rmSync(SSR_OUT, { recursive: true, force: true });
}

main().catch((e) => { console.error(e); process.exit(1); });
