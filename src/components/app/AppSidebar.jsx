import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Logo from '@/components/common/Logo';
import { translations } from '@/components/common/i18n';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  MessageSquare,
  Sparkles,
  CreditCard,
  FileText,
  Star,
  Settings,
  LogOut,
  ChevronLeft,
  Zap,
  Brain,
  Link2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, page: 'Dashboard', label: 'לוח בקרה' },
  { key: 'leads', icon: Users, page: 'Leads', label: 'לידים' },
  { key: 'bookings', icon: CalendarDays, page: 'Bookings', label: 'הזמנות' },
  { key: 'messages', icon: MessageSquare, page: 'Messages', label: 'הודעות' },
  { key: 'cleaning', icon: Sparkles, page: 'Cleaning', label: 'ניקיון' },
  { key: 'payments', icon: CreditCard, page: 'Payments', label: 'תשלומים' },
  { key: 'contracts', icon: FileText, page: 'Contracts', label: 'חוזים' },
  { key: 'reviews', icon: Star, page: 'Reviews', label: 'ביקורות' },
  { key: 'automations', icon: Zap, page: 'Automations', label: 'אוטומציות' },
  { key: 'insights', icon: Brain, page: 'Insights', label: 'תובנות AI' },
  { key: 'integrations', icon: Link2, page: 'Integrations', label: 'אינטגרציות' },
  { key: 'settings', icon: Settings, page: 'Settings', label: 'הגדרות' }
];

export default function AppSidebar({ collapsed, onCollapse, onLogout }) {
  const location = useLocation();
  const t = translations.he;
  const currentPage = location.pathname.split('/').pop();

  return (
    <aside 
      className={cn(
        "fixed top-0 right-0 h-full bg-[#0B1220] text-white transition-all duration-300 z-40 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "h-16 flex items-center border-b border-white/10 px-4",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && <Logo variant="light" size="small" />}
        {collapsed && (
          <div className="w-8 h-8 bg-[#00D1C1] rounded-lg flex items-center justify-center">
            <span className="font-bold text-[#0B1220]">S</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onCollapse}
          className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = currentPage === item.page;
            return (
              <li key={item.key}>
                <Link
                  to={createPageUrl(item.page)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                    isActive 
                      ? "bg-[#00D1C1] text-[#0B1220] font-medium" 
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <Button
          variant="ghost"
          onClick={onLogout}
          className={cn(
            "w-full text-white/70 hover:text-white hover:bg-white/10 rounded-xl",
            collapsed ? "px-3" : "justify-start"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="mr-3">יציאה</span>}
        </Button>
      </div>
    </aside>
  );
}