/**
 * Which look this build ships (v5, brand/direction-v5.md). Both are light, cool, indigo-only.
 *   "a" = Mercury: ultra-white, minimal, flat hairline cards.   (feat/app-ui-v5-a)
 *   "b" = Stripe/Ramp: indigo-tinted page header band, richer data cards with icons. (feat/app-ui-v5-b)
 * VITE_UI_DIRECTION overrides for side-by-side review. Mirrored on <html data-ui> for CSS.
 */
export const DIRECTION = import.meta.env.VITE_UI_DIRECTION || 'b';
export const isStripe = DIRECTION === 'b';

if (typeof document !== 'undefined') document.documentElement.dataset.ui = DIRECTION;
