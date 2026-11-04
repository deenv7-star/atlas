/**
 * What atlas shows while she talks: live cards built only from the real snapshot (facts.js) and from the
 * brain's proposals. Shared by both designs (they restyle the frame, not the content).
 *   ArrivalsCard   today's arrivals and departures, faces, who still owes
 *   UnpaidCard     open balances with amounts
 *   FreeCard       free nights per unit (next 14 days)
 *   LiveProposal   an action she prepared: a booking sliding into a mini calendar, a WhatsApp bubble ready to
 *                  open, a hand-off. Nothing happens until "אישור"; "ביטול" writes nothing. After אישור the app's
 *                  normal path runs (actions.js) and the card turns into the confirmation with a link.
 * Springs via framer-motion; reduced motion = instant.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, X, MessageCircle, CalendarPlus, Headset, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import Face from '@/ui-direction/y/Face';
import { performAction, ACTION_COPY } from '../actions.js';
import { dayLabel, money } from '../facts.js';
import './live.css';

export const SPRING = { type: 'spring', stiffness: 420, damping: 32, mass: 0.9 };
export const SOFT = { type: 'spring', stiffness: 260, damping: 26 };

/** Which data card goes with a question (or the tool the brain used). Data only from the snapshot. */
export function cardFor(question = '', tool = '', f = null) {
  if (!f) return null;
  const q = String(question);
  if (tool === 'get_money' || /חייב|תשלום|יתר|גבי|כסף|שולם/.test(q)) return (f.overdue.length || f.dueSoon.length) ? 'unpaid' : null;
  if (tool === 'check_availability' || /פנוי|פנויים|סוף ה?שבוע|לילות/.test(q)) return f.freeNights.length ? 'free' : null;
  if (tool === 'get_day_overview' || /מגיע|נכנס|כניס|יוצא|היום/.test(q)) return (f.arrivals.length || f.departures.length) ? 'arrivals' : null;
  return null;
}

const listV = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } } };
const rowV = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: SOFT } };

function Head({ icon: Icon, kicker, title }) {
  return (
    <header className="lc-head">
      <span className="lc-ic" aria-hidden="true"><Icon size={18} strokeWidth={1.9} /></span>
      <div><p className="lc-kicker">{kicker}</p><p className="lc-title">{title}</p></div>
    </header>
  );
}

export function ArrivalsCard({ f, onNavigate }) {
  const owe = new Map(f.overdue.map((r) => [r.id, r.amount]));
  const rows = [...f.arrivals.map((p) => ({ ...p, k: 'נכנסים' })), ...f.departures.map((p) => ({ ...p, k: 'יוצאים' }))].slice(0, 5);
  return (
    <section className="lc" aria-label="היום">
      <Head icon={CalendarPlus} kicker={f.todayLabel} title={`${f.arrivals.length} נכנסים · ${f.departures.length} יוצאים`} />
      <motion.ul className="lc-rows" variants={listV} initial="hidden" animate="show">
        {rows.map((p) => (
          <motion.li key={p.id + p.k} variants={rowV} className="lc-row">
            <Face name={p.name} size={40} />
            <div className="lc-row-t"><b>{p.name}</b><span>{p.unit}</span></div>
            {owe.get(p.id) ? <span className="lc-owe">{money(owe.get(p.id))} פתוח</span> : null}
            <span className={`lc-tag${p.k === 'נכנסים' ? ' is-in' : ''}`}>{p.k}</span>
          </motion.li>
        ))}
      </motion.ul>
      <Link to="/today" className="lc-link" onClick={onNavigate}>פתיחת היום<ArrowLeft size={16} strokeWidth={2} aria-hidden="true" /></Link>
    </section>
  );
}

export function UnpaidCard({ f, onNavigate }) {
  const rows = [...f.overdue.map((r) => ({ ...r, s: 'באיחור' })), ...f.dueSoon.map((r) => ({ ...r, s: 'בקרוב' }))].slice(0, 4);
  return (
    <section className="lc" aria-label="יתרות פתוחות">
      <Head icon={MessageCircle} kicker="יתרות פתוחות" title={f.overdueTotal ? `${money(f.overdueTotal)} באיחור` : 'אין יתרות באיחור'} />
      <motion.ul className="lc-rows" variants={listV} initial="hidden" animate="show">
        {rows.map((r) => (
          <motion.li key={r.id} variants={rowV} className="lc-row">
            <Face name={r.name} size={40} />
            <div className="lc-row-t"><b>{r.name}</b><span>{r.unit} · {r.s}</span></div>
            <span className="lc-amt">{money(r.amount)}</span>
          </motion.li>
        ))}
      </motion.ul>
      <Link to="/balances" className="lc-link" onClick={onNavigate}>פתיחת היתרות<ArrowLeft size={16} strokeWidth={2} aria-hidden="true" /></Link>
    </section>
  );
}

export function FreeCard({ f, onNavigate }) {
  return (
    <section className="lc" aria-label="לילות פנויים">
      <Head icon={CalendarPlus} kicker="14 הימים הקרובים" title={`${f.freeTotal} לילות פנויים`} />
      <motion.ul className="lc-rows" variants={listV} initial="hidden" animate="show">
        {f.freeNights.slice(0, 4).map((u) => (
          <motion.li key={u.unit} variants={rowV} className="lc-row lc-row--free">
            <div className="lc-row-t"><b>{u.unit}</b><span>{u.weekend.length ? `חמישי-שישי פנויים: ${u.weekend.map((d) => d.split('-').reverse().slice(0, 2).join('.')).join(', ')}` : 'סופי השבוע מלאים'}</span></div>
            <span className="lc-meter" aria-label={`${u.free} מתוך 14`}><motion.i initial={{ scaleX: 0 }} animate={{ scaleX: u.free / 14 }} transition={{ ...SOFT, delay: 0.25 }} /></span>
            <span className="lc-amt">{u.free}</span>
          </motion.li>
        ))}
      </motion.ul>
      <Link to="/calendar" className="lc-link" onClick={onNavigate}>פתיחת היומן<ArrowLeft size={16} strokeWidth={2} aria-hidden="true" /></Link>
    </section>
  );
}

export function DataCard({ kind, f, onNavigate }) {
  if (!kind || !f) return null;
  if (kind === 'arrivals') return <ArrivalsCard f={f} onNavigate={onNavigate} />;
  if (kind === 'unpaid') return <UnpaidCard f={f} onNavigate={onNavigate} />;
  if (kind === 'free') return <FreeCard f={f} onNavigate={onNavigate} />;
  return null;
}

/* ── the mini calendar: 7 days around the stay; the booking slides into its nights ── */
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addD = (s, n) => { const d = new Date(`${s}T00:00:00`); d.setDate(d.getDate() + n); return iso(d); };
const WD = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
function Strip({ ci, co, guest, done }) {
  const reduce = useReducedMotion();
  if (!ci || !co) return null;
  const start = addD(ci, -2);
  const days = Array.from({ length: 7 }, (_, i) => addD(start, i));
  const a = days.indexOf(ci); const b = Math.max(a + 1, days.indexOf(co) === -1 ? 7 : days.indexOf(co));
  return (
    <div className="lc-strip" aria-hidden="true">
      <div className="lc-days">
        {days.map((d) => { const x = new Date(`${d}T00:00:00`); return (
          <span key={d} className={`lc-day${d >= ci && d < co ? ' is-in' : ''}`}><small>{WD[x.getDay()]}</small><b>{x.getDate()}</b></span>
        ); })}
      </div>
      <div className="lc-track">
        <motion.span className={`lc-stay${done ? ' is-done' : ''}`} style={{ insetInlineStart: `calc(${(a / 7) * 100}% + ${100 / 14}%)`, width: `${((b - a) / 7) * 100}%` }}
          initial={reduce ? false : { scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ ...SPRING, delay: 0.35 }}>
          {done ? <Check size={14} strokeWidth={2.6} aria-hidden="true" /> : null}{guest}
        </motion.span>
      </div>
    </div>
  );
}

const KIND_IC = { create_booking: CalendarPlus, guest_message: MessageCircle, support_handoff: Headset };

/** <LiveProposal p onResolve(state, result) onNavigate page /> */
export function LiveProposal({ p, onResolve, onNavigate, page = '' }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const copy = ACTION_COPY[p.kind] || { title: 'פעולה', done: 'בוצע' };
  const st = p.state || 'proposed';
  const d = p.display || {};
  const Icon = KIND_IC[p.kind] || Check;
  const confirm = async () => {
    setBusy(true); setErr('');
    try {
      const r = await performAction(p, { user, page });
      if (r.ok) onResolve?.('confirmed', r); else { setErr(r.message || 'לא הצלחתי לבצע. נסו שוב.'); onResolve?.('failed', r); }
    } catch (e) { setErr(e?.message || 'לא הצלחתי לבצע. נסו שוב.'); onResolve?.('failed', null); } finally { setBusy(false); }
  };
  if (st === 'dismissed') {
    return <motion.p className="lc-gone" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={SOFT}>בוטל. שום דבר לא נשמר ולא נשלח.</motion.p>;
  }
  const done = st === 'confirmed';
  return (
    <motion.section layout className={`lc lc--act${done ? ' is-done' : ''}`} aria-label={copy.title} transition={SPRING}>
      <header className="lc-head">
        <span className="lc-ic" aria-hidden="true">
          <AnimatePresence mode="popLayout" initial={false}>
            {done
              ? <motion.span key="ok" initial={{ scale: 0.3, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 600, damping: 18 }}><Check size={18} strokeWidth={2.6} /></motion.span>
              : <motion.span key="ic" exit={{ scale: 0.3, opacity: 0 }}><Icon size={18} strokeWidth={1.9} /></motion.span>}
          </AnimatePresence>
        </span>
        <div>
          <p className="lc-kicker">{done ? 'בוצע' : 'מחכה לאישור שלכם'}</p>
          <p className="lc-title">{done ? copy.done : p.kind === 'guest_message' ? `הודעה ל${d.guest}` : copy.title}</p>
        </div>
      </header>

      {p.kind === 'create_booking' ? (
        <>
          <Strip ci={d.check_in} co={d.check_out} guest={d.guest} done={done} />
          <dl className="lc-dl">
            <div><dt>יחידה</dt><dd>{d.unit}</dd></div>
            <div><dt>תאריכים</dt><dd>{dayLabel(d.check_in)} עד {dayLabel(d.check_out)}</dd></div>
            <div><dt>מחיר</dt><dd>{d.total_price != null ? money(d.total_price) : 'אפשר להוסיף אחר כך'}</dd></div>
          </dl>
        </>
      ) : p.kind === 'guest_message' ? (
        <div className="lc-wa">
          <p className="lc-bubble" dir="auto">{d.text}<span className="lc-bubble-t" aria-hidden="true">עכשיו</span></p>
          <p className="lc-fine">{done ? 'נפתח בוואטסאפ שלכם. השליחה אצלכם.' : 'אחרי אישור ההודעה תיפתח בוואטסאפ שלכם, ואתם לוחצים שליחה.'}</p>
        </div>
      ) : (
        <p className="lc-quote" dir="auto">{d.text}</p>
      )}

      {err ? <p className="lc-err" role="alert">{err}</p> : null}
      <AnimatePresence initial={false} mode="popLayout">
        {done ? (
          <motion.div key="done" className="lc-done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SOFT, delay: 0.1 }}>
            {p.result?.message ? <p className="lc-fine">{p.result.message}</p> : null}
            {p.result?.href && copy.open ? <Link to={p.result.href} className="lc-link lc-link--strong" onClick={onNavigate}>{copy.open}<ArrowLeft size={16} strokeWidth={2} aria-hidden="true" /></Link> : null}
          </motion.div>
        ) : (
          <motion.div key="ask" className="lc-actions" exit={{ opacity: 0, scale: 0.96 }} transition={SOFT}>
            <button type="button" className="lc-btn lc-btn--ok" onClick={confirm} disabled={busy}>
              {busy ? <span className="lc-spin" aria-hidden="true" /> : <Check size={18} strokeWidth={2.4} aria-hidden="true" />}{busy ? 'רגע…' : 'אישור'}
            </button>
            <button type="button" className="lc-btn" onClick={() => onResolve?.('dismissed')} disabled={busy}><X size={18} strokeWidth={2} aria-hidden="true" />ביטול</button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
