import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import AppSidebar from '@/components/app/AppSidebar';
import AppHeader from '@/components/app/AppHeader';
import BottomTabs from '@/components/app/BottomTabs';
import AIChatBubble from '@/components/app/AIChatBubble';
import { cn } from '@/lib/utils';

const publicPages = ['Landing', 'Login', 'Privacy', 'Terms', 'GuestService', 'About', 'UserAgreement', 'DataSecurity', 'Accessibility', 'SLA', 'Contact'];

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50/50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#00D1C1] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">טוען...</p>
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
    const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = '/icon.png';
    document.head.appendChild(link);
    document.title = 'ATLAS';
  }, []);

  // Mobile: close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    queryClient.clear();
    await logout(false);
    window.location.href = '/Login';
  };

  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--page-bg)' }} dir="rtl">
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
        sidebarOpen ? "translate-x-0" : "translate-x-full"
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
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<PageLoader />}>
            {React.cloneElement(children, {
              user,
              selectedPropertyId,
              orgId: user?.organization_id,
            })}
          </Suspense>
        </main>
        {/* Mobile bottom tabs */}
        <div className="md:hidden">
          <BottomTabs />
        </div>
      </div>
      {!isPublicPage && <AIChatBubble />}
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
