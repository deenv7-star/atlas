import React from 'react';
import {
  CalendarRange, Users, MessageCircle, Wallet, SprayCan, Check, Clock, Star,
} from 'lucide-react';

/*
 * Static, illustrative renders of real ATLAS screens (calendar, leads, messages,
 * payments, cleaning). The data is sample data that shows how a screen looks.
 * aria-hidden on the visual body: the surrounding copy describes the feature.
 */

const DAYS = [
  { d: 'א׳', n: 18 }, { d: 'ב׳', n: 19, today: true }, { d: 'ג׳', n: 20 }, { d: 'ד׳', n: 21 },
  { d: 'ה׳', n: 22 }, { d: 'ו׳', n: 23 }, { d: 'ש׳', n: 24 },
];

const UNITS = [
  { name: 'הגפן', bars: [{ s: 1, e: 3, ch: 'airbnb', g: 'כהן' }, { s: 5, e: 7, ch: 'direct', g: 'אברהם' }] },
  { name: 'הזית', bars: [{ s: 2, e: 5, ch: 'booking', g: 'מזרחי' }, { s: 6, e: 7, ch: 'airbnb', g: 'פרץ' }] },
  { name: 'הנחל', bars: [{ s: 1, e: 1, ch: 'direct', g: 'לוי' }, { s: 4, e: 7, ch: 'booking', g: 'ביטון' }] },
  { name: 'האלון', bars: [{ s: 3, e: 6, ch: 'direct', g: 'דהן' }] },
];

export function CalendarMock({ compact = false }) {
  const units = compact ? UNITS.slice(0, 3) : UNITS;
  return (
    <div className="lp-cal">
      <div className="lp-cal-grid">
        <span />
        {DAYS.map((x) => (
          <div key={x.n} className={`lp-cal-day${x.today ? ' is-today' : ''}`}>
            {x.d}
            <b className="num">{x.n}</b>
          </div>
        ))}
        {units.map((u) => (
          <React.Fragment key={u.name}>
            <div className="lp-cal-unit">{u.name}</div>
            <div className="lp-cal-row">
              {u.bars.map((b) => (
                <div
                  key={b.s}
                  className={`lp-bar lp-bar-${b.ch}`}
                  style={{ gridColumn: `${b.s} / ${b.e + 1}` }}
                >
                  {b.g}
                </div>
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export function Legend() {
  return (
    <div className="lp-legend">
      <span><i style={{ background: 'var(--lp-booking)' }} />Booking.com</span>
      <span><i style={{ background: 'var(--lp-airbnb)' }} />Airbnb</span>
      <span><i style={{ background: 'var(--lp-direct)' }} />הזמנה ישירה</span>
    </div>
  );
}

export function HeroMock() {
  return (
    <div className="lp-window" aria-hidden="true">
      <div className="lp-win-bar">
        <span className="lp-win-title"><CalendarRange size={16} />לוח שנה</span>
        <span className="lp-win-meta">אוקטובר 2026</span>
      </div>
      <CalendarMock />
      <Legend />
    </div>
  );
}

function SyncMock() {
  const rows = [
    { ch: 'Booking.com', cls: 'booking', u: 'הזית, הנחל', t: 'עודכן לפני 8 דק׳' },
    { ch: 'Airbnb', cls: 'airbnb', u: 'הגפן, הזית', t: 'עודכן לפני 8 דק׳' },
    { ch: 'הזמנות ישירות', cls: 'direct', u: 'כל היחידות', t: 'נרשמות ישירות ב-ATLAS' },
  ];
  return (
    <div className="lp-window" aria-hidden="true">
      <div className="lp-win-bar">
        <span className="lp-win-title"><CalendarRange size={16} />סנכרון יומנים</span>
        <span className="lp-chip lp-chip-ok">פעיל</span>
      </div>
      <div className="lp-list">
        {rows.map((r) => (
          <div key={r.ch} className="lp-row">
            <span className={`lp-av lp-av-${r.cls}`}>{r.ch.charAt(0)}</span>
            <div className="lp-row-main"><b>{r.ch}</b><span>{r.u}</span></div>
            <div className="lp-row-end">
              <span className="lp-chip lp-chip-ok">מסונכרן</span>
              <span className="lp-row-time">{r.t}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="lp-sync-strip">
        <CalendarMock compact />
      </div>
    </div>
  );
}

function LeadsMock() {
  const cols = [
    { t: 'פנייה חדשה', items: [{ n: 'רונית ש.', s: '2 לילות, 24-26/10' }, { n: 'עומר ג.', s: 'זוג, סוף שבוע' }] },
    { t: 'הצעת מחיר', items: [{ n: 'משפחת אזולאי', s: '3 לילות, ₪2,700' }] },
    { t: 'שולמה מקדמה', items: [{ n: 'יעל ונדב', s: 'צימר הגפן, ₪600' }, { n: 'שרון ק.', s: 'סוויטת הנחל' }] },
  ];
  return (
    <div className="lp-window" aria-hidden="true">
      <div className="lp-win-bar">
        <span className="lp-win-title"><Users size={16} />לידים</span>
        <span className="lp-win-meta num">5 פתוחים</span>
      </div>
      <div className="lp-pipe">
        {cols.map((c) => (
          <div key={c.t} className="lp-pipe-col">
            <h4><span>{c.t}</span><span className="num">{c.items.length}</span></h4>
            {c.items.map((i) => (
              <div key={i.n} className="lp-pipe-card"><b>{i.n}</b><span>{i.s}</span></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MessagesMock() {
  const steps = [
    { icon: Check, when: 'מיד אחרי ההזמנה', text: 'היי יעל, ההזמנה שלכם לצימר הגפן אושרה. 24-26/10, נתראה!' },
    { icon: Clock, when: 'יום לפני ההגעה', text: 'מחר צ׳ק-אין מ-15:00. קוד לשער: 4821. ניווט בוויז: צימר הגפן.' },
    { icon: Star, when: 'אחרי העזיבה', text: 'תודה שהתארחתם! נשמח אם תשאירו לנו ביקורת קצרה.' },
  ];
  return (
    <div className="lp-window" aria-hidden="true">
      <div className="lp-win-bar">
        <span className="lp-win-title"><MessageCircle size={16} />הודעות אוטומטיות</span>
        <span className="lp-chip lp-chip-ok">פעיל</span>
      </div>
      <div className="lp-flow">
        {steps.map((s) => (
          <div key={s.when} className="lp-flow-step">
            <span className="lp-flow-dot"><s.icon size={16} /></span>
            <div>
              <div className="lp-flow-when">{s.when}</div>
              <div className="lp-bubble">{s.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentsMock() {
  const rows = [
    { n: 'משפחת מזרחי', s: 'צימר הזית, 20-23/10', a: '₪3,400', st: ['שולם', 'ok'] },
    { n: 'יעל ונדב', s: 'צימר הגפן, 24-26/10', a: '₪1,200', st: ['יתרה פתוחה', 'warn'] },
    { n: 'אורי דהן', s: 'בקתת האלון, 21-24/10', a: '₪2,850', st: ['מקדמה התקבלה', 'info'] },
  ];
  return (
    <div className="lp-window" aria-hidden="true">
      <div className="lp-win-bar">
        <span className="lp-win-title"><Wallet size={16} />תשלומים</span>
        <span className="lp-win-meta">אוקטובר</span>
      </div>
      <div className="lp-money">
        <div><small>הכנסות</small><b className="num">₪41,200</b></div>
        <div><small>הוצאות</small><b className="num">₪9,860</b></div>
        <div><small>פתוח לגבייה</small><b className="num">₪2,350</b></div>
      </div>
      <div className="lp-list">
        {rows.map((r) => (
          <div key={r.n} className="lp-row">
            <span className="lp-av">{r.n.charAt(0)}</span>
            <div className="lp-row-main"><b>{r.n}</b><span>{r.s}</span></div>
            <div className="lp-row-end">
              <b className="num">{r.a}</b>
              <span className={`lp-chip lp-chip-${r.st[1]}`}>{r.st[0]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CleaningMock() {
  const tasks = [
    { u: 'צימר הגפן', s: 'אחרי עזיבה, 11:00 · מירב', done: true },
    { u: 'סוויטת הנחל', s: 'אחרי עזיבה, 11:00 · מירב', done: false },
    { u: 'צימר הזית', s: 'החלפת מצעים, 13:00 · סאלח', done: false },
  ];
  return (
    <div className="lp-window" aria-hidden="true">
      <div className="lp-win-bar">
        <span className="lp-win-title"><SprayCan size={16} />ניקיון היום</span>
        <span className="lp-win-meta num">1 מתוך 3 בוצעו</span>
      </div>
      <div className="lp-list">
        {tasks.map((t) => (
          <div key={t.u} className={`lp-row${t.done ? ' done' : ''}`}>
            <span className={`lp-task-check${t.done ? ' done' : ''}`}>{t.done && <Check size={14} strokeWidth={3} />}</span>
            <div className="lp-row-main"><b>{t.u}</b><span>{t.s}</span></div>
            <span className={`lp-chip ${t.done ? 'lp-chip-ok' : ''}`}>{t.done ? 'בוצע' : 'ממתין'}</span>
          </div>
        ))}
      </div>
      <div className="lp-legend"><span><Users size={13} />כל משימה משויכת לאיש צוות, עם צ׳קליסט</span></div>
    </div>
  );
}

export const SHOWCASE_MOCKS = {
  calendar: SyncMock,
  leads: LeadsMock,
  messages: MessagesMock,
  payments: PaymentsMock,
  cleaning: CleaningMock,
};
