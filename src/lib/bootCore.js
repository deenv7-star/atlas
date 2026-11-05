/** Boot screen variant choice (pure, no imports: tests/unit/boot.test.mjs). See src/lib/boot.js. */
export const BOOT_VARIANTS = ['a', 'b'];
export const BOOT_DEFAULT = 'a';
export const BOOT_STORE_KEY = 'atlas.boot.v';

/** ?boot=a|b wins (and is remembered by the inline script), then the stored value, then the default. */
export function pickBootVariant(search = '', stored = '') {
  const q = new URLSearchParams(search || '').get('boot');
  if (q && BOOT_VARIANTS.includes(q)) return q;
  if (stored && BOOT_VARIANTS.includes(stored)) return stored;
  return BOOT_DEFAULT;
}
