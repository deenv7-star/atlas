/**
 * Guided tour, design A: classic spotlight.
 * The screen dims, a rounded "window" glides from element to element with a soft pulse around it,
 * and a white card next to it says what it is. Progress dots, back / next / skip, voice toggle.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X, Volume2, VolumeX, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import '@/styles/tour-a.css';

const PAD = 8;
const GAP = 14;

function useViewport() {
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useEffect(() => {
    const h = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return vp;
}

/** The highlighted window, clipped to the screen so a tall element never pushes the card away. */
function holeFor(rect, vp) {
  if (!rect) return null;
  const top = Math.max(8, rect.top - PAD);
  const left = Math.max(8, rect.left - PAD);
  const right = Math.min(vp.w - 8, rect.right + PAD);
  const bottom = Math.min(vp.h - 8, rect.bottom + PAD);
  if (bottom - top < 24 || right - left < 24) return null;
  return { top, left, width: right - left, height: bottom - top };
}

export default function TourView({ step, idx, total, steps, rect, ready, reduced, voiceOn, voiceError, speaking, onNext, onBack, onSkip, onToggleVoice, onGo }) {
  const vp = useViewport();
  const cardRef = useRef(null);
  const primaryRef = useRef(null);
  const [cardH, setCardH] = useState(240);
  const first = idx === 0;
  const last = idx === total - 1;
  const phone = vp.w < 640;

  // the card is max 360 wide; on phones it spans the screen with 12px margins
  const cardW = Math.min(360, vp.w - 24);
  let hole = holeFor(rect, vp);
  // a very tall element (the calendar on a phone): keep its top part lit, leave room for the card
  if (hole && phone && hole.height > vp.h - cardH - GAP - 40) {
    hole = { ...hole, height: Math.max(120, vp.h - cardH - GAP - 40 - hole.top) };
  }

  let pos;
  let arrow = null;
  if (!hole) {
    pos = { top: Math.max(16, (vp.h - cardH) / 2), left: (vp.w - cardW) / 2, centered: true };
  } else {
    const below = vp.h - (hole.top + hole.height) - GAP - 12;
    const above = hole.top - GAP - 12;
    const cx = hole.left + hole.width / 2;
    const left = Math.min(Math.max(12, cx - cardW / 2), vp.w - cardW - 12);
    if (below >= cardH) {
      pos = { top: hole.top + hole.height + GAP, left };
      arrow = { side: 'top', x: Math.min(Math.max(24, cx - left), cardW - 24) };
    } else if (above >= cardH) {
      pos = { top: hole.top - GAP - cardH, left };
      arrow = { side: 'bottom', x: Math.min(Math.max(24, cx - left), cardW - 24) };
    } else {
      pos = { top: vp.h - cardH - 12, left: (vp.w - cardW) / 2, docked: true };
    }
  }

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
  });

  // focus the main button on every step (the card is a modal dialog)
  useEffect(() => {
    if (!ready) return;
    // focus the card itself (not a button), so touch users never see a focus ring; Tab then reaches the buttons
    const t = setTimeout(() => cardRef.current?.focus({ preventScroll: true }), reduced ? 0 : 160);
    return () => clearTimeout(t);
  }, [idx, ready, reduced]);

  // keep Tab inside the card
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

  const holeStyle = hole
    ? { transform: `translate(${hole.left}px, ${hole.top}px)`, width: hole.width, height: hole.height, borderRadius: 18 }
    : { transform: `translate(${vp.w / 2}px, ${vp.h / 2}px)`, width: 0, height: 0, borderRadius: 999 };

  return (
    <div className={cn('ta-root', reduced && 'ta-still')} dir="rtl" onKeyDown={onKeyDown}>
      {/* the dim layer with the lit window; it also keeps the page from being clicked mid-tour */}
      <div className="ta-catch" aria-hidden onClick={(e) => e.stopPropagation()} />
      <div className="ta-hole" style={holeStyle} aria-hidden>
        {hole && ready ? <span key={idx} className="ta-pulse" /> : null}
      </div>

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby="ta-title"
        aria-describedby="ta-text"
        className={cn('ta-card', pos.centered && 'ta-card--center', !ready && 'ta-card--wait')}
        style={{ top: pos.top, left: pos.left, width: cardW }}
      >
        {arrow ? <span className={cn('ta-arrow', `ta-arrow--${arrow.side}`)} style={{ left: arrow.x - 7 }} aria-hidden /> : null}
        <div key={idx} className="ta-body">
          <div className="ta-top">
            <span className="ta-count" aria-hidden>{idx + 1} מתוך {total}</span>
            <button
              type="button"
              className={cn('ta-voice', voiceOn && 'is-on')}
              aria-pressed={voiceOn}
              onClick={onToggleVoice}
            >
              {voiceOn ? (speaking ? <span className="ta-bars" aria-hidden><i /><i /><i /></span> : <Volume2 className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden />) : <VolumeX className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden />}
              {voiceOn ? 'הסבר קולי פועל' : 'השמע הסבר'}
            </button>
            <button type="button" className="ta-x" onClick={onSkip} aria-label={last ? 'סגירת הסיור' : 'דילוג על הסיור'}>
              <X className="h-5 w-5" strokeWidth={1.9} aria-hidden />
            </button>
          </div>
          <h2 id="ta-title" className="ta-title">{step.title}</h2>
          <p id="ta-text" className="ta-text" aria-live="polite">{step.text}</p>
          {voiceError && voiceOn ? <p className="ta-note">לא הצלחנו להשמיע את ההסבר. הטקסט כאן למעלה.</p> : null}
          <p className="sr-only">שלב {idx + 1} מתוך {total}</p>

          <div className="ta-foot">
            <div className="ta-dots" aria-hidden>
              {steps.map((s, k) => (
                <span key={s.id} className={cn('ta-dot', k === idx && 'is-on', k < idx && 'is-past')} />
              ))}
            </div>
            <div className="ta-btns">
              {!first ? (
                <button type="button" className="ta-back" onClick={onBack}>
                  <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                  הקודם
                </button>
              ) : (
                <button type="button" className="ta-back" onClick={onSkip}>אחר כך</button>
              )}
              <button ref={primaryRef} type="button" className="ta-next" onClick={onNext} disabled={!ready}>
                {first ? 'בואו נתחיל' : last ? 'סיום' : 'הבא'}
                {!last ? <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden /> : null}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
