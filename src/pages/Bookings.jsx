import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  CalendarDays, Plus, Search, Filter, MoreVertical,
  User, Building2, Clock, ChevronRight, Edit, Trash2,
  X, Check,
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'ממתין', color: 'bg-amber-100 text-amber-700' },
  { value: 'APPROVED', label: 'מאושר', color: 'bg-green-100 text-green-700' },
  { value: 'CONFIRMED', label: 'מאושר סופית', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'CHECKED_IN', label: 'נכנס', color: 'bg-blue-100 text-blue-700' },
  { value: 'CHECKED_OUT', label: 'יצא', color: 'bg-gray-100 text-gray-600' },
  { value: 'CANCELLED', label: 'בוטל', color: 'bg-red-100 text-red-700' },
  { value: 'WAITLIST', label: 'המתנה', color: 'bg-purple-100 text-purple-700' },
];

const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s]));

const emptyBooking = {
  guest_name: '',
  guest_email: '',
  guest_phone: '',
  property_id: '',
  check_in_date: '',
  check_out_date: '',
  nights: 1,
  adults: 2,
  children: 0,
  total_price: '',
  status: 'PENDING',
  notes: '',
};

export default function BookingsPage({ user, selectedPropertyId }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [form, setForm] = useState(emptyBooking);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings', selectedPropertyId],
    queryFn: () => base44.entities.Booking.list(selectedPropertyId ? { property_id: selectedPropertyId } : {}),
    staleTime: 2 * 60 * 1000,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties-list'],
    queryFn: () => base44.entities.Property.list(),
    staleTime: 10 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Booking.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast({ title: 'הזמנה נוצרה בהצלחה' });
      setShowDialog(false);
      setForm(emptyBooking);
    },
    onError: () => toast({ title: 'שגיאה ביצירת ההזמנה', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Booking.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast({ title: 'הזמנה עודכנה' });
      setShowDialog(false);
    },
    onError: () => toast({ title: 'שגיאה בעדכון', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Booking.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast({ title: 'הזמנה נמחקה' });
    },
    onError: () => toast({ title: 'שגיאה במחיקה', variant: 'destructive' }),
  });

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      const matchSearch = !searchTerm ||
        (b.guest_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.guest_email || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  const openNew = () => {
    setEditingBooking(null);
    setForm(emptyBooking);
    setShowDialog(true);
  };

  const openEdit = (booking) => {
    setEditingBooking(booking);
    setForm({
      guest_name: booking.guest_name || '',
      guest_email: booking.guest_email || '',
      guest_phone: booking.guest_phone || '',
      property_id: booking.property_id || '',
      check_in_date: booking.check_in_date || '',
      check_out_date: booking.check_out_date || '',
      nights: booking.nights || 1,
      adults: booking.adults || 2,
      children: booking.children || 0,
      total_price: booking.total_price || '',
      status: booking.status || 'PENDING',
      notes: booking.notes || '',
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.guest_name || !form.check_in_date) {
      toast({ title: 'נא למלא שם אורח ותאריך כניסה', variant: 'destructive' });
      return;
    }
    if (editingBooking) {
      updateMutation.mutate({ id: editingBooking.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const getNights = () => {
    try {
      if (form.check_in_date && form.check_out_date) {
        return differenceInDays(parseISO(form.check_out_date), parseISO(form.check_in_date));
      }
    } catch {}
    return 0;
  };

  const counts = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter(b => ['APPROVED', 'CONFIRMED'].includes(b.status)).length;
    const pending = bookings.filter(b => b.status === 'PENDING').length;
    return { total, confirmed, pending };
  }, [bookings]);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#00D1C1]" />
            הזמנות
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{counts.total} הזמנות סה"כ</p>
        </div>
        <Button
          onClick={openNew}
          className="gap-1.5 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold h-9 text-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          הזמנה חדשה
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'סה"כ', value: counts.total, color: 'text-gray-700' },
          { label: 'מאושרות', value: counts.confirmed, color: 'text-emerald-600' },
          { label: 'ממתינות', value: counts.pending, color: 'text-amber-600' },
        ].map(stat => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="חפש לפי שם אורח..."
            className="h-9 pr-9 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 text-sm w-full sm:w-40">
            <Filter className="w-3.5 h-3.5 ml-1 text-gray-400" />
            <SelectValue placeholder="כל הסטטוסים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bookings list */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">
                {searchTerm || statusFilter !== 'all' ? 'לא נמצאו תוצאות' : 'אין הזמנות עדיין'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={openNew} size="sm" className="mt-3 gap-1.5 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold">
                  <Plus className="w-3.5 h-3.5" />
                  הוסף הזמנה ראשונה
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((booking) => {
                const statusInfo = STATUS_MAP[booking.status] || STATUS_MAP.PENDING;
                const property = properties.find(p => p.id === booking.property_id);
                return (
                  <div
                    key={booking.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50/80 transition-colors group"
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-blue-600">
                      {(booking.guest_name || 'א')[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {booking.guest_name || 'אורח'}
                        </p>
                        <Badge className={`${statusInfo.color} text-[10px] py-0 px-1.5 border-0 flex-shrink-0`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {booking.check_in_date && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <CalendarDays className="w-3 h-3" />
                            {format(parseISO(booking.check_in_date), 'dd/MM/yy')}
                            {booking.check_out_date && (
                              <> → {format(parseISO(booking.check_out_date), 'dd/MM/yy')}</>
                            )}
                          </span>
                        )}
                        {booking.nights && (
                          <span className="text-xs text-gray-400">{booking.nights} לילות</span>
                        )}
                        {property && (
                          <span className="flex items-center gap-1 text-xs text-gray-400 truncate">
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{property.name}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    {booking.total_price && (
                      <p className="text-sm font-semibold text-gray-700 flex-shrink-0">
                        ₪{parseFloat(booking.total_price).toLocaleString()}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700"
                        onClick={() => openEdit(booking)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                        onClick={() => {
                          if (confirm('למחוק הזמנה זו?')) deleteMutation.mutate(booking.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingBooking ? 'עריכת הזמנה' : 'הזמנה חדשה'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">שם אורח *</Label>
              <Input value={form.guest_name} onChange={e => setForm(p => ({ ...p, guest_name: e.target.value }))} placeholder="שם מלא" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">אימייל</Label>
              <Input value={form.guest_email} onChange={e => setForm(p => ({ ...p, guest_email: e.target.value }))} placeholder="email@example.com" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">טלפון</Label>
              <Input value={form.guest_phone} onChange={e => setForm(p => ({ ...p, guest_phone: e.target.value }))} placeholder="050-0000000" className="h-9 text-sm" />
            </div>
            {properties.length > 0 && (
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">נכס</Label>
                <Select value={form.property_id} onValueChange={val => setForm(p => ({ ...p, property_id: val }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="בחר נכס" /></SelectTrigger>
                  <SelectContent>
                    {properties.map(prop => (
                      <SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">תאריך כניסה *</Label>
              <Input type="date" value={form.check_in_date} onChange={e => setForm(p => ({ ...p, check_in_date: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">תאריך יציאה</Label>
              <Input type="date" value={form.check_out_date} onChange={e => setForm(p => ({ ...p, check_out_date: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">מחיר כולל (₪)</Label>
              <Input type="number" value={form.total_price} onChange={e => setForm(p => ({ ...p, total_price: e.target.value }))} placeholder="0" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">סטטוס</Label>
              <Select value={form.status} onValueChange={val => setForm(p => ({ ...p, status: val }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {getNights() > 0 && (
              <div className="col-span-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                {getNights()} לילות
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDialog(false)} className="h-9">ביטול</Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="h-9 gap-1.5 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <div className="w-4 h-4 border-2 border-[#0B1220] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {editingBooking ? 'שמור שינויים' : 'צור הזמנה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}