import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import TrialBanner from '@/components/TrialBanner';
import IOSInstallBanner from '@/components/app/IOSInstallBanner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { cn } from '@/lib/utils';
import { QuickBookingProvider } from '@/components/app/QuickBooking';
import { SkelLine } from '@/components/ds';
import ConnectionNotice from '@/components/app/shell/ConnectionNotice';
import { Sidebar, Header, TabBar, shellClass } from '@/ui-direction';
import TourHost from '@/components/tour/TourHost';
import { prefetchMainPagesWhenIdle } from '@/lib/appPreload';
import { useAssistantOpen } from '@/assistant/launcher';

// Help bot + human handoff (supabase/functions/support-chat). Lazy: not part of the first paint.
const SupportWidget = React.lazy(() => import('@/support/SupportWidget'));
// Search palette (⌘K): not needed for the first paint (audit 04.11 #9). Mounted on first open or once the
// browser is idle, so its own ⌘K listener is up a moment after the screen appears.
const CommandPalette = React.lazy(() => import('@/components/ui/CommandPalette').then((m) => ({ default: m.CommandPalette })));
// "שאלו את atlas" side panel / sheet (version B). Lazy and mounted only after the first open.
const AssistantPanel = React.lazy(() => import('@/assistant/AssistantPanel'));

const publicPages = ['Landing', 'Login', 'Register', 'Privacy', 'Terms', 'GuestService', 'About', 'DataSecurity', 'Accessibility', 'SLA', 'Contact', 'Status', 'HowItWorks', 'PricingPlans'];

/**
 * ecosystem v1 #22: the in-app loader mirrors the real list screens (title + action, chip row, 3 rows of 64px)
 * instead of "2 tiles + big card", so nothing jumps when content arrives. It fades in only after 300ms, so a fast
 * load shows no flash; shimmer is off under reduced motion (atlas-skeleton).
 */
function PageLoader() {
  return (
    <div className="atlas-loader-late mx-auto w-full max-w-[var(--page-max,1200px)] px-5 pt-6 md:px-10" role="status" aria-busy="true" aria-label="טוען את המסך">
      <div className="flex items-center justify-between gap-3">
        <SkelLine className="h-8 w-40" />
        <SkelLine className="h-11 w-32 rounded-full" />
      </div>
      <div className="mt-5 flex gap-2">
        {[64, 80, 72].map((w) => <SkelLine key={w} className="h-9 rounded-full" style={{ width: w }} />)}
      </div>
      <div className="mt-5 space-y-2">
        {[0, 1, 2].map((i) => <SkelLine key={i} className="h-16 rounded-[16px]" />)}
      </div>
    </div>
  );
}

function LayoutContent({ children, currentPageName }) {
  const { user, logout } = useAuth();
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [paletteReady, setPaletteReady] = useState(false);
  useEffect(() => {
    if (paletteReady) return undefined;
    if (commandPaletteOpen) { setPaletteReady(true); return undefined; }
    const ric = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 1500));
    const cancel = window.cancelIdleCallback || window.clearTimeout;
    const id = ric(() => setPaletteReady(true), { timeout: 3000 });
    return () => cancel(id);
  }, [commandPaletteOpen, paletteReady]);
  const queryClient = useQueryClient();
  const orgId = user?.organization_id ?? user?.org_id ?? null;

  const isPublicPage = publicPages.includes(currentPageName);
  const assistant = useAssistantOpen();

  useEffect(() => {
    let link = document.querySelector("link[rel='icon'][type='image/svg+xml']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      document.head.appendChild(link);
    }
    link.href = '/favicon.svg?v=2';
  }, []);

  // Once the first screen is up, fetch the code of the other main screens in the background (idle time),
  // so moving between them does not wait for a download.
  useEffect(() => {
    if (!isPublicPage) prefetchMainPagesWhenIdle();
  }, [isPublicPage]);

  // The app is light-only. An old theme toggle (or OS dark mode) used to add `.dark`
  // and paint skeletons near-black; clear it once.
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    try { localStorage.removeItem('atlas-dark-mode'); } catch { /* ignore */ }
  }, []);

  // Sidebar, header account menu, mobile "עוד" sheet. logout() never throws or hangs and ends with a
  // full reload on /login (the react-query cache is cleared inside it too).
  const handleLogout = () => {
    try { queryClient.clear(); } catch { /* ignore */ }
    void logout(true);
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
            {paletteReady ? (
              <Suspense fallback={null}>
                <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} orgId={orgId} />
              </Suspense>
            ) : null}
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
          <ErrorBoundary section="support-widget" variant="silent">
            <Suspense fallback={null}><SupportWidget /></Suspense>
          </ErrorBoundary>
          {assistant.mounted ? (
            <ErrorBoundary section="assistant-panel" variant="silent">
              <Suspense fallback={null}><AssistantPanel /></Suspense>
            </ErrorBoundary>
          ) : null}
          <IOSInstallBanner />
        </div>
        <TourHost user={user} />
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
