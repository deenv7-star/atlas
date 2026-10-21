import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { useEnsureGuestToken } from '@/hooks/useGuestToken';
import { todayIsrael } from '@/lib/localDate';

const todayIso = () => todayIsrael();

/**
 * Each guest gets a personal service link (/guest-service?t=<booking guest_token>).
 * The public form is validated server-side by that token (submit_guest_service, migration 013b),
 * so a generic link without a booking can no longer reach a random organization.
 */
export default function GuestServiceLinkCard({ orgId }) {
  const ensureToken = useEnsureGuestToken();
  const [bookingId, setBookingId] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: bookings = [] } = useQuery({
    queryKey: ['guestServiceLinkBookings', orgId],
    queryFn: () => base44.entities.Booking.filter({ org_id: orgId }, 'check_in_date', 200),
    enabled: Boolean(orgId),
    staleTime: 60_000,
  });

  const upcoming = useMemo(() => {
    const t = todayIso();
    return (bookings || [])
      .filter((b) => !b.is_block && !['CANCELLED', 'CANCELED'].includes(String(b.status || '').toUpperCase()))
      .filter((b) => (b.check_out_date || b.check_in_date || '') >= t)
      .slice(0, 50);
  }, [bookings]);

  const copy = async () => {
    const b = upcoming.find((x) => x.id === bookingId);
    if (!b) return;
    setBusy(true);
    try {
      const withToken = await ensureToken(b);
      if (!withToken?.guest_token) {
        atlasToastApi.error('לא הצלחנו ליצור קישור להזמנה הזו');
        return;
      }
      const url = `${window.location.origin}/guest-service?t=${encodeURIComponent(withToken.guest_token)}`;
      await navigator.clipboard?.writeText(url);
      atlasToastApi.success('הקישור האישי הועתק');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="v7-card p-4 shadow-card">
      <h3 className="mb-1 text-[15px] font-bold text-navy-900">קישור אישי לטופס שירות</h3>
      <p className="mb-3 text-[14px] text-ink-600">
        כל הזמנה מקבלת קישור משלה, כך שהבקשה מגיעה אליכם עם שם האורח והיחידה. בחרו הזמנה והעתיקו.
      </p>
      {upcoming.length === 0 ? (
        <p className="text-[14px] text-ink-400">אין כרגע הזמנות קרובות. הקישור יופיע כאן כשתהיה הזמנה.</p>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            aria-label="בחירת הזמנה"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            className="h-11 min-w-0 flex-1 rounded-[10px] border border-line bg-canvas px-3 text-[16px] text-navy-900 sm:text-[14px]"
          >
            <option value="">בחרו הזמנה…</option>
            {upcoming.map((b) => (
              <option key={b.id} value={b.id}>
                {(b.guest_name || 'אורח')} · {b.check_in_date || ''}{b.property_name ? ` · ${b.property_name}` : ''}
              </option>
            ))}
          </select>
          <Button className="h-11" onClick={copy} disabled={!bookingId || busy}>העתקת הקישור</Button>
        </div>
      )}
    </div>
  );
}
