import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import TrialBanner from '@/components/TrialBanner';
import IOSInstallBanner from '@/components/app/IOSInstallBanner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { cn } from '@/lib/utils';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { QuickBookingProvider } from '@/components/app/QuickBooking';
import { SkelLine } from '@/components/ds';
import ConnectionNotice from '@/components/app/shell/ConnectionNotice';
import { Sidebar, Header, TabBar, shellClass } from '@/ui-direction';

const publicPages = ['Landing', 'Login', 'Register', 'Privacy', 'Terms', 'GuestService', 'About', 'DataSecurity', 'Accessibility', 'SLA', 'Contact', 'Changelog', 'Status', 'ApiDocs', 'HowItWorks', 'PricingPlans'];

function PageLoader() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pt-6 md:px-8" role="status" aria-busy="true" aria-label="טוען את המסך">
      <SkelLine className="h-8 w-48" />
      <SkelLine className="mt-3 h-4 w-72 max-w-full" />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <SkelLine key={i} className="h-[112px] rounded-[18px]" />)}
      </div>
      <SkelLine className="mt-4 h-64 rounded-[18px]" />
    </div>
  );
}

function LayoutContent({ children, currentPageName }) {
  const { user, logout } = useAuth();
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const queryClient = useQueryClient();
  const orgId = user?.organization_id ?? user?.org_id ?? null;

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

  // The app is light-only. An old theme toggle (or OS dark mode) used to add `.dark`
  // and paint skeletons near-black; clear it once.
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    try { localStorage.removeItem('atlas-dark-mode'); } catch { /* ignore */ }
  }, []);

  const handleLogout = async () => {
    queryClient.clear();
    await logout(false);
    window.location.href = '/login';
  };

  if (isPublicPage) {
    // Public routes use lazy() in pages.config — must suspend inside a boundary
    // or client navigation to /contact, /about, etc. throws and hits GlobalErrorBoundary.
    return (
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    );
  }

  return (
    <QuickBookingProvider>
      <div className={cn('atlas-app-shell flex h-[100dvh] max-h-[100dvh] min-h-[100dvh] flex-col overflow-hidden safe-top safe-left safe-right', shellClass)} dir="rtl">
        <div className="lg:hidden"><TrialBanner /></div>
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="hidden shrink-0 lg:flex">
            <Sidebar onLogout={handleLogout} user={user} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <Header
              user={user}
              currentPageName={currentPageName}
              selectedPropertyId={selectedPropertyId}
              onPropertyChange={setSelectedPropertyId}
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
              onLogout={handleLogout}
            />
            <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} orgId={orgId} />
            <main id="atlas-main-scroll" className="flex-1 overflow-y-auto overflow-x-hidden pb-[calc(104px+env(safe-area-inset-bottom))] lg:pb-0">
              <ConnectionNotice />
              <ErrorBoundary section="layout-outlet" variant="page">
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
            <TabBar user={user} onLogout={handleLogout} />
          </div>
          <IOSInstallBanner />
        </div>
      </div>
    </QuickBookingProvider>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <LayoutContent currentPageName={currentPageName}>
      {children}
    </LayoutContent>
  );
}
