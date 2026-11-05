/**
 * Today (05.11.2026): shared pieces for the desktop top card and the phone. The setup steps an account with units but
 * no bookings still has, and the two setup actions.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';

/** units exist (the empty Today only shows when they do), so step 1 is done; the next two are the actions */
export const SETUP_STEPS = [
  { key: 'unit', t: 'הוסיפו יחידה', short: 'יחידה', done: true },
  { key: 'channels', t: 'חברו את Booking או Airbnb', short: 'ערוצים' },
  { key: 'booking', t: 'הוסיפו הזמנה ראשונה', short: 'הזמנה ראשונה' },
];
export const SETUP_DONE = SETUP_STEPS.filter((s) => s.done).length;

export function SetupActions({ onAdd, compact = false }) {
  return (
    <div className={cn('hv-acts', compact && 'is-compact')}>
      <button type="button" className="hv-btn press" onClick={onAdd}><Plus strokeWidth={2} aria-hidden />הוספת הזמנה</button>
      <Link to={createPageUrl('Integrations')} className="hv-btn hv-btn--ghost press">חיבור ערוצים</Link>
    </div>
  );
}
