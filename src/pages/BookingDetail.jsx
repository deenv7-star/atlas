import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import BookingDetails from '@/components/bookings/BookingDetails';
import { ErrorFallback } from '@/components/common/ErrorFallback';
import { SkelLine } from '@/components/ds';

export default function BookingDetail({ orgId }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: booking, isLoading, isError, error } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => base44.entities.Booking.get(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[880px] px-4 pt-6 md:px-8" role="status" aria-busy="true" aria-label="טוען הזמנה">
        <SkelLine className="h-6 w-24" />
        <SkelLine className="mt-4 h-[260px] rounded-[22px]" />
        <div className="mt-4 grid gap-4 md:grid-cols-[1.3fr_1fr]">
          <SkelLine className="h-[220px] rounded-[22px]" />
          <SkelLine className="h-[220px] rounded-[22px]" />
        </div>
      </div>
    );
  }

  if (isError && error?.status !== 404) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <h1 className="sr-only">פרטי הזמנה</h1>
        <ErrorFallback />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-[18px] font-bold text-navy-900">לא מצאנו את ההזמנה</h1>
        <p className="mt-1 text-[16px] text-ink-600">אולי היא נמחקה, או שהקישור ישן.</p>
        <button type="button" onClick={() => navigate(createPageUrl('Bookings'))} className="mt-4 inline-flex min-h-11 items-center rounded-full px-5 text-[15px] font-semibold text-brand-600 hover:bg-brand-50">לכל ההזמנות</button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <BookingDetails 
        booking={booking} 
        onClose={() => navigate(createPageUrl('Bookings'))}
        orgId={orgId}
      />
    </motion.div>
  );
}