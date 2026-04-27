import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import BookingDetails from '@/components/bookings/BookingDetails';
import { ErrorFallback } from '@/components/common/ErrorFallback';
import { SkeletonBookingDetailSheet } from '@/components/skeletons/atlas-skeletons';

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
      <div className="flex justify-end w-full min-h-[40vh]">
        <SkeletonBookingDetailSheet />
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
      <div className="p-6 text-center text-gray-500">
        הזמנה לא נמצאה
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