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
  Link2,
  Bell,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navGroups = [
  {
    label: 'ניהול',
    items: [
      { key: 'dashboard', icon: LayoutDashboard, page: 'Dashboard', label: 'לוח בקרה' },
      { key: 'leads', icon: Users, page: 'Leads', label: 'לידים' },
      { key: 'bookings', icon: CalendarDays, page: 'Bookings', label: 'הזמנות' },
    ],
  },
  {
    label: 'תפעול',
    items: [
      { key: 'messages', icon: MessageSquare, page: 'Messages', label: 'הודעות' },
      { key: 'cleaning', icon: Sparkles, page: 'Cleaning', label: 'ניקיון' },
      { key: 'service-requests', icon: Bell, page: 'ServiceRequests', label: 'שירות חדרים' },
    ],
  },
  {
    label: 'כספים',
    items: [
      { key: 'invoices', icon: FileText, page: 'Invoices', label: 'חשבוניות' },
      { key: 'payments', icon: CreditCard, page: 'Payments', label: 'תשלומים' },
      { key: 'contracts', icon: FileText, page: 'Contracts', label: 'חוזים' },
    ],
  },
  {
    label: 'כלים',
    items: [
      { key: 'reviews', icon: Star, page: 'Reviews', label: 'ביקורות' },
      { key: 'automations', icon: Zap, page: 'Automations', label: 'אוטומציות' },
      { key: 'ai-assistant', icon: Brain, page: 'AIAssistant', label: 'עוזר AI' },
      { key: 'integrations', icon: Link2, page: 'Integrations', label: 'אינטגרציות' },
    ],
  },
  {
    label: 'חשבון',
    items: [
      { key: 'billing', icon: Wallet, page: 'Billing', label: 'מנוי וחיוב' },
      { key: 'settings', icon: Settings, page: 'Settings', label: 'הגדרות' },
    ],
  },
];

export default function AppSidebar({ collapsed, onCollapse, onLogout }) {
  const location = useLocation();
  const t = translations.he;
  const currentPage = location.pathname.split('/').pop();

  return (
    <aside
      className={cn(
        "fixed top-0 right-0 h-full text-white transition-all duration-300 z-40 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
      style={{
        background: 'linear-gradient(180deg, #0B1220 0%, #0f1a2e 100%)',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.20)',
      }}
    >
      {/* ── Logo / header ─────────────────────────────────────── */}
      <div className={cn(
        "h-16 flex items-center px-4 flex-shrink-0",
        collapsed ? "justify-center" : "justify-between"
      )}
           style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{
                   background: 'linear-gradient(135deg, #00D1C1 0%, #00a8a0 100%)',
                   boxShadow: '0 4px 12px rgba(0,209,193,0.35)',
                 }}>
              <span className="font-extrabold text-[#0B1220] text-sm">A</span>
            </div>
            <Logo variant="light" size="small" />
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
               style={{
                 background: 'linear-gradient(135deg, #00D1C1 0%, #00a8a0 100%)',
                 boxShadow: '0 4px 12px rgba(0,209,193,0.35)',
               }}>
            <span className="font-extrabold text-[#0B1220] text-sm">A</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onCollapse}
          className={cn(
            "h-7 w-7 rounded-lg transition-all",
            collapsed && "hidden"
          )}
          style={{
            color: 'rgba(255,255,255,0.35)',
            background: 'transparent',
          }}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {/* ── Navigation ────────────────────────────────────────── */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
        <div className={cn("space-y-6", collapsed ? "px-2" : "px-3")}>
          {navGroups.map((group) => {
            const hasActive = group.items.some(item => currentPage === item.page);
            return (
              <div key={group.label}>
                {/* Group label */}
                {!collapsed && (
                  <div className="px-3 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em]"
                          style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {group.label}
                    </span>
                  </div>
                )}
                {collapsed && (
                  <div className="h-px mx-2 mb-2"
                       style={{ background: 'rgba(255,255,255,0.06)' }} />
                )}

                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = currentPage === item.page;
                    return (
                      <li key={item.key}>
                        <Link
                          to={createPageUrl(item.page)}
                          title={collapsed ? item.label : undefined}
                          className={cn(
                            "flex items-center gap-3 rounded-xl transition-all duration-200 group relative hover:bg-white/5",
                            collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5",
                            isActive && "shadow-lg"
                          )}
                          style={
                            isActive
                              ? {
                                  background: 'rgba(0,209,193,0.15)',
                                  color: '#00D1C1',
                                  boxShadow: '0 0 20px rgba(0,209,193,0.2)',
                                }
                              : {
                                  color: 'rgba(255,255,255,0.50)',
                                }
                          }
                        >
                          {/* Active left bar */}
                          {isActive && !collapsed && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full animate-pulse"
                                 style={{ 
                                   background: 'linear-gradient(180deg, #00D1C1 0%, #00B8A9 100%)',
                                   boxShadow: '0 0 10px rgba(0,209,193,0.5)'
                                 }} />
                          )}

                          {/* Icon */}
                          <div className={cn(
                            "flex items-center justify-center flex-shrink-0 rounded-lg transition-all duration-150",
                            collapsed ? "w-9 h-9" : "w-7 h-7",
                          )}
                               style={
                                 isActive
                                   ? {
                                       background: 'rgba(0,209,193,0.15)',
                                       boxShadow: '0 0 0 1px rgba(0,209,193,0.20)',
                                     }
                                   : {}
                               }>
                            <item.icon className={cn(
                              "flex-shrink-0 transition-colors",
                              collapsed ? "h-4.5 w-4.5" : "h-4 w-4",
                            )} />
                          </div>

                          {!collapsed && (
                            <span className="text-sm font-semibold transition-colors">{item.label}</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>

      {/* ── Logout ────────────────────────────────────────────── */}
      <div className={cn("p-3 flex-shrink-0", collapsed ? "px-2" : "px-3")}
           style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={onLogout}
          className={cn(
            "w-full flex items-center rounded-xl py-2.5 transition-all group",
            collapsed ? "justify-center px-0" : "gap-3 px-3"
          )}
          style={{ color: 'rgba(255,255,255,0.35)' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.35)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <div className={cn(
            "flex items-center justify-center rounded-lg flex-shrink-0 transition-all",
            collapsed ? "w-9 h-9" : "w-7 h-7",
          )}>
            <LogOut className="h-4 w-4" />
          </div>
          {!collapsed && <span className="text-sm font-semibold">יציאה</span>}
        </button>
      </div>
    </aside>
  );
}