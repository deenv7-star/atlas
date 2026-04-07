import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  LayoutDashboard, CalendarRange, CalendarDays, MessageSquare,
  MoreHorizontal, X, Users, Wrench,   ClipboardList, FileText,
  Star, Brain, Zap, Link2, Wallet, TrendingUp, BarChart3, Headset,
  FileBarChart, Globe, Workflow, Settings, TrendingDown,
  Receipt, CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mainTabs = [
  { name: 'Dashboard',     label: 'בקרה',    icon: LayoutDashboard },
  { name: 'MultiCalendar', label: 'יומן',    icon: CalendarRange },
  { name: 'Bookings',      label: 'הזמנות',  icon: CalendarDays },
  { name: 'Messages',      label: 'הודעות',  icon: MessageSquare },
  { name: '__more__',      label: 'עוד',      icon: MoreHorizontal },
];

const moreGroups = [
  {
    label: 'אורחים',
    items: [
      { name: 'Leads',   label: 'ליד אורח', icon: Users },
      { name: 'Reviews', label: 'ביקורות',  icon: Star },
    ],
  },
  {
    label: 'תפעול',
    items: [
      { name: 'Cleaning',   label: 'ניקיון', icon: Wrench },
      { name: 'ServiceRequests', label: 'בקשות שירות', icon: Headset },
      { name: 'Contracts',  label: 'חוזים',  icon: ClipboardList },
    ],
  },
  {
    label: 'כספים',
    items: [
      { name: 'Invoices',           label: 'חשבוניות',       icon: FileText },
      { name: 'Payments',           label: 'תשלומים',         icon: Wallet },
      { name: 'RevenueIntelligence',label: 'מודיעין הכנסות', icon: BarChart3 },
      { name: 'OwnerReports',       label: 'דוחות בעלים',    icon: FileBarChart },
      { name: 'DynamicPricing',     label: 'תמחור דינאמי',   icon: TrendingUp },
      { name: 'ExpenseTracker',     label: 'מעקב הוצאות',    icon: TrendingDown },
      { name: 'Billing',            label: 'חיוב',            icon: Receipt },
      { name: 'Subscription',       label: 'מנוי',            icon: CreditCard },
    ],
  },
  {
    label: 'כלים',
    items: [
      { name: 'AIAssistant',  label: 'AI עוזר',      icon: Brain },
      { name: 'Automations',  label: 'אוטומציות',    icon: Zap },
      { name: 'Integrations', label: 'אינטגרציות',   icon: Link2 },
      { name: 'GuestJourney', label: 'מסע אורח',      icon: Workflow },
      { name: 'GuestPortal',  label: 'פורטל אורחים',  icon: Globe },
      { name: 'Settings',     label: 'הגדרות',        icon: Settings },
    ],
  },
];

const morePageNames = new Set(moreGroups.flatMap(g => g.items.map(i => i.name)));

export default function BottomTabs() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const currentPath = location.pathname;

  // Close drawer on navigation
  useEffect(() => { setMoreOpen(false); }, [currentPath]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (moreOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [moreOpen]);

  const isTabActive = (tabName) => {
    if (tabName === '__more__') return moreOpen || isMorePageActive();
    const tabPath = createPageUrl(tabName).toLowerCase();
    const path = currentPath.toLowerCase();
    return path === tabPath || path.startsWith(tabPath + '/');
  };

  const isMorePageActive = () => {
    return [...morePageNames].some(name => {
      const p = createPageUrl(name).toLowerCase();
      return currentPath.toLowerCase() === p || currentPath.toLowerCase().startsWith(p + '/');
    });
  };

  const activeColor = '#4F46E5'; // indigo

  return (
    <>
      {/* More drawer backdrop */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More drawer — slides up from bottom */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-in-out overflow-hidden',
          moreOpen ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'
        )}
        style={{ maxHeight: '75vh', paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
        dir="rtl"
      >
        {/* Drawer handle */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
          <h3 className="text-base font-bold text-gray-900">תפריט נוסף</h3>
          <button
            onClick={() => setMoreOpen(false)}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer content */}
        <div className="overflow-y-auto px-4 pb-4" style={{ maxHeight: 'calc(75vh - 60px)' }}>
          {moreGroups.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">
                {group.label}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const itemPath = createPageUrl(item.name).toLowerCase();
                  const isActive = currentPath.toLowerCase() === itemPath || currentPath.toLowerCase().startsWith(itemPath + '/');
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.name)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl transition-all touch-manipulation',
                        isActive
                          ? 'bg-indigo-50 text-[#4F46E5]'
                          : 'text-gray-500 active:bg-gray-100'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        isActive ? 'bg-indigo-100' : 'bg-gray-100'
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom tab bar */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-30 select-none safe-left safe-right"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        <nav className="flex items-center justify-around h-14">
          {mainTabs.map((tab) => {
            const isActive = isTabActive(tab.name);
            const Icon = tab.icon;

            if (tab.name === '__more__') {
              return (
                <button
                  key={tab.name}
                  onClick={() => setMoreOpen(prev => !prev)}
                  className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 touch-manipulation relative"
                >
                  <div className={cn(
                    'w-6 h-6 flex items-center justify-center transition-transform duration-150',
                    isActive && 'scale-110'
                  )}>
                    {moreOpen
                      ? <X className="w-5 h-5" style={{ color: activeColor }} />
                      : <MoreHorizontal className="w-5 h-5" style={{ color: isActive ? activeColor : '#9CA3AF' }} />
                    }
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: isActive ? activeColor : '#9CA3AF' }}>
                    {tab.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={tab.name}
                to={createPageUrl(tab.name)}
                className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 touch-manipulation relative"
              >
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                    style={{ backgroundColor: activeColor }}
                  />
                )}
                <div className={cn(
                  'w-6 h-6 flex items-center justify-center transition-transform duration-150',
                  isActive && 'scale-110'
                )}>
                  <Icon className="w-5 h-5" style={{ color: isActive ? activeColor : '#9CA3AF' }} />
                </div>
                <span className="text-[10px] font-medium" style={{ color: isActive ? activeColor : '#9CA3AF' }}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
