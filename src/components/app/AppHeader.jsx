import React from 'react';
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
    <header className="min-h-[56px] h-14 flex-shrink-0 bg-white border-b border-gray-100 flex items-center px-4 gap-3 z-10 safe-top">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="md:hidden min-w-[44px] min-h-[44px] p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center justify-center touch-manipulation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <h1 className="text-base font-semibold text-gray-800 truncate">{pageTitle}</h1>
      </div>

      {/* Property selector */}
      {properties.length > 0 && (
        <div className="hidden sm:block">
          <Select
            value={selectedPropertyId || 'all'}
            onValueChange={(val) => onPropertyChange(val === 'all' ? null : val)}
          >
            <SelectTrigger className="h-8 text-xs border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors min-w-[140px] max-w-[180px] gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
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
            <button className="relative min-w-[44px] min-h-[44px] p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center justify-center touch-manipulation">
              <Bell className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">התראות</p>
            </div>
            <div className="py-6 text-center">
              <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">אין התראות חדשות</p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={user.profile_image} />
                  <AvatarFallback className="bg-[#00D1C1]/15 text-[#00D1C1] text-xs font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block" />
              </button>
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
