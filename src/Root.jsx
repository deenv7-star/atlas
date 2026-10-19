import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { RootTree, PublicFallback, isLeanUrl } from '@/RootTree';

export { isLeanUrl, LEAN_PATHS } from '@/RootTree';

/**
 * Top of the tree: the Router, scroll reset and SEO tags, then either a "lean" public page or the full app.
 *
 * Performance (qa/landing-perf/report.md): the landing ("/") and /pricing need no auth, no Supabase,
 * no React Query and no toasters. Rendering them through the full app made every phone download and run
 * ~160 KB (gzip) of app code before the hero could paint (Lighthouse mobile 57-61). So these two URLs
 * render only their page, and every other URL renders the full app (src/App.jsx), unchanged.
 *
 * Both lean pages are also prerendered to static HTML at build time (scripts/prerender.mjs renders
 * <RootTree> (src/RootTree.jsx) through src/site/entry-server.jsx) and hydrated by main.jsx, so the server HTML is
 * on screen (and readable without JS) before any of this runs.
 *
 * A first URL carrying a Supabase auth result ("/#access_token=…", "?code=…") goes through the full app,
 * exactly as before, so the session in the URL is still picked up (see isLeanUrl).
 */
export const loadFullApp = () => import('@/App.jsx');
export const loadLanding = () => import('@/pages/Landing');
export const loadPricing = () => import('@/pages/PricingPlans');

const Landing = lazy(loadLanding);
const Pricing = lazy(loadPricing);
const FullApp = lazy(loadFullApp);
const PAGES = { Landing, Pricing };

/** Once the full app has mounted (the visitor went to /register, /login, …) it also serves "/" and /pricing
 *  from then on, as before this split, so its auth state is never torn down by a visit to the landing. */
function FullAppMounted({ onMount, children }) {
  useEffect(() => { onMount(); }, [onMount]);
  return children;
}

/** Warm the full app's code when the visitor heads for a link that needs it (/register, /login, …): pointer
 *  over it, a touch or focus on it. Never at load, so the landing's own start-up stays small. */
function useWarmFullApp(lean) {
  useEffect(() => {
    if (!lean) return undefined;
    const evs = ['pointerover', 'touchstart', 'focusin'];
    const off = () => evs.forEach((e) => window.removeEventListener(e, onIntent, true));
    function onIntent(e) {
      const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      let u;
      try { u = new URL(a.href, window.location.href); } catch { return; }
      if (u.origin !== window.location.origin || isLeanUrl(u)) return;
      off();
      loadFullApp().catch(() => {});
    }
    evs.forEach((e) => window.addEventListener(e, onIntent, { capture: true, passive: true }));
    return off;
  }, [lean]);
}

export default function Root({ lean: leanAtBoot = true }) {
  const [lean, setLean] = useState(leanAtBoot);
  const [onFullMount] = useState(() => () => setLean(false));
  useWarmFullApp(lean);
  const full = <Suspense fallback={<PublicFallback />}><FullAppMounted onMount={onFullMount}><FullApp /></FullAppMounted></Suspense>;
  return (
    <BrowserRouter>
      <RootTree lean={lean} pages={PAGES} full={full} />
    </BrowserRouter>
  );
}
