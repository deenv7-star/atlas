/**
 * Generate iOS/Android app icons from atlas-logo.png
 * Run: node scripts/generate-icons.js
 * Requires: npm install sharp
 */

import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SRC = join(ROOT, 'public', 'atlas-logo-transparent.png')
const OUT = join(ROOT, 'public', 'icons')

const SIZES = [72, 96, 120, 128, 144, 152, 167, 180, 192, 512, 1024]

mkdirSync(OUT, { recursive: true })

for (const size of SIZES) {
  await sharp(SRC)
    .resize(size, size, { fit: 'contain', background: { r: 11, g: 18, b: 32, alpha: 1 } })
    .png()
    .toFile(join(OUT, `icon-${size}x${size}.png`))
  console.log(`✓ icon-${size}x${size}.png`)
}

console.log('\nAll icons generated in public/icons/')
console.log('Next: run  npx cap add ios  to add the iOS project')
