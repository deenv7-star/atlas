import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import BookingDetails from '@/components/bookings/BookingDetails';
import { Skeleton } from '@/components/ui/skeleton';

export default function BookingDetail({ orgId }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const bookings = await base44.entities.Booking.filter({ id });
      return bookings[0];
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
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
        onClose={() => navigate('/bookings')}
        orgId={orgId}
      />
    </motion.div>
  );
}