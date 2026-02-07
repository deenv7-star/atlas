import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PullToRefresh from '@/components/common/PullToRefresh';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  List,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Users,
  Wallet,
  MessageSquare,
  Sparkles,
  FileText,
  Star
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, isWithinInterval, differenceInDays, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
import BookingDetails from '@/components/bookings/BookingDetails';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  CONFIRMED: 'bg-green-100 text-green-700 border-green-200',
  CHECKED_IN: 'bg-blue-100 text-blue-700 border-blue-200',
  CHECKED_OUT: 'bg-gray-100 text-gray-700 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200'
};

const statusLabels = {
  PENDING: 'ממתין',
  CONFIRMED: 'מאושר',
  CHECKED_IN: 'צ׳ק-אין',
  CHECKED_OUT: 'צ׳ק-אאוט',
  CANCELLED: 'מבוטל'
};

export default function Bookings({ user, selectedPropertyId, orgId, properties }) {
  const [view, setView] = useState('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  // Check for booking ID in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('id');
    if (bookingId && bookings?.length > 0) {
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        setSelectedBooking(booking);
      }
    }
  }, []);

  const [newBooking, setNewBooking] = useState({
    guest_name: '',
    phone: '',
    email: '',
    checkin_date: '',
    checkout_date: '',
    guests_count: 2,
    total_amount: 0,
    notes: '',
    status: 'PENDING'
  });

  // Fetch bookings
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings', orgId, selectedPropertyId],
    queryFn: () => orgId ? base44.entities.Booking.filter(
      selectedPropertyId 
        ? { org_id: orgId, property_id: selectedPropertyId }
        : { org_id: orgId },
      '-created_date'
    ) : [],
    enabled: !!orgId
  });

  // Create booking mutation
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Booking.create({
      ...data,
      org_id: orgId,
      property_id: selectedPropertyId,
      currency: 'ILS'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setIsCreateOpen(false);
      setNewBooking({
        guest_name: '',
        phone: '',
        email: '',
        checkin_date: '',
        checkout_date: '',
        guests_count: 2,
        total_amount: 0,
        notes: '',
        status: 'PENDING'
      });
    }
  });

  // Check for double booking
  const checkDoubleBooking = (checkin, checkout, excludeId = null) => {
    if (!checkin || !checkout || !selectedPropertyId) return false;
    
    const newCheckin = parseISO(checkin);
    const newCheckout = parseISO(checkout);
    
    return bookings.some(booking => {
      if (booking.id === excludeId) return false;
      if (booking.status === 'CANCELLED') return false;
      if (booking.property_id !== selectedPropertyId) return false;
      
      const existingCheckin = parseISO(booking.checkin_date);
      const existingCheckout = parseISO(booking.checkout_date);
      
      // Check if ranges overlap
      return (newCheckin < existingCheckout && newCheckout > existingCheckin);
    });
  };

  const hasConflict = checkDoubleBooking(newBooking.checkin_date, newBooking.checkout_date);

  // Calendar data
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const weekDays = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

  // Get bookings for a specific day
  const getBookingsForDay = (day) => {
    return bookings.filter(booking => {
      if (booking.status === 'CANCELLED') return false;
      if (!booking.checkin_date || !booking.checkout_date) return false;
      
      const checkin = parseISO(booking.checkin_date);
      const checkout = parseISO(booking.checkout_date);
      
      return isWithinInterval(day, { start: checkin, end: addDays(checkout, -1) }) ||
             isSameDay(day, checkin) || 
             isSameDay(day, checkout);
    });
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['bookings'] });
  };

  const handleBookingClick = (bookingId) => {
    navigate(`${createPageUrl('Bookings')}/${bookingId}`);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6">
        {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1220]">הזמנות</h1>
          <p className="text-gray-500">נהל את כל ההזמנות בנכסים שלך - צור הזמנות חדשות, עקוב אחרי סטטוסים, הוסף תשלומים ושלח הודעות לאורחים.</p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={view} onValueChange={setView}>
            <TabsList className="rounded-xl">
              <TabsTrigger value="calendar" className="rounded-lg gap-2">
                <CalendarIcon className="h-4 w-4" />
                יומן
              </TabsTrigger>
              <TabsTrigger value="list" className="rounded-lg gap-2">
                <List className="h-4 w-4" />
                רשימה
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl gap-2"
          >
            <Plus className="h-4 w-4" />
            הזמנה חדשה
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      {view === 'calendar' && (
        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {format(currentMonth, 'MMMM yyyy', { locale: he })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                  className="rounded-lg"
                >
                  היום
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Week days header */}
            <div className="grid grid-cols-7 mb-2">
              {weekDays.map((day, i) => (
                <div key={i} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month start */}
              {[...Array(monthStart.getDay())].map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              
              {/* Days of month */}
              {daysInMonth.map((day, i) => {
                const dayBookings = getBookingsForDay(day);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div 
                    key={i}
                    className={`aspect-square p-1 border rounded-lg transition-colors ${
                      isToday ? 'bg-[#00D1C1]/10 border-[#00D1C1]' : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`text-sm mb-1 ${isToday ? 'font-bold text-[#00D1C1]' : 'text-gray-700'}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayBookings.slice(0, 2).map(booking => (
                        <div 
                          key={booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          className={`text-xs truncate px-1 py-0.5 rounded cursor-pointer ${
                            booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                            booking.status === 'CHECKED_IN' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {booking.guest_name}
                        </div>
                      ))}
                      {dayBookings.length > 2 && (
                        <div className="text-xs text-gray-400 px-1">
                          +{dayBookings.length - 2} עוד
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {view === 'list' && (
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">טוען...</div>
            ) : bookings.length === 0 ? (
              <div className="p-8 text-center text-gray-500">אין הזמנות עדיין</div>
            ) : (
              <div className="divide-y">
                {bookings.map(booking => {
                  const nights = booking.checkin_date && booking.checkout_date 
                    ? differenceInDays(parseISO(booking.checkout_date), parseISO(booking.checkin_date))
                    : 0;
                  
                  return (
                    <div 
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#00D1C1]/10 rounded-xl flex items-center justify-center">
                            <span className="text-lg font-bold text-[#00D1C1]">
                              {booking.guest_name?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-[#0B1220]">{booking.guest_name}</p>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <span>{booking.checkin_date && format(parseISO(booking.checkin_date), 'd/M')} - {booking.checkout_date && format(parseISO(booking.checkout_date), 'd/M')}</span>
                              <span>•</span>
                              <span>{nights} לילות</span>
                              <span>•</span>
                              <span>{booking.guests_count} אורחים</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {booking.total_amount > 0 && (
                            <span className="font-semibold">₪{booking.total_amount?.toLocaleString()}</span>
                          )}
                          <Badge className={`${statusColors[booking.status]} border`}>
                            {statusLabels[booking.status]}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking Details Sheet */}
      {selectedBooking && (
        <BookingDetails 
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          orgId={orgId}
        />
      )}

      {/* Create Booking Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>הזמנה חדשה</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {hasConflict && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm flex items-center gap-2">
                <span>⚠️</span>
                <span>קיימת הזמנה בתאריכים אלו. בחר תאריכים אחרים.</span>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>שם האורח</Label>
                <Input 
                  value={newBooking.guest_name}
                  onChange={(e) => setNewBooking({ ...newBooking, guest_name: e.target.value })}
                  className="mt-1 rounded-xl"
                  placeholder="שם מלא"
                />
              </div>
              <div>
                <Label>טלפון</Label>
                <Input 
                  value={newBooking.phone}
                  onChange={(e) => setNewBooking({ ...newBooking, phone: e.target.value })}
                  className="mt-1 rounded-xl"
                  placeholder="050-000-0000"
                  dir="ltr"
                />
              </div>
              <div>
                <Label>אימייל</Label>
                <Input 
                  value={newBooking.email}
                  onChange={(e) => setNewBooking({ ...newBooking, email: e.target.value })}
                  className="mt-1 rounded-xl"
                  placeholder="email@example.com"
                  dir="ltr"
                />
              </div>
              <div>
                <Label>תאריך כניסה</Label>
                <Input 
                  type="date"
                  value={newBooking.checkin_date}
                  onChange={(e) => setNewBooking({ ...newBooking, checkin_date: e.target.value })}
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label>תאריך יציאה</Label>
                <Input 
                  type="date"
                  value={newBooking.checkout_date}
                  onChange={(e) => setNewBooking({ ...newBooking, checkout_date: e.target.value })}
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label>מספר אורחים</Label>
                <Input 
                  type="number"
                  value={newBooking.guests_count}
                  onChange={(e) => setNewBooking({ ...newBooking, guests_count: parseInt(e.target.value) || 1 })}
                  className="mt-1 rounded-xl"
                  min={1}
                />
              </div>
              <div>
                <Label>סכום כולל (₪)</Label>
                <Input 
                  type="number"
                  value={newBooking.total_amount}
                  onChange={(e) => setNewBooking({ ...newBooking, total_amount: parseFloat(e.target.value) || 0 })}
                  className="mt-1 rounded-xl"
                  min={0}
                />
              </div>
              <div className="col-span-2">
                <Label>הערות</Label>
                <Textarea 
                  value={newBooking.notes}
                  onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                  className="mt-1 rounded-xl"
                  rows={3}
                  placeholder="הערות נוספות..."
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl">
              ביטול
            </Button>
            <Button 
              onClick={() => createMutation.mutate(newBooking)}
              disabled={!newBooking.guest_name || !newBooking.phone || !newBooking.checkin_date || !newBooking.checkout_date || hasConflict || createMutation.isPending}
              className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl"
            >
              {createMutation.isPending ? 'שומר...' : 'צור הזמנה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PullToRefresh>
  );
}