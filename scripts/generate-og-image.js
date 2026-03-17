import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'public', 'og-image.png');

const width = 1200;
const height = 630;

const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0B1220"/>
      <stop offset="50%" style="stop-color:#1e3a5f"/>
      <stop offset="100%" style="stop-color:#0B1220"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#4F46E5"/>
      <stop offset="100%" style="stop-color:#7C3AED"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="0" y="0" width="100%" height="6" fill="url(#accent)"/>
  <text x="50%" y="42%" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="72" font-weight="bold">ATLAS</text>
  <text x="50%" y="55%" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-family="Arial, sans-serif" font-size="28">מערכת ניהול מתחמי נופש בישראל</text>
  <text x="50%" y="68%" text-anchor="middle" fill="rgba(167,139,250,0.95)" font-family="Arial, sans-serif" font-size="22">הפסק לנהל. תתחיל להרוויח.</text>
</svg>
`;

await sharp(Buffer.from(svg))
  .png()
  .toFile(outPath);

console.log('Generated og-image.png at', outPath);
