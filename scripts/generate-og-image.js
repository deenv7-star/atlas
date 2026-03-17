import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'public', 'og-image.png');

const width = 1200;
const height = 630;

// Create dark background with gradient
const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0B1220"/>
      <stop offset="100%" style="stop-color:#1a2744"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <text x="50%" y="42%" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="72" font-weight="bold">ATLAS</text>
  <text x="50%" y="58%" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-family="Arial, sans-serif" font-size="24">מערכת ניהול מתחמי נופש</text>
  <text x="50%" y="72%" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="Arial, sans-serif" font-size="18">הפסק לנהל. תתחיל להרוויח.</text>
</svg>
`;

await sharp(Buffer.from(svg))
  .png()
  .toFile(outPath);

console.log('Generated og-image.png at', outPath);
