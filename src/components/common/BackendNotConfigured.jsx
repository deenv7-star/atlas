import React from 'react';

export default function BackendNotConfigured() {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Heebo', sans-serif",
        background: '#F4F6FB',
        textAlign: 'center',
        maxWidth: 560,
        margin: '0 auto'
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0B1220', marginBottom: 12 }}>
        נדרשת הגדרת שרת
      </h1>
      <p style={{ color: '#6B7280', lineHeight: 1.7, marginBottom: 16 }}>
        בפרודקשן חובה להגדיר <code style={{ background: '#E5E7EB', padding: '2px 6px', borderRadius: 4 }}>VITE_SUPABASE_URL</code>
        {' + '}
        <code style={{ background: '#E5E7EB', padding: '2px 6px', borderRadius: 4 }}>VITE_SUPABASE_ANON_KEY</code>
        {' או '}
        <code style={{ background: '#E5E7EB', padding: '2px 6px', borderRadius: 4 }}>VITE_API_URL</code>
        {' (כתובת ה-API) — כדי שלא יישמרו נתוני לקוחות בדפדפן בלבד.'}
      </p>
      <p style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 24 }}>
        לפיתוח מקומי בלבד אפשר להגדיר <code style={{ background: '#FEF3C7', padding: '2px 6px', borderRadius: 4 }}>VITE_ALLOW_LOCAL_DEMO=true</code>
      </p>
      <a
        href="/"
        style={{
          padding: '12px 24px',
          background: '#00D1C1',
          color: '#0B1220',
          borderRadius: 8,
          fontWeight: 600,
          textDecoration: 'none'
        }}
      >
        חזרה לדף הבית
      </a>
    </div>
  );
}
