import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const inputPath = join(__dirname, '..', 'public', 'atlas-logo-new.png');
const outPath = join(__dirname, '..', 'public', 'atlas-logo-final.png');

async function main() {
  if (!existsSync(inputPath)) {
    console.error('Source logo not found at public/atlas-logo-new.png');
    process.exit(1);
  }

  const img = await sharp(inputPath);
  const { width, height, channels } = await img.metadata();
  const { data } = await img.raw().ensureAlpha().toBuffer({ resolveWithObject: true });

  // Make white/light pixels (high luminance) transparent
  const threshold = 245;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = (r * 0.299 + g * 0.587 + b * 0.114);
    if (luminance >= threshold) {
      data[i + 3] = 0;
    }
  }

  await sharp(Buffer.from(data), {
    raw: { width, height, channels: 4 },
  })
    .png()
    .toFile(outPath);

  console.log('Logo saved to', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
