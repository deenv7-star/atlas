/**
 * PWA install assets from the approved monogram (public/favicon.svg) and the approved lowercase
 * wordmark (src/components/common/BrandWordmark.jsx). Re-run after a logo change:
 *   node scripts/pwa/generate-pwa-assets.mjs
 * Writes:
 *   public/icons/maskable-192.png, maskable-512.png   Android adaptive icons (mark inside the 80% safe zone)
 *   public/icons/apple-touch-*.png, public/apple-touch-icon.png
 *                                                     full-bleed squares (iOS fills transparent corners black)
 *   public/icons/shortcut-new.png, shortcut-calendar.png  manifest shortcut icons (96px)
 *   public/icons/badge-96.png                         monochrome notification badge (Android status bar)
 *   public/splash/*.png                               iOS launch images (apple-touch-startup-image), one per iPhone size
 */
import sharp from 'sharp';
import { mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ICONS = join(ROOT, 'public', 'icons');
const SPLASH = join(ROOT, 'public', 'splash');
mkdirSync(ICONS, { recursive: true });
mkdirSync(SPLASH, { recursive: true });

const fav = readFileSync(join(ROOT, 'public', 'favicon.svg'), 'utf8');
const TILE = (/<rect[^>]*fill="(#[0-9a-fA-F]{6})"/.exec(fav) || [])[1] || '#202334';
const MARK = /<path[\s\S]*?\/>/.exec(fav)[0]; // includes its own translate(20 42) inside a 256 box
const wm = readFileSync(join(ROOT, 'src', 'components', 'common', 'BrandWordmark.jsx'), 'utf8');
const WORD = [...wm.matchAll(/<path ([^>]*?)\/>/g)].map((m) => `<path ${m[1]}/>`).join('');

const NAVY = '#1B2656';
const CANVAS = '#F7F8FB';
const BRAND = '#3E2BF1';
const BRAND50 = '#F1EFFE';

/** mark centred in a square of `size`, scaled to `scale` of the 256 artboard, on a full-bleed tile */
const markSvg = (size, scale, { bg = TILE, rx = 0 } = {}) => {
  const s = (size / 256) * scale;
  const off = (size - 256 * s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${rx}" fill="${bg}"/>
    <g transform="translate(${off} ${off}) scale(${s})">${MARK}</g></svg>`;
};

const png = (svg, file) => sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(file);

// maskable: the safe zone is a circle of 80% diameter; 0.66 keeps the mark's corners inside it
for (const n of [192, 512]) await png(markSvg(n, 0.66), join(ICONS, `maskable-${n}.png`));
// iOS: full-bleed (iOS rounds the corners itself)
for (const n of [180, 167, 152, 120]) await png(markSvg(n, 1.0), join(ICONS, `apple-touch-${n}.png`));
await png(markSvg(180, 1.0), join(ROOT, 'public', 'apple-touch-icon.png'));

// shortcut icons: lucide "plus" and "calendar-days" glyphs, indigo on a tinted tile
const glyph = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="0" fill="${BRAND50}"/>
  <g transform="translate(24 24) scale(2)" fill="none" stroke="${BRAND}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</g></svg>`;
await png(glyph('<path d="M5 12h14"/><path d="M12 5v14"/>'), join(ICONS, 'shortcut-new.png'));
await png(glyph('<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>'), join(ICONS, 'shortcut-calendar.png'));

// notification badge: white silhouette of the mark on transparent (Android tints it)
{
  const n = 96; const s = (n / 256) * 1.15; const off = (n - 256 * s) / 2;
  await png(`<svg xmlns="http://www.w3.org/2000/svg" width="${n}" height="${n}"><g transform="translate(${off} ${off}) scale(${s})">${MARK.replace(/fill="[^"]*"/, 'fill="#fff"')}</g></svg>`, join(ICONS, 'badge-96.png'));
}

// iOS launch images: canvas, the tile with the mark, the lowercase wordmark under it.
// [css width, css height, device pixel ratio]: every current iPhone size class
export const SPLASH_SIZES = [
  [440, 956, 3], [402, 874, 3], [430, 932, 3], [393, 852, 3], [428, 926, 3], [390, 844, 3],
  [414, 896, 3], [375, 812, 3], [414, 896, 2], [375, 667, 2], [320, 568, 2],
];
for (const [w, h, r] of SPLASH_SIZES) {
  const W = w * r; const H = h * r;
  const tile = 96 * r; const tx = (W - tile) / 2; const ty = H / 2 - tile * 0.82;
  const wordW = 104 * r; const wordH = wordW * 638 / 1859; const wx = (W - wordW) / 2; const wy = ty + tile + 22 * r;
  const ms = tile / 256;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="${CANVAS}"/>
    <g transform="translate(${tx} ${ty})"><rect width="${tile}" height="${tile}" rx="${tile * 0.2266}" fill="${TILE}"/>
      <g transform="scale(${ms})">${MARK}</g></g>
    <g transform="translate(${wx} ${wy}) scale(${wordW / 1859})" fill="${NAVY}">${WORD}</g></svg>`;
  await png(svg, join(SPLASH, `iphone-${w}x${h}@${r}x.png`));
}
console.log('pwa assets written');
