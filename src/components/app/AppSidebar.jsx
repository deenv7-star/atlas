import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, CalendarDays, MessageSquare,
  CreditCard, FileText, Star, Settings, LogOut,
  ChevronLeft, ChevronRight, Zap, Brain, Link2,
  Wallet, ClipboardList, Wrench, Receipt, TrendingDown,
  TrendingUp, Globe, BarChart3, CalendarRange, FileBarChart, Workflow,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navGroups = [
  {
    label: null,
    items: [
      { icon: LayoutDashboard, label: 'דשבורד', page: 'Dashboard' },
      { icon: CalendarRange, label: 'לוח שנה', page: 'MultiCalendar' },
      { icon: CalendarDays, label: 'הזמנות', page: 'Bookings' },
      { icon: Users, label: 'אורחים', page: 'Leads' },
      { icon: MessageSquare, label: 'הודעות', page: 'Messages' },
    ],
  },
  {
    label: 'PRO',
    items: [
      { icon: BarChart3, label: 'מודיעין הכנסות', page: 'RevenueIntelligence' },
      { icon: FileBarChart, label: 'דוחות בעלים', page: 'OwnerReports' },
      { icon: Workflow, label: 'מסע אורח', page: 'GuestJourney' },
      { icon: TrendingUp, label: 'תמחור דינאמי', page: 'DynamicPricing' },
      { icon: Globe, label: 'פורטל אורחים', page: 'GuestPortal' },
      { icon: Wrench, label: 'ניקיון', page: 'Cleaning' },
      { icon: ClipboardList, label: 'חוזים', page: 'Contracts' },
      { icon: FileText, label: 'חשבוניות', page: 'Invoices' },
      { icon: Star, label: 'ביקורות', page: 'Reviews' },
      { icon: Brain, label: 'AI עוזר', page: 'AIAssistant' },
      { icon: Zap, label: 'אוטומציות', page: 'Automations' },
      { icon: Link2, label: 'אינטגרציות', page: 'Integrations' },
      { icon: Wallet, label: 'תשלומים', page: 'Payments' },
      { icon: TrendingDown, label: 'מעקב הוצאות', page: 'ExpenseTracker' },
      { icon: Receipt, label: 'חיוב', page: 'Billing' },
      { icon: CreditCard, label: 'מנוי', page: 'Subscription' },
    ],
  },
];

export default function AppSidebar({ collapsed, onCollapse, onLogout, user }) {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  const isActive = (page) => {
    const pageUrl = createPageUrl(page);
    return location.pathname === pageUrl || location.pathname.startsWith(pageUrl + '/');
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const name = user.full_name || user.email || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  return (
    <aside className={cn(
      "h-full flex flex-col transition-all duration-300 ease-in-out relative bg-white border-l border-gray-200/80",
      collapsed ? "w-[64px]" : "w-[240px]"
    )} style={{ fontFamily: "'Heebo', sans-serif" }}>
      <div className={cn("flex items-center h-16 px-3 border-b border-gray-100 flex-shrink-0", collapsed ? "justify-center" : "gap-3")}>
        <Link to="/" title="חזרה לדף הבית">
          <img src="/atlas-logo-final.png" alt="ATLAS" style={{ height: collapsed ? 34 : 44, width: 'auto', objectFit: 'contain', cursor: 'pointer' }} />
        </Link>
        <button
          onClick={onCollapse}
          className={cn("p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200", collapsed ? "mr-0" : "mr-auto")}
        >
          {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className={groupIdx > 0 ? "mt-3" : ""}>
            {group.label && !collapsed && (
              <p className={cn(
                "px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest select-none",
                group.label === 'PRO' ? "text-amber-500" : "text-gray-400"
              )}>
                {group.label === 'PRO' ? '★ PRO' : group.label}
              </p>
            )}
            {group.label && collapsed && <div className="border-t border-gray-100 my-2 mx-1" />}
            {group.items.map((item) => {
              const active = isActive(item.page);
              const Icon = item.icon;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onMouseEnter={() => setHoveredItem(item.page)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    "flex items-center rounded-xl transition-all duration-200 group relative py-2 px-2.5 gap-3 mb-0.5",
                    collapsed ? "justify-center" : "",
                    active
                      ? "bg-indigo-50 text-[#4F46E5] font-semibold"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  )}
                >
                  {active && <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#4F46E5] rounded-l-full" />}
                  <div className={cn("flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0 transition-transform duration-200", active ? "text-[#4F46E5]" : "group-hover:scale-110")}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {!collapsed && <span className="text-sm truncate">{item.label}</span>}
                  {collapsed && hoveredItem === item.page && (
                    <div className="absolute right-full mr-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap shadow-xl z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="flex-shrink-0 border-t border-gray-100 px-2 py-3 space-y-0.5">
        <Link
          to={createPageUrl('Settings')}
          className={cn(
            "flex items-center rounded-xl transition-all duration-200 py-2 px-2.5 gap-3",
            collapsed ? "justify-center" : "",
            isActive('Settings') ? "bg-indigo-50 text-[#4F46E5]" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
          )}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">הגדרות</span>}
        </Link>
        <button
          onClick={onLogout}
          className={cn("w-full flex items-center rounded-xl transition-all duration-200 py-2 px-2.5 gap-3", collapsed ? "justify-center" : "", "text-gray-400 hover:text-red-500 hover:bg-red-50")}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">יציאה</span>}
        </button>
        {user && (
          <div className={cn("mt-2 pt-2 border-t border-gray-100 flex items-center gap-2.5", collapsed ? "justify-center" : "px-1")}>
            <Avatar className="w-7 h-7 flex-shrink-0 ring-1 ring-indigo-100">
              <AvatarImage src={user.profile_image} />
              <AvatarFallback className="bg-indigo-50 text-[#4F46E5] text-xs font-bold">{getUserInitials()}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">{user.full_name || user.email}</p>
                <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}