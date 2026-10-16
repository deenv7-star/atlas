import React from 'react';
import { CROPS, CROPS_MOBILE } from './content';

const CHANNELS = [
  { key: 'booking', label: 'Booking.com', cls: 'ch-booking' },
  { key: 'airbnb', label: 'Airbnb', cls: 'ch-airbnb' },
  { key: 'direct', label: 'הזמנה ישירה', cls: 'ch-direct' },
];

/** Three channels flowing into one ATLAS calendar (real calendar crop). */
export default function SyncDiagram({ className = '' }) {
  const c = CROPS.calendar;
  return (
    <figure className={`sync ${className}`}>
      <ul className="sync-chips" aria-label="ערוצים שמסתנכרנים">
        {CHANNELS.map((ch) => (
          <li key={ch.key} className={`sync-chip ${ch.cls}`}>
            <i aria-hidden="true" />
            {ch.label}
          </li>
        ))}
      </ul>
      <svg className="sync-lines" viewBox="0 0 600 90" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M100 0 C100 50, 300 40, 300 90" />
        <path d="M300 0 L300 90" />
        <path d="M500 0 C500 50, 300 40, 300 90" />
      </svg>
      <div className="sync-cal">
        <picture>
          <source media="(max-width: 559px)" srcSet={CROPS_MOBILE.calendarSync.src} width={780} height={720} />
          <img src={c.src} width={c.w} height={c.h} alt={c.alt} loading="lazy" decoding="async" />
        </picture>
      </div>
      <figcaption className="sr-only">הזמנות מ-Booking.com, מ-Airbnb ומהזמנות ישירות נכנסות ללוח השנה של ATLAS</figcaption>
    </figure>
  );
}
