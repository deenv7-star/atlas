/**
 * Product UI for landing v5, built in HTML/CSS so it is pixel-crisp at any size.
 * Everything here is decorative (aria-hidden at the call site) and shows example data.
 */
import React from 'react';
import {
  CalendarDays, Home, Inbox, Users, Wallet, MessageCircle, Settings, RefreshCw, Check,
  CheckCheck, LogIn, LogOut, SprayCan, FileSpreadsheet, Download, Send, ChevronRight, ChevronLeft,
  TrendingUp, Lock,
} from 'lucide-react';
import { AIRBNB, WHATSAPP, GCAL } from './brandPaths';
import { DEMO, CHANNEL_LABEL } from './content';
import { fmt } from '@/components/landing/v4/motion';

const ILS = (n) => `₪${fmt(n)}`;

/* ---------- brand marks ---------- */
export function Mark({ ch, size = 16, className = '' }) {
  if (ch === 'booking') {
    return <span className={`l5-bk ${className}`} style={{ '--s': `${size}px` }}>B.</span>;
  }
  if (ch === 'direct') {
    return <span className={`l5-dm ${className}`} style={{ '--s': `${size}px` }}><i /></span>;
  }
  const d = ch === 'airbnb' ? AIRBNB : ch === 'whatsapp' ? WHATSAPP : GCAL;
  return (
    <svg className={`l5-mk l5-mk-${ch} ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} fill="currentColor" />
    </svg>
  );
}

export function Wordmark({ small = false }) {
  return <span className={`l5-wm${small ? ' is-sm' : ''}`} aria-hidden="true">ATLAS<i /></span>;
}

/* ---------- app chrome ---------- */
const NAV = [Home, CalendarDays, Inbox, Users, Wallet, MessageCircle];

export function AppWindow({ children, active = 1, className = '', bare = false }) {
  return (
    <div className={`l5-win ${className}`}>
      {!bare && (
        <aside className="l5-win-side">
          <span className="l5-win-logo"><i /></span>
          {NAV.map((I, i) => (
            <span key={i} className={`l5-win-ic${i === active ? ' is-on' : ''}`}><I size={18} strokeWidth={1.75} /></span>
          ))}
          <span className="l5-win-ic l5-win-ic-end"><Settings size={18} strokeWidth={1.75} /></span>
        </aside>
      )}
      <div className="l5-win-main">{children}</div>
    </div>
  );
}

/* ---------- calendar ---------- */
function Bar({ b, incoming = false, live = false, delay = 0 }) {
  const [, start, nights, ch, guest] = b;
  const n = DEMO.days.length;
  return (
    <span
      className={`l5-bar l5-bar-${ch}${incoming ? ' is-incoming' : ''}${live ? ' is-live' : ''}`}
      style={{
        insetInlineStart: `calc(${start / n} * var(--lane) + 3px)`,
        width: `calc(${nights / n} * var(--lane) - 6px)`,
        '--d': `${delay}ms`,
      }}
    >
      {ch !== 'direct' && <Mark ch={ch} size={11} />}
      <b dir="auto">{guest}</b>
    </span>
  );
}

export function Calendar({ showIncoming = false, compact = false }) {
  return (
    <div className={`l5-cal${compact ? ' is-compact' : ''}`}>
      <div className="l5-cal-top">
        <div className="l5-cal-title">
          <b>לוח שנה</b>
          <span className="l5-cal-month">
            <ChevronRight size={14} strokeWidth={2} />
            אוקטובר 2026
            <ChevronLeft size={14} strokeWidth={2} />
          </span>
        </div>
        <div className="l5-cal-legend">
          {['airbnb', 'booking', 'direct'].map((c) => (
            <span key={c}><i className={`l5-dot l5-dot-${c}`} />{CHANNEL_LABEL[c]}</span>
          ))}
        </div>
        <span className="l5-sync"><RefreshCw size={12} strokeWidth={2.25} />מסונכרן</span>
      </div>
      <div className="l5-cal-grid">
        <div className="l5-cal-row l5-cal-head">
          <span className="l5-cal-unit" />
          <div className="l5-cal-days">
            {DEMO.days.map((d, i) => (
              <span key={i} className={`l5-cal-day${i === DEMO.today ? ' is-today' : ''}${i >= 5 ? ' is-late' : ''}`}>
                <small>{d.d}</small>
                <b className="num">{d.n}</b>
              </span>
            ))}
          </div>
        </div>
        {DEMO.units.map((u, ui) => (
          <div key={u} className="l5-cal-row">
            <span className="l5-cal-unit">
              <i className="l5-ini">{DEMO.unitsShort[ui].slice(1, 2)}</i>
              <span className="l5-u-long">{u}</span>
              <span className="l5-u-short">{DEMO.unitsShort[ui]}</span>
            </span>
            <div className="l5-cal-lane">
              {DEMO.bars.filter((b) => b[0] === ui).map((b, i) => (
                <Bar key={i} b={b} delay={ui * 60 + i * 40} />
              ))}
              {ui === DEMO.incoming[0] && <Bar b={DEMO.incoming} incoming live={showIncoming} />}
            </div>
          </div>
        ))}
      </div>
      <div className="l5-cal-foot">
        <span>4 יחידות · 12 הזמנות השבוע</span>
        <span>עודכן לפני דקה</span>
      </div>
    </div>
  );
}

/* ---------- revenue ---------- */
function chartPaths(series, w, h, pad = 4) {
  const max = Math.max(...series) * 1.08;
  const min = Math.min(...series) * 0.8;
  const step = (w - pad * 2) / (series.length - 1);
  // time runs left to right, like every finance chart (up and to the right reads as growth)
  const pts = series.map((v, i) => [pad + i * step, h - pad - ((v - min) / (max - min)) * (h - pad * 2)]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  const area = `${d} L${pts[pts.length - 1][0]},${h} L${pts[0][0]},${h} Z`;
  return { d, area, end: pts[pts.length - 1] };
}

export function RevenueChart({ w = 320, h = 96, id = 'rv', grid = false }) {
  const { d, area, end } = chartPaths(DEMO.revenueSeries, w, h);
  return (
    <svg className="l5-chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#3E2BF1" stopOpacity="0.16" />
          <stop offset="1" stopColor="#3E2BF1" stopOpacity="0" />
        </linearGradient>
      </defs>
      {grid && [0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1="0" x2={w} y1={h * g} y2={h * g} className="l5-chart-grid" />
      ))}
      <path d={area} fill={`url(#${id}-g)`} className="l5-chart-area" />
      <path d={d} pathLength="1" className="l5-chart-line" vectorEffect="non-scaling-stroke" />
      <circle cx={end[0]} cy={end[1]} r="4" className="l5-chart-dot" />
    </svg>
  );
}

export function RevenueCard({ value = DEMO.revenue, className = '' }) {
  // className may carry is-pending (chart not drawn yet) and is-mini (phone layout)
  return (
    <div className={`l5-card l5-rev ${className}`}>
      <div className="l5-rev-top">
        <span className="l5-meta">הכנסות אוקטובר</span>
        <span className="l5-delta"><TrendingUp size={12} strokeWidth={2.25} />{DEMO.revenueDelta}</span>
      </div>
      <b className="l5-rev-num num">{ILS(value)}</b>
      <RevenueChart id="rvc" />
      <div className="l5-rev-axis" dir="ltr"><span>נוב׳</span><span>אוק׳</span></div>
    </div>
  );
}

/* ---------- WhatsApp ---------- */
export function WhatsAppCard({ stage = 2, className = '' }) {
  // stage 0: nothing, 1: typing, 2: message sent, 3: guest replied
  return (
    <div className={`l5-card l5-wa ${className}`}>
      <div className="l5-wa-head">
        <span className="l5-wa-av">נ</span>
        <span className="l5-wa-who"><b>{DEMO.wa.guest}</b><small>{DEMO.wa.unit}</small></span>
        <Mark ch="whatsapp" size={16} className="l5-wa-logo" />
      </div>
      <div className="l5-wa-body">
        {stage === 1 && <span className="l5-typing"><i /><i /><i /></span>}
        {stage >= 2 && (
          <p className="l5-bub l5-bub-out">
            {DEMO.wa.out}
            <span className="l5-bub-meta">09:00<CheckCheck size={13} strokeWidth={2} /></span>
          </p>
        )}
        {stage >= 3 && <p className="l5-bub l5-bub-in">{DEMO.wa.in}</p>}
      </div>
      <div className="l5-wa-foot"><Send size={12} strokeWidth={2} />{DEMO.wa.meta}</div>
    </div>
  );
}

/* ---------- Today board ---------- */
const KIND_ICON = { in: LogIn, out: LogOut, clean: SprayCan };

export function TodayBoard({ rows = DEMO.todayBoard, className = '', title = true }) {
  return (
    <div className={`l5-today ${className}`}>
      {title && (
        <div className="l5-today-head">
          <b>היום</b>
          <span className="l5-meta">יום ו׳, 16 באוק׳</span>
        </div>
      )}
      <div className="l5-today-sum">
        <span><b className="num">2</b> כניסות</span>
        <span><b className="num">1</b> יציאה</span>
        <span><b className="num">1</b> ניקיון</span>
      </div>
      <ul className="l5-today-list">
        {rows.map((r) => {
          const I = KIND_ICON[r.kind];
          return (
            <li key={r.title + r.time} className={`l5-tr l5-tr-${r.kind}`}>
              <span className="l5-tr-ic"><I size={16} strokeWidth={1.75} /></span>
              <span className="l5-tr-txt"><b>{r.title}</b><small>{r.sub}</small></span>
              <span className="l5-tr-time num">{r.time}</span>
              <span className={`l5-pill${r.status === 'שולם' || r.status === 'שובץ' ? ' is-ok' : ''}`}>{r.status}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- payments ---------- */
export function Payments({ className = '', total = true }) {
  return (
    <div className={`l5-pay ${className}`}>
      {total && (
      <div className="l5-pay-total">
        <span className="l5-meta">שולם החודש</span>
        <b className="num">{ILS(31840)}</b>
        <span className="l5-progress"><i style={{ width: '78%' }} /></span>
        <span className="l5-meta">עוד <b className="num">{ILS(8900)}</b> ממתין לגבייה</span>
      </div>
      )}
      <ul className="l5-pay-list">
        {DEMO.payments.map((p) => (
          <li key={p.who + p.what}>
            <span className="l5-pay-who"><b dir="auto">{p.who}</b><small>{p.what}</small></span>
            <span className="l5-pay-amt num">{ILS(p.amount)}</span>
            {p.state === 'paid'
              ? <span className="l5-pill is-ok"><Check size={12} strokeWidth={2.5} />שולם</span>
              : <span className="l5-pill">תזכורת נשלחה</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- sync ---------- */
export function SyncMini() {
  return (
    <div className="l5-syncmini">
      <ul className="l5-sm-src">
        {[['airbnb', 'Airbnb', 'הזמנה חדשה'], ['booking', 'Booking.com', 'עודכן'], ['gcal', 'Google Calendar', 'מסונכרן']].map(([c, n, s]) => (
          <li key={c}>
            <Mark ch={c} size={16} />
            <b>{n}</b>
            <small>{s}</small>
          </li>
        ))}
      </ul>
      <svg className="l5-sm-wires" viewBox="0 0 80 132" preserveAspectRatio="none" aria-hidden="true">
        <path d="M80 22 C40 22 40 66 0 66" pathLength="1" />
        <path d="M80 66 L0 66" pathLength="1" />
        <path d="M80 110 C40 110 40 66 0 66" pathLength="1" />
      </svg>
      <div className="l5-sm-hub">
        <Wordmark small />
        <span className="l5-sync"><Check size={12} strokeWidth={2.5} />לוח אחד</span>
        <div className="l5-sm-strip">
          <i className="l5-bar-airbnb" style={{ width: '34%' }} />
          <i className="l5-bar-direct" style={{ width: '22%' }} />
          <i className="l5-bar-booking" style={{ width: '30%' }} />
        </div>
      </div>
    </div>
  );
}

/* ---------- accountant report ---------- */
export function ReportMini() {
  const rows = [['הזמנות', 38], ['הכנסות', 48250], ['עמלות ערוצים', 3120]];
  return (
    <div className="l5-report">
      <div className="l5-doc">
        <div className="l5-doc-head">
          <FileSpreadsheet size={18} strokeWidth={1.75} />
          <span><b>דוח הכנסות</b><small>ספטמבר 2026</small></span>
        </div>
        <ul>
          {rows.map(([k, v]) => (
            <li key={k}><span>{k}</span><b className="num">{k === 'הזמנות' ? v : ILS(v)}</b></li>
          ))}
        </ul>
      </div>
      <div className="l5-report-actions">
        <span className="l5-fakebtn is-primary"><Send size={13} strokeWidth={2} />לרואה החשבון</span>
        <span className="l5-fakebtn"><Download size={13} strokeWidth={2} />Excel</span>
      </div>
    </div>
  );
}

/* ---------- direct booking page ---------- */
export function DirectPageMini() {
  return (
    <div className="l5-direct">
      <div className="l5-url"><Lock size={11} strokeWidth={2.25} /><span dir="ltr">atlas.co.il/ha-zayit</span></div>
      <div className="l5-direct-body">
        <div className="l5-direct-hero"><b>בקתת הזית</b><small>זוג · ג׳קוזי · נוף לגליל</small></div>
        <div className="l5-direct-dates">
          {[19, 20, 21, 22, 23].map((n, i) => (
            <span key={n} className={`num${i === 1 || i === 2 || i === 3 ? ' is-sel' : ''}${i === 1 ? ' is-a' : ''}${i === 3 ? ' is-b' : ''}`}>{n}</span>
          ))}
        </div>
        <div className="l5-direct-total"><span>2 לילות</span><b className="num">{ILS(1900)}</b></div>
        <span className="l5-fakebtn is-primary is-block">להזמין ולשלם מקדמה</span>
      </div>
    </div>
  );
}

/* ---------- finance view (variant B tab) ---------- */
export function FinanceView() {
  return (
    <div className="l5-fin">
      <div className="l5-fin-kpis">
        <div><span className="l5-meta">הכנסות</span><b className="num">{ILS(DEMO.revenue)}</b><span className="l5-delta"><TrendingUp size={12} strokeWidth={2.25} />{DEMO.revenueDelta}</span></div>
        <div><span className="l5-meta">שולם</span><b className="num">{ILS(31840)}</b></div>
        <div><span className="l5-meta">ממתין</span><b className="num">{ILS(8900)}</b></div>
      </div>
      <div className="l5-fin-body">
        <div className="l5-fin-chart">
          <RevenueChart id="fin" w={560} h={180} grid />
          <div className="l5-fin-axis" dir="ltr">{DEMO.months.map((m) => <span key={m}>{m}</span>)}</div>
        </div>
        <div className="l5-fin-pay"><span className="l5-meta">תשלומים אחרונים</span><Payments total={false} /></div>
      </div>
    </div>
  );
}
