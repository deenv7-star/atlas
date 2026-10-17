/**
 * Landing v6 shared bits (brand/direction-v5.md, v6 section): header that sits over a full-bleed
 * hero and turns solid on scroll, scroll-progress hooks, and the toast/summary cards the stories use.
 * Pricing, FAQ, steps and footer are reused from v5 so copy and prices stay in one place.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Mark, Wordmark } from '../v5/ui';
import { prefersReducedMotion } from '../v5/motion';

export function V6Header({ tone = 'photo' }) {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header className={`l6-hdr${solid ? ' is-solid' : ''}${tone === 'light' ? ' is-light' : ''}`}>
      <div className="l5-wrap l6-hdr-in">
        <Link to="/" className="l5-logo" aria-label="ATLAS, לדף הבית"><Wordmark /></Link>
        <nav className="l6-nav" aria-label="ניווט ראשי">
          <a href={tone === 'light' ? '#fly' : '#story'}>המוצר</a>
          <a href="#how">איך מתחילים</a>
          <a href="#pricing">מחירים</a>
          <a href="#faq">שאלות</a>
        </nav>
        <div className="l6-hdr-end">
          <Link to="/login" className="l6-login">כניסה</Link>
          <Link to="/register" className="l6-hdr-cta">להתחיל חינם</Link>
        </div>
      </div>
    </header>
  );
}

/**
 * Progress (0..1) of an element scrolling through the viewport, written straight to a CSS
 * variable (--p) on the element with rAF, so React never re-renders on scroll.
 * mode 'through': 0 when the top hits the viewport bottom, 1 when the bottom leaves the top.
 * mode 'sticky': 0 when the top reaches the viewport top, 1 when the bottom reaches the viewport bottom.
 */
export function useScrollVar(ref, { mode = 'through', onProgress } = {}) {
  const cb = useRef(onProgress);
  cb.current = onProgress;
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (prefersReducedMotion()) {
      el.style.setProperty('--p', '1');
      cb.current?.(1);
      return undefined;
    }
    let raf = 0;
    const calc = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      let p;
      if (mode === 'sticky') p = -r.top / Math.max(1, r.height - vh);
      else p = (vh - r.top) / (vh + r.height);
      p = Math.min(1, Math.max(0, p));
      el.style.setProperty('--p', p.toFixed(4));
      cb.current?.(p);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(calc); };
    calc();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, [ref, mode]);
}

export function Toast({ ch = 'booking', title, sub, className = '', style }) {
  return (
    <div className={`l6-toast ${className}`} style={style}>
      <Mark ch={ch} size={20} />
      <span><b>{title}</b><small>{sub}</small></span>
    </div>
  );
}

export function PaidToast({ amount = '₪750', who = 'נועה לוי · מקדמה 30%', className = '', style }) {
  return (
    <div className={`l6-toast is-paid ${className}`} style={style}>
      <span className="l6-paid-ic"><Check size={14} strokeWidth={3} /></span>
      <span><b>התקבל תשלום <span className="num" dir="ltr">{amount}</span></b><small>{who}</small></span>
    </div>
  );
}

/** "Tomorrow is ready" evening summary. Example data. */
export function EveningCard({ className = '' }) {
  const rows = [
    ['2 כניסות מחר', 'הודעות הגעה מתוזמנות ל-18:00'],
    ['ניקיון שובץ', 'סוויטת האלון · 12:00'],
    ['יתרה אחת פתוחה', 'תזכורת תצא בבוקר'],
  ];
  return (
    <div className={`l5-card l6-eve ${className}`}>
      <div className="l6-eve-top">
        <span className="l6-eve-dot" />
        <b>הכל מוכן למחר</b>
        <span className="l5-meta">21:30</span>
      </div>
      <ul>
        {rows.map(([t, s]) => (
          <li key={t}><Check size={16} strokeWidth={2.5} /><span><b>{t}</b><small>{s}</small></span></li>
        ))}
      </ul>
      <div className="l6-eve-sum"><span className="l5-meta">נכנס היום</span><b className="num" dir="ltr">₪3,890</b></div>
    </div>
  );
}
