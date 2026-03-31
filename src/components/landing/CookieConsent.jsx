import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'atlas_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Small delay so it doesn't flash on first render
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-label="הסכמה לעוגיות"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        left: 24,
        zIndex: 9999,
        maxWidth: 480,
        margin: '0 auto',
        background: '#111827',
        color: 'white',
        borderRadius: 14,
        padding: '20px 24px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        animation: 'cookieFadeUp 0.4s ease',
      }}
    >
      <style>{`
        @keyframes cookieFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>🍪</span>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 6 }}>
            אנחנו משתמשים בעוגיות
          </p>
          <p style={{ margin: 0, fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>
            ATLAS משתמשת בעוגיות כדי לשפר את חוויית הגלישה שלך, לנתח תנועה, ולהתאים תוכן.
            המידע מעובד בהתאם ל-
            <Link to="/privacy" style={{ color: '#A78BFA', textDecoration: 'underline' }}>מדיניות הפרטיות</Link>
            {' '}שלנו ועמידה מלאה ב-GDPR.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button
          onClick={decline}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#9CA3AF',
            borderRadius: 8,
            padding: '10px 18px',
            minHeight: 44,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'Heebo, sans-serif',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#9CA3AF'; }}
        >
          דחה
        </button>
        <button
          onClick={accept}
          style={{
            background: '#4F46E5',
            border: 'none',
            color: 'white',
            borderRadius: 8,
            padding: '10px 22px',
            minHeight: 44,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'Heebo, sans-serif',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#4338CA'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#4F46E5'; }}
        >
          אני מסכים/ה
        </button>
      </div>
    </div>
  );
}
