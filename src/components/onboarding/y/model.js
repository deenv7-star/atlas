/**
 * Onboarding round Y: the steps, the photos, and the real saves. No new writes: every save is one of the
 * live onboarding v2 actions (commitProfile → commitUnits → commitLinks → commitTimes → saveWhatsApp → commitStart),
 * in the same order the live flow (v3 B) runs them, so the DB sees exactly what it sees today.
 */
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { kindInfo, clampInt, UNITS_LIMIT, unitsLabel, checkIcalLink, phoneValid } from '@/lib/onboarding/v2/model';
import { commitProfile, commitUnits, commitTimes, commitStart, commitLinks, saveWhatsApp } from '@/lib/onboarding/v2/actions';
import { linksFromAnswers } from '../v3/linksB';

export const STEPS = ['hello', 'kind', 'name', 'units', 'channels', 'times', 'whatsapp'];
export const QUESTIONS = STEPS.length - 1; // "hello" is not a question

export const PHOTO = {
  zimmer: '/demo/units/unit-6.webp',
  villa: '/demo/units/unit-3.webp',
  complex: '/demo/complex-pool.webp',
  zimmer_complex: '/demo/units/unit-1.webp',
  guesthouse: '/demo/types/boutique.webp',
  boutique: '/demo/types/boutique.webp',
  apartments: '/demo/types/apartments.webp',
  other: '/demo/units/unit-2.webp',
};
export const kindPhoto = (kind) => PHOTO[kind] || '/demo/complex-pool.webp';
export const LINKABLE = { booking: 'BOOKING_COM', airbnb: 'AIRBNB' };

export function firstName(user) {
  const n = String(user?.full_name || user?.name || '').trim().split(/\s+/)[0] || '';
  return /@/.test(n) ? '' : n;
}

export function placeName(a) {
  return String(a.name || '').trim();
}

export function unitNamesOf(a, max = 6) {
  const k = kindInfo(a.kind || 'zimmer');
  const n = clampInt(a.unitCount, 1, UNITS_LIMIT);
  const single = n === 1 && placeName(a);
  return { names: Array.from({ length: Math.min(n, max) }, (_, i) => (single ? placeName(a) : `${k.unit} ${i + 1}`)), n };
}

/** Links that pass the paste check, for ticked channels only (same as the live flow). */
export function badLinks(a) {
  return ['booking', 'airbnb'].filter((c) => {
    const v = c === 'booking' ? a.icalBooking : a.icalAirbnb;
    return (a.channels || []).includes(c) && String(v || '').trim() && !checkIcalLink(LINKABLE[c], v).ok;
  });
}

export function phoneOkOrEmpty(v) {
  const s = String(v || '').trim();
  return !s || phoneValid(s);
}

/** The real saves, in order. Each line is shown while its write runs. */
export function buildPlan(user, a0) {
  const a = { ...a0, kind: a0.kind || 'zimmer', links: linksFromAnswers(a0) };
  const n = clampInt(a.unitCount, 1, UNITS_LIMIT);
  const names = Array.from(new Set(a.links.map((l) => (l.provider === 'AIRBNB' ? 'Airbnb' : 'Booking.com'))));
  const phone = String(a.phone || '').trim();
  return {
    a,
    steps: [
      { id: 'profile', title: 'שומרים את פרטי המתחם', detail: placeName(a) || kindInfo(a.kind).label, run: () => commitProfile(user, a) },
      { id: 'calendar', title: 'פותחים יומן לכל יחידה', detail: `${unitsLabel(a.kind, n)} ביומן`, run: () => commitUnits(user, a) },
      ...(a.links.length ? [{ id: 'links', title: `מחברים את ${names.join(' ו-')}`, detail: 'ההזמנות נכנסות לבד', run: () => commitLinks(user, a) }] : []),
      { id: 'messages', title: 'מכינים הודעות לאורחים', detail: a.timesVary ? 'שעות משתנות, ההודעה מוכנה' : `כניסה ${a.checkIn} · יציאה ${a.checkOut}`, run: () => commitTimes(user, a) },
      ...(phone && phoneValid(phone) ? [{ id: 'whatsapp', title: 'מחברים את הוואטסאפ', detail: phone, run: () => saveWhatsApp(user?.organization_id, phone, null) }] : []),
      { id: 'start', title: 'פותחים 14 יום חינם', detail: 'בלי כרטיס אשראי', run: () => commitStart(user, { ...a, plan: 'trial' }) },
    ],
  };
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Runs the plan once; a check appears because the write finished, not because a timer did. */
export function useBuild(user, a, { active, stepMs = 900 } = {}) {
  const still = useReducedMotion();
  const plan = useRef(null);
  if (active && !plan.current) plan.current = buildPlan(user, a);
  const steps = plan.current?.steps || [];
  const [at, setAt] = useState(0);
  const [error, setError] = useState('');
  const running = useRef(false);
  const run = async (from) => {
    if (running.current || !plan.current) return;
    running.current = true;
    setError('');
    for (let i = from; i < steps.length; i += 1) {
      setAt(i);
      const t0 = Date.now();
      try {
        await steps[i].run();
      } catch (e) {
        running.current = false;
        if (typeof console !== 'undefined') console.warn('onboarding save', steps[i].id, e?.message);
        setError('x');
        return;
      }
      const left = (still ? 200 : stepMs) - (Date.now() - t0);
      if (left > 0) await wait(left);
    }
    setAt(steps.length);
    running.current = false;
  };
  useEffect(() => { if (active) run(0); }, [active]);
  return { steps, at, error, done: active && steps.length > 0 && at >= steps.length, retry: () => run(at), a: plan.current?.a };
}
