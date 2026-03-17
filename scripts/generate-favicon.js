import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const logoPath = join(publicDir, 'atlas-logo-final.png');

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const { name, size } of sizes) {
  await sharp(logoPath)
    .resize(size, size)
    .png()
    .toFile(join(publicDir, name));
  console.log('Generated', name);
}

// favicon.ico as 32x32 (browsers accept PNG in .ico for simple cases)
await sharp(logoPath)
  .resize(32, 32)
  .png()
  .toFile(join(publicDir, 'favicon.ico'));
console.log('Generated favicon.ico');
