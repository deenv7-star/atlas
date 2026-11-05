/**
 * The real message a guest receives, drawn as a chat: a navy "phone" surface with one white bubble,
 * the time it goes out and read ticks. Text comes from renderTemplate with the owner's own zimmer.
 */
import React from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AtlasFace } from '@/components/mascot/AtlasFace.jsx';
import { emitMascot } from '@/components/mascot/useMascotMood';
import { FriendlyText } from './FriendlyText';
import './magic.css';

function initials(name) {
  const p = String(name || '').trim().split(/\s+/);
  return (p[0]?.[0] || 'א') + (p[1]?.[0] || '');
}


export function WaBubble({ text, guest = 'נועה לוי', time = '10:00', sample = false, className, compact = false, delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <div className={cn('mg-chat', compact && 'is-compact', className)} dir="rtl">
      <div className="mg-chat-head">
        <span className="mg-chat-av" aria-hidden>{initials(guest)}</span>
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-semibold text-white">{guest}</span>
          <span className="block text-[12px] text-white/60">וואטסאפ{sample ? ' · דוגמה' : ''}</span>
        </span>
      </div>
      <motion.div
        className="mg-bubble"
        initial={reduce ? false : { opacity: 0, y: 14, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30, delay }}
      >
        <p className="whitespace-pre-line"><FriendlyText text={text} /></p>
        <span className="mg-bubble-meta" dir="ltr">
          <span className="tabular">{time}</span>
          <CheckCheck className="h-[15px] w-[15px]" strokeWidth={1.75} aria-hidden />
        </span>
      </motion.div>
    </div>
  );
}

/** Full-screen "done" moment: the bubble flies out, a check draws itself, one sentence. Auto-closes. */
export function DoneMoment({ open, title, line, onDone }) {
  const reduce = useReducedMotion();
  React.useEffect(() => {
    if (!open) return undefined;
    emitMascot('success');
    const t = setTimeout(() => onDone?.(), reduce ? 900 : 1900);
    return () => clearTimeout(t);
  }, [open, onDone, reduce]);
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <motion.div className="mg-done" role="status" aria-live="polite" onClick={() => onDone?.()}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      {!reduce ? (
        <>
          {[0, 1, 2].map((i) => (
            <motion.span key={i} className="mg-done-fly" aria-hidden
              initial={{ opacity: 0, x: 0, y: 40, scale: 0.7, rotate: 0 }}
              animate={{ opacity: [0, 1, 0], x: [0, (i - 1) * 70], y: [40, -220 - i * 40], scale: [0.7, 1, 0.8], rotate: (i - 1) * 8 }}
              transition={{ duration: 1.1, delay: 0.05 + i * 0.09, ease: [0.22, 1, 0.36, 1] }} />
          ))}
        </>
      ) : null}
      <motion.div className="mg-done-card"
        initial={reduce ? false : { scale: 0.9, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24, delay: reduce ? 0 : 0.15 }}>
        <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden className="mx-auto">
          <motion.path d="M24 39.5l9.5 9.5L53 29" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: reduce ? 0 : 0.35, ease: [0.65, 0, 0.35, 1] }} />
        </svg>
        <p className="mt-4 text-[24px] font-bold leading-tight text-white">{title}</p>
        {line ? <p className="mx-auto mt-2 max-w-[18rem] text-[15px] leading-snug text-white/75">{line}</p> : null}
      </motion.div>
    </motion.div>,
    document.body,
  );
}

/** The assistant's face on the guest-message screen: the living atlas glow face (mascot C). */
export function AssistantFace({ size = 40, className, mood = 'neutral' }) {
  return (
    <span className={cn('mg-face', className)} style={{ width: size, height: size }} data-slot="mascot" aria-hidden>
      <AtlasFace live mood={mood} size={size} decorative />
    </span>
  );
}
