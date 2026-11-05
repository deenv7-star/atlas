import { lazy, Suspense, useEffect, useState } from 'react';
import { useOptimisticConflictModalState } from '@/lib/optimistic/conflictModalState';
import { preloadForInitialRoute, prefetchDataForInitialRoute } from '@/lib/appPreload';
import { BootDone, hideBoot, isBootShown } from '@/lib/boot';
import { Skeleton } from '@/components/ui/skeleton';
import { AtlasToaster } from '@/components/ui/AtlasToast';
import { QueryClientProvider } from '@tanstack/react-query'
import GlobalErrorBoundary from '@/components/common/GlobalErrorBoundary';
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { Route, Routes, Navigate, useParams, Link, useLocation } from 'react-router-dom';
import { readLockPrefs, lockAtColdStart } from '@/lib/nativeApp/appLockCore';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6';
import BackendNotConfigured from '@/components/common/BackendNotConfigured';
import { isProductionBackendConfigured } from '@/lib/backendConfig';
import { createPageUrl, canonicalPathFor } from '@/utils';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { PUBLIC_PAGE_KEYS, LEGACY_REDIRECTS, getSafeReturnUrl } from '@/config/routes';
// Trial over and not paid (src/lib/access.js): every app route shows the paywall; writes are refused (src/lib/accessLock.js).
import AccessGate, { Paywall, LockedFrame } from '@/components/paywall/AccessGate';
import { AccessSync } from '@/hooks/useAccess';
import OfflineBanner from '@/components/common/OfflineBanner';
import { isNativeApp } from '@/lib/nativePlatform';
// Stored session, network down on the first load: offline screen with retry (audit 04.11), never /login.
// Static import: when the network is down a lazy chunk may not load either.
import OfflineAuthScreen from '@/components/common/OfflineAuthScreen';
import AppFallback from '@/components/common/AppFallback';
// Code-split: the landing page should not download the app shell or the auth screens.
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const UpdatePassword = lazy(() => import('@/pages/UpdatePassword'));
// Google / Apple sign-in lands here (Supabase redirectTo). Not behind the signed-in redirects: the session appears on this page.
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
// iOS app only: Face ID Keychain sync + the one-time "next time with Face ID?" sheet.
const NativeAuthHost = lazy(() => import('@/components/auth/NativeAuthHost'));
const AppLockHost = lazy(() => import('@/components/nativeApp/AppLockHost.jsx'));
const NotifyHost = lazy(() => import('@/components/nativeApp/NotifyHost.jsx'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const SetupPage = lazy(() => import('@/pages/Setup'));
const ImportComplexPage = lazy(() => import('@/pages/ImportComplex'));
const AppLayout = lazy(() => import('./Layout.jsx'));
// Platform admin console (/admin): its own shell, gated by the database (migration 011).
const AdminRoot = lazy(() => import('@/admin/AdminRoot'));
const AccountSuspended = lazy(() => import('@/components/common/AccountSuspended'));

const GuestStayPage = lazy(() => import('@/pages/GuestStay'));
const BookDirectPage = lazy(() => import('@/pages/BookDirect'));
const MonthlyReportPrintPage = lazy(() => import('@/pages/MonthlyReportPrint'));
// Public site (blog + legal + trust pages). Prerendered to static HTML at build (scripts/prerender.mjs).
const SitePage = lazy(() => import('@/site/SitePage'));
const SiteNotFound = lazy(() => import('@/site/SitePage').then((m) => ({ default: m.SiteNotFound })));

function PublicFallback() {
  return <div className="min-h-[100dvh]" style={{ background: '#F7F8FB' }} />;
}

const DevSkeletonsPage = import.meta.env.DEV ? lazy(() => import('@/pages/DevSkeletons')) : null;

const { Pages } = pagesConfig;

// Signed-in owner reloading an app screen: fetch the shell + that screen's code now, in parallel with auth.
preloadForInitialRoute();
// …and Today's data: its queries start as soon as the session is restored, not after the Today screen has mounted.
prefetchDataForInitialRoute(queryClientInstance);

// The 409 conflict dialog (and its animation library) is only downloaded the first time it is needed.
const OptimisticConflictModal = lazy(() => import('@/components/common/OptimisticConflictModal').then((m) => ({ default: m.OptimisticConflictModal })));
function ConflictModalHost() {
  const { open } = useOptimisticConflictModalState();
  const [needed, setNeeded] = useState(false);
  useEffect(() => { if (open) setNeeded(true); }, [open]);
  if (!needed && !open) return null;
  return <Suspense fallback={null}><OptimisticConflictModal /></Suspense>;
}

const EXPLICIT_PROTECTED_KEYS = new Set([
  // persona-clarity (05.11.2026): "הכנסות" lives in כסף → דוחות → 12 חודשים; the old address redirects there
  'RevenueIntelligence',
  'Dashboard',
  'Billing',
  'Subscription',
  'PlatformAdmin',
  'BookingDetail',
  'LeadDetail',
  'Onboarding',
]);

function LegacyBookingDetailRedirect() {
  const { id } = useParams();
  return <Navigate to={`/booking/${id}`} replace />;
}

function LegacyLeadDetailRedirect() {
  const { id } = useParams();
  return <Navigate to={`/lead/${id}`} replace />;
}

const PUBLIC_LAYOUT_PAGES = new Set(['Landing', 'Login', 'Register', 'Privacy', 'Terms', 'GuestService', 'About', 'DataSecurity', 'Accessibility', 'SLA', 'Contact', 'Status', 'HowItWorks', 'PricingPlans']);

/** iOS app with Face ID lock on: decided once, before anything renders, so no guest data flashes. */
const LOCK_AT_START = (() => {
  try { return lockAtColdStart({ native: isNativeApp(), prefs: readLockPrefs(window.localStorage) }); } catch { return false; }
})();

/** Plain cover while the lock screen chunk loads (same navy as the lock glass). */
function LockCover() {
  return <div aria-hidden className="fixed inset-0 z-[2147483000]" style={{ background: '#1B2656' }} />;
}

/** Public pages render bare (lazy page + Suspense); app pages load the shell lazily. */
const LayoutWrapper = ({ children, currentPageName }) => (
  PUBLIC_LAYOUT_PAGES.has(currentPageName)
    ? <Suspense fallback={<PublicFallback />}>{children}<BootDone /></Suspense>
    : <Suspense fallback={<AppFallback />}><AppLayout currentPageName={currentPageName}>{children}</AppLayout></Suspense>
);
/** Full-screen page: its own Suspense; the boot overlay leaves once it has rendered (src/lib/boot.js). */
const S = ({ children }) => <Suspense fallback={<PublicFallback />}>{children}<BootDone /></Suspense>;

// Fallback when DB update failed: allow through if user just completed onboarding (localStorage flag)
function hasOnboardingBypass(user) {
  try {
    const raw = localStorage.getItem('onboarding_just_completed') || '';
    let uid = '', ts = 0;
    try { ({ uid = '', ts = 0 } = JSON.parse(raw) || {}); } catch { /* older plain-timestamp flag: not tied to a user, ignore */ }
    return !!(user?.id && uid === user.id && ts && Date.now() - ts < 10 * 60 * 1000);
  } catch { return false; }
}

// Redirects to /login if not authenticated; preserves return URL.
// If requireOnboarding=true (default), redirects to /onboarding when user hasn't completed it.

const ProtectedRoute = ({ children, requireOnboarding = true, allowSuspended = false, lockedRender = null }) => {
  const { isLoadingAuth, isAuthenticated, user, authOffline, retryAuth } = useAuth();
  if (isLoadingAuth) return <AppFallback />;
  if (!isAuthenticated && authOffline) {
    return <><OfflineAuthScreen onRetry={retryAuth} /><BootDone /></>;
  }
  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    return <Navigate to={`/login?return=${returnUrl}`} replace />;
  }
  // New orgs go through onboarding once, also when they arrive via /login after confirming their email.
  // Existing orgs are never forced: auth.me() marks an org that already has units / bookings / leads as done.
  // Suspended by the ATLAS team (admin console, my_account_status()): billing stays reachable.
  if (user?.account_suspended && !allowSuspended) {
    return <S><AccountSuspended reason={user.account_suspended_reason} /></S>;
  }
  // Expired and unpaid: the paywall before anything else (also before onboarding), so no app screen mounts.
  const inner = requireOnboarding && !user?.onboarding_completed && !hasOnboardingBypass(user)
    ? <Navigate to="/onboarding" replace />
    : children;
  return <AccessGate locked={lockedRender}>{inner}</AccessGate>;
};

/** /billing while locked: the web keeps the billing page (no app shell); the iOS app gets the no-purchase screen. */
function BillingWhileLocked() {
  const { user } = useAuth();
  if (isNativeApp()) return <Paywall />;
  return <LockedFrame><Suspense fallback={<AppFallback />}><Pages.Billing user={user} /><BootDone /></Suspense></LockedFrame>;
}

/** Signed-in / iOS 404: what happened + one way back, never the marketing 404 with pricing links (ecosystem v1 #24). */
function AppNotFound() {
  return (
    <main dir="rtl" className="flex min-h-[60dvh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <span className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(62,43,241,0.08)] text-[#3E2BF1]" aria-hidden>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" /></svg>
        </span>
        <h1 className="text-[22px] font-bold text-[#1B2656]">המסך הזה לא נמצא</h1>
        <p className="mt-2 text-[15px] text-[#4A5578]">ייתכן שהקישור ישן. כל השאר במקום.</p>
        <Link to="/dashboard" className="press mt-6 inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#3E2BF1] px-6 text-[15px] font-bold text-white">חזרה להיום</Link>
      </div>
    </main>
  );
}

/** Catch-all: legacy PascalCase paths redirect (case-insensitive); signed-in users get the app 404 inside the shell. */
function NotFoundRoute({ isAuthenticated }) {
  const loc = useLocation();
  const to = canonicalPathFor(loc.pathname, loc.search, loc.hash);
  if (to) return <Navigate to={to} replace />;
  if (isNativeApp() && !isAuthenticated) return <div style={{ background: '#F7F8FB', minHeight: '100dvh' }}><AppNotFound /><BootDone /></div>;
  if (isAuthenticated || isNativeApp()) return <LayoutWrapper currentPageName="NotFound"><AppNotFound /></LayoutWrapper>;
  return <S><SiteNotFound /></S>;
}

const AuthenticatedApp = () => {
  // Do not block public routes (/, /pricing, /status, /contact, …) on auth hydration.
  // Slow or hanging /auth/me would otherwise show a full-screen spinner for everyone.
  const { isAuthenticated, user, authOffline } = useAuth();

  return (
    <Routes>
      {/* Public landing page — always show at root, no auto-redirect to onboarding */}
      <Route
        path="/"
        element={isNativeApp() ? <Navigate to="/login" replace /> : <LayoutWrapper currentPageName="Landing"><Pages.Landing /></LayoutWrapper>}
      />

      {/* Auth pages — redirect based on onboarding_completed */}
      <Route
        path="/login"
        element={
          isAuthenticated || authOffline
            ? <Navigate to="/dashboard" replace />
            : <S><Login /></S>
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated
            ? <Navigate to={(user?.onboarding_completed || hasOnboardingBypass(user) ? '/dashboard' : '/onboarding')} replace />
            : <S><Register /></S>
        }
      />
      <Route
        path="/verify-email"
        element={<S><VerifyEmail /></S>}
      />
      <Route path="/reset-password" element={<S><ResetPassword /></S>} />
      <Route path="/update-password" element={<S><UpdatePassword /></S>} />
      <Route path="/auth/callback" element={<S><AuthCallback /></S>} />

      {/* Public static pages — no auth required */}
      <Route path="/about" element={<S><SitePage /></S>} />
      <Route path="/status" element={<LayoutWrapper currentPageName="Status"><Pages.Status /></LayoutWrapper>} />
      <Route path="/privacy" element={<S><SitePage /></S>} />
      <Route path="/terms" element={<S><SitePage /></S>} />
      <Route path="/contact" element={<S><SitePage /></S>} />
      <Route path="/guest-service" element={<LayoutWrapper currentPageName="GuestService"><Pages.GuestService /></LayoutWrapper>} />
      <Route path="/data-security" element={<S><SitePage /></S>} />
      <Route path="/accessibility" element={<S><SitePage /></S>} />
      <Route path="/cookies" element={<S><SitePage /></S>} />
      <Route path="/cancellation" element={<S><SitePage /></S>} />
      <Route path="/data-processing" element={<S><SitePage /></S>} />
      <Route path="/blog" element={<S><SitePage /></S>} />
      <Route path="/blog/:slug" element={<S><SitePage /></S>} />
      <Route path="/sla" element={<LayoutWrapper currentPageName="SLA"><Pages.SLA /></LayoutWrapper>} />
      <Route path="/how-it-works" element={<LayoutWrapper currentPageName="HowItWorks"><Pages.HowItWorks /></LayoutWrapper>} />
      <Route path="/pricing" element={isNativeApp() ? <Navigate to="/login" replace /> : <LayoutWrapper currentPageName="PricingPlans"><Pages.PricingPlans /></LayoutWrapper>} />

      {/* Public guest page per booking + direct-booking page per property (no login) */}
      <Route path="/g/:token" element={<Suspense fallback={<PublicFallback />}><GuestStayPage /><BootDone /></Suspense>} />
      <Route path="/book/:slug" element={<Suspense fallback={<PublicFallback />}><BookDirectPage /><BootDone /></Suspense>} />
      {/* Print / PDF view of the monthly accountant report (no app chrome) */}
      <Route path="/monthly-report/print" element={<ProtectedRoute><Suspense fallback={<PublicFallback />}><MonthlyReportPrintPage /><BootDone /></Suspense></ProtectedRoute>} />

      {/* Onboarding — requires auth but NOT onboarding_completed (user lands here after verification) */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute requireOnboarding={false}>
            <S><Onboarding /></S>
          </ProtectedRoute>
        }
      />
      {/* ייבוא מתחם: paste a Booking / Airbnb / own-site link, confirm, answer only what's missing (full screen) */}
      <Route path="/import" element={<ProtectedRoute requireOnboarding={false}><S><ImportComplexPage /></S></ProtectedRoute>} />
      {/* Guided setup after onboarding (calendars, WhatsApp, units): full screen, needs a set-up account */}
      <Route
        path="/setup"
        element={
          <ProtectedRoute>
            <S><SetupPage /></S>
          </ProtectedRoute>
        }
      />
      {/* Explicit dashboard route — ensures /dashboard always works */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <LayoutWrapper currentPageName="Dashboard">
              <Pages.Dashboard />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      {import.meta.env.DEV && DevSkeletonsPage && (
        <Route
          path="/dev/skeletons"
          element={
            <ProtectedRoute>
              <LayoutWrapper currentPageName="Dashboard">
                <Suspense
                  fallback={
                    <div className="p-6 max-w-6xl mx-auto space-y-4" dir="rtl">
                      <Skeleton height={32} width={220} borderRadius={8} />
                      <Skeleton height={280} className="w-full max-w-3xl" borderRadius={16} />
                    </div>
                  }
                >
                  <DevSkeletonsPage />
                </Suspense>
              </LayoutWrapper>
            </ProtectedRoute>
          }
        />
      )}
      {/* Billing & Subscription — protected, no onboarding redirect (always accessible) */}
      {/* iOS app (audit 04.11 C1): billing and plans never open there; a locked account still gets the no-purchase paywall. */}
      <Route path="/billing" element={<ProtectedRoute requireOnboarding={false} allowSuspended lockedRender={<BillingWhileLocked />}>{isNativeApp() ? <Navigate to="/settings" replace /> : <LayoutWrapper currentPageName="Billing"><Pages.Billing /></LayoutWrapper>}</ProtectedRoute>} />
      {/* While locked, /subscription IS the paywall (plan choice + request; no purchase UI in the iOS app). */}
      <Route path="/subscription" element={<ProtectedRoute requireOnboarding={false} allowSuspended lockedRender={<Paywall />}>{isNativeApp() ? <Navigate to="/settings" replace /> : <LayoutWrapper currentPageName="Subscription"><Pages.Subscription /></LayoutWrapper>}</ProtectedRoute>} />
      {/* Platform admin console. Access is checked server-side (admin_whoami + every admin_* RPC). */}
      <Route path="/admin/*" element={<Suspense fallback={<PublicFallback />}><AdminRoot /><BootDone /></Suspense>} />
      <Route path="/platform-admin" element={<Navigate to="/admin" replace />} />
      <Route path="/revenue-intelligence" element={<Navigate to="/monthly-report?view=year" replace />} />
      {/* Legacy routes — redirect to canonical lowercase paths */}
      {/* caseSensitive is required: React Router matches case-insensitively by default,
          so "/Bookings" -> "/bookings" also matched "/bookings" itself and rendered a blank page. */}
      {LEGACY_REDIRECTS.filter(({ from, to }) => from !== to).map(({ from, to }) => (
        <Route key={from} path={from} caseSensitive element={<Navigate to={to} replace />} />
      ))}

      <Route path="/BookingDetail/:id" caseSensitive element={<LegacyBookingDetailRedirect />} />
      <Route path="/LeadDetail/:id" caseSensitive element={<LegacyLeadDetailRedirect />} />

      {/* Protected detail pages with :id param */}
      <Route
        path="/booking/:id"
        element={
          <ProtectedRoute>
            <LayoutWrapper currentPageName="BookingDetail">
              <Pages.BookingDetail />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/lead/:id"
        element={
          <ProtectedRoute>
            <LayoutWrapper currentPageName="LeadDetail">
              <Pages.LeadDetail />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />

      {/* All other pages — protected (explicit keys excluded above) */}
      {Object.entries(Pages)
        .filter(
          ([path]) =>
            !EXPLICIT_PROTECTED_KEYS.has(path) && !PUBLIC_PAGE_KEYS.includes(path),
        )
        .map(([path, Page]) => (
          <Route
            key={path}
            path={createPageUrl(path)}
            element={
              <ProtectedRoute>
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              </ProtectedRoute>
            }
          />
        ))}

      {/* Audit 04.11 #8: the iOS app never shows the marketing header (prices, blog) on a wrong link. */}
      <Route path="*" element={<NotFoundRoute isAuthenticated={isAuthenticated} />} />
    </Routes>
  );
};


/**
 * The full app: providers + every route. The Router, scroll reset and SEO tags live in src/Root.jsx,
 * which serves "/" and /pricing (lean public pages) without this module. Every other URL renders this, lazily.
 */
/**
 * perf/cold-start: the iOS-only hosts (Face ID Keychain sync + offer sheet, notifications, app lock on resume) are not
 * part of the first screen. They load a moment after the boot screen has gone, so their code does not compete with
 * the shell and Today on a phone's CPU. A lock at cold start (LOCK_AT_START) still mounts at once.
 */
function useAfterFirstScreen(delayMs = 800, maxMs = 4000) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let t1; let t2;
    const go = () => setReady(true);
    const later = () => { t1 = window.setTimeout(go, delayMs); };
    if (isBootShown()) window.addEventListener('atlas:boot-done', later, { once: true });
    else later();
    t2 = window.setTimeout(go, maxMs);
    return () => { window.removeEventListener('atlas:boot-done', later); window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [delayMs, maxMs]);
  return ready;
}

function App() {
  const nativeHosts = useAfterFirstScreen();
  if (!isProductionBackendConfigured()) { hideBoot(); return <BackendNotConfigured />; }
  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <NuqsAdapter>
            <NavigationTracker />
            <AccessSync />
            <OfflineBanner />
            <AuthenticatedApp />
            {isNativeApp() && nativeHosts ? <Suspense fallback={null}><NativeAuthHost /></Suspense> : null}
            {isNativeApp() && nativeHosts ? <Suspense fallback={null}><NotifyHost /></Suspense> : null}
            {isNativeApp() && (nativeHosts || LOCK_AT_START) ? <Suspense fallback={LOCK_AT_START ? <LockCover /> : null}><AppLockHost initialLocked={LOCK_AT_START} /></Suspense> : null}
          </NuqsAdapter>
          <ConflictModalHost />
          <AtlasToaster />
        </QueryClientProvider>
      </AuthProvider>
    </GlobalErrorBoundary>
  )
}

export default App
