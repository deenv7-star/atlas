import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AppSidebar from '@/components/app/AppSidebar';
import AppHeader from '@/components/app/AppHeader';
import { cn } from '@/lib/utils';

// Pages that don't need the app layout
const publicPages = ['Landing', 'Login', 'Privacy', 'Terms'];

export default function Layout({ children, currentPageName }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const queryClient = useQueryClient();

  const isPublicPage = publicPages.includes(currentPageName);

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
    <div dir="rtl" className="min-h-screen bg-[#F8FAFC] font-['Heebo',sans-serif]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
      `}</style>
      
      <AppSidebar 
        collapsed={sidebarCollapsed} 
        onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={handleLogout}
      />

      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "mr-20" : "mr-64"
      )}>
        <AppHeader 
          user={user}
          properties={properties}
          selectedPropertyId={selectedPropertyId}
          onPropertyChange={handlePropertyChange}
          onLogout={handleLogout}
        />

        <main className="p-6">
          {React.cloneElement(children, { 
            user, 
            selectedPropertyId, 
            properties,
            orgId: user?.org_id 
          })}
        </main>
      </div>
    </div>
  );
}