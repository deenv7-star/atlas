import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
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
    label: 'ניהול',
    items: [
      { icon: LayoutDashboard, label: 'דשבורד', page: 'Dashboard' },
      { icon: CalendarRange, label: 'לוח שנה', page: 'MultiCalendar' },
      { icon: CalendarDays, label: 'הזמנות', page: 'Bookings' },
    ],
  },
  {
    label: 'אורחים',
    items: [
      { icon: Users, label: 'אורחים', page: 'Leads' },
      { icon: MessageSquare, label: 'הודעות', page: 'Messages' },
      { icon: Workflow, label: 'מסע אורח', page: 'GuestJourney' },
      { icon: Globe, label: 'פורטל אורחים', page: 'GuestPortal' },
      { icon: Star, label: 'ביקורות', page: 'Reviews' },
    ],
  },
  {
    label: 'תפעול',
    items: [
      { icon: Wrench, label: 'ניקיון', page: 'Cleaning' },
      { icon: ClipboardList, label: 'חוזים', page: 'Contracts' },
    ],
  },
  {
    label: 'כספים',
    items: [
      { icon: FileText, label: 'חשבוניות', page: 'Invoices' },
      { icon: Wallet, label: 'תשלומים', page: 'Payments' },
      { icon: BarChart3, label: 'מודיעין הכנסות', page: 'RevenueIntelligence' },
      { icon: FileBarChart, label: 'דוחות בעלים', page: 'OwnerReports' },
      { icon: TrendingUp, label: 'תמחור דינאמי', page: 'DynamicPricing' },
      { icon: TrendingDown, label: 'מעקב הוצאות', page: 'ExpenseTracker' },
      { icon: Receipt, label: 'חיוב', page: 'Billing' },
      { icon: CreditCard, label: 'מנוי', page: 'Subscription' },
    ],
  },
  {
    label: 'כלים',
    items: [
      { icon: Brain, label: 'AI עוזר', page: 'AIAssistant' },
      { icon: Zap, label: 'אוטומציות', page: 'Automations' },
      { icon: Link2, label: 'אינטגרציות', page: 'Integrations' },
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
    <aside
      className={cn(
        "h-full flex flex-col transition-all duration-300 ease-in-out relative",
        collapsed ? "w-[64px]" : "w-[240px]"
      )}
      style={{
        fontFamily: "'Heebo', sans-serif",
        background: 'linear-gradient(180deg, #0B1220 0%, #0f1a2e 60%, #0B1220 100%)',
        borderLeft: '1px solid rgba(0,209,193,0.12)',
        boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.04), 4px 0 24px rgba(0,0,0,0.25)',
      }}
    >
      {/* Subtle animated top glow */}
      <div
        className="absolute top-0 inset-x-0 pointer-events-none"
        style={{
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,209,193,0.7) 40%, rgba(139,92,246,0.5) 70%, transparent 100%)',
        }}
      />

      {/* Logo + collapse button */}
      <div className={cn(
        "flex items-center h-16 px-3 flex-shrink-0",
        collapsed ? "justify-center" : "gap-3",
        "border-b border-white/[0.06]"
      )}>
        <Link to="/" title="חזרה לדף הבית">
          <img
            src="/atlas-logo-final.png"
            alt="ATLAS"
            style={{ height: collapsed ? 30 : 40, width: 'auto', objectFit: 'contain', cursor: 'pointer', filter: 'brightness(1.1)' }}
          />
        </Link>
        <motion.button
          onClick={onCollapse}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "p-1.5 rounded-lg transition-all duration-200 flex-shrink-0",
            collapsed ? "mr-0" : "mr-auto"
          )}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          {collapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </motion.button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 scrollbar-none">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className={groupIdx > 0 ? "mt-4" : ""}>
            {group.label && !collapsed && (
              <p
                className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-widest select-none"
                style={{ color: 'rgba(0,209,193,0.45)', letterSpacing: '0.12em' }}
              >
                {group.label}
              </p>
            )}
            {group.label && collapsed && (
              <div className="my-2 mx-2" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            )}
            {group.items.map((item) => {
              const active = isActive(item.page);
              const Icon = item.icon;
              return (
                <div key={item.page} className="relative">
                  <Link
                    to={createPageUrl(item.page)}
                    onMouseEnter={() => setHoveredItem(item.page)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={cn(
                      "flex items-center rounded-xl transition-all duration-200 group relative py-2.5 px-3 gap-3 mb-0.5 min-h-[42px] touch-manipulation",
                      collapsed ? "justify-center" : "",
                    )}
                    style={{
                      background: active
                        ? 'linear-gradient(135deg, rgba(0,209,193,0.20) 0%, rgba(0,209,193,0.08) 100%)'
                        : 'transparent',
                      border: active
                        ? '1px solid rgba(0,209,193,0.25)'
                        : '1px solid transparent',
                      boxShadow: active
                        ? 'inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 8px rgba(0,209,193,0.10)'
                        : 'none',
                    }}
                  >
                    {/* Active left indicator */}
                    {active && (
                      <span
                        className="absolute right-0 top-1/2 -translate-y-1/2 rounded-l-full"
                        style={{ width: '3px', height: '18px', background: '#00D1C1', boxShadow: '0 0 8px rgba(0,209,193,0.8)' }}
                      />
                    )}

                    <div className={cn(
                      "flex items-center justify-center w-5 h-5 flex-shrink-0 transition-all duration-200",
                      active ? "" : "group-hover:scale-110"
                    )}
                    style={{ color: active ? '#00D1C1' : 'rgba(255,255,255,0.45)' }}
                    >
                      <Icon className="w-[17px] h-[17px]" />
                    </div>

                    {!collapsed && (
                      <span
                        className="text-[13px] truncate font-medium transition-colors duration-200"
                        style={{ color: active ? '#e2fffe' : 'rgba(255,255,255,0.55)' }}
                      >
                        {item.label}
                      </span>
                    )}

                    {/* Tooltip on collapsed */}
                    <AnimatePresence>
                      {collapsed && hoveredItem === item.page && (
                        <motion.div
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-full mr-2 px-2.5 py-1.5 text-xs rounded-lg whitespace-nowrap z-50 pointer-events-none"
                          style={{
                            background: '#0B1220',
                            border: '1px solid rgba(0,209,193,0.25)',
                            color: '#e2fffe',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                          }}
                        >
                          {item.label}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Link>
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 px-2 py-3 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link
          to={createPageUrl('Settings')}
          className={cn(
            "flex items-center rounded-xl transition-all duration-200 py-2.5 px-3 gap-3 min-h-[42px] touch-manipulation group",
            collapsed ? "justify-center" : "",
          )}
          style={{
            background: isActive('Settings') ? 'rgba(0,209,193,0.12)' : 'transparent',
            color: isActive('Settings') ? '#00D1C1' : 'rgba(255,255,255,0.40)',
          }}
        >
          <Settings className="w-[17px] h-[17px] flex-shrink-0 group-hover:rotate-45 transition-transform duration-300" />
          {!collapsed && <span className="text-[13px] font-medium">הגדרות</span>}
        </Link>

        <button
          onClick={onLogout}
          className={cn(
            "w-full flex items-center rounded-xl transition-all duration-200 py-2.5 px-3 gap-3 min-h-[42px] touch-manipulation group",
            collapsed ? "justify-center" : ""
          )}
          style={{ color: 'rgba(255,255,255,0.30)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.30)'}
        >
          <LogOut className="w-[17px] h-[17px] flex-shrink-0" />
          {!collapsed && <span className="text-[13px] font-medium">יציאה</span>}
        </button>

        {user && (
          <div
            className={cn(
              "mt-2 pt-2 flex items-center gap-2.5",
              collapsed ? "justify-center" : "px-1"
            )}
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Avatar className="w-7 h-7 flex-shrink-0" style={{ boxShadow: '0 0 0 2px rgba(0,209,193,0.35)' }}>
              <AvatarImage src={user.profile_image} />
              <AvatarFallback style={{ background: 'rgba(0,209,193,0.15)', color: '#00D1C1', fontSize: '11px', fontWeight: 700 }}>
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {user.full_name || user.email}
                </p>
                <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {user.email}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
