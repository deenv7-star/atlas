/**
 * Today · variation B "מספרים קודם": the tiles lead. Setup is a slim strip under the greeting with a 1/3 ring,
 * the next step in words and one action; channels sit one tap away on the same line.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { StepRing } from './shared';
import './var-b.css';

export const HOME_VAR = 'b';
export const HIDE_PHOTO = false;

export default function HomeTop({ noBookings, onAdd }) {
  if (!noBookings) return null;
  return (
    <section className="hvb-strip" aria-labelledby="hvb-h">
      <StepRing size={44} />
      <div className="hvb-t">
        <h2 id="hvb-h">הצעד הבא: הזמנה ראשונה</h2>
        <Link to={createPageUrl('Integrations')} className="hvb-link">או חברו את Booking ואת Airbnb</Link>
      </div>
      <button type="button" className="hvb-add press" onClick={onAdd} aria-label="הוספת הזמנה"><Plus strokeWidth={2.2} aria-hidden /><span>הוספה</span></button>
    </section>
  );
}
