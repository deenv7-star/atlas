/**
 * Start downloading the app shell and the current page's code in parallel with sign-in / auth,
 * instead of after it (the shell used to wait for the profile request, then the page waited for the shell).
 * Nothing here renders anything; it only warms the module cache, so the UI is unchanged.
 */
import { preloadPage } from '@/pages.config';
import { getPageKeyFromPathname } from '@/utils';
import { PUBLIC_PAGE_KEYS } from '@/config/routes';
import { storedSessionUser, isSupabaseConfigured } from '@/api/supabaseClient';

const loadLayout = () => import('@/Layout.jsx').catch(() => null);

/** The screens owners open most; their code is fetched in the background after the app is up. */
const MAIN_PAGES = ['Dashboard', 'Today', 'MultiCalendar', 'Bookings', 'Leads', 'Messages', 'Payments', 'Settings'];

export function hasStoredSession() {
  if (isSupabaseConfigured) return Boolean(storedSessionUser());
  try { return Boolean(localStorage.getItem('atlas_jwt_token') || localStorage.getItem('atlas_current_user')); } catch { return false; }
}

function isAppKey(key) {
  return Boolean(key) && !PUBLIC_PAGE_KEYS.includes(key);
}

/** Shell + the page for `pathname` (or a page key). Safe to call many times. */
export function preloadAppShell(pathnameOrKey = '/dashboard') {
  const key = pathnameOrKey.startsWith('/') ? getPageKeyFromPathname(pathnameOrKey) : pathnameOrKey;
  loadLayout();
  if (isAppKey(key)) preloadPage(key);
}

/** At boot: a returning signed-in owner opening an app route gets its code requested immediately. */
export function preloadForInitialRoute() {
  if (typeof window === 'undefined') return;
  const key = getPageKeyFromPathname(window.location.pathname);
  if (!isAppKey(key) || !hasStoredSession()) return;
  preloadAppShell(key);
}

const idle = (cb, timeout = 2000) =>
  (typeof window !== 'undefined' && 'requestIdleCallback' in window)
    ? window.requestIdleCallback(cb, { timeout })
    : setTimeout(cb, 300);

let mainPrefetched = false;
/** After the first screen is up: fetch the other main screens' code one by one, when the browser is idle. */
export function prefetchMainPagesWhenIdle(delayMs = 2500) {
  if (mainPrefetched || typeof window === 'undefined') return;
  if (navigator.connection?.saveData) return;
  mainPrefetched = true;
  setTimeout(() => {
    const queue = [...MAIN_PAGES];
    const next = () => {
      const key = queue.shift();
      if (!key) return;
      Promise.resolve(preloadPage(key)).finally(() => idle(next));
    };
    idle(next);
  }, delayMs);
}
