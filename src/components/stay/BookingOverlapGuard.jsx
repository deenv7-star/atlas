/**
 * Double-booking guard for the booking form: warns when the dates overlap another
 * booking in the same unit and asks for an explicit "save anyway" before saving.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { findOverlaps, checkOutOf } from '@/lib/stay/bookings';
import { formatRangeHe } from '@/lib/stay/format';
import { STALE_LIVE_MS } from '@/lib/queryStaleTimes';
import '@/styles/atlas-brand.css';

export function useOverlaps({ propertyId, unitId, checkIn, checkOut, excludeId }) {
  const enabled = !!(propertyId || unitId) && !!checkIn;
  const q = useQuery({
    queryKey: ['stay', 'overlap-bookings', propertyId || unitId],
    queryFn: () => base44.entities.Booking.filter(propertyId ? { property_id: propertyId } : { unit_id: unitId }, '-check_in_date', 2000),
    enabled,
    staleTime: STALE_LIVE_MS,
  });
  return useMemo(() => (enabled
    ? findOverlaps(q.data || [], { property_id: propertyId, unit_id: unitId, check_in_date: checkIn, check_out_date: checkOut }, excludeId)
    : []), [enabled, q.data, propertyId, unitId, checkIn, checkOut, excludeId]);
}

/** onBlockingChange(true) while there is an unacknowledged overlap. */
export function BookingOverlapGuard({ propertyId, unitId, checkIn, checkOut, excludeId, onBlockingChange }) {
  const overlaps = useOverlaps({ propertyId, unitId, checkIn, checkOut, excludeId });
  const [ack, setAck] = useState(false);
  const sig = overlaps.map((o) => o.id).join(',');

  useEffect(() => { setAck(false); }, [sig, checkIn, checkOut, propertyId]);
  useEffect(() => { onBlockingChange?.(overlaps.length > 0 && !ack); }, [overlaps.length, ack, onBlockingChange]);
  useEffect(() => () => onBlockingChange?.(false), [onBlockingChange]);

  if (!overlaps.length) return null;
  return (
    <div role="alert" className="col-span-2 rounded-[10px] p-3 ab-enter" style={{ background: '#FDECEC', border: '1px solid #F7C9C9', fontFamily: 'Heebo, system-ui, sans-serif' }}>
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={18} strokeWidth={1.75} className="shrink-0 mt-0.5" style={{ color: '#C93D3D' }} aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold" style={{ color: '#8E2424' }}>
            {overlaps.length === 1 ? 'התאריכים חופפים להזמנה אחרת ביחידה הזו' : `התאריכים חופפים ל-${overlaps.length} הזמנות ביחידה הזו`}
          </p>
          <ul className="mt-1 space-y-0.5 text-[13px]" style={{ color: '#4A5578' }}>
            {overlaps.slice(0, 3).map((o) => (
              <li key={o.id}>
                <a href={`/booking/${o.id}`} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2" style={{ color: '#1B2656' }}>{o.guest_name || 'אורח'}</a>
                {' · '}{formatRangeHe(o.check_in_date, checkOutOf(o))}
              </li>
            ))}
          </ul>
          <label className="mt-2 flex items-center gap-2 text-[13px] font-semibold cursor-pointer select-none" style={{ color: '#1B2656' }}>
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="w-4 h-4 accent-[#3E2BF1]" />
            הבנתי, לשמור בכל זאת
          </label>
        </div>
      </div>
    </div>
  );
}
