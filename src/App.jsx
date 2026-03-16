import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Login from '@/pages/Login';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;
const DashboardPage = Pages.Dashboard;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// Redirects to /Login if not authenticated; preserves return URL
const ProtectedRoute = ({ children }) => {
  const { isLoadingAuth, isAuthenticated } = useAuth();
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    return <Navigate to={`/Login?return=${returnUrl}`} replace />;
  }
  return children;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated } = useAuth();

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
      {/* Public landing page — always accessible at / */}
      <Route
        path="/"
        element={<LayoutWrapper currentPageName="Landing"><Pages.Landing /></LayoutWrapper>}
      />

      {/* Login — redirect to Dashboard if already authenticated */}
      <Route
        path="/Login"
        element={
          isAuthenticated
            ? <Navigate to="/Dashboard" replace />
            : <Login />
        }
      />

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
        .filter(([path]) => path !== 'Landing' && path !== 'Login')
        .map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
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
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
