import BrandWordmark from '@/components/common/BrandWordmark';
/**
 * Guided tour, design B: "the guide".
 * A friendly guide card docks at the bottom of the screen and walks the owner through, screen by
 * screen. Each step has a small live demo (a booking landing in the calendar, a WhatsApp message
 * going out, a payment turning "שולם"), the real element behind it gets a soft indigo frame,
 * and the page stays visible (no heavy dimming).
 */
import React, { useEffect, useRef, useState } from 'react';
import { X, Volume2, VolumeX, ArrowLeft, ArrowRight, CalendarRange, MessageCircle, Wallet, Check, CircleHelp, Link2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import '@/styles/tour-b.css';

function useViewport() {
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useEffect(() => {
    const h = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return vp;
}

/* ── the guide: the ATLAS dot with a face of sound rings (no stock person, no mascot clip-art) ── */
function Guide({ speaking }) {
  return (
    <span className={cn('tb-guide', speaking && 'is-speaking')} aria-hidden>
      <span className="tb-ring tb-ring--1" />
      <span className="tb-ring tb-ring--2" />
      <span className="tb-guide-core"><span className="tb-guide-dot" /></span>
    </span>
  );
}

/* ── one small live demo per step ── */
function Demo({ id }) {
  switch (id) {
    case 'welcome':
      return (
        <div className="tb-demo tb-d-welcome">
          <span className="tb-word" dir="ltr"><BrandWordmark /></span>
          <span className="tb-orb tb-orb--1"><CalendarRange strokeWidth={1.9} /></span>
          <span className="tb-orb tb-orb--2"><MessageCircle strokeWidth={1.9} /></span>
          <span className="tb-orb tb-orb--3"><Wallet strokeWidth={1.9} /></span>
        </div>
      );
    case 'today':
      return (
        <div className="tb-demo tb-d-list">
          {[['כניסה', '15:00', 'משפחת לוי · הגפן'], ['יציאה', '11:00', 'דנה כהן · הזית'], ['ניקיון', '12:00', 'התאנה']].map(([k, t, d], i) => (
            <span key={k} className="tb-row" style={{ '--d': `${i * 360}ms` }}>
              <span className="tb-pill">{k}</span>
              <span className="tb-row-t"><b>{t}</b> {d}</span>
              <span className="tb-tick"><Check strokeWidth={3} /></span>
            </span>
          ))}
        </div>
      );
    case 'calendar':
      return (
        <div className="tb-demo tb-d-cal">
          {['הגפן', 'הזית', 'התאנה'].map((u) => (
            <span key={u} className="tb-cal-row">
              <span className="tb-cal-unit">{u}</span>
              <span className="tb-cal-cells">{[0, 1, 2, 3, 4, 5].map((c) => <i key={c} />)}</span>
            </span>
          ))}
          <span className="tb-cal-bar tb-cal-bar--a">לוי</span>
          <span className="tb-cal-bar tb-cal-bar--b" />
          <span className="tb-cal-tap"><Plus strokeWidth={2.5} /></span>
        </div>
      );
    case 'bookings':
      return (
        <div className="tb-demo tb-d-list">
          {[['#1B2656', 'Booking.com', 'משפחת לוי', '₪2,400'], ['#EF5B5B', 'Airbnb', 'דנה כהן', '₪1,250'], ['#3E2BF1', 'ישיר', 'אורי ונועה', '₪1,900']].map(([c, ch, n, m], i) => (
            <span key={ch} className="tb-row" style={{ '--d': `${i * 300}ms` }}>
              <span className="tb-dot" style={{ background: c }} />
              <span className="tb-row-t"><b>{n}</b> {ch}</span>
              <span className="tb-row-m">{m}</span>
            </span>
          ))}
        </div>
      );
    case 'leads':
      return (
        <div className="tb-demo tb-d-lead">
          <span className="tb-lead">
            <span className="tb-lead-a">ד</span>
            <span className="tb-lead-t"><b>דנה</b> שאלה על סוף השבוע</span>
          </span>
          <span className="tb-lead-arrow"><ArrowLeft strokeWidth={2.2} /></span>
          <span className="tb-lead-done"><Check strokeWidth={3} />הזמנה</span>
        </div>
      );
    case 'messages':
      return (
        <div className="tb-demo tb-d-wa">
          <span className="tb-typing"><i /><i /><i /></span>
          <span className="tb-bubble">
            שלום נועה, ההזמנה שלכם בגפן מאושרת. כניסה מ-15:00.
            <span className="tb-ticks">✓✓</span>
          </span>
        </div>
      );
    case 'payments':
      return (
        <div className="tb-demo tb-d-pay">
          <span className="tb-pay-amt" dir="ltr"><small>₪</small><span className="tb-pay-n" /></span>
          <span className="tb-pay-pill"><span className="tb-pay-wait">ממתין</span><span className="tb-pay-paid"><Check strokeWidth={3} />שולם</span></span>
        </div>
      );
    case 'settings':
      return (
        <div className="tb-demo tb-d-list">
          {[['#1B2656', 'Booking.com'], ['#EF5B5B', 'Airbnb']].map(([c, n], i) => (
            <span key={n} className="tb-row" style={{ '--d': `${i * 500}ms` }}>
              <span className="tb-dot" style={{ background: c }} />
              <span className="tb-row-t"><b>{n}</b> <Link2 className="tb-inl" strokeWidth={2} />קישור יומן</span>
              <span className="tb-switch"><i /></span>
            </span>
          ))}
        </div>
      );
    case 'done':
      return (
        <div className="tb-demo tb-d-done">
          <span className="tb-q"><CircleHelp strokeWidth={1.9} /></span>
          <span className="tb-q-tip"><b>מה זה?</b> הסבר קצר, ומה עושים.</span>
        </div>
      );
    default:
      return null;
  }
}

export default function TourView({ step, idx, total, rect, ready, reduced, voiceOn, voiceError, speaking, onNext, onBack, onSkip, onToggleVoice }) {
  const vp = useViewport();
  const cardRef = useRef(null);
  const first = idx === 0;
  const last = idx === total - 1;

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => cardRef.current?.focus({ preventScroll: true }), reduced ? 0 : 160);
    return () => clearTimeout(t);
  }, [idx, ready, reduced]);

  const onKeyDown = (e) => {
    if (!cardRef.current) return;
    if (e.key === 'Enter' && document.activeElement === cardRef.current) { e.preventDefault(); onNext(); return; }
    if (e.key !== 'Tab') return;
    const f = [...cardRef.current.querySelectorAll('button:not([disabled])')];
    if (!f.length) return;
    const a = f[0];
    const z = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === a || document.activeElement === cardRef.current)) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  };

  // the soft frame around the real element (clipped to the screen)
  let frame = null;
  if (rect && ready) {
    const top = Math.max(6, rect.top - 6);
    const left = Math.max(6, rect.left - 6);
    const right = Math.min(vp.w - 6, rect.right + 6);
    const bottom = Math.min(vp.h - 6, rect.bottom + 6);
    if (bottom - top > 24 && right - left > 24) frame = { transform: `translate(${left}px, ${top}px)`, width: right - left, height: bottom - top };
  }

  return (
    <div className={cn('tb-root', reduced && 'tb-still')} dir="rtl" onKeyDown={onKeyDown}>
      <div className="tb-veil" aria-hidden onClick={(e) => e.stopPropagation()} />
      <div className={cn('tb-frame', frame && 'is-on')} style={frame || undefined} aria-hidden />

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby="tb-title"
        aria-describedby="tb-text"
        className="tb-card"
      >
        <div className="tb-head">
          <Guide speaking={speaking} />
          <span className="tb-who">
            <span className="tb-name">המדריך של ATLAS</span>
            <span className="tb-count">שלב {idx + 1} מתוך {total}</span>
          </span>
          <button type="button" className="tb-x" onClick={onSkip} aria-label={last ? 'סגירת הסיור' : 'דילוג על הסיור'}>
            <X className="h-5 w-5" strokeWidth={1.9} aria-hidden />
          </button>
        </div>

        <div key={idx} className="tb-swap">
          <div className="tb-stage" aria-hidden><Demo id={step.id} /></div>
          <h2 id="tb-title" className="tb-title">{step.title}</h2>
          <p id="tb-text" className="tb-text" aria-live="polite">{step.text}</p>
          {voiceError && voiceOn ? <p className="tb-note">לא הצלחנו להשמיע את ההסבר. הטקסט כאן למעלה.</p> : null}
        </div>

        <span className="tb-progress" aria-hidden><span style={{ width: `${((idx + 1) / total) * 100}%` }} /></span>

        <div className="tb-foot">
          <button type="button" className={cn('tb-voice', voiceOn && 'is-on')} aria-pressed={voiceOn} onClick={onToggleVoice}>
            {voiceOn ? (speaking ? <span className="tb-bars" aria-hidden><i /><i /><i /></span> : <Volume2 className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden />) : <VolumeX className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden />}
            <span>{voiceOn ? 'הסבר קולי פועל' : 'השמע הסבר'}</span>
          </button>
          <span className="tb-btns">
            {!first ? (
              <button type="button" className="tb-back" onClick={onBack} aria-label="הקודם">
                <ArrowRight className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            ) : null}
            <button type="button" className="tb-next" onClick={onNext} disabled={!ready}>
              {first ? 'בואו נתחיל' : last ? 'סיום' : 'הבא'}
              {!last ? <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden /> : null}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
