/**
 * The real message a guest receives, drawn as a chat: a navy "phone" surface with one white bubble,
 * the time it goes out and read ticks. Text comes from renderTemplate with the owner's own zimmer.
 */
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
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
        <p className="whitespace-pre-line">{text}</p>
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
    const t = setTimeout(() => onDone?.(), reduce ? 900 : 1900);
    return () => clearTimeout(t);
  }, [open, onDone, reduce]);
  if (!open) return null;
  return (
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
    </motion.div>
  );
}

/** Slot for the assistant's face (mascot v2 lands here later). Until then the atlas spark on indigo. */
export function AssistantFace({ size = 40, className }) {
  return (
    <span className={cn('mg-face', className)} style={{ width: size, height: size }} data-slot="mascot" aria-hidden>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <path d="M12 1.6c.5 3.9 1.3 6.9 2.4 8.4L12 12l-2.4-2C10.7 8.5 11.5 5.5 12 1.6Z" fill="#fff" />
        <path d="M12 22.4c-.35-2.6-.9-4.6-1.65-5.7L12 12l1.65 4.7c-.75 1.1-1.3 3.1-1.65 5.7ZM21.4 12c-2.6.35-4.6.9-5.7 1.65L12 12l3.7-1.65c1.1.75 3.1 1.3 5.7 1.65ZM2.6 12c2.6-.35 4.6-.9 5.7-1.65L12 12l-3.7 1.65C7.2 12.9 5.2 12.35 2.6 12Z" fill="#fff" opacity=".45" />
      </svg>
    </span>
  );
}
