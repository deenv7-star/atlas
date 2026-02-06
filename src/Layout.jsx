import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import AppSidebar from '@/components/app/AppSidebar';
import AppHeader from '@/components/app/AppHeader';
import BottomTabs from '@/components/app/BottomTabs';
import { cn } from '@/lib/utils';

// Pages that don't need the app layout
const publicPages = ['Landing', 'Login', 'Privacy', 'Terms'];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const queryClient = useQueryClient();

  const isPublicPage = publicPages.includes(currentPageName);

  // Set favicon
  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985b1fe56d9d0df97ea2f90/a8bf088be_66452C78-3479-445B-A742-9175A3E3BF81.png';
    document.head.appendChild(link);
  }, []);

  // Fetch user data
  useEffect(() => {
    if (!isPublicPage) {
      const fetchUser = async () => {
        try {
          const userData = await base44.auth.me();
          setUser(userData);
          
          // If user doesn't have an org_id, create one or assign demo org
          if (!userData.org_id) {
            // For demo purposes, assign the demo organization
            const orgs = await base44.entities.Organization.list('-created_date', 1);
            if (orgs.length > 0) {
              await base44.auth.updateMe({ org_id: orgs[0].id, app_role: 'OWNER' });
              setUser({ ...userData, org_id: orgs[0].id, app_role: 'OWNER' });
            }
          }
          
          if (userData.selected_property_id) {
            setSelectedPropertyId(userData.selected_property_id);
          }
        } catch (e) {
          // User not authenticated, redirect to login
          base44.auth.redirectToLogin();
        }
      };
      fetchUser();
    }
  }, [isPublicPage]);

  // Fetch properties
  const { data: properties = [] } = useQuery({
    queryKey: ['properties', user?.org_id],
    queryFn: () => base44.entities.Property.filter({ org_id: user?.org_id }),
    enabled: !!user?.org_id && !isPublicPage,
  });

  // Set first property as default if none selected
  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  const handlePropertyChange = async (propertyId) => {
    setSelectedPropertyId(propertyId);
    if (user) {
      await base44.auth.updateMe({ selected_property_id: propertyId });
    }
  };

  const handleLogout = () => {
    base44.auth.logout('/Landing');
  };

  // Public pages get no layout
  if (isPublicPage) {
    return <>{children}</>;
  }

  // App layout
  return (
    <div dir="rtl" className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 font-['Heebo',sans-serif] overscroll-y-none">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

        :root {
          --bg-primary: #F8FAFC;
          --bg-secondary: #FFFFFF;
          --text-primary: #0B1220;
          --text-secondary: #64748B;
          --border-color: #E2E8F0;
          --accent: #00D1C1;
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --bg-primary: #030712;
            --bg-secondary: #111827;
            --text-primary: #F9FAFB;
            --text-secondary: #9CA3AF;
            --border-color: #374151;
            --accent: #00D1C1;
          }
        }

        body {
          overscroll-behavior-y: none;
        }

        /* Prevent text selection on interactive elements */
        button,
        [role="button"],
        a,
        nav,
        nav *,
        header,
        h1, h2, h3, h4, h5, h6,
        svg,
        .select-none {
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
        }
      `}</style>
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AppSidebar 
          collapsed={sidebarCollapsed} 
          onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed top-0 right-0 h-full w-64 bg-white z-50 transform transition-transform duration-300 lg:hidden",
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <AppSidebar 
          collapsed={false} 
          onCollapse={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />
      </div>

      <div className={cn(
        "transition-all duration-300",
        "lg:mr-20 lg:mr-64",
        sidebarCollapsed ? "lg:mr-20" : "lg:mr-64"
      )}>
        <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <AppHeader 
            user={user}
            properties={properties}
            selectedPropertyId={selectedPropertyId}
            onPropertyChange={handlePropertyChange}
            onLogout={handleLogout}
            onMenuClick={() => setSidebarOpen(true)}
          />
        </div>

        <main className="p-3 sm:p-4 md:p-6 pb-20 lg:pb-6">
          <AnimatePresence mode="wait" initial={false}>
            {React.cloneElement(children, { 
              key: location.pathname,
              user, 
              selectedPropertyId, 
              properties,
              orgId: user?.org_id 
            })}
          </AnimatePresence>
        </main>
      </div>

      <BottomTabs />
    </div>
  );
}