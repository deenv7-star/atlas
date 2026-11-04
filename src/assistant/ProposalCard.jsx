/**
 * A proposal from the brain (propose_* tools): what atlas prepared, shown in full, done only on "אישור".
 * Shared by the text assistant and both voice screens.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, MessageCircle, Headset, Check } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { performAction, ACTION_COPY } from './actions.js';
import { dayLabel, money } from './facts.js';
import './proposal.css';

const ICON = { create_booking: CalendarPlus, guest_message: MessageCircle, support_handoff: Headset };

function Details({ p }) {
  const d = p.display || {};
  if (p.kind === 'create_booking') {
    return (
      <dl className="pc-rows">
        <div><dt>אורח</dt><dd>{d.guest}</dd></div>
        <div><dt>יחידה</dt><dd>{d.unit}</dd></div>
        <div><dt>הגעה</dt><dd>{dayLabel(d.check_in)}</dd></div>
        <div><dt>יציאה</dt><dd>{dayLabel(d.check_out)}{d.nights ? ` · ${d.nights === 1 ? 'לילה אחד' : `${d.nights} לילות`}` : ''}</dd></div>
        <div><dt>מחיר</dt><dd>{d.total_price != null ? money(d.total_price) : 'עוד לא נקבע'}</dd></div>
      </dl>
    );
  }
  if (p.kind === 'guest_message') {
    return (
      <>
        <p className="pc-to">ל{d.guest}</p>
        <p className="pc-quote" dir="auto">{d.text}</p>
      </>
    );
  }
  return <p className="pc-quote" dir="auto">{d.text}</p>;
}

/** <ProposalCard p onResolve(state, result) page compact /> */
export function ProposalCard({ p, onResolve, page = '', onNavigate, compact = false }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const copy = ACTION_COPY[p.kind] || { title: 'פעולה', confirm: 'אישור', done: 'בוצע' };
  const Icon = ICON[p.kind] || Check;
  const state = p.state || 'proposed';

  const confirm = async () => {
    setBusy(true); setErr('');
    try {
      const r = await performAction(p, { user, page });
      if (r.ok) onResolve?.('confirmed', r); else { setErr(r.message || ''); onResolve?.('failed', r); }
    } catch (e) {
      setErr(e?.message || 'לא הצלחנו לבצע. נסו שוב.');
    } finally { setBusy(false); }
  };

  if (state === 'dismissed') return <p className="pc-note">בוטל. שום דבר לא נשמר ולא נשלח.</p>;
  if (state === 'confirmed') {
    return (
      <p className="pc-done" role="status">
        <Check size={18} strokeWidth={1.75} aria-hidden="true" />
        <span>{copy.done}{p.result?.message ? `. ${p.result.message}` : ''}</span>
        {p.result?.href && copy.open ? <Link to={p.result.href} className="pc-open" onClick={onNavigate}>{copy.open}<span aria-hidden="true">←</span></Link> : null}
      </p>
    );
  }
  return (
    <section className={`pc${compact ? ' pc--compact' : ''}`} aria-label={copy.title}>
      <header className="pc-head">
        <span className="pc-icon" aria-hidden="true"><Icon size={20} strokeWidth={1.75} /></span>
        <div className="pc-title">
          <p className="pc-kicker">מחכה לאישור שלכם</p>
          <p className="pc-name">{copy.title}</p>
        </div>
      </header>
      <Details p={p} />
      {err ? <p className="pc-err" role="alert">{err}</p> : null}
      <div className="pc-actions">
        <button type="button" className="pc-btn pc-btn--primary" onClick={confirm} disabled={busy}>{busy ? 'רגע…' : copy.confirm}</button>
        <button type="button" className="pc-btn" onClick={() => onResolve?.('dismissed')} disabled={busy}>ביטול</button>
      </div>
    </section>
  );
}
