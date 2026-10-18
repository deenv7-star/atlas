/**
 * Hebrew counts with the right singular: "יחידה אחת", "הזמנה אחת", "לילה אחד", "יומיים".
 * Pure (no imports) so it can be unit-tested with `node --test`.
 */
const NOUNS = {
  unit: { one: 'יחידה אחת', many: 'יחידות' },
  property: { one: 'נכס אחד', many: 'נכסים' },
  complex: { one: 'מתחם אחד', many: 'מתחמים' },
  booking: { one: 'הזמנה אחת', many: 'הזמנות' },
  lead: { one: 'ליד אחד', many: 'לידים' },
  guest: { one: 'אורח אחד', many: 'אורחים' },
  night: { one: 'לילה אחד', many: 'לילות' },
  day: { one: 'יום אחד', many: 'ימים', two: 'יומיים' },
  message: { one: 'הודעה אחת', many: 'הודעות' },
  payment: { one: 'תשלום אחד', many: 'תשלומים' },
};

/** heCount(1, 'unit') → "יחידה אחת"; heCount(3, 'unit') → "3 יחידות"; heCount(0, 'unit') → "0 יחידות". */
export function heCount(n, noun) {
  const w = NOUNS[noun];
  const num = Number(n) || 0;
  if (!w) return String(num);
  if (num === 1) return w.one;
  if (num === 2 && w.two) return w.two;
  return `${num} ${w.many}`;
}

export const HE_NOUNS = Object.keys(NOUNS);
