/**
 * Onboarding Y1, phone: the full-bleed zimmer photo behind the card stack (from Y2). It changes with every step,
 * crossfades, and pushes in slowly. From the name step on it is "your place" (a photo for the kind they picked).
 * Sources are ≥2000px licensed photos (credits in brand/book/README.md), served as responsive webp:
 * a 2:3 portrait crop at 640/1000w for phones, a 1600w landscape for tablets. Desktop never loads them.
 */
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export const ARRIVE_KEY = 'atlas.onb.arrive'; // the finish → /today: TourHost lets Today land before the tour

const BG = { hello: 'valley', kind: 'infinity', units: 'mountain', channels: 'lake', times: 'fields', whatsapp: 'villa' };
const KIND_BG = { zimmer: 'aframe', villa: 'villa', complex: 'infinity', zimmer_complex: 'mountain' };
export function bgFor(q, phase, kind) {
  if (!q) return null;
  if (phase !== 'ask' || q === 'name') return KIND_BG[kind] || 'lake';
  return BG[q] || 'valley';
}
const SRCSET = (id) => `/onboarding/bg/${id}-p640.webp 640w, /onboarding/bg/${id}-p1000.webp 1000w`;
const WIDE = '(min-width: 700px)';

const PHONE = '(max-width: 1023px)';
export function useIsPhone() {
  const [on, setOn] = useState(() => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(PHONE).matches : false));
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(PHONE);
    const h = () => setOn(mq.matches);
    mq.addEventListener?.('change', h);
    return () => mq.removeEventListener?.('change', h);
  }, []);
  return on;
}

export function StepPhoto({ id, next }) {
  // warm the next step's photo (same candidate the browser will pick), so the crossfade never shows a blank
  useEffect(() => {
    if (!next || next === id) return;
    const img = new Image();
    if (window.matchMedia?.(WIDE).matches) img.src = `/onboarding/bg/${next}-1600.webp`;
    else { img.sizes = '100vw'; img.srcset = SRCSET(next); }
  }, [id, next]);
  const [firstId] = useState(id);
  const priority = id === firstId;
  return (
    <AnimatePresence initial={false}>
      <motion.picture key={id} className="oy1-pbg" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.9, ease: [0.23, 1, 0.32, 1] } }} exit={{ opacity: 0, transition: { duration: 0.9 } }}>
        <source media={WIDE} srcSet={`/onboarding/bg/${id}-1600.webp`} />
        <img src={`/onboarding/bg/${id}-p640.webp`} srcSet={SRCSET(id)} sizes="100vw" alt="" decoding="async" fetchPriority={priority ? 'high' : 'auto'} draggable={false} />
      </motion.picture>
    </AnimatePresence>
  );
}
