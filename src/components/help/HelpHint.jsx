/**
 * <HelpHint id="today.revenue" />: a small "?" next to anything that needs a word of explanation.
 *
 *   - Desktop (a mouse): opens on hover after a short pause, or on click. Stays open while the
 *     pointer is over the card. Escape or clicking away closes it.
 *   - Phones / touch: a tap opens a bottom sheet with a big "הבנתי" button.
 *   - Keyboard: Tab to it, Enter / Space opens, Escape closes and focus returns to the "?".
 *   - Screen readers: the button says "הסבר: <title>", the card is a labelled dialog.
 *
 * The copy lives in src/content/help.he.js (one line "what is it" + one line "what to do").
 */
import React, { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { CircleHelp, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { helpFor } from '@/content/help.he';
import '@/styles/help.css';

const FINE = '(hover: hover) and (pointer: fine)';
function subscribe(cb) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mq = window.matchMedia(FINE);
  mq.addEventListener?.('change', cb);
  return () => mq.removeEventListener?.('change', cb);
}
const finePointer = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(FINE).matches : true);
export function useFinePointer() {
  return useSyncExternalStore(subscribe, finePointer, () => true);
}

function Body({ entry, titleId, descId }) {
  return (
    <>
      <p id={titleId} className="hh-title">{entry.title}</p>
      <p id={descId} className="hh-what">{entry.what}</p>
      {entry.todo ? (
        <p className="hh-todo">
          <ArrowLeft className="hh-todo-icon" strokeWidth={2} aria-hidden />
          <span>{entry.todo}</span>
        </p>
      ) : null}
    </>
  );
}

export default function HelpHint({ id, entry: entryProp, tone = 'plain', className, side = 'bottom', align = 'center' }) {
  const entry = entryProp || helpFor(id);
  const fine = useFinePointer();
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const uid = useId();
  const titleId = `hh-t-${uid}`;
  const descId = `hh-d-${uid}`;

  const clear = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  const later = useCallback((v, ms) => { clear(); timer.current = setTimeout(() => setOpen(v), ms); }, []);
  useEffect(() => clear, []);

  if (!entry) return null;

  const trigger = (
    <button
      type="button"
      aria-label={`הסבר: ${entry.title}`}
      data-help={id || undefined}
      className={cn('hh-btn', tone === 'onHero' && 'hh-btn--hero', open && 'is-open', className)}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); clear(); setOpen((v) => !v); }}
      onPointerEnter={fine ? (e) => { if (e.pointerType === 'mouse') later(true, 140); } : undefined}
      onPointerLeave={fine ? (e) => { if (e.pointerType === 'mouse') later(false, 220); } : undefined}
    >
      <CircleHelp className="hh-icon" strokeWidth={1.9} aria-hidden />
    </button>
  );

  if (fine) {
    return (
      <PopoverPrimitive.Root open={open} onOpenChange={(v) => { clear(); setOpen(v); }}>
        <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            side={side}
            align={align}
            sideOffset={6}
            collisionPadding={12}
            dir="rtl"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="hh-pop"
            onPointerEnter={(e) => { if (e.pointerType === 'mouse') clear(); }}
            onPointerLeave={(e) => { if (e.pointerType === 'mouse') later(false, 220); }}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Body entry={entry} titleId={titleId} descId={descId} />
            <PopoverPrimitive.Arrow className="hh-arrow" width={14} height={7} />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="hh-scrim" />
        <DialogPrimitive.Content className="hh-sheet" dir="rtl">
          <span className="hh-grab" aria-hidden />
          <DialogPrimitive.Title className="hh-title hh-title--sheet">{entry.title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="hh-what">{entry.what}</DialogPrimitive.Description>
          {entry.todo ? (
            <p className="hh-todo">
              <ArrowLeft className="hh-todo-icon" strokeWidth={2} aria-hidden />
              <span>{entry.todo}</span>
            </p>
          ) : null}
          <DialogPrimitive.Close className="hh-ok">הבנתי</DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** A title with its "?" right after it, on one line (used by page headers, sections, tiles). */
export function WithHint({ id, children, tone, className }) {
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-0.5', className)}>
      <span className="min-w-0 truncate">{children}</span>
      <HelpHint id={id} tone={tone} />
    </span>
  );
}
