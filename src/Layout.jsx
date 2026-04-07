import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import AppSidebar from '@/components/app/AppSidebar';
import AppHeader from '@/components/app/AppHeader';
import BottomTabs from '@/components/app/BottomTabs';
import AIChatBubble from '@/components/app/AIChatBubble';
import TrialBanner from '@/components/TrialBanner';
import IOSInstallBanner from '@/components/app/IOSInstallBanner';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const publicPages = ['Landing', 'Login', 'Register', 'Privacy', 'Terms', 'GuestService', 'About', 'DataSecurity', 'Accessibility', 'SLA', 'Contact', 'Changelog', 'Status', 'ApiDocs', 'HowItWorks', 'PricingPlans'];

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--page-bg)' }}>
      <div className="flex flex-col items-center gap-3">
        <Loader2
          className="w-10 h-10 text-[var(--brand-teal,#00D1C1)] opacity-90"
          strokeWidth={2}
          aria-hidden
        />
        <p className="text-sm font-semibold" style={{ color: 'var(--atlas-ink-muted, rgba(0,0,0,0.4))' }}>טוען את המסך…</p>
      </div>
    </div>
  );
}

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const queryClient = useQueryClient();

  const isPublicPage = publicPages.includes(currentPageName);

  useEffect(() => {
    let link = document.querySelector("link[rel='icon'][type='image/svg+xml']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      document.head.appendChild(link);
    }
    link.href = '/favicon.svg';
  }, []);

  // Mobile: close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    queryClient.clear();
    await logout(false);
    window.location.href = '/login';
  };

  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <div className="atlas-app-shell flex flex-col min-h-[100dvh] h-[100dvh] max-h-[100dvh] overflow-hidden safe-top safe-left safe-right" style={{ background: 'linear-gradient(165deg, #f0fdf9 0%, #f4f6fb 42%, #eef6f4 100%)' }} dir="rtl">
      <TrialBanner />
      <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - desktop */}
      <div className={cn(
        "hidden md:flex flex-shrink-0 transition-all duration-300",
        sidebarCollapsed ? "w-[64px]" : "w-[240px]"
      )}>
        <AppSidebar
          collapsed={sidebarCollapsed}
          onCollapse={() => setSidebarCollapsed(prev => !prev)}
          onLogout={handleLogout}
          user={user}
        />
      </div>

      {/* Sidebar - mobile drawer */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-40 w-[240px] md:hidden transition-transform duration-300",
        sidebarOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"
      )}>
        <AppSidebar
          collapsed={false}
          onCollapse={() => setSidebarOpen(false)}
          onLogout={handleLogout}
          user={user}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AppHeader
          user={user}
          currentPageName={currentPageName}
          onMenuClick={() => setSidebarOpen(prev => !prev)}
          selectedPropertyId={selectedPropertyId}
          onPropertyChange={setSelectedPropertyId}
        />
        <main id="atlas-main-scroll" className="flex-1 overflow-y-auto overflow-x-hidden pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              {React.isValidElement(children)
                ? React.cloneElement(children, {
                    user,
                    selectedPropertyId,
                    orgId: user?.organization_id ?? user?.org_id ?? null,
                  })
                : children}
            </Suspense>
          </ErrorBoundary>
        </main>
        {/* Mobile bottom tabs — fixed, self-manages visibility via lg:hidden */}
        <BottomTabs />
      </div>
      {!isPublicPage && <AIChatBubble />}
      <IOSInstallBanner />
      </div>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <LayoutContent currentPageName={currentPageName}>
      {children}
    </LayoutContent>
  );
}
