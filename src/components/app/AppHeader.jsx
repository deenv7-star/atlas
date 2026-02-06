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
import { Building2, User, Settings, LogOut, Bell, Plus, Menu } from 'lucide-react';

export default function AppHeader({ 
  user, 
  properties, 
  selectedPropertyId, 
  onPropertyChange,
  onLogout,
  onMenuClick
}) {
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
    <header className="h-14 sm:h-16 bg-white border-b flex items-center justify-between px-3 sm:px-4 md:px-6">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        {/* Property Selector */}
        <Select value={selectedPropertyId || ''} onValueChange={onPropertyChange}>
          <SelectTrigger className="w-[140px] sm:w-[180px] md:w-[200px] border-gray-200 rounded-lg md:rounded-xl text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
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

      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 sm:h-9 sm:w-9">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-2 sm:px-3 h-8 sm:h-9">
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                <AvatarFallback className="bg-[#00D1C1] text-[#0B1220] font-medium text-xs sm:text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs sm:text-sm font-medium text-gray-700 hidden md:block">
                {user?.full_name || 'משתמש'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem className="gap-2">
              <User className="h-4 w-4" />
              פרופיל
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <Settings className="h-4 w-4" />
              הגדרות
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-red-600" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              יציאה
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}