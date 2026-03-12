import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, CalendarDays, MessageSquare,
  CreditCard, FileText, Star, Settings, LogOut,
  ChevronLeft, ChevronRight, Zap, Brain, Link2, Bell,
  Wallet, Home, ClipboardList, Wrench, BarChart3,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navGroups = [
  {
    label: null,
    items: [{ icon: LayoutDashboard, label: 'דשבורד', page: 'Dashboard' }],
  },
  {
    label: 'ניהול',
    items: [
      { icon: Home, label: 'נכסים', page: 'Properties' },
      { icon: Users, label: 'לידים', page: 'Leads' },
      { icon: CalendarDays, label: 'הזמנות', page: 'Bookings' },
      { icon: ClipboardList, label: 'חוזים', page: 'Contracts' },
      { icon: FileText, label: 'חשבוניות', page: 'Invoices' },
    ],
  },
  {
    label: 'תפעול',
    items: [
      { icon: Wrench, label: 'ניקיון', page: 'Cleaning' },
      { icon: MessageSquare, label: 'הודעות', page: 'Messages' },
      { icon: Star, label: 'ביקורות', page: 'Reviews' },
      { icon: Bell, label: 'בקשות שירות', page: 'ServiceRequests' },
    ],
  },
  {
    label: 'אוטומציה',
    items: [
      { icon: Brain, label: 'AI עוזר', page: 'AIAssistant' },
      { icon: Zap, label: 'אוטומציות', page: 'Automations' },
      { icon: Link2, label: 'אינטגרציות', page: 'Integrations' },
    ],
  },
  {
    label: 'חשבון',
    items: [
      { icon: Wallet, label: 'תשלומים', page: 'Payments' },
      { icon: CreditCard, label: 'מנוי', page: 'Subscription' },
      { icon: BarChart3, label: 'אנליטיקה', page: 'Analytics' },
    ],
  },
];

export default function AppSidebar({ collapsed, onCollapse, onLogout }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

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
      "h-full flex flex-col transition-all duration-300 ease-in-out relative bg-[#0B1220] border-l border-white/5",
      collapsed ? "w-[64px]" : "w-[240px]"
    )}>
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00D1C1]/50 to-transparent" />

      <div className={cn("flex items-center h-16 px-3 border-b border-white/5 flex-shrink-0", collapsed ? "justify-center" : "gap-3")}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D1C1] to-[#00a89a] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#00D1C1]/20">
          <span className="text-[#0B1220] font-bold text-sm">A</span>
        </div>
        {!collapsed && <span className="text-white font-bold text-lg tracking-tight">ATLAS</span>}
        <button
          onClick={onCollapse}
          className={cn("p-1 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 transition-all duration-200", collapsed ? "mr-0" : "mr-auto")}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className={groupIdx > 0 ? "mt-3" : ""}>
            {group.label && !collapsed && (
              <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/25 select-none">{group.label}</p>
            )}
            {group.label && collapsed && <div className="border-t border-white/5 my-2 mx-1" />}
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
                    "flex items-center rounded-lg transition-all duration-200 group relative py-2 px-2 gap-3 mb-0.5",
                    collapsed ? "justify-center" : "",
                    active ? "bg-[#00D1C1]/12 text-[#00D1C1]" : "text-white/45 hover:text-white/85 hover:bg-white/5"
                  )}
                >
                  {active && <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#00D1C1] rounded-l-full" />}
                  <div className={cn("flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0 transition-transform duration-200", active ? "text-[#00D1C1]" : "group-hover:scale-110")}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
                  {collapsed && hoveredItem === item.page && (
                    <div className="absolute right-full mr-2 px-2.5 py-1 bg-[#1a2540] text-white text-xs rounded-md whitespace-nowrap shadow-xl z-50 border border-white/10">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="flex-shrink-0 border-t border-white/5 px-2 py-3 space-y-0.5">
        <Link
          to={createPageUrl('Settings')}
          className={cn(
            "flex items-center rounded-lg transition-all duration-200 py-2 px-2 gap-3",
            collapsed ? "justify-center" : "",
            isActive('Settings') ? "bg-[#00D1C1]/12 text-[#00D1C1]" : "text-white/45 hover:text-white/85 hover:bg-white/5"
          )}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">הגדרות</span>}
        </Link>
        <button
          onClick={onLogout}
          className={cn("w-full flex items-center rounded-lg transition-all duration-200 py-2 px-2 gap-3", collapsed ? "justify-center" : "", "text-white/35 hover:text-red-400 hover:bg-red-500/8")}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">יציאה</span>}
        </button>
        {user && (
          <div className={cn("mt-2 pt-2 border-t border-white/5 flex items-center gap-2.5", collapsed ? "justify-center" : "px-1")}>
            <Avatar className="w-7 h-7 flex-shrink-0 ring-1 ring-[#00D1C1]/30">
              <AvatarImage src={user.profile_image} />
              <AvatarFallback className="bg-[#00D1C1]/20 text-[#00D1C1] text-xs font-bold">{getUserInitials()}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white/65 truncate">{user.full_name || user.email}</p>
                <p className="text-[10px] text-white/30 truncate">{user.email}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}