import { useLayoutEffect, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SPA: reset window scroll on route change so footer (or deep scroll) does not carry over.
 * Hash-only navigation scrolls to the target id on the same pathname.
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search]);

  useEffect(() => {
    if (!hash || hash.length <= 1) return;
    const id = decodeURIComponent(hash.slice(1));
    if (!id) return;
    const raf = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(raf);
  }, [hash, pathname]);

  return null;
}
