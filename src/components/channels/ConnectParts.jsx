/** Shared pieces of the channel connection flows: full-screen sheet, paste field, big copy button, save + live check. */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, X, ClipboardPaste, Check, Copy, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { DB_FEATURES } from '@/config/dbFeatures';
import { callEdge, icalExportUrl } from '@/lib/real/edge';
import { CHANNELS, checkPasted, syncErrorHe, DEMO_EXPORT } from './channelKit';
import ChannelLogo from './ChannelLogo';
import './channels.css';

/** Full-screen sheet, one task at a time. Escape and the X close it; the back arrow goes one step back. */
export function Sheet({ title, onClose, onBack, children, footer, progress, label, stepKey }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => { document.documentElement.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);
  useEffect(() => { ref.current?.scrollTo?.(0, 0); ref.current?.querySelector('h1')?.focus?.({ preventScroll: true }); }, [stepKey]);
  return createPortal(
    <div className="ch-sheet" role="dialog" aria-modal="true" aria-label={label || title} dir="rtl">
      <header className="ch-top">
        {onBack ? <button type="button" className="ch-icon ch-press" onClick={onBack} aria-label="חזרה"><ArrowRight strokeWidth={2} aria-hidden /></button> : <span className="ch-icon-gap" />}
        <p className="ch-top-t">{title}</p>
        <button type="button" className="ch-icon ch-press" onClick={onClose} aria-label="סגירה"><X strokeWidth={2} aria-hidden /></button>
      </header>
      {progress ? (
        <div className="ch-prog" aria-label={`שלב ${progress[0]} מתוך ${progress[1]}`}>
          {Array.from({ length: progress[1] }, (_, i) => <span key={i} className={i < progress[0] ? 'is-on' : ''} />)}
        </div>
      ) : null}
      <div className="ch-scroll" ref={ref}><div className="ch-inner">{children}</div></div>
      {footer ? <footer className="ch-foot"><div className="ch-inner">{footer}</div></footer> : null}
    </div>,
    document.body,
  );
}

/** The big paste box: one field, one paste button, and a plain sentence that says what we found. */
export function PasteField({ value, onChange, exportToken, expected, id = 'ch-paste', autoFocus }) {
  const [pasteFail, setPasteFail] = useState(false);
  const check = useMemo(() => checkPasted(value, { exportToken }), [value, exportToken]);
  const other = check.ok && expected && check.channel !== expected && expected !== 'ICAL';
  const paste = async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (t && t.trim()) { onChange(t.trim()); setPasteFail(false); } else setPasteFail(true);
    } catch { setPasteFail(true); }
  };
  return (
    <div className="ch-paste">
      <label htmlFor={id} className="ch-label">הקישור שהעתקתם</label>
      <div className={`ch-field ${value ? (check.ok ? 'is-ok' : 'is-bad') : ''}`}>
        <input id={id} dir="ltr" inputMode="url" autoComplete="off" autoCapitalize="off" spellCheck={false} autoFocus={autoFocus}
          value={value} onChange={(e) => { onChange(e.target.value); setPasteFail(false); }}
          placeholder="הדביקו כאן" aria-invalid={value && !check.ok ? 'true' : undefined} aria-describedby={`${id}-msg`} />
        {value ? <button type="button" className="ch-clear ch-press" onClick={() => onChange('')} aria-label="מחיקת הקישור"><X strokeWidth={2} aria-hidden /></button> : null}
      </div>
      {!value ? (
        <button type="button" className="ch-btn is-soft ch-press" onClick={paste}><ClipboardPaste strokeWidth={2} aria-hidden />הדביקו את הקישור</button>
      ) : null}
      <div id={`${id}-msg`} aria-live="polite">
        {pasteFail && !value ? <p className="ch-msg">הטלפון לא נתן להדביק בלחיצה. לחצו לחיצה ארוכה בתוך השדה ובחרו "הדבקה".</p> : null}
        {value && check.ok ? (
          <p className="ch-msg is-ok"><ChannelLogo channel={check.channel} size={28} />
            <span>{check.channel === 'ICAL' ? check.message : other ? `זה קישור של ${CHANNELS[check.channel].name}. נחבר אותו בתור ${CHANNELS[check.channel].name}.` : `${check.message}.`}</span>
          </p>
        ) : null}
        {value && !check.ok && check.message ? <p className="ch-msg is-bad"><AlertCircle strokeWidth={2} aria-hidden /><span>{check.message}</span></p> : null}
      </div>
    </div>
  );
}

/** One big button that copies atlas's own calendar link, and says so. */
export function CopyBig({ value, label = 'העתיקו את הקישור של atlas' }) {
  const [state, setState] = useState('');
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setState('ok'); window.setTimeout(() => setState(''), 2500); }
    catch { setState('fail'); }
  };
  return (
    <div className="ch-copy">
      <button type="button" className={`ch-btn ${state === 'ok' ? 'is-done' : 'is-primary'} ch-press`} onClick={copy} aria-live="polite">
        {state === 'ok' ? <Check strokeWidth={2.5} aria-hidden /> : <Copy strokeWidth={2} aria-hidden />}
        {state === 'ok' ? 'הועתק. עכשיו הדביקו בערוץ' : label}
      </button>
      {state === 'fail' ? (
        <>
          <p className="ch-msg">הטלפון לא נתן להעתיק בלחיצה. סמנו את הקישור שלמטה והעתיקו.</p>
          <input readOnly dir="ltr" value={value} className="ch-raw" onFocus={(e) => e.target.select()} aria-label="הקישור של atlas" />
        </>
      ) : null}
    </div>
  );
}

export function exportLinkFor(property, channel) {
  const c = CHANNELS[channel];
  return icalExportUrl(property, c?.exportChannel || '') || (DB_FEATURES.realCore ? '' : DEMO_EXPORT);
}

/**
 * Save a pasted link for one unit and run the live check right away (ical-sync fetches and parses it, as before).
 * A link the server cannot read is removed again, so the list never keeps a broken connection.
 * Demo account: nothing leaves the browser; the result is marked as an example.
 */
export function useConnect({ orgId, property, existing = [] }) {
  const [busy, setBusy] = useState(false);
  const connect = async ({ url, channel }) => {
    if (existing.some((s) => s.property_id === property.id && String(s.ical_url || '').trim() === url)) {
      return { ok: false, message: 'הקישור הזה כבר מחובר ליחידה הזו.' };
    }
    setBusy(true);
    try {
      if (!DB_FEATURES.realCore) {
        await new Promise((r) => setTimeout(r, 900));
        const now = new Date().toISOString();
        try {
          await base44.entities.CalendarSync.create({ org_id: orgId, property_id: property.id, provider: channel, ical_url: url, sync_direction: 'IMPORT', sync_status: 'ACTIVE', is_active: true, last_success_at: now, last_sync_at: now, events_count: 6 });
        } catch { /* demo storage is best effort */ }
        return { ok: true, events: 6, demo: true, at: now };
      }
      const created = await base44.entities.CalendarSync.create({
        org_id: orgId, property_id: property.id, provider: channel, ical_url: url, sync_direction: 'IMPORT', sync_status: 'ACTIVE', is_active: true,
      });
      const res = await callEdge('ical-sync', { sync_id: created.id });
      const r = res?.results?.[0];
      if (r && r.ok) return { ok: true, events: r.events || 0, warning: r.warning || '', conflicts: r.conflicts || 0, at: new Date().toISOString() };
      try { await base44.entities.CalendarSync.delete(created.id); } catch { /* keep going */ }
      return { ok: false, message: syncErrorHe(r?.error) };
    } catch (e) {
      return { ok: false, message: e?.message ? `לא הצלחנו לחבר: ${e.message}` : 'לא הצלחנו לחבר. נסו שוב בעוד דקה.' };
    } finally {
      setBusy(false);
    }
  };
  return { connect, busy };
}
