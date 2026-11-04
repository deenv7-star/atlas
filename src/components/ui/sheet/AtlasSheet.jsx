/**
 * AtlasSheet: the one sheet every form and dialog in the app opens in.
 * Canvas (#F7F8FB) surface; fields sit in white SheetGroup cards. Phone (<640px): bottom sheet with a grab
 * handle, header (title, one quiet line, X), a scrolling body and a sticky footer with ONE primary button.
 * Tablet/desktop (640px+): the same content as a centred dialog, max 480px wide (560 for size="lg").
 * Keyboard-aware on iPhone (never hides the focused field or the button), safe-area aware, RTL.
 *
 * <AtlasSheet open onOpenChange title="הזמנה חדשה" subtitle="שם, תאריכים וערוץ.">
 *   ...fields
 *   <SheetFooter><SheetSubmit .../></SheetFooter>
 * </AtlasSheet>
 */
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKeyboardInset, useScrollFocusedIntoView } from '@/hooks/useKeyboardInset';

function usePhone() {
  const q = '(max-width: 639px)';
  const get = () => typeof window !== 'undefined' && window.matchMedia(q).matches;
  const [m, setM] = React.useState(get);
  React.useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return m;
}

const spring = { type: 'spring', stiffness: 460, damping: 42, mass: 0.9 };
const exit = { duration: 0.18, ease: [0.32, 0.72, 0, 1] };

export function AtlasSheet({
  open,
  onOpenChange,
  title,
  subtitle = null,
  children,
  size = 'md',
  className,
  bodyClassName,
  hideClose = false,
  ...rest
}) {
  const phone = usePhone();
  const reduce = useReducedMotion();
  const { inset, viewport } = useKeyboardInset(open && phone);
  const bodyRef = React.useRef(null);
  useScrollFocusedIntoView(bodyRef, open);
  const [state, setState] = React.useState('open');
  const nodeRef = React.useRef(null);
  React.useLayoutEffect(() => {
    const node = nodeRef.current;
    if (!node) return undefined;
    const sync = () => setState(node.getAttribute('data-state') || 'closed');
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(node, { attributes: true, attributeFilter: ['data-state'] });
    return () => mo.disconnect();
  });
  // Above the keyboard: lift the sheet and cap its height to what is visible.
  const phoneStyle = phone
    ? { bottom: inset, maxHeight: inset && viewport ? `${Math.max(320, viewport - 12)}px` : undefined }
    : undefined;
  const shown = state === 'open';

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#1B2656]/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:duration-200 data-[state=closed]:duration-150" />
        <DialogPrimitive.Content
          asChild
          dir="rtl"
          // No auto keyboard on phones: the sheet opens calm, the owner taps the first field.
          onOpenAutoFocus={(e) => { if (phone) { e.preventDefault(); nodeRef.current?.focus({ preventScroll: true }); } }}
          {...(subtitle ? {} : { 'aria-describedby': undefined })}
          {...rest}
        >
          <motion.div
            ref={nodeRef}
            tabIndex={-1}
            data-atlas-sheet=""
            className={cn(
              'atlas-sheet fixed z-50 flex flex-col overflow-hidden bg-[#F7F8FB] text-[#1B2656] outline-none',
              'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[28px] shadow-[0_-12px_48px_-12px_rgba(27,38,86,0.28)]',
              'sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[88dvh] sm:w-[calc(100vw-2rem)] sm:rounded-[24px] sm:shadow-[0_24px_64px_-16px_rgba(27,38,86,0.32)]',
              size === 'lg' ? 'sm:max-w-[560px]' : size === 'sm' ? 'sm:max-w-[400px]' : 'sm:max-w-[480px]',
              className,
            )}
            style={phone ? phoneStyle : { x: '-50%', y: '-50%' }}
            initial={phone ? { y: reduce ? 0 : '100%', opacity: reduce ? 0 : 1 } : { opacity: 0, scale: reduce ? 1 : 0.97, x: '-50%', y: '-50%' }}
            animate={phone
              ? (shown ? { y: 0, opacity: 1 } : { y: reduce ? 0 : '100%', opacity: reduce ? 0 : 1 })
              : (shown ? { opacity: 1, scale: 1, x: '-50%', y: '-50%' } : { opacity: 0, scale: reduce ? 1 : 0.97, x: '-50%', y: '-50%' })}
            transition={shown ? (reduce ? { duration: 0.15 } : spring) : exit}
          >
            <div aria-hidden className="flex shrink-0 justify-center pt-2.5 sm:hidden">
              <span className="h-[5px] w-9 rounded-full bg-[#1B2656]/15" />
            </div>
            <header className="flex shrink-0 items-start gap-3 ps-5 pe-3 pt-3 sm:ps-6 sm:pt-5">
              <div className="min-w-0 flex-1 pt-1.5">
                <DialogPrimitive.Title className="text-[22px] font-bold leading-tight tracking-[-0.01em] text-[#1B2656]">
                  {title}
                </DialogPrimitive.Title>
                {subtitle ? (
                  <DialogPrimitive.Description className="mt-1 text-[15px] leading-snug text-[#1B2656]/70">
                    {subtitle}
                  </DialogPrimitive.Description>
                ) : null}
              </div>
              {hideClose ? null : (
                <DialogPrimitive.Close
                  className="press inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#1B2656]/70 shadow-[0_1px_2px_rgba(27,38,86,0.08)] transition-colors hover:text-[#1B2656] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3E2BF1]"
                >
                  <X className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                  <span className="sr-only">סגירה</span>
                </DialogPrimitive.Close>
              )}
            </header>
            <div
              ref={bodyRef}
              data-sheet-body=""
              className={cn(
                'flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain px-5 pt-5 sm:px-6',
                'pb-[calc(20px+env(safe-area-inset-bottom))]',
                bodyClassName,
              )}
            >
              {children}
            </div>
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default AtlasSheet;
