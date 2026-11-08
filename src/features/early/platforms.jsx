/**
 * The "many places" a host juggles today. Brand names are used nominatively as plain text only (no logos, no
 * imitation of their UIs). Glyphs are generic line icons in atlas indigo.
 */
const G = {
  bed: <><path d="M3 18v-7h18v7" /><path d="M3 14.5h18" /><path d="M6.5 11V8.5h5V11" /></>,
  home: <><path d="M4 11.5 12 5l8 6.5V19H4z" /><path d="M10 19v-4.5h4V19" /></>,
  chat: <path d="M12 4c4.6 0 8 3 8 6.9s-3.4 6.9-8 6.9c-1 0-2-.1-2.9-.4L5 19.6l1.1-3.3C4.8 15 4 13.1 4 10.9 4 7 7.4 4 12 4z" />,
  phone: <path d="M7 3.5h3l1.5 4.5-2.2 1.4a11 11 0 0 0 5.3 5.3l1.4-2.2 4.5 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 5 5.5a2 2 0 0 1 2-2z" />,
  cal: <><rect x="4" y="5.5" width="16" height="14" rx="2.5" /><path d="M4 10h16M9 3.5v4M15 3.5v4" /></>,
  book: <><path d="M6.5 3.5H18v17H6.5A2 2 0 0 1 4.5 18.5v-13a2 2 0 0 1 2-2z" /><path d="M8.5 3.5v17M11.5 8h4M11.5 11h4" /></>,
  grid: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 9.5h16M4 14.5h16M10 4v16" /></>,
  coin: <><circle cx="12" cy="12" r="8" /><path d="M12 7.5v9M14.5 9.5h-3.3a1.7 1.7 0 0 0 0 3.4h1.6a1.7 1.7 0 0 1 0 3.4H9.5" /></>,
  bank: <><path d="m3.5 9 8.5-4.5L20.5 9" /><path d="M6 9.5v7M10 9.5v7M14 9.5v7M18 9.5v7M3.5 19.5h17" /></>,
  mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  plane: <><path d="M20.5 3.5 3.5 10.2l6.6 2.7 2.7 6.6z" /><path d="m10.1 12.9 10.4-9.4" /></>,
  bubble: <><path d="M5 5h14v10H10l-5 4z" /><path d="M8.5 9h7M8.5 12h4" /></>,
};

export function Glyph({ g }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {G[g]}
    </svg>
  );
}

/** Order = visual stacking order. `ltr` marks Latin names (rendered in an isolated LTR span). */
export const PLATFORMS = [
  { k: 'booking', name: 'Booking.com', ltr: true, meta: 'הזמנה חדשה · שישי עד ראשון', g: 'bed' },
  { k: 'wa', name: 'וואטסאפ', meta: '״יש לכם פנוי בשישי?״', g: 'chat' },
  { k: 'airbnb', name: 'Airbnb', ltr: true, meta: 'הזמנה חדשה · אותו שישי', g: 'home' },
  { k: 'call', name: 'שיחה שלא נענתה', meta: '23:40 · מספר לא שמור', g: 'phone' },
  { k: 'note', name: 'המחברת', meta: '״לבדוק מי שילם מקדמה״', g: 'book' },
  { k: 'xls', name: 'אקסל', meta: 'הזמנות 2026 · גיליון 3', g: 'grid' },
  { k: 'gcal', name: 'Google Calendar', ltr: true, meta: 'משפחת כהן · 2 לילות', g: 'cal' },
  { k: 'bit', name: 'ביט', meta: 'התקבלו ₪500 · מקדמה', g: 'coin' },
  { k: 'bank', name: 'העברה בנקאית', meta: '₪1,800 · לבדוק בחשבון', g: 'bank' },
  { k: 'mail', name: 'מייל', meta: 'אישור הזמנה · לא נקרא', g: 'mail' },
  { k: 'ig', name: 'Instagram', ltr: true, meta: 'הודעה: ״כמה ללילה?״', g: 'plane' },
  { k: 'fb', name: 'Facebook', ltr: true, meta: '״יש מקום לזוג בחג?״', g: 'bubble' },
];

export function PlatformName({ p }) {
  return p.ltr ? <bdi dir="ltr">{p.name}</bdi> : <span>{p.name}</span>;
}
