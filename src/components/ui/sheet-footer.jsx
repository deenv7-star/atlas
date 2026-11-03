/**
 * StickySheetFooter: the action row of a bottom sheet / dialog that stays visible while the
 * fields scroll (APP-023). On phones it sticks to the bottom of the sheet's scroll area with a
 * white backdrop and the safe-area inset; from `sm` up it is a normal footer row.
 *
 * Usage (inside DialogContent, as the last child of the scrolling content):
 *   <StickySheetFooter>
 *     <Button variant="outline">ביטול</Button>
 *     <Button>שמירת הזמנה</Button>
 *   </StickySheetFooter>
 * A notice that explains a disabled primary button (e.g. an overlap warning) can go in `note`,
 * so it is seen next to the button instead of below the fold.
 */
import React from 'react';
import { cn } from '@/lib/utils';

export function StickySheetFooter({ className, note = null, children, ...rest }) {
  return (
    <div data-sheet-footer="" className={cn('sheet-footer', className)} {...rest}>
      {note ? <div className="sheet-footer-note" role="status">{note}</div> : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-start">{children}</div>
    </div>
  );
}

export default StickySheetFooter;
