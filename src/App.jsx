import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from 'sonner';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { PUBLIC_PAGE_KEYS, LEGACY_REDIRECTS, getSafeReturnUrl } from '@/config/routes';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import VerifyEmail from '@/pages/VerifyEmail';
import ResetPassword from '@/pages/ResetPassword';
import UpdatePassword from '@/pages/UpdatePassword';
import Onboarding from '@/pages/Onboarding';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;
const DashboardPage = Pages.Dashboard;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// Fallback when DB update failed: allow through if user just completed onboarding (localStorage flag)
function hasOnboardingBypass() {
  try {
    const ts = parseInt(localStorage.getItem('onboarding_just_completed') || '0', 10);
    return !!(ts && Date.now() - ts < 10 * 60 * 1000);
  } catch { return false; }
}

// User came from Login = existing user, skip onboarding and go straight to dashboard
function hasLoginBypass() {
  try {
    const ts = parseInt(localStorage.getItem('login_just_completed') || '0', 10);
    return !!(ts && Date.now() - ts < 30 * 60 * 1000);
  } catch { return false; }
}

// Redirects to /login if not authenticated; preserves return URL.
// If requireOnboarding=true (default), redirects to /onboarding when user hasn't completed it.

const ProtectedRoute = ({ children, requireOnboarding = true }) => {
  const { isLoadingAuth, isAuthenticated, user } = useAuth();
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    return <Navigate to={`/login?return=${returnUrl}`} replace />;
  }
  if (requireOnboarding && !user?.onboarding_completed && !hasOnboardingBypass() && !hasLoginBypass()) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated, user } = useAuth();

  // Show loading spinner while checking auth on root/login routes
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

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
            : <Login />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated
            ? <Navigate to={(user?.onboarding_completed || hasOnboardingBypass() ? '/dashboard' : '/onboarding')} replace />
            : <Register />
        }
      />
      <Route
        path="/verify-email"
        element={<VerifyEmail />}
      />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/update-password" element={<UpdatePassword />} />

      {/* Public static pages — no auth required */}
      <Route path="/about" element={<LayoutWrapper currentPageName="About"><Pages.About /></LayoutWrapper>} />
      <Route path="/changelog" element={<LayoutWrapper currentPageName="Changelog"><Pages.Changelog /></LayoutWrapper>} />
      <Route path="/status" element={<LayoutWrapper currentPageName="Status"><Pages.Status /></LayoutWrapper>} />
      <Route path="/privacy" element={<LayoutWrapper currentPageName="Privacy"><Pages.Privacy /></LayoutWrapper>} />
      <Route path="/terms" element={<LayoutWrapper currentPageName="Terms"><Pages.Terms /></LayoutWrapper>} />
      <Route path="/contact" element={<LayoutWrapper currentPageName="Contact"><Pages.Contact /></LayoutWrapper>} />
      <Route path="/guest-service" element={<LayoutWrapper currentPageName="GuestService"><Pages.GuestService /></LayoutWrapper>} />
      <Route path="/data-security" element={<LayoutWrapper currentPageName="DataSecurity"><Pages.DataSecurity /></LayoutWrapper>} />
      <Route path="/accessibility" element={<LayoutWrapper currentPageName="Accessibility"><Pages.Accessibility /></LayoutWrapper>} />
      <Route path="/sla" element={<LayoutWrapper currentPageName="SLA"><Pages.SLA /></LayoutWrapper>} />

      {/* Onboarding — requires auth but NOT onboarding_completed (user lands here after verification) */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute requireOnboarding={false}>
            <Onboarding />
          </ProtectedRoute>
        }
      />
      {/* Legacy routes — redirect to canonical lowercase paths */}
      {LEGACY_REDIRECTS.map(({ from, to }) => (
        <Route key={from} path={from} element={<Navigate to={to} replace />} />
      ))}

      {/* Protected detail pages with :id param */}
      <Route
        path="/BookingDetail/:id"
        element={
          <ProtectedRoute>
            <LayoutWrapper currentPageName="BookingDetail">
              <Pages.BookingDetail />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/LeadDetail/:id"
        element={
          <ProtectedRoute>
            <LayoutWrapper currentPageName="LeadDetail">
              <Pages.LeadDetail />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />

      {/* All other pages — protected */}
      {Object.entries(Pages)
        .filter(([path]) => !PUBLIC_PAGE_KEYS.includes(path))
        .map(([path, Page]) => (
          <Route
            key={path}
            path={path === 'Dashboard' ? '/dashboard' : `/${path}`}
            element={
              <ProtectedRoute>
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              </ProtectedRoute>
            }
          />
        ))}

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <SonnerToaster position="top-center" dir="rtl" richColors closeButton duration={4000} />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
