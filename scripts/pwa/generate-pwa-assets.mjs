/**
 * Every app-icon surface of atlas, generated from one source: the approved lowercase wordmark
 * (scripts/pwa/source/atlas-wordmark-v6.svg, brand/symbols-v6/wordmark-latin.svg). Re-run after a logo change:
 *   node scripts/pwa/generate-pwa-assets.mjs                 (default variant of this branch)
 *   node scripts/pwa/generate-pwa-assets.mjs --variant=a     lowercase "a" glyph, white on indigo
 *   node scripts/pwa/generate-pwa-assets.mjs --variant=wordmark
 *                                                            full "atlas" wordmark from 120px up, "a" below
 * Palette is strict: indigo #3E2BF1 tile, white mark, canvas #F7F8FB launch background.
 *
 * Writes:
 *   public/favicon.svg, favicon.ico (16+32+48), favicon-16x16.png, favicon-32x32.png   browser tab
 *   public/safari-pinned-tab.svg                       monochrome mask icon (legacy Safari pinned tabs)
 *   public/icons/icon-<n>x<n>.png                      manifest "any" + notification icon + schema.org logo
 *   public/icons/maskable-192.png, maskable-512.png    Android adaptive (mark inside the 80% safe circle)
 *   public/icons/apple-touch-*.png, public/apple-touch-icon.png
 *                                                      full-bleed squares, no transparency (iOS rounds them)
 *   public/icons/shortcut-new.png, shortcut-calendar.png  manifest shortcut icons (96px)
 *   public/icons/badge-96.png                          monochrome notification badge (Android tints it)
 *   public/splash/*.png                                iOS launch images (apple-touch-startup-image)
 */
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const DEFAULT_VARIANT = 'a';
const VARIANT = (process.argv.find((a) => a.startsWith('--variant=')) || `--variant=${DEFAULT_VARIANT}`).split('=')[1];
if (!['a', 'wordmark'].includes(VARIANT)) throw new Error(`unknown --variant=${VARIANT} (a | wordmark)`);

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const PUB = join(ROOT, 'public');
const ICONS = join(PUB, 'icons');
const SPLASH = join(PUB, 'splash');
mkdirSync(ICONS, { recursive: true });
mkdirSync(SPLASH, { recursive: true });

const INDIGO = '#3E2BF1';
const CANVAS = '#F7F8FB';
const WHITE = '#FFFFFF';
const INDIGO50 = '#F1EFFE';

// ---- source geometry -------------------------------------------------------------------------------------
// The wordmark is one path of 7 sub-paths: a, a, s, t, l, a-counter, a-counter. The first "a" = sub-paths 0 + 5.
const src = readFileSync(join(HERE, 'source', 'atlas-wordmark-v6.svg'), 'utf8');
const D = / d="([^"]+)"/.exec(src)[1];
const SUBS = D.split('Z').filter((s) => s.trim()).map((s) => `${s}Z`);
// Measured from a 4x raster of the outlines (ink bounds in wordmark units).
// "a": bounds x 26..557, y -513.5..12; ink centroid (301.3, -231.3).
// Optical centre: halfway to the centroid horizontally (the stem side is heavier), and a touch above the box
// centre vertically, because the bowl sits low and a box-centred "a" reads as dropped.
const GLYPHS = {
  a: { d: SUBS[0] + SUBS[5], w: 531, h: 525.5, cx: 296.4, cy: -254 },
  // "atlas": bounds x 26..2209.25, y -694.5..12.5; centroid y -262.9. The ascenders of t and l are thin, so the
  // optical centre sits between the box centre (-341) and the x-height mass.
  wordmark: { d: D, w: 2183.25, h: 707, cx: 1117.6, cy: -318 },
};

/** a glyph scaled so its WIDTH is `frac` of `size`, optically centred at (size/2, size/2 + dy) */
const glyphG = (key, size, frac, fill = WHITE, dy = 0) => {
  const g = GLYPHS[key];
  const s = (size * frac) / g.w;
  return `<g transform="translate(${size / 2 - g.cx * s} ${size / 2 + dy - g.cy * s}) scale(${s})" fill="${fill}"><path d="${g.d}"/></g>`;
};

/** which glyph a surface of `px` shows: the wordmark only where it stays legible (>=120px) */
const pick = (px) => (VARIANT === 'wordmark' && px >= 120 ? 'wordmark' : 'a');
// Glyph width as a fraction of the tile. "a" grows as the tile shrinks so the counter stays open at 16px.
const FRAC = {
  a: { tile: 0.5, maskable: 0.4, fav16: 0.7, fav32: 0.64, badge: 0.84 },
  wordmark: { tile: 0.74, maskable: 0.56 },
};

const tileSvg = (size, key, frac, { rx = 0, bg = INDIGO } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
  `<rect width="${size}" height="${size}" rx="${rx}" fill="${bg}"/>${glyphG(key, size, frac)}</svg>`;

const png = (svg, file) => sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(file);
const pngBuf = (svg) => sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
const SQUIRCLE = 0.2237; // iOS corner radius / side

// ---- browser tab -------------------------------------------------------------------------------------------
// Favicons are always the "a": a wordmark at 16px is noise.
{
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" rx="${256 * SQUIRCLE}" fill="${INDIGO}"/>${glyphG('a', 256, 0.6)}</svg>\n`;
  writeFileSync(join(PUB, 'favicon.svg'), svg);
  const f16 = await pngBuf(tileSvg(16, 'a', FRAC.a.fav16, { rx: 3.5 }));
  const f32 = await pngBuf(tileSvg(32, 'a', FRAC.a.fav32, { rx: 7 }));
  const f48 = await pngBuf(tileSvg(48, 'a', 0.62, { rx: 10.5 }));
  writeFileSync(join(PUB, 'favicon-16x16.png'), f16);
  writeFileSync(join(PUB, 'favicon-32x32.png'), f32);
  writeFileSync(join(PUB, 'favicon.ico'), await pngToIco([f16, f32, f48]));
  // Safari pinned tab: single-colour silhouette, no background (Safari fills it with the mask-icon color)
  writeFileSync(join(PUB, 'safari-pinned-tab.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">${glyphG('a', 256, 0.86, '#000')}</svg>\n`);
}

// ---- manifest "any" icons (also: Web Push icon at 192, schema.org logo at 512, legacy sizes) --------------
// Rounded tile with transparent corners: desktop Chrome / Edge show "any" icons as-is.
for (const n of [72, 96, 120, 128, 144, 152, 167, 180, 192, 384, 512, 1024]) {
  const key = pick(n);
  await png(tileSvg(n, key, FRAC[key].tile, { rx: n * SQUIRCLE }), join(ICONS, `icon-${n}x${n}.png`));
}

// ---- Android adaptive (maskable): full-bleed, mark inside the central 80% circle ---------------------------
for (const n of [192, 512]) {
  const key = pick(n);
  await png(tileSvg(n, key, FRAC[key].maskable), join(ICONS, `maskable-${n}.png`));
}

// ---- iOS home screen: full-bleed opaque squares (iOS applies its own squircle) ----------------------------
for (const n of [180, 167, 152, 120]) {
  const key = pick(n);
  await png(tileSvg(n, key, FRAC[key].tile), join(ICONS, `apple-touch-${n}.png`));
}
{
  const key = pick(180);
  await png(tileSvg(180, key, FRAC[key].tile), join(PUB, 'apple-touch-icon.png'));
}

// ---- manifest shortcuts: lucide "plus" / "calendar-days", indigo on a tinted tile --------------------------
const glyph = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="0" fill="${INDIGO50}"/>
  <g transform="translate(24 24) scale(2)" fill="none" stroke="${INDIGO}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</g></svg>`;
await png(glyph('<path d="M5 12h14"/><path d="M12 5v14"/>'), join(ICONS, 'shortcut-new.png'));
await png(glyph('<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>'), join(ICONS, 'shortcut-calendar.png'));

// ---- notification badge: white "a" silhouette on transparent (Android uses alpha only) ---------------------
await png(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">${glyphG('a', 96, FRAC.a.badge)}</svg>`, join(ICONS, 'badge-96.png'));

// ---- iOS launch images: canvas background, the app icon tile centred ---------------------------------------
// [css width, css height, device pixel ratio]: every current iPhone size class
export const SPLASH_SIZES = [
  [440, 956, 3], [402, 874, 3], [430, 932, 3], [393, 852, 3], [428, 926, 3], [390, 844, 3],
  [414, 896, 3], [375, 812, 3], [414, 896, 2], [375, 667, 2], [320, 568, 2],
];
for (const [w, h, r] of SPLASH_SIZES) {
  const W = w * r; const H = h * r;
  const tile = 104 * r; const key = pick(180);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="${CANVAS}"/>
    <g transform="translate(${(W - tile) / 2} ${(H - tile) / 2})">${tileSvg(tile, key, FRAC[key].tile, { rx: tile * SQUIRCLE }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></svg>`;
  await png(svg, join(SPLASH, `iphone-${w}x${h}@${r}x.png`));
}
console.log(`pwa assets written (variant: ${VARIANT})`);
