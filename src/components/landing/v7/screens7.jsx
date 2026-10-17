/**
 * ATLAS app screens for the v7 G/H landings, drawn in HTML/CSS (crisp at any size) after the
 * real v7 app UI (qa/app-ui-v7): greeting row, big "היום" title, date chip strip, one indigo KPI
 * card, calm lists, floating pill tab bar with a round "+" in the middle.
 * Every screen is decorative (aria-hidden at the call site) and shows example data only.
 */
import React from 'react';
import {
  Bell, Search, ArrowUpLeft, Sun, CalendarDays, Plus, ListChecks, MoreHorizontal, ChevronRight,
  CheckCheck, Check, Video, Phone as PhoneIc, Mic, LogIn, LogOut, SprayCan,
} from 'lucide-react';
import { Mark } from '../v5/ui';
import { AV } from './shared7';

export function StatusBar() {
  return (
    <div className="s7-bar">
      <span className="num" dir="ltr">9:41</span>
      <i className="s7-island" />
      <span className="s7-bar-ic" dir="ltr"><b /><b /><b /><em /></span>
    </div>
  );
}

export function TabBar({ active = 0 }) {
  const items = [
    [Sun, 'היום'], [CalendarDays, 'לוח שנה'], null, [ListChecks, 'הזמנות'], [MoreHorizontal, 'עוד'],
  ];
  return (
    <div className="s7-tabs">
      {items.map((it, i) => {
        if (!it) return <span key="plus" className="s7-plus"><Plus size={20} strokeWidth={2.4} /></span>;
        const [I, label] = it;
        const idx = i > 2 ? i - 1 : i;
        return (
          <span key={label} className={`s7-tab${idx === active ? ' is-on' : ''}`}>
            <I size={16} strokeWidth={1.9} />
            <small>{label}</small>
          </span>
        );
      })}
    </div>
  );
}

function Spark() {
  return (
    <svg className="s7-spark" viewBox="0 0 120 44" width="96" height="36" aria-hidden="true">
      <defs>
        <linearGradient id="s7-sp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M2 36 L20 33 L38 26 L56 23 L74 24 L92 30 L118 8 L118 44 L2 44 Z" fill="url(#s7-sp)" />
      <path d="M2 36 L20 33 L38 26 L56 23 L74 24 L92 30 L118 8" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="118" cy="8" r="3.2" fill="#3e2bf1" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

const DAYS = [['ש׳', 17, true], ['א׳', 18, false], ['ב׳', 19, true], ['ג׳', 20, false], ['ד׳', 21, true]];

/** "היום" — the owner's home screen. */
export function ScrToday({ notify = false }) {
  return (
    <div className="s7 s7-today">
      <StatusBar />
      {notify && (
        <div className="s7-notif">
          <span className="s7-notif-app"><i /></span>
          <span className="s7-notif-txt">
            <b>ATLAS <small>עכשיו</small></b>
            <span>הזמנה חדשה מ-Booking.com · מאיה כ. · 3 לילות</span>
          </span>
        </div>
      )}
      <div className="s7-pad">
        <div className="s7-greet">
          <span className="s7-me">יש</span>
          <span className="s7-greet-t"><b>בוקר טוב, יעל</b><small>יום ש׳, 17 באוק׳</small></span>
          <span className="s7-round"><Search size={14} strokeWidth={2} /></span>
          <span className="s7-round"><Bell size={14} strokeWidth={2} /></span>
        </div>
        <h4 className="s7-title">היום</h4>
        <p className="s7-sum"><b className="num">2</b> כניסות <i>·</i> <b className="num">1</b> יציאה <i>·</i> <b className="num">1</b> ניקיון</p>
        <div className="s7-days">
          {DAYS.map(([d, n, dot], i) => (
            <span key={n} className={`s7-day${i === 0 ? ' is-on' : ''}`}><small>{d}</small><b className="num">{n}</b>{dot && <i />}</span>
          ))}
        </div>
        <div className="s7-kpi">
          <span className="s7-kpi-arrow"><ArrowUpLeft size={13} strokeWidth={2.2} /></span>
          <small>הכנסות החודש</small>
          <b className="num" dir="ltr">₪48,250</b>
          <span className="s7-kpi-delta"><span dir="ltr" className="num">+18%</span> מהחודש שעבר</span>
          <Spark />
        </div>
        <div className="s7-card s7-list">
          <div className="s7-list-h"><b>כניסות ויציאות</b><small>הכל</small></div>
          <div className="s7-row">
            <img src={AV.w1} alt="" width="30" height="30" />
            <span><b>נועה לוי</b><small>בקתת הזית · 2 לילות</small></span>
            <em className="s7-tag is-in"><LogIn size={11} strokeWidth={2.2} />15:00</em>
          </div>
          <div className="s7-row">
            <img src={AV.m3} alt="" width="30" height="30" />
            <span><b>אבי כהן</b><small>סוויטת האלון · יתרה ₪900</small></span>
            <em className="s7-tag is-out"><LogOut size={11} strokeWidth={2.2} />11:00</em>
          </div>
          <div className="s7-row">
            <span className="s7-row-ic"><SprayCan size={14} strokeWidth={1.9} /></span>
            <span><b>ניקיון</b><small>סוויטת האלון · אחרי יציאה</small></span>
            <em className="s7-tag is-ok"><Check size={11} strokeWidth={2.6} />שובץ</em>
          </div>
        </div>
      </div>
      <TabBar active={0} />
    </div>
  );
}

/* month grid: [day, unit-colour or null] */
const OCT = (() => {
  // Oct 2026 starts on Thursday. Grid starts Sunday (RTL rows read right-to-left).
  const cells = [];
  for (let i = 0; i < 4; i += 1) cells.push(null);
  for (let d = 1; d <= 31; d += 1) cells.push(d);
  while (cells.length % 7) cells.push(null);
  return cells;
})();
const BOOKED = {
  booking: [2, 3, 4, 15, 16, 17, 27, 28],
  airbnb: [8, 9, 10, 22, 23],
  direct: [5, 6, 12, 13, 19, 20, 24, 25, 30, 31],
};
const chOf = (d) => Object.keys(BOOKED).find((k) => BOOKED[k].includes(d));

/** "לוח שנה" — month view, every channel on one board. */
export function ScrCalendar() {
  return (
    <div className="s7 s7-cal">
      <StatusBar />
      <div className="s7-pad">
        <div className="s7-cal-top">
          <h4 className="s7-title is-sm">לוח שנה</h4>
          <span className="s7-seg"><i>שבוע</i><i className="is-on">חודש</i></span>
        </div>
        <div className="s7-month"><b>אוקטובר 2026</b><span className="s7-sync"><i />מסונכרן</span></div>
        <div className="s7-card s7-grid">
          {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((d) => <small key={d}>{d}</small>)}
          {OCT.map((d, i) => {
            if (!d) return <span key={`e${i}`} />;
            const ch = chOf(d);
            return <span key={d} className={`s7-c${ch ? ` is-${ch}` : ''}${d === 17 ? ' is-today' : ''}`}><span className="num">{d}</span></span>;
          })}
        </div>
        <div className="s7-legend"><span><i className="is-booking" />Booking.com</span><span><i className="is-airbnb" />Airbnb</span><span><i className="is-direct" />ישיר</span></div>
        <div className="s7-card s7-list">
          <div className="s7-row">
            <span className="s7-row-ch"><Mark ch="booking" size={18} /></span>
            <span><b>מאיה כ.</b><small>סוויטת האלון · 17-20 באוק׳</small></span>
            <em className="s7-tag is-ok">שולם</em>
          </div>
          <div className="s7-row">
            <span className="s7-row-ch"><Mark ch="airbnb" size={18} /></span>
            <span><b>Jonas M.</b><small>בקתת הזית · 22-24 באוק׳</small></span>
            <em className="s7-tag">מקדמה</em>
          </div>
        </div>
      </div>
      <TabBar active={1} />
    </div>
  );
}

/** WhatsApp chat with a guest; ATLAS sent the first message by itself. */
export function ScrWhatsApp({ stage = 3 }) {
  return (
    <div className="s7 s7-wa">
      <StatusBar />
      <div className="s7-wa-head">
        <ChevronRight size={16} strokeWidth={2.2} />
        <img src={AV.w1} alt="" width="30" height="30" />
        <span><b>נועה לוי</b><small>בקתת הזית · מגיעה מחר</small></span>
        <Video size={15} strokeWidth={1.9} />
        <PhoneIc size={14} strokeWidth={1.9} />
      </div>
      <div className="s7-wa-body">
        <span className="s7-wa-date">היום</span>
        <p className="s7-bub is-out">
          היי נועה, מחכים לכם מחר מ-15:00 בבקתת הזית. הקוד לדלת: <b className="num" dir="ltr">4821</b>. הדרכה לחניה מצורפת.
          <span className="s7-bub-meta"><span className="num">09:00</span><CheckCheck size={12} strokeWidth={2.2} /></span>
        </p>
        <span className="s7-wa-auto"><Mark ch="whatsapp" size={10} />נשלח אוטומטית מ-ATLAS · יום לפני ההגעה</span>
        {stage >= 2 && <p className="s7-bub is-in">תודה! נגיע בסביבות 16:00 <span className="s7-bub-meta"><span className="num">09:12</span></span></p>}
        {stage >= 3 && (
          <p className="s7-bub is-out">
            מעולה, נתראה. המקדמה של <span className="num" dir="ltr">₪750</span> התקבלה.
            <span className="s7-bub-meta"><span className="num">09:12</span><CheckCheck size={12} strokeWidth={2.2} /></span>
          </p>
        )}
      </div>
      <div className="s7-wa-input"><span>הודעה</span><Mic size={15} strokeWidth={1.9} /></div>
    </div>
  );
}

/** Scaled phone: a 300×640 device drawn at --k. */
export function Device({ children, k, className = '', style }) {
  return (
    <div className={`s7-dev ${className}`} style={k == null ? style : { '--k': k, ...style }} aria-hidden="true">
      <div className="s7-dev-in">
        <div className="s7-dev-scr">{children}</div>
      </div>
    </div>
  );
}
