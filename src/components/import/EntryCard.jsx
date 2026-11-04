/**
 * ייבוא מתחם: the way in. Today (when no unit exists yet) and Settings (any time) show the same card.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import './import.css';

export const IMPORT_COPY = {
  today: { title: 'עוד לא חיברתם מתחם', line: 'הדביקו קישור מ-Booking, מ-Airbnb או מהאתר. והשאר יתמלא לבד.', cta: 'ייבוא המתחם' },
  settings: { title: 'ייבוא פרטי המתחם מקישור', line: 'תמונות, יחידות, שעות וכללים מהמודעה שלכם, בלי להקליד.', cta: 'ייבוא מקישור' },
};

export default function ImportEntryCard({ where = 'today', className = '' }) {
  const c = IMPORT_COPY[where] || IMPORT_COPY.today;
  return (
    <Link to="/import" className={`im-entry im-press ${className}`} dir="rtl" data-testid={`import-entry-${where}`}>
      <span className="im-entry-ic" aria-hidden><Sparkles strokeWidth={1.75} /></span>
      <span className="im-entry-tx"><b>{c.title}</b><span>{c.line}</span></span>
      <span className="im-entry-go" aria-hidden>{c.cta}</span>
    </Link>
  );
}
