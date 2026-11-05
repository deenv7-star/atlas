/** Brand marks, used only to name the channel (Airbnb: Simple Icons CC0 path; Booking.com: its "B." mark in type). */
import React from 'react';
import { CalendarDays } from 'lucide-react';
import { AIRBNB } from '@/components/landing/v5/brandPaths';

export default function ChannelLogo({ channel, size = 40, className = '' }) {
  if (channel === 'AIRBNB') {
    return (
      <span className={`ch-logo ${className}`} style={{ width: size, height: size }} aria-hidden>
        <svg viewBox="0 0 24 24" width={size * 0.72} height={size * 0.72}><path d={AIRBNB} fill="#FF385C" /></svg>
      </span>
    );
  }
  if (channel === 'BOOKING_COM') {
    return (
      <span className={`ch-logo is-booking ${className}`} style={{ width: size, height: size, fontSize: size * 0.56 }} aria-hidden dir="ltr">
        B<i>.</i>
      </span>
    );
  }
  return (
    <span className={`ch-logo is-other ${className}`} style={{ width: size, height: size }} aria-hidden>
      <CalendarDays width={size * 0.55} height={size * 0.55} strokeWidth={1.75} />
    </span>
  );
}
