/**
 * X2 · "ציר חי". The day is one line with a live "now" on it. What is done slides behind the line;
 * what is ahead waits below it, and the first thing that needs you is already open with its action.
 * One tap does it (the button folds, checks, and the row glides up behind "now"). Things without an
 * hour (new leads, money waiting) sit pinned above the line. Desktop: the line in the middle and the
 * stay you are looking at open beside it, no modal.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { KeyRound, DoorOpen, Brush, Inbox, Wallet, Check, ChevronLeft } from 'lucide-react';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { formatDayHe } from '@/lib/stay/format';
import { cn } from '@/lib/utils';
import { useTodayModel, guestLabel, guestsOf, money } from './model';
import Face from './Face';
import MorphButton from './MorphButton';
import StaySheet, { StayDetail } from './Sheet';
import './x.css';

const EASE = [0.23, 1, 0.32, 1];
const KIND = { in: { icon: KeyRound, l: 'הגעה' }, out: { icon: DoorOpen, l: 'יציאה' }, clean: { icon: Brush, l: 'ניקיון' } };
const toMin = (t) => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
const pad = (n) => String(n).padStart(2, '0');

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(id); }, []);
  return now;
}

function Ribbon({ rows, nowMin, isDone }) {
  const A = 7 * 60; const Z = 23 * 60;
  const pos = (min) => `${Math.min(100, Math.max(0, ((min - A) / (Z - A)) * 100))}%`;
  return (
    <div className="x2-rib" aria-hidden>
      <div className="x2-rib-track">
        <motion.span className="x2-rib-past" initial={{ width: 0 }} animate={{ width: pos(nowMin) }} transition={{ duration: 0.9, ease: EASE, delay: 0.15 }} />
        {rows.map((r, i) => (
          <motion.i key={r.key} className={cn('x2-rib-dot', r.kind, isDone(r) && 'done')} style={{ insetInlineStart: pos(toMin(r.time)) }}
            initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, ease: EASE, delay: 0.3 + i * 0.04 }} />
        ))}
        <motion.span className="x2-rib-now" style={{ insetInlineStart: pos(nowMin) }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} />
      </div>
      <div className="x2-rib-h">{[8, 12, 16, 20].map((h) => <span key={h} style={{ insetInlineStart: pos(h * 60) }}>{pad(h)}:00</span>)}</div>
    </div>
  );
}

export default function DashboardView({ user, orgId }) {
  const m = useTodayModel({ orgId });
  const now = useNow();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const [anim, setAnim] = useState(() => new Set());
  const [openKey, setOpenKey] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [selected, setSelected] = useState(null);
  const [composer, setComposer] = useState(null);
  const [showDone, setShowDone] = useState(true);

  const actions = useMemo(() => {
    const seen = new Set(); const out = [];
    for (const a of [...m.queueAll, ...m.doneItems]) { if (!seen.has(a.id)) { seen.add(a.id); out.push(a); } }
    return out;
  }, [m.queueAll, m.doneItems]);

  const rows = m.rowsFor(m.board, m.day).map((r) => {
    let a = null;
    if (r.kind === 'clean') a = actions.find((x) => x.kind === 'clean' && x.c.key === r.c.key);
    else {
      const mine = actions.filter((x) => (x.kind === 'message' || x.kind === 'balance') && x.booking?.id === r.booking.id);
      a = mine.find((x) => !m.isDone(x.id)) || mine[0] || null;
    }
    return { ...r, action: a };
  });
  const handled = (r) => !anim.has(r.action?.id) && (r.done || (r.action && m.isDone(r.action.id)));
  const behind = rows.filter(handled);
  const ahead = rows.filter((r) => !handled(r));
  const firstOpen = ahead.find((r) => r.action) || ahead[0] || null;
  const openRow = ahead.find((r) => r.key === openKey) || firstOpen;
  const focusBooking = selected || openRow?.booking || rows[0]?.booking || null;

  const run = (r) => { setAnim((s) => new Set(s).add(r.action.id)); m.doItem(r.action); };
  const settle = (r) => { setAnim((s) => { const n = new Set(s); n.delete(r.action.id); return n; }); setOpenKey(null); };
  const openDetail = (b) => { if (window.matchMedia('(min-width: 1024px)').matches) setSelected(b); else setSheet(b); };

  const nIn = m.board.arrivals.length; const nOut = m.board.departures.length;
  const pins = [
    m.leads.length ? { k: 'leads', icon: Inbox, t: `${m.leads.length} ${m.leads.length === 1 ? 'פנייה חדשה' : 'פניות חדשות'}`, to: '/leads' } : null,
    m.pendingTotal > 0 ? { k: 'pay', icon: Wallet, t: `${money(m.pendingTotal)} ממתינים לתשלום`, to: '/balances', due: true } : null,
  ].filter(Boolean);

  const renderRow = (r, isBehind) => {
    const K = KIND[r.kind]; const Icon = K.icon;
    const open = !isBehind && openRow?.key === r.key;
    const title = r.kind === 'clean' ? `ניקיון ${r.unit}` : guestLabel(r.booking);
    return (
      <motion.li key={r.key} layout="position" transition={{ layout: { duration: 0.55, ease: EASE } }}
        className={cn('x2-ev', `k-${r.kind}`, open && 'is-open', isBehind && 'is-done')}>
        <span className="x2-ev-time" dir="ltr">{r.time}</span>
        <span className="x2-ev-node" aria-hidden>{isBehind ? <Check strokeWidth={2.25} /> : null}</span>
        <div className="x2-ev-card">
          <button type="button" className="x2-ev-main" onClick={() => { if (!isBehind) setOpenKey(r.key); if (r.booking) setSelected(r.booking); }}>
            {r.kind === 'clean' ? <span className="x2-ev-ic"><Icon strokeWidth={1.75} /></span> : <Face name={r.booking.guest_name || ''} size={open ? 48 : 36} />}
            <span className="x2-ev-t">
              <span className="x2-ev-n">{title}</span>
              <span className="x2-ev-s">{isBehind ? (r.action ? `${r.action.short} · ${r.action.doneText}` : r.status) : [K.l, r.kind === 'clean' ? null : r.unit, open && r.booking && r.kind !== 'clean' ? guestsOf(r.booking) : null].filter(Boolean).join(' · ')}</span>
            </span>
            {!open && !isBehind && r.action ? <span className="x2-ev-hint">{r.action.kind === 'clean' ? 'לסמן' : 'לשלוח'}</span> : null}
          </button>
          <AnimatePresence initial={false}>
            {open ? (
              <motion.div key="x" className="x2-ev-more" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.32, ease: EASE }}>
                <div className="x2-ev-acts">
                  {r.action ? (
                    <MorphButton className="x2-go" label={r.action.short} doneLabel={r.action.doneText}
                      onRun={() => run(r)} onSettled={() => settle(r)} />
                  ) : <span className="x2-ready"><Check strokeWidth={2} />הכל מוכן</span>}
                  {r.booking && r.kind !== 'clean' ? <button type="button" className="x2-sec press x2-open" onClick={() => openDetail(r.booking)}>פרטים<ChevronLeft strokeWidth={1.75} /></button> : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.li>
    );
  };

  return (
    <div className="x2" dir="rtl">
      <div className="x2-grid">
        <section className="x2-main" aria-label="היום">
          <div className="x2-top">
            <h1 className="x2-h1">היום</h1>
            <p className="x2-date">{formatDayHe(m.day)}</p>
          </div>
          <p className="x2-stats">
            <b>{nIn}</b> {nIn === 1 ? 'מגיע' : 'מגיעים'}<span aria-hidden> · </span><b>{nOut}</b> {nOut === 1 ? 'יוצא' : 'יוצאים'}
            {m.openCleanings.length ? <><span aria-hidden> · </span><b>{m.openCleanings.length}</b> {m.openCleanings.length === 1 ? 'ניקיון פתוח' : 'ניקיונות פתוחים'}</> : null}
          </p>
          <Ribbon rows={rows} nowMin={nowMin} isDone={handled} />
          {pins.length ? (
            <div className="x2-pins">
              {pins.map(({ k, icon: Icon, t, to, due }) => (
                <Link key={k} to={to} className="x2-pin press"><Icon strokeWidth={1.75} />{due ? <i className="x2-due" aria-hidden /> : null}<span>{t}</span><ChevronLeft strokeWidth={1.75} className="x2-pin-go" /></Link>
              ))}
            </div>
          ) : null}

          <LayoutGroup>
            <ol className="x2-line" aria-label="היום לפי שעות">
              {behind.length ? (
                <motion.li layout key="__dh" className="x2-dh">
                  <button type="button" onClick={() => setShowDone((v) => !v)} className="x2-dh-b">{behind.length} {behind.length === 1 ? 'בוצע' : 'בוצעו'}<ChevronLeft strokeWidth={1.75} className={cn('x2-dh-c', showDone && 'on')} /></button>
                </motion.li>
              ) : null}
              {showDone ? behind.map((r) => renderRow(r, true)) : null}
              <motion.li layout key="__now" className="x2-now" transition={{ layout: { duration: 0.55, ease: EASE } }}>
                <span className="x2-now-pill" dir="ltr">{pad(now.getHours())}:{pad(now.getMinutes())}</span><span className="x2-now-l">עכשיו</span><i />
              </motion.li>
              {ahead.map((r) => renderRow(r, false))}
              {!ahead.length ? <motion.li layout key="__clear" className="x2-clear">הכל בוצע להיום.</motion.li> : null}
            </ol>
          </LayoutGroup>
        </section>

        <aside className="x2-pane" aria-label="פרטי ההזמנה">
          {focusBooking ? (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={focusBooking.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.28, ease: EASE }}>
                <StayDetail booking={focusBooking} model={m} onWhatsApp={(b, t) => setComposer({ booking: b, template: t })} />
              </motion.div>
            </AnimatePresence>
          ) : <p className="x2-muted">בחרו שורה ביום כדי לראות את ההזמנה.</p>}
        </aside>
      </div>

      <StaySheet open={!!sheet} onOpenChange={(o) => !o && setSheet(null)} booking={sheet} model={m}
        onWhatsApp={(b, t) => { setSheet(null); setComposer({ booking: b, template: t }); }} />
      <WhatsAppComposer
        open={!!composer}
        onOpenChange={(o) => { if (!o) setComposer(null); }}
        booking={composer?.booking}
        property={composer ? m.prop(composer.booking.property_id) : null}
        balance={composer ? m.balanceFor(composer.booking) : undefined}
        initialTemplate={composer?.template}
        orgId={orgId}
        orgName={user?.organization_name || ''}
        onSent={(key) => { if (composer) { m.markSent(composer.booking.id, composer.template); m.markSent(composer.booking.id, key); } }}
      />
    </div>
  );
}
