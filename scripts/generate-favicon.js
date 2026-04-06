import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

/** Prefer monogram SVG; fallback to full logo PNG if present. */
const svgSource = join(publicDir, 'favicon.svg');
const pngFallback = join(publicDir, 'atlas-logo-final.png');

const input = existsSync(svgSource) ? svgSource : pngFallback;

if (!existsSync(input)) {
  console.error('Missing favicon source:', svgSource, 'or', pngFallback);
  process.exit(1);
}

const resizeOpts = {
  fit: 'contain',
  background: { r: 79, g: 70, b: 229, alpha: 1 },
};

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const { name, size } of sizes) {
  await sharp(input)
    .resize(size, size, resizeOpts)
    .png()
    .toFile(join(publicDir, name));
  console.log('Generated', name);
}

const buf16 = await sharp(input).resize(16, 16, resizeOpts).png().toBuffer();
const buf32 = await sharp(input).resize(32, 32, resizeOpts).png().toBuffer();
const ico = await pngToIco([buf32, buf16]);
writeFileSync(join(publicDir, 'favicon.ico'), ico);
console.log('Generated favicon.ico');
