import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'atlas_cookie_consent';

export function readChoice() {
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
export default function CookieConsent({ revealAfter = null, variant = 'card' }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (readChoice()) return undefined;
    // revealAfter: CSS selector (e.g. the hero). The bar appears only once that
    // element has been scrolled fully out of view, so it can never cover it.
    if (revealAfter) {
      const el = document.querySelector(revealAfter);
      if (el) {
        const check = () => {
          if (el.getBoundingClientRect().bottom <= 0) {
            setVisible(true);
            window.removeEventListener('scroll', check);
          }
        };
        window.addEventListener('scroll', check, { passive: true });
        check();
        return () => window.removeEventListener('scroll', check);
      }
    }
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
  }, [revealAfter]);

  const choose = (value) => {
    try { localStorage.setItem(STORAGE_KEY, value); } catch { /* storage blocked: just hide */ }
    setVisible(false);
    // The landing's sticky sign-up bar waits for this, so only one bar is ever at the bottom.
    try { window.dispatchEvent(new CustomEvent('atlas:cookie-choice', { detail: value })); } catch { /* old browser */ }
  };

  if (!visible) return null;

  return (
    <div className={`lp-cookie${variant === 'row' ? ' is-row' : ''}`} dir="rtl" role="region" aria-label="הסכמה לעוגיות">
      {variant === 'row' ? (
        <p>עוגיות לשיפור האתר. <Link to="/cookies">מדיניות</Link></p>
      ) : (
        <p>
          אנחנו משתמשים בעוגיות כדי שהאתר יעבוד טוב יותר.{' '}
          <Link to="/cookies">מדיניות העוגיות</Link>
        </p>
      )}
      <div className="lp-cookie-actions">
        <button type="button" className="no" onClick={() => choose('declined')}>לא תודה</button>
        <button type="button" className="ok" onClick={() => choose('accepted')}>אישור</button>
      </div>
    </div>
  );
}
