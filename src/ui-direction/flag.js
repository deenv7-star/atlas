/**
 * Which look this build ships. feat/app-ui-v4-a ships "a" (Airbnb warm),
 * feat/app-ui-v4-b ships "b" (playful light). VITE_UI_DIRECTION overrides for side-by-side review.
 * The flag is mirrored on <html data-ui> so CSS can tint surfaces without touching components.
 */
export const DIRECTION = import.meta.env.VITE_UI_DIRECTION || 'a';
export const isPlayful = DIRECTION === 'b';

if (typeof document !== 'undefined') document.documentElement.dataset.ui = DIRECTION;
