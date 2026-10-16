/** Makes sure a booking has a private guest_token before its guest link is shared. */
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { makeToken } from '@/lib/stay/guestInfo';
import { STAY_KEYS } from '@/hooks/useStayData';

export function useEnsureGuestToken() {
  const qc = useQueryClient();
  return useCallback(async (booking) => {
    if (!booking?.id || booking.guest_token) return booking;
    const guest_token = makeToken();
    try {
      const updated = await base44.entities.Booking.update(booking.id, { guest_token });
      qc.invalidateQueries({ queryKey: STAY_KEYS.bookings });
      return { ...booking, ...updated, guest_token };
    } catch {
      // Column missing until migration 008 is applied: keep working without a link token.
      return booking;
    }
  }, [qc]);
}
