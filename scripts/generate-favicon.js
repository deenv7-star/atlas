import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

/** Prefer crisp monogram SVG; fallback to full logo PNG if present. */
const svgSource = join(publicDir, 'favicon.svg');
const pngFallback = join(publicDir, 'atlas-logo-final.png');

const input = existsSync(svgSource) ? svgSource : pngFallback;

if (!existsSync(input)) {
  console.error('Missing favicon source:', svgSource, 'or', pngFallback);
  process.exit(1);
}

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const { name, size } of sizes) {
  await sharp(input)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(join(publicDir, name));
  console.log('Generated', name);
}

await sharp(input)
  .resize(32, 32, { fit: 'cover' })
  .png()
  .toFile(join(publicDir, 'favicon.ico'));
console.log('Generated favicon.ico');
