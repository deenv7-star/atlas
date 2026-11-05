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
    const main = document.getElementById('atlas-main-scroll');
    if (main) main.scrollTop = 0;
  }, [pathname, search]);

  useEffect(() => {
    if (!hash || hash.length <= 1) return;
    const id = decodeURIComponent(hash.slice(1));
    if (!id) return;
    const raf = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    // deep links into the landing ("/#calendar" from the blog): the hero and lazy images can still change the page
    // height after the first scroll, so land on the target once more when the layout has settled
    const settle = setTimeout(() => {
      const el = document.getElementById(id);
      if (el && Math.abs(el.getBoundingClientRect().top) > 120) el.scrollIntoView({ behavior: 'auto', block: 'start' });
    }, 900);
    return () => { cancelAnimationFrame(raf); clearTimeout(settle); };
  }, [hash, pathname]);

  return null;
}
