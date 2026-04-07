import React from 'react';
import { motion } from 'framer-motion';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import {
  Menu, Bell, Settings, LogOut, User, ChevronDown,
  Building2, Home,
} from 'lucide-react';

const pageNames = {
  Dashboard: 'דשבורד',
  Bookings: 'הזמנות',
  Leads: 'לידים',
  Messages: 'הודעות',
  Reviews: 'ביקורות',
  Invoices: 'חשבוניות',
  Payments: 'תשלומים',
  Contracts: 'חוזים',
  Cleaning: 'ניקיון',
  ServiceRequests: 'בקשות שירות',
  Settings: 'הגדרות',
  Subscription: 'מנוי',
  Billing: 'חיוב',
  Integrations: 'אינטגרציות',
  BookingDetail: 'פרטי הזמנה',
  LeadDetail: 'פרטי ליד',
  Automations: 'אוטומציות',
  AIAssistant: 'AI עוזר',
  ExpenseTracker: 'מעקב הוצאות',
  DynamicPricing: 'תמחור דינאמי',
  GuestPortal: 'פורטל אורחים',
  RevenueIntelligence: 'מודיעין הכנסות',
  MultiCalendar: 'לוח שנה מרכזי',
  OwnerReports: 'דוחות בעלים',
  GuestJourney: 'מסע אורח',
  PlatformAdmin: 'ניהול פלטפורמה',
};

export default function AppHeader({ user, currentPageName, onMenuClick, selectedPropertyId, onPropertyChange }) {
  const { logout } = useAuth();

  const { data: properties = [] } = useQuery({
    queryKey: ['properties-header'],
    queryFn: () => base44.entities.Property.list(),
    staleTime: 5 * 60 * 1000,
  });

  const getUserInitials = () => {
    if (!user) return 'U';
    const name = user.full_name || user.email || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const pageTitle = pageNames[currentPageName] || currentPageName;

  return (
    <header
      className="min-h-[56px] h-14 flex-shrink-0 flex items-center px-4 gap-3 z-10 safe-top relative"
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.8), 0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* Chromatic accent line */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,209,193,0.35) 35%, rgba(11,18,32,0.12) 65%, transparent 100%)',
        }}
      />

      {/* Mobile menu button */}
      <motion.button
        onClick={onMenuClick}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'tween', duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
        className="md:hidden min-w-[40px] min-h-[40px] p-2 rounded-xl flex items-center justify-center touch-manipulation bg-black/[0.05] border border-black/[0.07] text-gray-700 transition-[background-color] duration-150 atlas-ease-out-trans [@media(hover:hover)_and_(pointer:fine)]:hover:bg-black/[0.08]"
      >
        <Menu className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
      </motion.button>

      {/* Page title */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <h1
          className="text-base md:text-[17px] font-extrabold truncate tracking-tight"
          style={{
            color: 'var(--atlas-ink, #0B1220)',
            letterSpacing: '-0.02em',
          }}
        >
          {pageTitle}
        </h1>
      </div>

      {/* Property selector */}
      {properties.length > 0 && (
        <div className="hidden sm:block">
          <Select
            value={selectedPropertyId || 'all'}
            onValueChange={(val) => onPropertyChange(val === 'all' ? null : val)}
          >
            <SelectTrigger
              className="h-8 text-xs min-w-[140px] max-w-[180px] gap-1.5 rounded-lg"
              style={{
                background: 'rgba(0,209,193,0.06)',
                border: '1px solid rgba(0,209,193,0.20)',
                color: '#0B1220',
              }}
            >
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#00D1C1' }} />
              <SelectValue placeholder="כל הנכסים" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הנכסים</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1.5">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'tween', duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
              className="relative min-w-[36px] min-h-[36px] p-2 rounded-xl flex items-center justify-center touch-manipulation bg-black/[0.04] border border-black/[0.06] text-gray-500 transition-[background-color] duration-150 atlas-ease-out-trans [@media(hover:hover)_and_(pointer:fine)]:hover:bg-black/[0.07]"
            >
              <Bell className="w-4 h-4" />
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">התראות</p>
            </div>
            <div className="py-6 text-center px-3">
              <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-500">הכל שקט כרגע</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">כשמשהו חשוב יקרה — תקבל עדכון כאן.</p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'tween', duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl touch-manipulation bg-[rgba(0,209,193,0.08)] border border-[rgba(0,209,193,0.18)] transition-[background-color] duration-150 atlas-ease-out-trans [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[rgba(0,209,193,0.14)]"
              >
                <Avatar className="w-6 h-6">
                  <AvatarImage src={user.profile_image} />
                  <AvatarFallback
                    style={{
                      background: 'rgba(0,209,193,0.15)',
                      color: '#00D1C1',
                      fontSize: '10px',
                      fontWeight: 700,
                    }}
                  >
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-3 h-3 hidden sm:block" style={{ color: '#00a89a' }} />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-800 truncate">{user.full_name || 'משתמש'}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <DropdownMenuItem asChild>
                <Link to="/" className="flex items-center gap-2 cursor-pointer">
                  <Home className="w-4 h-4 text-gray-400" />
                  דף הבית
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl('Settings')} className="flex items-center gap-2 cursor-pointer">
                  <Settings className="w-4 h-4 text-gray-400" />
                  הגדרות
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl('Subscription')} className="flex items-center gap-2 cursor-pointer">
                  <User className="w-4 h-4 text-gray-400" />
                  מנוי
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50 flex items-center gap-2 cursor-pointer"
                onClick={() => logout()}
              >
                <LogOut className="w-4 h-4" />
                יציאה
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
