/**
 * Today's background photo (04.11.2026, Deen's pick): soft green hills under a bright sky behind frosted-white
 * cards on Today only; every other screen is the calm canvas (y-bg.css). The photo mounts the first time Today
 * is shown (never on other screens), preloads there, and crossfades in/out on the shell's data-page; reduced
 * motion = instant. <picture>: AVIF → WebP → JPEG, phone and desktop crops. Photo: Spencer DeMera, Unsplash
 * License (public/app-bg/CREDITS.md).
 */
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export const TODAY_PAGES = new Set(['Dashboard', 'Today']);
const SRC = '/app-bg/today-hills';
const DESK = '(min-width: 768px)';

function preloadOnce() {
  if (typeof document === 'undefined' || document.getElementById('atlas-today-bg-preload-m')) return;
  [['m', `(max-width: 767px)`], ['d', DESK]].forEach(([k, media]) => {
    const l = document.createElement('link');
    l.id = `atlas-today-bg-preload-${k}`; l.rel = 'preload'; l.as = 'image'; l.type = 'image/avif';
    l.href = `${SRC}-${k}.avif`; l.media = media; l.setAttribute('fetchpriority', 'high');
    document.head.appendChild(l);
  });
}

export default function TodayBackdrop({ on }) {
  const [mounted, setMounted] = useState(on);
  const [ready, setReady] = useState(false);
  const [host, setHost] = useState(null);
  useEffect(() => { setHost(document.querySelector('.y2-shell')); }, []);
  useEffect(() => { if (on) { preloadOnce(); setMounted(true); } }, [on]);
  if (!mounted || !host) return null;
  return createPortal(
    <div className={cn('y2-bgphoto', on && ready && 'is-on')} aria-hidden="true">
      <picture>
        <source type="image/avif" media={DESK} srcSet={`${SRC}-d.avif`} />
        <source type="image/avif" srcSet={`${SRC}-m.avif`} />
        <source type="image/webp" media={DESK} srcSet={`${SRC}-d.webp`} />
        <source type="image/webp" srcSet={`${SRC}-m.webp`} />
        <source media={DESK} srcSet={`${SRC}-d.jpg`} />
        <img src={`${SRC}-m.jpg`} alt="" decoding="async" fetchPriority="high" draggable={false}
          ref={(img) => { if (img && img.complete && img.naturalWidth) setReady(true); }} onLoad={() => setReady(true)} />
      </picture>
    </div>,
    host,
  );
}
