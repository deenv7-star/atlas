import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Building2, User, Settings, LogOut, Bell, Menu, ArrowRightIcon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AppHeader({
  user,
  properties,
  selectedPropertyId,
  onPropertyChange,
  onLogout,
  onMenuClick
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  const pathParts = location.pathname.split('/').filter(Boolean);
  const isDetailRoute = pathParts.length > 1;

  const pageNames = {
    'Bookings': 'הזמנה',
    'Leads': 'ליד',
    'Payments': 'תשלום',
    'Cleaning': 'משימת ניקיון',
    'Messages': 'הודעה',
    'Contracts': 'חוזה',
    'Reviews': 'ביקורת'
  };

  const currentPage = pathParts[0];
  const pageTitle = pageNames[currentPage] || currentPage;

  return (
    <header
      className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 md:px-6"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(226,232,240,0.7)',
        boxShadow: '0 1px 8px rgba(11,18,32,0.05)',
      }}
    >
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile: Back button on detail routes */}
        {isDetailRoute ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 rounded-xl"
              style={{ color: '#0B1220' }}
              onClick={() => navigate(-1)}
            >
              <ArrowRightIcon className="h-4.5 w-4.5" />
            </Button>
            <h1 className="text-base font-bold text-[#0B1220] md:hidden">{pageTitle}</h1>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 rounded-xl"
            style={{ color: '#6b7280' }}
            onClick={onMenuClick}
          >
            <Menu className="h-4.5 w-4.5" />
          </Button>
        )}

        {/* Property Selector */}
        <Select value={selectedPropertyId || ''} onValueChange={onPropertyChange}>
          <SelectTrigger
            className={`w-[140px] sm:w-[180px] md:w-[200px] rounded-xl text-xs sm:text-sm font-semibold select-none ${isDetailRoute ? 'hidden md:flex' : ''}`}
            style={{
              background: 'rgba(244,246,251,0.9)',
              border: '1px solid rgba(226,232,240,0.8)',
              boxShadow: '0 1px 4px rgba(11,18,32,0.05)',
              color: '#374151',
            }}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Building2 className="h-3.5 w-3.5 text-[#00D1C1]" />
              <SelectValue placeholder="בחר נכס" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
            {properties.length === 0 && (
              <SelectItem value="none" disabled>
                אין נכסים
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Notification bell */}
        <button
          className="relative flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl transition-all"
          style={{ background: 'rgba(244,246,251,0.9)', border: '1px solid rgba(226,232,240,0.8)' }}
        >
          <Bell className="h-4 w-4 text-gray-500" />
          {/* Unread dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00D1C1]"
                style={{ boxShadow: '0 0 0 2px rgba(255,255,255,0.9)' }} />
        </button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 rounded-xl px-2 sm:px-2.5 h-8 sm:h-9 transition-all"
              style={{
                background: 'rgba(244,246,251,0.9)',
                border: '1px solid rgba(226,232,240,0.8)',
                boxShadow: '0 1px 4px rgba(11,18,32,0.05)',
              }}
            >
              <Avatar className="h-6 w-6 sm:h-7 sm:w-7">
                <AvatarFallback
                  className="font-bold text-xs sm:text-sm"
                  style={{
                    background: 'linear-gradient(135deg, #00D1C1 0%, #00a8a0 100%)',
                    color: '#0B1220',
                  }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs sm:text-sm font-semibold text-gray-700 hidden md:block">
                {user?.full_name || 'משתמש'}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 rounded-xl shadow-lg"
                               style={{ border: '1px solid rgba(226,232,240,0.8)' }}>
            <DropdownMenuItem className="gap-2 rounded-lg font-medium text-sm">
              <User className="h-4 w-4 text-gray-400" />
              פרופיל
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 rounded-lg font-medium text-sm" onClick={() => navigate(createPageUrl('Settings'))}>
              <Settings className="h-4 w-4 text-gray-400" />
              הגדרות
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 rounded-lg font-medium text-sm text-red-500 focus:text-red-600" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              יציאה
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
