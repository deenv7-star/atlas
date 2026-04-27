import type { QueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  findBookingInSnapshot,
  removeBookingFromAllBookingQueries,
  restoreBookingQueriesSnapshot,
  snapshotBookingQueries,
} from '@/lib/optimistic/bookingCache';
import { getErrorHttpStatus, getErrorMessage } from '@/lib/optimistic/httpError';
import { openOptimisticConflictModal } from '@/lib/optimistic/conflictModalState';
import { setOptimisticEntityPhase } from '@/lib/optimistic/entityVisualState';
import { atlasToastApi } from './atlasToastApi';

const BOOKINGS_KEY = 'bookings';

/**
 * Optimistic removal + single queued undo toast; server DELETE runs after 5s unless the user taps בטל (restores cache).
 */
export function deleteBookingWithUndo(qc: QueryClient, bookingId: string): void {
  void qc.cancelQueries({ queryKey: [BOOKINGS_KEY] });
  const previousBookings = snapshotBookingQueries(qc);
  const removed = findBookingInSnapshot(previousBookings, bookingId);
  removeBookingFromAllBookingQueries(qc, bookingId);
  setOptimisticEntityPhase(bookingId, 'pending');

  const restore = (): void => {
    restoreBookingQueriesSnapshot(qc, previousBookings);
    setOptimisticEntityPhase(bookingId, 'idle');
    void qc.invalidateQueries({ queryKey: [BOOKINGS_KEY] });
  };

  const message = removed
    ? `ההזמנה של ${removed.guest_name || 'אורח'} נמחקה מהתצוגה.`
    : 'ההזמנה נמחקה מהתצוגה.';

  atlasToastApi.undo(message, restore, async () => {
    try {
      await base44.entities.Booking.delete(bookingId);
      setOptimisticEntityPhase(bookingId, 'idle');
      void qc.invalidateQueries({ queryKey: [BOOKINGS_KEY] });
    } catch (err) {
      restore();
      const status = getErrorHttpStatus(err);
      if (status === 409) {
        openOptimisticConflictModal({
          message: getErrorMessage(err) || 'לא ניתן למחוק את ההזמנה.',
        });
        return;
      }
      atlasToastApi.error('המחיקה נכשלה', getErrorMessage(err) || undefined);
      setOptimisticEntityPhase(bookingId, 'rollback');
    }
  });
}
