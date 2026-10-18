/** Rebuild all raster brand assets from the approved vector originals. */
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { writeFile, mkdir } from 'node:fs/promises';
const root = new URL('../public/', import.meta.url);
const logo = new URL('atlas-logo.svg', root);
const icon = new URL('favicon.svg', root);
for (const name of ['atlas-logo.png', 'atlas-logo-clean.png', 'atlas-logo-final.png', 'atlas-logo-transparent.png']) {
  await sharp(logo.pathname).resize({ width: 1714 }).png().toFile(new URL(name, root).pathname);
}
await mkdir(new URL('icons/', root), { recursive: true });
for (const size of [72, 96, 120, 128, 144, 152, 167, 180, 192, 512, 1024]) {
  await sharp(icon.pathname).resize(size, size).png().toFile(new URL(`icons/icon-${size}x${size}.png`, root).pathname);
}
for (const [name, size] of [['favicon-16x16.png', 16], ['favicon-32x32.png', 32], ['apple-touch-icon.png', 180]]) {
  await sharp(icon.pathname).resize(size, size).png().toFile(new URL(name, root).pathname);
}
await writeFile(new URL('favicon.ico', root), await pngToIco(await Promise.all([16, 32].map(size => sharp(icon.pathname).resize(size, size).png().toBuffer()))));
await sharp(icon.pathname).resize(1024, 1024).png().toFile(new URL('../resources/icon.png', root).pathname);
