import { lazy, Suspense, useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { useOptimisticConflictModalState } from '@/lib/optimistic/conflictModalState';
import { preloadForInitialRoute } from '@/lib/appPreload';
import { Skeleton } from '@/components/ui/skeleton';
import { AtlasToaster } from '@/components/ui/AtlasToast';
import { QueryClientProvider } from '@tanstack/react-query'
import GlobalErrorBoundary from '@/components/common/GlobalErrorBoundary';
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { Route, Routes, Navigate, useParams } from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6';
import BackendNotConfigured from '@/components/common/BackendNotConfigured';
import { isProductionBackendConfigured } from '@/lib/backendConfig';
import { createPageUrl } from '@/utils';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { PUBLIC_PAGE_KEYS, LEGACY_REDIRECTS, getSafeReturnUrl } from '@/config/routes';
// Code-split: the landing page should not download the app shell or the auth screens.
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const UpdatePassword = lazy(() => import('@/pages/UpdatePassword'));
// Google / Apple sign-in lands here (Supabase redirectTo). Not behind the signed-in redirects: the session appears on this page.
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const SetupPage = lazy(() => import('@/pages/Setup'));
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

const PUBLIC_LAYOUT_PAGES = new Set(['Landing', 'Login', 'Register', 'Privacy', 'Terms', 'GuestService', 'About', 'DataSecurity', 'Accessibility', 'SLA', 'Contact', 'Changelog', 'Status', 'ApiDocs', 'HowItWorks', 'PricingPlans']);

function AppFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#F7F8FB' }} role="status" aria-busy="true" aria-label="טוען">
      <div className="h-8 w-8 rounded-full border-[3px] border-[#E6E8F0] border-t-[#3E2BF1] motion-safe:animate-spin" />
    </div>
  );
}

/** Public pages render bare (lazy page + Suspense); app pages load the shell lazily. */
const LayoutWrapper = ({ children, currentPageName }) => (
  PUBLIC_LAYOUT_PAGES.has(currentPageName)
    ? <Suspense fallback={<PublicFallback />}>{children}</Suspense>
    : <Suspense fallback={<AppFallback />}><AppLayout currentPageName={currentPageName}>{children}</AppLayout></Suspense>
);
const S = ({ children }) => <Suspense fallback={<PublicFallback />}>{children}</Suspense>;

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

const ProtectedRoute = ({ children, requireOnboarding = true, allowSuspended = false }) => {
  const { isLoadingAuth, isAuthenticated, user } = useAuth();
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-[3px] border-[#E6E8F0] border-t-[#3E2BF1] motion-safe:animate-spin" aria-label="טוען" role="status"></div>
      </div>
    );
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
  if (requireOnboarding && !user?.onboarding_completed && !hasOnboardingBypass(user)) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
};

const AuthenticatedApp = () => {
  // Do not block public routes (/, /pricing, /status, /contact, …) on auth hydration.
  // Slow or hanging /auth/me would otherwise show a full-screen spinner for everyone.
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Public landing page — always show at root, no auto-redirect to onboarding */}
      <Route
        path="/"
        element={<LayoutWrapper currentPageName="Landing"><Pages.Landing /></LayoutWrapper>}
      />

      {/* Auth pages — redirect based on onboarding_completed */}
      <Route
        path="/login"
        element={
          isAuthenticated
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
      <Route path="/changelog" element={<LayoutWrapper currentPageName="Changelog"><Pages.Changelog /></LayoutWrapper>} />
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
      <Route path="/api-docs" element={<LayoutWrapper currentPageName="ApiDocs"><Pages.ApiDocs /></LayoutWrapper>} />
      <Route path="/how-it-works" element={<LayoutWrapper currentPageName="HowItWorks"><Pages.HowItWorks /></LayoutWrapper>} />
      <Route path="/pricing" element={<LayoutWrapper currentPageName="PricingPlans"><Pages.PricingPlans /></LayoutWrapper>} />

      {/* Public guest page per booking + direct-booking page per property (no login) */}
      <Route path="/g/:token" element={<Suspense fallback={<PublicFallback />}><GuestStayPage /></Suspense>} />
      <Route path="/book/:slug" element={<Suspense fallback={<PublicFallback />}><BookDirectPage /></Suspense>} />
      {/* Print / PDF view of the monthly accountant report (no app chrome) */}
      <Route path="/monthly-report/print" element={<ProtectedRoute><Suspense fallback={<PublicFallback />}><MonthlyReportPrintPage /></Suspense></ProtectedRoute>} />

      {/* Onboarding — requires auth but NOT onboarding_completed (user lands here after verification) */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute requireOnboarding={false}>
            <S><Onboarding /></S>
          </ProtectedRoute>
        }
      />
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
      <Route path="/billing" element={<ProtectedRoute requireOnboarding={false} allowSuspended><LayoutWrapper currentPageName="Billing"><Pages.Billing /></LayoutWrapper></ProtectedRoute>} />
      <Route path="/subscription" element={<ProtectedRoute requireOnboarding={false} allowSuspended><LayoutWrapper currentPageName="Subscription"><Pages.Subscription /></LayoutWrapper></ProtectedRoute>} />
      {/* Platform admin console. Access is checked server-side (admin_whoami + every admin_* RPC). */}
      <Route path="/admin/*" element={<Suspense fallback={<PublicFallback />}><AdminRoot /></Suspense>} />
      <Route path="/platform-admin" element={<Navigate to="/admin" replace />} />
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

      <Route path="*" element={<S><SiteNotFound /></S>} />
    </Routes>
  );
};


/**
 * The full app: providers + every route. The Router, scroll reset and SEO tags live in src/Root.jsx,
 * which serves "/" and /pricing (lean public pages) without this module. Every other URL renders this, lazily.
 */
function App() {
  if (!isProductionBackendConfigured()) return <BackendNotConfigured />;
  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <NuqsAdapter>
            <NavigationTracker />
            <AuthenticatedApp />
          </NuqsAdapter>
          <Toaster />
          <ConflictModalHost />
          <AtlasToaster />
        </QueryClientProvider>
      </AuthProvider>
    </GlobalErrorBoundary>
  )
}

export default App
