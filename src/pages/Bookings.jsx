import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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
  CalendarDays, Plus, Search, Building2, Edit, Trash2, Check,
  Clock, CheckCircle2, XCircle, UserCheck, Users,
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'PENDING',    label: 'ממתין',       color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-400' },
  { value: 'APPROVED',   label: 'מאושר',        color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  { value: 'CONFIRMED',  label: 'מאושר סופית',  color: 'bg-green-100 text-green-700',   dot: 'bg-green-400' },
  { value: 'CHECKED_IN', label: 'נכנס',         color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-400' },
  { value: 'CHECKED_OUT',label: 'יצא',          color: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400' },
  { value: 'CANCELLED',  label: 'בוטל',         color: 'bg-red-100 text-red-600',       dot: 'bg-red-400' },
  { value: 'WAITLIST',   label: 'המתנה',        color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400' },
];
const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s]));

const emptyBooking = {
  guest_name: '', guest_email: '', guest_phone: '',
  property_id: '', check_in_date: '', check_out_date: '',
  nights: 1, adults: 2, children: 0,
  total_price: '', status: 'PENDING', notes: '',
};

export default function BookingsPage({ user, selectedPropertyId }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDialog, setShowDialog]     = useState(false);
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
    onSuccess: () => { queryClient.invalidateQueries(['bookings']); toast({ title: 'הזמנה נוצרה בהצלחה ✓' }); setShowDialog(false); setForm(emptyBooking); },
    onError: () => toast({ title: 'שגיאה ביצירת ההזמנה', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Booking.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['bookings']); toast({ title: 'ההזמנה עודכנה ✓' }); setShowDialog(false); },
    onError: () => toast({ title: 'שגיאה בעדכון', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Booking.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['bookings']); toast({ title: 'ההזמנה נמחקה' }); },
    onError: () => toast({ title: 'שגיאה במחיקה', variant: 'destructive' }),
  });

  const filtered = useMemo(() => bookings.filter(b => {
    const q = searchTerm.toLowerCase();
    return (!q || (b.guest_name || '').toLowerCase().includes(q) || (b.guest_email || '').toLowerCase().includes(q))
      && (statusFilter === 'all' || b.status === statusFilter);
  }), [bookings, searchTerm, statusFilter]);

  const openNew = () => { setEditingBooking(null); setForm(emptyBooking); setShowDialog(true); };
  const openEdit = (b) => {
    setEditingBooking(b);
    setForm({ guest_name: b.guest_name||'', guest_email: b.guest_email||'', guest_phone: b.guest_phone||'',
      property_id: b.property_id||'', check_in_date: b.check_in_date||'', check_out_date: b.check_out_date||'',
      nights: b.nights||1, adults: b.adults||2, children: b.children||0,
      total_price: b.total_price||'', status: b.status||'PENDING', notes: b.notes||'' });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.guest_name || !form.check_in_date) { toast({ title: 'נא למלא שם אורח ותאריך כניסה', variant: 'destructive' }); return; }
    editingBooking ? updateMutation.mutate({ id: editingBooking.id, data: form }) : createMutation.mutate(form);
  };

  const getNights = () => {
    try { if (form.check_in_date && form.check_out_date) return differenceInDays(parseISO(form.check_out_date), parseISO(form.check_in_date)); } catch {}
    return 0;
  };

  const counts = useMemo(() => ({
    total:     bookings.length,
    confirmed: bookings.filter(b => ['APPROVED','CONFIRMED','CHECKED_IN'].includes(b.status)).length,
    pending:   bookings.filter(b => b.status === 'PENDING').length,
    cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
  }), [bookings]);

  const avatarBg = ['bg-blue-100 text-blue-700', 'bg-violet-100 text-violet-700',
    'bg-emerald-100 text-emerald-700', 'bg-rose-100 text-rose-700', 'bg-amber-100 text-amber-700'];

  return (
    <div className="min-h-full p-4 md:p-6 space-y-5 max-w-6xl mx-auto animate-fade-in">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <CalendarDays className="w-4 h-4 text-white" />
            </span>
            הזמנות
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 mr-10">{counts.total} הזמנות סה"כ</p>
        </div>
        <Button
          onClick={openNew}
          className="gap-2 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold h-9 text-sm self-start sm:self-auto shadow-sm shadow-[#00D1C1]/20"
        >
          <Plus className="w-4 h-4" />
          הזמנה חדשה
        </Button>
      </div>

      {/* ── Stat Pills ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'סה"כ',    value: counts.total,     icon: CalendarDays, bg: 'bg-slate-50',    text: 'text-slate-700' },
          { label: 'פעילות',  value: counts.confirmed,  icon: CheckCircle2, bg: 'bg-emerald-50',  text: 'text-emerald-700' },
          { label: 'ממתינות', value: counts.pending,    icon: Clock,        bg: 'bg-amber-50',    text: 'text-amber-700' },
          { label: 'בוטלו',   value: counts.cancelled,  icon: XCircle,      bg: 'bg-red-50',      text: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className={cn("rounded-2xl px-4 py-3 flex items-center gap-3 border border-white shadow-sm", s.bg)}>
            <s.icon className={cn("w-5 h-5 flex-shrink-0", s.text)} />
            <div>
              <p className={cn("text-xl font-bold leading-none", s.text)}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm p-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="חפש לפי שם אורח..."
            className="h-9 pr-9 text-sm bg-gray-50/50 border-gray-200 focus:bg-white rounded-xl"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold transition-all", statusFilter === 'all' ? 'bg-[#00D1C1] text-[#0B1220]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
          >
            הכל
          </button>
          {STATUS_OPTIONS.slice(0,4).map(s => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(prev => prev === s.value ? 'all' : s.value)}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold transition-all", statusFilter === s.value ? s.color + ' ring-1 ring-current/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bookings List ── */}
      <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-500 mb-1">
              {searchTerm || statusFilter !== 'all' ? 'לא נמצאו תוצאות' : 'אין הזמנות עדיין'}
            </p>
            <p className="text-xs text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' ? 'נסה לשנות את הסינון' : 'הוסף את ההזמנה הראשונה שלך'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={openNew} size="sm" className="gap-1.5 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold rounded-xl">
                <Plus className="w-3.5 h-3.5" />
                הוסף הזמנה ראשונה
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50/80">
            {filtered.map((booking, idx) => {
              const statusInfo = STATUS_MAP[booking.status] || STATUS_MAP.PENDING;
              const property   = properties.find(p => p.id === booking.property_id);
              const avatarStyle = avatarBg[idx % avatarBg.length];
              return (
                <div
                  key={booking.id}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/60 transition-colors group"
                >
                  {/* Avatar */}
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold shadow-sm", avatarStyle)}>
                    {(booking.guest_name || 'א')[0]}
                  </div>

                  {/* Core info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-800 truncate">{booking.guest_name || 'אורח'}</p>
                      <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0", statusInfo.color)}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {booking.check_in_date && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <CalendarDays className="w-3 h-3" />
                          {format(parseISO(booking.check_in_date), 'dd/MM/yy', { locale: he })}
                          {booking.check_out_date && ` → ${format(parseISO(booking.check_out_date), 'dd/MM/yy', { locale: he })}`}
                        </span>
                      )}
                      {booking.nights ? <span className="text-xs text-gray-400">{booking.nights} לילות</span> : null}
                      {property && (
                        <span className="flex items-center gap-1 text-xs text-gray-400 truncate max-w-[120px]">
                          <Building2 className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{property.name}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  {booking.total_price ? (
                    <p className="text-sm font-bold text-gray-800 flex-shrink-0 hidden sm:block">
                      ₪{parseFloat(booking.total_price).toLocaleString('he-IL')}
                    </p>
                  ) : null}

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => openEdit(booking)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm('למחוק הזמנה זו?')) deleteMutation.mutate(booking.id); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingBooking ? 'עריכת הזמנה' : 'הזמנה חדשה'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold">שם אורח *</Label>
              <Input value={form.guest_name} onChange={e => setForm(p => ({...p, guest_name: e.target.value}))} placeholder="שם מלא" className="h-9 text-sm rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">אימייל</Label>
              <Input value={form.guest_email} onChange={e => setForm(p => ({...p, guest_email: e.target.value}))} placeholder="email@example.com" className="h-9 text-sm rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">טלפון</Label>
              <Input value={form.guest_phone} onChange={e => setForm(p => ({...p, guest_phone: e.target.value}))} placeholder="050-0000000" className="h-9 text-sm rounded-xl" />
            </div>
            {properties.length > 0 && (
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">נכס</Label>
                <Select value={form.property_id} onValueChange={val => setForm(p => ({...p, property_id: val}))}>
                  <SelectTrigger className="h-9 text-sm rounded-xl"><SelectValue placeholder="בחר נכס" /></SelectTrigger>
                  <SelectContent>
                    {properties.map(prop => <SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">תאריך כניסה *</Label>
              <Input type="date" value={form.check_in_date} onChange={e => setForm(p => ({...p, check_in_date: e.target.value}))} className="h-9 text-sm rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">תאריך יציאה</Label>
              <Input type="date" value={form.check_out_date} onChange={e => setForm(p => ({...p, check_out_date: e.target.value}))} className="h-9 text-sm rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">מחיר כולל (₪)</Label>
              <Input type="number" value={form.total_price} onChange={e => setForm(p => ({...p, total_price: e.target.value}))} placeholder="0" className="h-9 text-sm rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">סטטוס</Label>
              <Select value={form.status} onValueChange={val => setForm(p => ({...p, status: val}))}>
                <SelectTrigger className="h-9 text-sm rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {getNights() > 0 && (
              <div className="col-span-2">
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {getNights()} לילות
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDialog(false)} className="h-9 rounded-xl">ביטול</Button>
            <Button
              size="sm" onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="h-9 gap-1.5 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold rounded-xl"
            >
              {(createMutation.isPending || updateMutation.isPending)
                ? <div className="w-4 h-4 border-2 border-[#0B1220] border-t-transparent rounded-full animate-spin" />
                : <Check className="w-4 h-4" />}
              {editingBooking ? 'שמור שינויים' : 'צור הזמנה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
