import React, { useRef } from 'react';
import { Check, CalendarRange, CheckCheck } from 'lucide-react';
import { DEMO, THUMBS } from './content';
import { useInView, useTimeline, useCountUp, fmt } from './motion';

const CH = { airbnb: 'Airbnb', booking: 'Booking.com', direct: 'ישיר' };

function ChannelDot({ ch }) {
  return <span className={`l4-dot l4-dot-${ch}`} aria-hidden="true" />;
}

function Avatar({ initials, tone = 1 }) {
  return <span className={`l4-av l4-av-${tone}`} aria-hidden="true">{initials}</span>;
}

function Typing() {
  return <span className="l4-typing" aria-hidden="true"><i /><i /><i /></span>;
}

/** "שולם" pill that turns from amber "ממתין" to green with a check pop. */
function PaidPill({ paid }) {
  return (
    <span className={`l4-pill ${paid ? 'is-paid' : ''}`}>
      <span className="l4-pill-wait">ממתין</span>
      <span className="l4-pill-paid"><Check size={14} strokeWidth={3} aria-hidden="true" />שולם</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Variant A: one floating "today" card over the hero photo.           */
/* booking chip slides in → WhatsApp typing → message → "שולם ✓"       */
/* ------------------------------------------------------------------ */
const HERO_CARD_TL = [500, 1500, 2600, 3700];

export function HeroCard() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false });
  const s = useTimeline(HERO_CARD_TL, { loop: 9500, active: inView });
  const amount = useCountUp(DEMO.amount, s >= 3, 800);
  return (
    <div ref={ref} className="l4-hcard" role="img" aria-label="הדגמה: הזמנה חדשה נכנסת, הודעת וואטסאפ יוצאת לאורח והתשלום מסומן כשולם">
      <div className="l4-hcard-top">
        <span className="l4-hcard-title">היום במתחם</span>
        <span className="l4-hcard-sun" aria-hidden="true" />
      </div>

      <Row on={s >= 1} cls="l4-hrow-book">
        <img src={THUMBS.oak} alt="" width="44" height="44" className="l4-thumb" />
        <div className="l4-hrow-txt">
          <b>{DEMO.guest}</b>
          <span>{DEMO.unit}<span className="l4-nights"> · {DEMO.nights}</span></span>
        </div>
        <span className="l4-chip-new"><ChannelDot ch="airbnb" />הזמנה חדשה</span>
      </Row>

      <Row on={s >= 2} cls="l4-hrow-msg">
        <span className="l4-wa-ic" aria-hidden="true"><WaGlyph /></span>
        <div className={`l4-bubble ${s >= 3 ? 'is-text' : ''}`}>
          <Typing />
          <span className="l4-bubble-txt">היי נועה, מחכים לכם. הצ׳ק-אין מ-15:00.</span>
          <CheckCheck size={14} strokeWidth={2.25} className="l4-ticks" aria-hidden="true" />
        </div>
      </Row>

      <Row on={s >= 3} cls="l4-hrow-pay">
        <span className="l4-pay-lbl">מקדמה</span>
        <b className="l4-pay-amt num" dir="ltr">₪{fmt(amount)}</b>
        <PaidPill paid={s >= 4} />
      </Row>
    </div>
  );
}

/** A row that grows open (grid 0fr → 1fr) and slides in, so the card grows as events arrive. */
function Row({ on, cls, children }) {
  return (
    <div className={`l4-hrow-wrap ${on ? 'is-in' : ''}`}>
      <div className={`l4-hrow ${cls} ${on ? 'is-in' : ''}`}>{children}</div>
    </div>
  );
}

function WaGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.6 11.6 0 0 0 4.5 4c1.7.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Mini calendar: units with cover photos, bars fill in staggered.     */
/* ------------------------------------------------------------------ */
export function MiniCalendar({ play, compact = false }) {
  return (
    <div className={`l4-cal ${play ? 'is-play' : ''} ${compact ? 'is-compact' : ''}`} role="img" aria-label="הדגמה: לוח שנה של ארבע יחידות שמתמלא בהזמנות מ-Airbnb, Booking.com והזמנות ישירות">
      <div className="l4-cal-head">
        <span className="l4-cal-title"><CalendarRange size={18} strokeWidth={2} aria-hidden="true" />לוח שנה</span>
        <span className="l4-cal-legend" aria-hidden="true">
          {['airbnb', 'booking', 'direct'].map((c) => <span key={c}><ChannelDot ch={c} />{CH[c]}</span>)}
        </span>
      </div>
      <div className="l4-cal-grid" aria-hidden="true">
        <span className="l4-cal-corner" style={{ gridRow: 1, gridColumn: 1 }} />
        {DEMO.days.map((d, i) => <span key={d} className={`l4-cal-day ${i === 1 ? 'is-today' : ''}`} style={{ gridColumn: i + 2 }}>{d}</span>)}
        {DEMO.units.map((u, r) => (
          <React.Fragment key={u.key}>
            <span className="l4-cal-unit" style={{ gridRow: r + 2 }}>
              <img src={THUMBS[u.key]} alt="" width="28" height="28" />
              <span>{u.name}</span>
            </span>
            <span className="l4-cal-lane" style={{ gridRow: r + 2 }} />
          </React.Fragment>
        ))}
        {DEMO.bars.map(([r, start, len, ch], i) => (
          <span
            key={`${r}-${start}`}
            className={`l4-bar l4-bar-${ch}`}
            style={{ gridRow: r + 2, gridColumn: `${start + 2} / span ${len}`, '--i': i }}
          />
        ))}
        <span className="l4-cal-todayline" style={{ gridColumn: 3, gridRow: `2 / span ${DEMO.units.length}` }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Phone with a WhatsApp conversation (light frame, never dark).       */
/* ------------------------------------------------------------------ */
export function ChatPhone({ step }) {
  return (
    <div className="l4-phone" role="img" aria-label="הדגמה: אורחת שואלת בוואטסאפ על שעת הגעה ומקבלת תשובה">
      <div className="l4-phone-scr">
        <span className="l4-phone-island" aria-hidden="true" />
        <div className="l4-chat-hdr" aria-hidden="true">
          <Avatar initials="נל" tone={3} />
          <span><b>{DEMO.guest}</b><small>{DEMO.unit}</small></span>
        </div>
        <div className="l4-chat" aria-hidden="true">
          <span className="l4-chat-date">היום</span>
          <div className={`l4-msg l4-msg-in ${step >= 1 ? 'is-in' : ''}`}>{DEMO.chatIn}</div>
          <div className={`l4-msg l4-msg-out ${step >= 2 ? 'is-in' : ''} ${step >= 3 ? 'is-text' : ''}`}>
            <Typing />
            <span className="l4-msg-txt">{DEMO.chatOut}</span>
          </div>
        </div>
        <div className="l4-chat-input" aria-hidden="true"><span>הודעה</span><i /></div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Payment card that flips to "שולם".                                  */
/* ------------------------------------------------------------------ */
export function PayFlip({ paid, amount = DEMO.amount }) {
  return (
    <div className={`l4-flip ${paid ? 'is-paid' : ''}`} role="img" aria-label={`הדגמה: יתרה של ${fmt(amount)} שקלים מסומנת כשולמה`}>
      <div className="l4-flip-in" aria-hidden="true">
        <div className="l4-flip-face l4-flip-front">
          <span className="l4-flip-lbl">יתרה · {DEMO.unit}</span>
          <b className="num" dir="ltr">₪{fmt(amount)}</b>
          <span className="l4-flip-state is-wait">ממתין לתשלום</span>
        </div>
        <div className="l4-flip-face l4-flip-back">
          <span className="l4-flip-check"><Check size={22} strokeWidth={3} /></span>
          <span><b className="num" dir="ltr">₪{fmt(amount)}</b><span className="l4-flip-state">שולם</span></span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Variant B hero stage: calendar + phone + payment, one script.       */
/* ------------------------------------------------------------------ */
const STAGE_TL = [300, 2100, 2900, 3900, 5000];

export function LiveDemo() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false });
  const s = useTimeline(STAGE_TL, { loop: 10500, active: inView });
  return (
    <div ref={ref} className="l4-stage">
      <div className="l4-stage-cal"><MiniCalendar play={s >= 1} /></div>
      <div className="l4-stage-phone"><ChatPhone step={s - 1} /></div>
      <div className="l4-stage-pay"><PayFlip paid={s >= 5} /></div>
    </div>
  );
}

/* Variant A product section: the same three pieces, one tile each, played once in view. */
const TILE_TL = [200, 1000, 1700, 2600, 3400];

export function DemoTiles({ captions }) {
  const ref = useRef(null);
  const inView = useInView(ref, { margin: '0px 0px -15% 0px' });
  const s = useTimeline(TILE_TL, { active: inView });
  return (
    <ul ref={ref} className="l4-tiles" data-reveal>
      <li className="l4-tile l4-tile-cal">
        <div className="l4-tile-stage"><MiniCalendar play={s >= 1} compact /></div>
        <p>{captions[0]}</p>
      </li>
      <li className="l4-tile l4-tile-chat">
        <div className="l4-tile-stage"><ChatPhone step={s - 1} /></div>
        <p>{captions[1]}</p>
      </li>
      <li className="l4-tile l4-tile-pay">
        <div className="l4-tile-stage"><PayFlip paid={s >= 5} /></div>
        <p>{captions[2]}</p>
      </li>
    </ul>
  );
}
