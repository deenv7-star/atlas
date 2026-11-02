/**
 * W3 · "זכוכית חלבית". Four frosted blocks over the complex photo:
 *   1. the day in three big numbers (מגיעים · יוצאים · ניקיון) + chips for new leads and money waiting
 *      (desktop: four glass KPI cards)
 *   2. the ONE next thing, an indigo glass card with its button
 *   3. today's schedule by the hour (tap → booking sheet)
 *   4. money in this month with a soft 6-month curve
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, DoorOpen, Brush, Inbox, Wallet, Check, ChevronLeft, MessageCircle } from 'lucide-react';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { templateByKey } from '@/lib/stay/whatsapp';
import { cn } from '@/lib/utils';
import { useTodayModel, guestLabel, money, moneyNum } from './model';
import StaySheet from './StaySheet';
import './w.css';

function Curve({ months }) {
  const W = 320; const H = 96; const vals = months.map((x) => x.value || 0); const max = Math.max(1, ...vals);
  const pts = vals.map((v, i) => [W - (i * W) / Math.max(1, vals.length - 1), H - 8 - (v / max) * (H - 24)]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i]; const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  const area = `${d} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`;
  return (
    <div className="w3-curve">
      <div className="w3-curve-plot">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
        <defs><linearGradient id="w3g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3E2BF1" stopOpacity=".28" /><stop offset="1" stopColor="#3E2BF1" stopOpacity="0" /></linearGradient></defs>
        <path d={area} fill="url(#w3g)" />
        <path d={d} fill="none" stroke="#3E2BF1" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      </div>
      <div className="w3-curve-l" aria-hidden>{months.map((x) => <span key={x.key}>{x.label}</span>)}</div>
    </div>
  );
}

export default function DashboardView({ user, orgId }) {
  const m = useTodayModel({ orgId });
  const [composer, setComposer] = useState(null);
  const [sheet, setSheet] = useState(null);
  const openWa = (booking, template) => setComposer({ booking, template });
  const { board, next } = m;
  const rows = m.rowsFor(board, m.day);

  const kpis = [
    { k: 'in', icon: KeyRound, n: board.arrivals.length, l: 'מגיעים', to: '/bookings' },
    { k: 'out', icon: DoorOpen, n: board.departures.length, l: 'יוצאים', to: '/bookings' },
    { k: 'clean', icon: Brush, n: m.openCleanings.length, l: 'ניקיון פתוח', to: '/cleaning' },
    { k: 'leads', icon: Inbox, n: m.leads.length, l: 'פניות חדשות', to: '/leads' },
  ];

  const nextBody = !next ? null : next.kind === 'message'
    ? { t: templateByKey(next.template).label, s: `${guestLabel(next.booking)} · ${next.unit}. ההודעה מוכנה, נשאר לשלוח.`, b: 'פתיחה בוואטסאפ', go: () => openWa(next.booking, next.template) }
    : next.kind === 'cleaning'
      ? { t: `ניקיון ${next.c.unit}`, s: next.c.sameDayTurnover ? 'יש כניסה היום. סמנו כשהיחידה מוכנה.' : 'סמנו כשהיחידה מוכנה.', b: 'סימון שבוצע', go: () => m.markCleaned(next.c) }
      : { t: 'תזכורת תשלום', s: `${guestLabel(next.booking)} · יתרה ${money(next.balance.balance)}`, b: 'שליחת תזכורת', go: () => openWa(next.booking, 'balance_reminder') };

  return (
    <div className="w3" dir="rtl">
      <h1 className="sr-only">היום</h1>
      <div className="w3-grid">
        {/* 1 · the day in numbers */}
        <section className="w3-glass w3-day w3-a-kpi" aria-label="היום במספרים">
          <p className="w3-k w3-only-m">היום במתחם</p>
          <div className="w3-kpis">
            {kpis.map(({ k, icon: Icon, n, l, to }) => (
              <Link key={k} to={to} className={cn('w3-kpi press', k === 'leads' && 'w3-kpi--lead')}>
                <span className="w3-kpi-ic"><Icon strokeWidth={1.9} /></span>
                <span className="w3-kpi-n" dir="ltr">{n}</span>
                <span className="w3-kpi-l">{l}</span>
              </Link>
            ))}
          </div>
          <div className="w3-chips w3-only-m">
            <Link to="/leads" className="w3-chip press"><Inbox strokeWidth={1.9} /><b dir="ltr">{m.leads.length}</b> פניות חדשות</Link>
            {m.pendingTotal > 0 ? <Link to="/balances" className="w3-chip press"><i className="w3-dot" aria-hidden /><b dir="ltr">{money(m.pendingTotal)}</b> ממתינים</Link> : null}
          </div>
        </section>

        {/* 2 · next thing */}
        <section className={cn('w3-next w3-a-next', !next && 'done')} aria-label="הדבר הבא">
          {next ? (
            <>
              <div className="w3-next-top">
                <span className="w3-next-ic">{next.kind === 'message' ? <MessageCircle strokeWidth={1.9} /> : next.kind === 'cleaning' ? <Brush strokeWidth={1.9} /> : <Wallet strokeWidth={1.9} />}</span>
                <div className="min-w-0 flex-1"><p className="w3-next-k">הבא בתור</p><p className="w3-next-t">{nextBody.t}</p></div>
              </div>
              <p className="w3-next-s">{nextBody.s}</p>
              <button type="button" className="w3-next-b press" onClick={nextBody.go}>{nextBody.b}</button>
            </>
          ) : (
            <div className="w3-next-top"><span className="w3-next-ic"><Check strokeWidth={2.5} /></span><div><p className="w3-next-t">הכל מוכן להיום</p><p className="w3-next-k">אין משהו שמחכה לכם.</p></div></div>
          )}
        </section>

        {/* 3 · schedule */}
        <section className="w3-glass w3-sched w3-a-sched" aria-label="לוח היום">
          <div className="w3-row"><p className="w3-h3">לוח היום</p><Link to="/multicalendar" className="w3-link press">ליומן</Link></div>
          {rows.length ? (
            <ul className="w3-list">
              {rows.map((r, i) => (
                <li key={r.key} className={cn(i >= 4 && 'w3-more-row')}>
                  <button type="button" className="w3-li press" onClick={() => (r.kind === 'clean' ? (!r.done && m.markCleaned(r.c)) : setSheet(r.booking))}>
                    <span className="w3-time" dir="ltr">{r.time}</span>
                    <span className={cn('w3-bar', r.kind, r.done && 'done')} aria-hidden />
                    <span className="w3-li-t"><span className="w3-li-n">{r.kind === 'clean' ? `ניקיון ${r.unit}` : guestLabel(r.booking)}</span><span className="w3-li-s">{r.kind === 'clean' ? (r.done ? 'בוצע' : 'הקישו לסימון שבוצע') : `${r.status} · ${r.unit}`}</span></span>
                    {r.done ? <span className="w3-ok"><Check strokeWidth={2.5} /></span> : <ChevronLeft className="w3-go" strokeWidth={2} />}
                  </button>
                </li>
              ))}
            </ul>
          ) : <p className="w3-empty">אין היום כניסות או יציאות.</p>}
          {rows.length > 4 ? <Link to="/multicalendar" className="w3-link press w3-only-d">עוד {rows.length - 4} ביומן</Link> : null}
        </section>

        {/* 4 · money */}
        <section className="w3-glass w3-money w3-a-money" aria-label="כסף">
          <div className="w3-row"><p className="w3-k">נכנס ב{m.money.month}</p><span className="w3-occ">תפוסה <b dir="ltr">{m.money.occupancy}%</b></span></div>
          <p className="w3-big" dir="ltr"><span className="w3-cur">₪</span>{moneyNum(m.money.received)}</p>
          <Curve months={m.money.months} />
          {m.pendingTotal > 0 ? <Link to="/balances" className="w3-due press w3-only-d"><i className="w3-dot" aria-hidden />{money(m.pendingTotal)} עוד לא שולמו<ChevronLeft strokeWidth={2} /></Link> : null}
        </section>
      </div>

      <StaySheet open={!!sheet} onOpenChange={(o) => !o && setSheet(null)} booking={sheet} model={m} onWhatsApp={(b, t) => { setSheet(null); openWa(b, t); }} />
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
