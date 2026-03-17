import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const inputPath = join(__dirname, '..', 'public', 'atlas-logo-source.png');
const outPath = join(__dirname, '..', 'public', 'atlas-logo-final.png');

async function main() {
  if (!existsSync(inputPath)) {
    console.error('Source logo not found at public/atlas-logo-source.png');
    process.exit(1);
  }

  const img = await sharp(inputPath);
  const { width, height } = await img.metadata();
  const { data } = await img.raw().ensureAlpha().toBuffer({ resolveWithObject: true });

  // Make white/light pixels transparent - aggressive for white + lavender gradient
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = (r * 0.299 + g * 0.587 + b * 0.114);
    // White, off-white, light lavender - all become transparent
    const isLight = luminance >= 210 || (r >= 200 && g >= 200 && b >= 180);
    if (isLight) {
      data[i + 3] = 0;
    }
  }

  let result = sharp(Buffer.from(data), {
    raw: { width, height, channels: 4 },
  }).png();

  // Trim transparent/whitespace borders - keeps only the content
  result = result.trim({ threshold: 10 });

  const trimmed = await result.toBuffer();

  // Add small padding so logo doesn't touch edges
  const padding = 16;

  await sharp(trimmed)
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(outPath);

  console.log('Logo saved to', outPath, '(transparent, trimmed, padded)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
