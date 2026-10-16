import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'atlas_cookie_consent';

function readChoice() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return 'unavailable';
  }
}

/**
 * Compact bottom bar. It never covers the hero CTAs: it appears only after the
 * visitor has scrolled a little (or after a short delay on short pages) and sits
 * at the very bottom edge of the viewport. Styles live in landing.css (.lp-cookie).
 */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (readChoice()) return undefined;
    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      setVisible(true);
      window.removeEventListener('scroll', onScroll);
    };
    const onScroll = () => { if (window.scrollY > 240) show(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    const timer = setTimeout(show, 4000);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const choose = (value) => {
    try { localStorage.setItem(STORAGE_KEY, value); } catch { /* storage blocked: just hide */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="lp-cookie" dir="rtl" role="region" aria-label="הסכמה לעוגיות">
      <p>
        אנחנו משתמשים בעוגיות כדי שהאתר יעבוד טוב יותר.{' '}
        <Link to="/privacy">מדיניות הפרטיות</Link>
      </p>
      <div className="lp-cookie-actions">
        <button type="button" className="no" onClick={() => choose('declined')}>לא תודה</button>
        <button type="button" className="ok" onClick={() => choose('accepted')}>אישור</button>
      </div>
    </div>
  );
}
