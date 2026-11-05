/**
 * Today's background photo (04.11.2026, Deen's pick): soft green hills under a bright sky behind frosted-white
 * cards on Today only; every other screen is the calm canvas (y-bg.css). The photo mounts the first time Today
 * is shown (never on other screens), once the main thread is idle, at low priority (the hero photo is Today's LCP), and crossfades in/out on the shell's data-page; reduced
 * motion = instant. <picture>: AVIF → WebP → JPEG, phone and desktop crops. Photo: Spencer DeMera, Unsplash
 * License (public/app-bg/CREDITS.md).
 */
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export const TODAY_PAGES = new Set(['Dashboard', 'Today']);
/** 05.11.2026 "one continuous story": the Today photo continues behind every screen. 'dim' = photo at low opacity under the
 *  canvas; 'glass' = full photo behind a milky veil with frosted cards (y-bg-story.css); 'off' = Today only (as before). */
export const APP_BG = ['dim', 'glass', 'off'].includes(import.meta.env.VITE_APP_BG) ? import.meta.env.VITE_APP_BG : 'glass';
const SRC = '/app-bg/today-hills';
const DESK = '(min-width: 768px)';

function preloadOnce() {
  if (typeof document === 'undefined' || document.getElementById('atlas-today-bg-preload-m')) return;
  [['m', `(max-width: 767px)`], ['d', DESK]].forEach(([k, media]) => {
    const l = document.createElement('link');
    l.id = `atlas-today-bg-preload-${k}`; l.rel = 'preload'; l.as = 'image'; l.type = 'image/avif';
    l.href = `${SRC}-${k}.avif`; l.media = media; l.setAttribute('fetchpriority', 'low'); // decorative: never compete with Today's hero photo (the LCP)
    document.head.appendChild(l);
  });
}

export default function TodayBackdrop({ on }) {
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [host, setHost] = useState(null);
  useEffect(() => { setHost(document.querySelector('.y2-shell')); }, []);
  useEffect(() => {
    if (!on || mounted) return undefined;
    // after first paint, when the main thread is idle: the photo is decoration and must stay out of Today's LCP window
    const go = () => { preloadOnce(); setMounted(true); };
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(go, { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    // Safari (iOS app WebView) has no requestIdleCallback: wait for the page's load event, then a beat
    let t;
    const later = () => { t = window.setTimeout(go, 250); };
    if (document.readyState === 'complete') later(); else window.addEventListener('load', later, { once: true });
    return () => { window.removeEventListener('load', later); window.clearTimeout(t); };
  }, [on, mounted]);
  if (!mounted || !host) return null;
  return createPortal(
    <div className={cn('y2-bgphoto', on && ready && 'is-on')} aria-hidden="true">
      <picture>
        <source type="image/avif" media={DESK} srcSet={`${SRC}-d.avif`} />
        <source type="image/avif" srcSet={`${SRC}-m.avif`} />
        <source type="image/webp" media={DESK} srcSet={`${SRC}-d.webp`} />
        <source type="image/webp" srcSet={`${SRC}-m.webp`} />
        <source media={DESK} srcSet={`${SRC}-d.jpg`} />
        <img src={`${SRC}-m.jpg`} alt="" decoding="async" fetchPriority="low" draggable={false}
          ref={(img) => { if (img && img.complete && img.naturalWidth) setReady(true); }} onLoad={() => setReady(true)} />
      </picture>
    </div>,
    host,
  );
}
