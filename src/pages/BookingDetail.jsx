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

  const { data: booking, isLoading, isError } = useQuery({
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

  if (isError) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <ErrorFallback />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-10 text-center text-[16px] text-ink-600">
        לא מצאנו את ההזמנה. אולי היא נמחקה.
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