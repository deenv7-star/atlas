/**
 * /import · ייבוא מתחם (import v1). The owner pastes a Booking.com / Airbnb / own-site link; atlas reads it
 * (edge function property-import), shows what it found, and asks ONLY what is missing. Full screen, no app chrome.
 * Entry points: Today when no unit exists ("עוד לא חיברתם מתחם") and Settings → העסק.
 * Version A (this branch): a conversation, one message at a time.
 */
import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import ImportA from '@/components/import/a/ImportA';

export default function ImportComplex() {
  const { user } = useAuth();
  return <ImportA user={user} />;
}
