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
import { Building2, User, Settings, LogOut, Bell, Plus } from 'lucide-react';

export default function AppHeader({ 
  user, 
  properties, 
  selectedPropertyId, 
  onPropertyChange,
  onLogout 
}) {
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {/* Property Selector */}
        <Select value={selectedPropertyId || ''} onValueChange={onPropertyChange}>
          <SelectTrigger className="w-[200px] border-gray-200 rounded-xl">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
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

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5 text-gray-500" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 rounded-xl px-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-[#00D1C1] text-[#0B1220] font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
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