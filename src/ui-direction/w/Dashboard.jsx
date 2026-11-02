/**
 * W2 · "סרגל כהה ורשימת עבודה". The day is a worklist: every card is something that needs you, with
 * its action button on the card. Phone: navy top (greeting + 4 counters) → worklist → money.
 * Desktop: counters + worklist live in the navy side panel; the light area shows the day's timeline,
 * the next WhatsApp message ready to send, and money in.
 */
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { KeyRound, DoorOpen, Brush, Inbox, Wallet, MessageCircle, Check, ArrowUpLeft, Bell, Send, BedDouble } from 'lucide-react';
import { GuestAvatar, dayPart } from '@/components/app/atoms';
import { UserMenu } from '@/components/app/shell/shared';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { templateByKey, renderTemplate } from '@/lib/stay/whatsapp';
import { formatDayHe, firstName } from '@/lib/stay/format';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';
import { useTodayModel, guestLabel, money, moneyNum } from './model';
import StaySheet from './StaySheet';
import './w.css';

const ROW_ICON = { in: KeyRound, out: DoorOpen, clean: Brush };

function Counters({ m }) {
  const items = [
    { k: 'in', icon: KeyRound, l: 'מגיעים', n: m.board.arrivals.length, to: '/bookings' },
    { k: 'out', icon: DoorOpen, l: 'יוצאים', n: m.board.departures.length, to: '/bookings' },
    { k: 'clean', icon: Brush, l: 'ניקיון', n: m.openCleanings.length, to: '/cleaning' },
    { k: 'leads', icon: Inbox, l: 'פניות חדשות', n: m.leads.length, to: '/leads' },
  ];
  return (
    <div className="w2-counters">
      {items.map(({ k, icon: Icon, l, n, to }) => (
        <Link key={k} to={to} className="w2-cnt press">
          <span className="w2-cnt-l"><Icon strokeWidth={1.9} />{l}</span>
          <span className="w2-cnt-n" dir="ltr">{n}</span>
        </Link>
      ))}
    </div>
  );
}

function Worklist({ items, max }) {
  const shown = max ? items.slice(0, max) : items;
  if (!items.length) {
    return <div className="w2-clear"><span><Check strokeWidth={2.5} /></span><p>אין משהו שמחכה לכם. הכל מוכן להיום.</p></div>;
  }
  return (
    <ul className="w2-work">
      {shown.map((it, i) => (
        <li key={it.key} className={cn('w2-wi', i === 0 && 'on')}>
          <button type="button" className="w2-wi-top press" onClick={it.onOpen} disabled={!it.onOpen}>
            {it.person ? <GuestAvatar name={it.person} size={44} /> : <span className="w2-wi-ic">{it.icon ? <it.icon strokeWidth={1.9} /> : <BedDouble strokeWidth={1.9} />}</span>}
            <span className="w2-wi-t"><span className="w2-wi-n">{it.title}</span><span className="w2-wi-s">{it.sub}</span></span>
            {it.onOpen ? <ArrowUpLeft className="w2-wi-go" strokeWidth={2} /> : null}
          </button>
          <div className="w2-wi-act">
            <span className="w2-wi-tag"><it.tagIcon strokeWidth={1.9} />{it.tag}</span>
            <button type="button" className="w2-wi-btn press" onClick={it.onAction}>{it.action}</button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardView({ user, orgId }) {
  const m = useTodayModel({ orgId });
  const { logout } = useAuth();
  const [composer, setComposer] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [panel, setPanel] = useState(null);
  useEffect(() => { setPanel(document.getElementById('w2-panel')); }, []);
  const openWa = (booking, template) => setComposer({ booking, template });
  const name = firstName(user?.full_name || '') || '';

  const work = [
    ...m.messages.map((x) => ({
      key: `msg-${x.booking.id}-${x.template}`, person: x.booking.guest_name || '', title: guestLabel(x.booking), sub: x.unit,
      tag: `${templateByKey(x.template).label} מוכנה`, tagIcon: MessageCircle, action: 'שליחה', onAction: () => openWa(x.booking, x.template), onOpen: () => setSheet(x.booking),
    })),
    ...m.openCleanings.map((c) => ({
      key: `cl-${c.key}`, icon: Brush, title: `ניקיון ${c.unit}`, sub: c.sameDayTurnover ? 'יש כניסה היום' : 'אחרי היציאה',
      tag: 'מחכה לסימון', tagIcon: Brush, action: 'בוצע', onAction: () => m.markCleaned(c),
    })),
    ...m.pending.map((x) => ({
      key: `bal-${x.booking.id}`, person: x.booking.guest_name || '', title: guestLabel(x.booking), sub: x.unit,
      tag: `יתרה ${money(x.balance.balance)}`, tagIcon: Wallet, action: 'תזכורת', onAction: () => openWa(x.booking, 'balance_reminder'), onOpen: () => setSheet(x.booking),
    })),
    ...m.leads.slice(0, 3).map((l) => ({
      key: `lead-${l.id}`, person: l.full_name || l.name || '', title: l.full_name || l.name || 'פנייה חדשה', sub: l.notes ? String(l.notes).slice(0, 40) : 'פנייה חדשה',
      tag: 'פנייה חדשה', tagIcon: Inbox, action: 'מענה', onAction: () => { window.location.href = '/leads'; },
    })),
  ];

  const rows = m.rowsFor(m.board, m.day);
  const nextMsg = m.messages[0] || null;
  let draft = '';
  if (nextMsg) { try { draft = renderTemplate(nextMsg.template, { booking: nextMsg.booking, property: m.prop(nextMsg.booking.property_id), balance: nextMsg.balance, orgName: user?.organization_name }).split('\n').filter(Boolean).slice(0, 3).join('\n'); } catch { draft = ''; } }
  const months = m.money.months;
  const maxM = Math.max(1, ...months.map((x) => x.value || 0));

  const panelContent = (
    <div className="w2-pane">
      <Counters m={m} />
      <div className="w2-pane-h"><p>מה מחכה לכם</p><span>{work.length}</span></div>
      <Worklist items={work} />
    </div>
  );

  return (
    <div className="w2" dir="rtl">
      <h1 className="sr-only">היום</h1>
      {panel ? createPortal(panelContent, panel) : null}

      {/* phone: navy top */}
      <section className="w2-top" aria-label="היום במספרים">
        <div className="w2-top-row">
          <UserMenu user={user} onLogout={async () => { await logout(false); window.location.href = '/login'; }}>
            <button type="button" aria-label="החשבון שלי" className="press inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full"><GuestAvatar name={user?.full_name || ''} owner size={44} /></button>
          </UserMenu>
          <div className="min-w-0 flex-1">
            <p className="w2-top-hello">{dayPart().greeting}{name ? `, ${name}` : ''}</p>
            <p className="w2-top-date">{formatDayHe(m.day)}</p>
          </div>
          <Link to="/messages" aria-label="הודעות" className="w2-top-bell press"><Bell strokeWidth={1.75} /></Link>
        </div>
        <Counters m={m} />
      </section>

      <div className="w2-main">
        {/* phone: worklist */}
        <section className="w2-block w2-only-m" aria-label="מה מחכה לכם">
          <div className="w2-bh"><p>מה מחכה לכם</p>{work.length > 4 ? <span className="w2-more">עוד {work.length - 4}</span> : null}</div>
          <Worklist items={work} max={4} />
        </section>

        {/* desktop: timeline */}
        <section className="w2-card w2-timeline w2-only-d" aria-label="ציר היום">
          <div className="w2-bh"><p>ציר היום</p><Link to="/multicalendar" className="w2-link press">ליומן</Link></div>
          {rows.length ? (
            <ol className="w2-tl">
              {rows.map((r) => {
                const Icon = ROW_ICON[r.kind];
                return (
                  <li key={r.key} className={cn(r.done && 'done')}>
                    <span className="w2-tl-time" dir="ltr">{r.time}</span>
                    <span className={cn('w2-tl-dot', r.kind)} aria-hidden><Icon strokeWidth={2} /></span>
                    <button type="button" className="w2-tl-card press" onClick={() => (r.kind === 'clean' ? (!r.done && m.markCleaned(r.c)) : setSheet(r.booking))}>
                      <span className="w2-tl-t"><span className="w2-tl-n">{r.kind === 'clean' ? `ניקיון ${r.unit}` : guestLabel(r.booking)}</span><span className="w2-tl-s">{r.kind === 'clean' ? (r.done ? 'בוצע' : 'הקישו לסימון שבוצע') : r.unit}</span></span>
                      <span className="w2-tl-tag">{r.status}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : <p className="w2-empty">אין היום כניסות או יציאות.</p>}
        </section>

        <div className="w2-side-col">
          {/* desktop: next WhatsApp */}
          {nextMsg ? (
            <section className="w2-card w2-chat" aria-label="ההודעה הבאה">
              <div className="w2-chat-h">
                <GuestAvatar name={nextMsg.booking.guest_name || ''} size={44} />
                <div className="min-w-0 flex-1"><p className="w2-chat-n">{guestLabel(nextMsg.booking)}</p><p className="w2-chat-s">{templateByKey(nextMsg.template).label} · {nextMsg.unit}</p></div>
              </div>
              <div className="w2-bubble">{draft}</div>
              <button type="button" className="w2-send press" onClick={() => openWa(nextMsg.booking, nextMsg.template)}><Send strokeWidth={2} />פתיחה בוואטסאפ</button>
            </section>
          ) : null}

          {/* money */}
          <section className="w2-money" aria-label="כסף">
            <div className="w2-bh"><p>נכנס ב{m.money.month}</p><Link to="/payments" className="w2-link w2-link--on press">תשלומים</Link></div>
            <p className="w2-big" dir="ltr"><span className="w2-cur">₪</span>{moneyNum(m.money.received)}</p>
            <div className="w2-bars" aria-hidden>
              {months.map((x, i) => (
                <span key={x.key} className={cn('w2-b', i === months.length - 1 && 'cur')}><i style={{ height: `${Math.max(6, Math.round(((x.value || 0) / maxM) * 100))}%` }} /><em>{x.label}</em></span>
              ))}
            </div>
            {m.pendingTotal > 0 ? <Link to="/balances" className="w2-due press"><i aria-hidden />{money(m.pendingTotal)} ממתינים לתשלום</Link> : null}
          </section>
        </div>
      </div>

      <StaySheet chat open={!!sheet} onOpenChange={(o) => !o && setSheet(null)} booking={sheet} model={m} onWhatsApp={(b, t) => { setSheet(null); openWa(b, t); }} />
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
