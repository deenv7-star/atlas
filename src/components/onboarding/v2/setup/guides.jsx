/**
 * "Exactly where to click" for Booking.com and Airbnb calendar links, in plain Hebrew with the English
 * button names in small print (most extranets show English). Steps follow the platforms' own help pages
 * (checked 19.10.2026):
 *   Booking.com: https://partner.booking.com/en-us/help/rates-availability/extranet-calendar/how-synchronize-your-calendars-across-channels
 *   Airbnb:      https://www.airbnb.com/help/article/99
 * The pictures are simplified drawings of those screens (not screenshots), so they stay correct when a
 * site changes its colours, and every one is labelled as an illustration.
 */
import React from 'react';
import { cn } from '@/lib/utils';

export const GUIDES = {
  BOOKING_COM: {
    name: 'Booking.com',
    short: 'Booking',
    open: { href: 'https://admin.booking.com/', label: 'פתיחת האקסטרא-נט של Booking' },
    help: 'https://partner.booking.com/en-us/help/rates-availability/extranet-calendar/how-synchronize-your-calendars-across-channels',
    tip: 'הכי נוח מהמחשב. כל יחידה ב-Booking מקבלת קישור משלה.',
    steps: [
      { title: 'נכנסים לאקסטרא-נט', en: 'admin.booking.com', text: 'האתר שבו מנהלים את המקום ב-Booking. נכנסים עם השם והסיסמה הרגילים.', pic: 'b1' },
      { title: 'תעריפים וזמינות ← סנכרון לוחות שנה', en: 'Rates & Availability → Sync calendars', text: 'בתפריט למעלה לוחצים על "תעריפים וזמינות", ואז על "סנכרון לוחות שנה".', pic: 'b2' },
      { title: 'ליד היחידה: הוספת חיבור', en: 'Add calendar connection → Skip this step', text: 'ליד היחידה לוחצים "הוספת חיבור לוח שנה". בחלון שנפתח גוללים למטה ולוחצים "דילוג על השלב".', pic: 'b3' },
      { title: 'נותנים שם ומעתיקים את הקישור', en: 'Name it "atlas" → Copy link', text: 'כותבים atlas בשם החיבור ולוחצים "העתקת קישור". הקישור נשמר בזיכרון של המחשב או הטלפון.', pic: 'b4' },
    ],
  },
  AIRBNB: {
    name: 'Airbnb',
    short: 'Airbnb',
    open: { href: 'https://www.airbnb.com/hosting', label: 'פתיחת Airbnb למארחים' },
    help: 'https://www.airbnb.com/help/article/99',
    tip: 'עובד מהמחשב וגם מהדפדפן בטלפון. כל מודעה מקבלת קישור משלה.',
    steps: [
      { title: 'נכנסים ל-Airbnb ← לוח שנה', en: 'Menu → Calendar', text: 'נכנסים לחשבון המארח, ולוחצים על "לוח שנה". בוחרים את המודעה.', pic: 'a1' },
      { title: 'זמינות', en: 'Availability', text: 'בצד של לוח השנה לוחצים על "זמינות".', pic: 'a2' },
      { title: 'חיבור לוחות שנה ← חיבור לאתר אחר', en: 'Connect calendars → Connect to another website', text: 'גוללים עד "חיבור לוחות שנה" ולוחצים "חיבור לאתר אחר".', pic: 'a3' },
      { title: 'מעתיקים את הקישור של Airbnb', en: 'Copy the Airbnb calendar link (.ics)', text: 'מופיע קישור שנגמר ב-ics. לוחצים "העתקה".', pic: 'a4' },
    ],
  },
};

const Bar = ({ url }) => (
  <div className="flex items-center gap-1.5 border-b border-[#EEF0F5] bg-[#F7F8FB] px-3 py-2">
    <span className="h-2 w-2 rounded-full bg-[#D5D9E6]" /><span className="h-2 w-2 rounded-full bg-[#D5D9E6]" /><span className="h-2 w-2 rounded-full bg-[#D5D9E6]" />
    <span className="ms-2 flex-1 truncate rounded-full bg-white px-3 py-0.5 text-[11px] text-ink-600" dir="ltr">{url}</span>
  </div>
);
const Mark = ({ n, className }) => <span className={cn('ob2-mark', className)}>{n}</span>;
const Line = ({ w = 'w-20', className }) => <span className={cn('block h-2 rounded-full bg-[#E9ECF4]', w, className)} />;

/** A simplified drawing of the screen for one step, with the place to click outlined and numbered. */
export function GuidePic({ pic, n }) {
  const brandB = 'bg-[#1B2656]'; // drawn in the app's navy, not the platform's colours
  let body = null;
  switch (pic) {
    case 'b1':
      body = (<>
        <Bar url="admin.booking.com" />
        <div className="flex flex-col items-center gap-2 px-6 py-5">
          <span className="text-[13px] font-extrabold text-navy-900" dir="ltr">Booking.com · Extranet</span>
          <span className="h-7 w-full rounded-[8px] border border-[#E1E4EE]" /><span className="h-7 w-full rounded-[8px] border border-[#E1E4EE]" />
          <span className="ob2-hot relative flex h-8 w-full items-center justify-center text-[12px] font-bold text-navy-900" dir="ltr">Sign in<Mark n={n} className="-end-3 -top-3" /></span>
        </div>
      </>);
      break;
    case 'b2':
      body = (<>
        <Bar url="admin.booking.com" />
        <div className={cn('flex items-center gap-3 px-3 py-2 text-[11px] font-semibold text-white/80', brandB)} dir="ltr">
          <span>Home</span><span className="ob2-hot relative px-2 py-0.5 !text-navy-900">Rates &amp; Availability<Mark n={n} className="-end-4 -top-4" /></span><span>Reservations</span>
        </div>
        <div className="flex gap-3 px-3 py-3" dir="ltr">
          <div className="flex w-[54%] flex-col gap-1 rounded-[10px] border border-[#E1E4EE] p-2 text-[11px] text-navy-900 shadow-sm">
            <span className="px-1.5 py-1">Calendar</span>
            <span className="ob2-hot px-1.5 py-1 font-bold">Sync calendars</span>
            <span className="px-1.5 py-1">Rate plans</span>
          </div>
          <div className="flex flex-1 flex-col gap-1.5 pt-1"><Line w="w-full" /><Line w="w-3/4" /><Line w="w-2/3" /></div>
        </div>
      </>);
      break;
    case 'b3':
      body = (<>
        <Bar url="admin.booking.com/…/sync" />
        <div className="flex flex-col gap-2 px-3 py-3" dir="ltr">
          <span className="text-[12px] font-extrabold text-navy-900">Sync calendars</span>
          {[0, 1].map((r) => (
            <div key={r} className="flex items-center justify-between rounded-[10px] border border-[#E1E4EE] px-2.5 py-2">
              <span className="text-[11px] font-semibold text-navy-900">Room {r + 1}</span>
              <span className={cn('relative whitespace-nowrap rounded-[7px] px-1.5 py-1 text-[9px] font-bold', r === 0 ? 'ob2-hot text-navy-900' : 'bg-[#F1F2F7] text-ink-600')}>Add calendar connection{r === 0 ? <Mark n={n} className="-end-4 -top-4" /> : null}</span>
            </div>
          ))}
          <span className="self-end text-[10px] font-semibold text-brand-700 underline">Skip this step</span>
        </div>
      </>);
      break;
    case 'b4':
      body = (<>
        <Bar url="admin.booking.com/…/sync" />
        <div className="flex flex-col gap-2 px-3 py-3" dir="ltr">
          <span className="text-[12px] font-extrabold text-navy-900">Export calendar</span>
          <span className="flex h-7 items-center rounded-[8px] border border-[#E1E4EE] px-2 text-[11px] text-navy-900">atlas</span>
          <div className="flex items-center gap-2">
            <span className="flex h-7 flex-1 items-center truncate rounded-[8px] bg-[#F7F8FB] px-2 text-[10px] text-ink-600">https://ical.booking.com/v1/export?t=…</span>
            <span className="ob2-hot relative flex h-7 items-center px-2 text-[11px] font-bold text-navy-900">Copy link<Mark n={n} className="-end-3 -top-4" /></span>
          </div>
        </div>
      </>);
      break;
    case 'a1':
      body = (<>
        <Bar url="airbnb.com/hosting" />
        <div className="flex items-center gap-3 px-3 py-2 text-[11px] font-semibold text-ink-600" dir="ltr">
          <span>Today</span><span className="ob2-hot relative px-2 py-0.5 !text-navy-900">Calendar<Mark n={n} className="-end-4 -top-4" /></span><span>Listings</span><span>Messages</span>
        </div>
        <div className="grid grid-cols-7 gap-1 px-3 pb-3">{Array.from({ length: 14 }, (_, i) => <span key={i} className="h-5 rounded-[5px] bg-[#F1F2F7]" />)}</div>
      </>);
      break;
    case 'a2':
      body = (<>
        <Bar url="airbnb.com/hosting/calendar" />
        <div className="flex gap-3 px-3 py-3" dir="ltr">
          <div className="grid flex-1 grid-cols-5 gap-1">{Array.from({ length: 15 }, (_, i) => <span key={i} className="h-5 rounded-[5px] bg-[#F1F2F7]" />)}</div>
          <div className="flex w-[42%] flex-col gap-1 rounded-[10px] border border-[#E1E4EE] p-1.5 text-[11px] text-navy-900">
            <span className="px-1.5 py-1">Pricing</span>
            <span className="ob2-hot relative px-1.5 py-1 font-bold">Availability<Mark n={n} className="-end-3 -top-3" /></span>
          </div>
        </div>
      </>);
      break;
    case 'a3':
      body = (<>
        <Bar url="airbnb.com/hosting/calendar" />
        <div className="flex flex-col gap-2 px-3 py-3" dir="ltr">
          <Line w="w-1/2" /><Line w="w-2/3" />
          <span className="mt-1 text-[12px] font-extrabold text-navy-900">Connect calendars</span>
          <span className="ob2-hot relative flex h-8 items-center px-2.5 text-[11px] font-bold text-navy-900">Connect to another website<Mark n={n} className="-end-3 -top-4" /></span>
        </div>
      </>);
      break;
    case 'a4':
      body = (<>
        <Bar url="airbnb.com/hosting/calendar" />
        <div className="flex flex-col gap-2 px-3 py-3" dir="ltr">
          <span className="text-[12px] font-extrabold text-navy-900">Airbnb calendar link</span>
          <div className="flex items-center gap-2">
            <span className="flex h-7 flex-1 items-center truncate rounded-[8px] bg-[#F7F8FB] px-2 text-[10px] text-ink-600">https://www.airbnb.com/calendar/ical/….ics</span>
            <span className="ob2-hot relative flex h-7 items-center px-2 text-[11px] font-bold text-navy-900">Copy<Mark n={n} className="-end-3 -top-4" /></span>
          </div>
        </div>
      </>);
      break;
    default:
      body = null;
  }
  return (
    <figure className="m-0">
      <div className="ob2-shot relative" aria-hidden>{body}</div>
      <figcaption className="mt-1.5 text-[12px] text-ink-400">איור להמחשה. המסך אצלכם יכול להיראות קצת אחרת.</figcaption>
    </figure>
  );
}
