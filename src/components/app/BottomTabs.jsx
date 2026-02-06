import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LayoutDashboard, CalendarCheck, Users, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { name: 'Dashboard', label: 'בקרה', icon: LayoutDashboard },
  { name: 'Bookings', label: 'הזמנות', icon: CalendarCheck },
  { name: 'Leads', label: 'לידים', icon: Users },
  { name: 'Messages', label: 'הודעות', icon: MessageSquare }
];

export default function BottomTabs() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 lg:hidden z-30 select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <nav className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = currentPath.includes(tab.name);
          return (
            <Link
              key={tab.name}
              to={createPageUrl(tab.name)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors select-none",
                isActive 
                  ? "text-[#00D1C1] dark:text-[#00D1C1]" 
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              <tab.icon className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}