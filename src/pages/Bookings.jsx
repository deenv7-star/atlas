import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useBookings, useCreateBooking, useUpdateBooking, useDeleteBooking } from '@/data/entities';
import { useProperties } from '@/data/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorFallback } from '@/components/common/ErrorFallback';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { SkeletonTableFull } from '@/components/skeletons/atlas-skeletons';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  CalendarDays, Plus, Search, Building2, Edit, Trash2,
  Clock, CheckCircle2, XCircle, Phone, MessageCircle,
  Download, CheckSquare, Square, X, ChevronDown,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { exportToCSV, BOOKING_COLUMNS } from '@/lib/csvExport';
import { BookingForm } from '@/components/forms/BookingForm';
import { emptyBookingFormValues } from '@/components/forms/atlasFormSchemas';

const STATUS_OPTIONS = [
  { value: 'PENDING',     label: 'ממתין',        color: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-400' },
  { value: 'APPROVED',    label: 'מאושר',         color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  { value: 'CONFIRMED',   label: 'מאושר סופית',   color: 'bg-green-100 text-green-700',     dot: 'bg-green-400' },
  { value: 'CHECKED_IN',  label: 'נכנס',          color: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-400' },
  { value: 'CHECKED_OUT', label: 'יצא',           color: 'bg-gray-100 text-gray-600',       dot: 'bg-gray-400' },
  { value: 'CANCELLED',   label: 'בוטל',          color: 'bg-red-100 text-red-600',         dot: 'bg-red-400' },
  { value: 'WAITLIST',    label: 'המתנה',         color: 'bg-purple-100 text-purple-700',   dot: 'bg-purple-400' },
];
const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s]));

function bookingEntityToFormValues(b) {
  if (!b) return { ...emptyBookingFormValues };
  return {
    ...emptyBookingFormValues,
    guest_name: b.guest_name || '',
    guest_email: b.guest_email || '',
    guest_phone: b.guest_phone || '',
    property_id: b.property_id || '',
    check_in_date: b.check_in_date || '',
    check_out_date: b.check_out_date || '',
    nights: b.nights || 1,
    adults: b.adults || 2,
    children: b.children || 0,
    total_price: b.total_price != null && b.total_price !== '' ? String(b.total_price) : '',
    status: b.status || 'PENDING',
    notes: b.notes || '',
    guest_count: (b.adults || 0) + (b.children || 0) || 2,
    booking_source: b.booking_source || 'direct',
    payment_status: b.payment_status || 'pending',
  };
}

export default function BookingsPage({ user, selectedPropertyId }) {
  const { toast } = useToast();
  const filters = useMemo(() => (selectedPropertyId ? { property_id: selectedPropertyId } : {}), [selectedPropertyId]);

  const [searchTerm, setSearchTerm]         = useState('');
  const [statusFilter, setStatusFilter]     = useState('all');
  const [showDialog, setShowDialog]         = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const bookingDialogInterceptRef = useRef(null);

  useEffect(() => {
    if (!showDialog) bookingDialogInterceptRef.current = null;
  }, [showDialog]);

  // ── Bulk selection ──────────────────────────────────────────────────────────
  const [selected, setSelected]       = useState(new Set());
  const [bulkStatus, setBulkStatus]   = useState('');
  const [showBulkMenu, setShowBulkMenu] = useState(false);

  const { data: bookings = [], isLoading, isError } = useBookings(filters, '-created_at', 200);
  const { data: properties = [], isLoading: propertiesLoading } = useProperties();
  const createMutation  = useCreateBooking();
  const updateMutation  = useUpdateBooking();
  const deleteMutation  = useDeleteBooking();

  const filtered = useMemo(() => bookings.filter(b => {
    const q = searchTerm.toLowerCase();
    return (!q || (b.guest_name || '').toLowerCase().includes(q) || (b.guest_email || '').toLowerCase().includes(q))
      && (statusFilter === 'all' || b.status === statusFilter);
  }), [bookings, searchTerm, statusFilter]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const closeBookingDialog = () => {
    setShowDialog(false);
    setEditingBooking(null);
  };

  const openNew = () => {
    setEditingBooking(null);
    setShowDialog(true);
  };
  const openEdit = b => {
    setEditingBooking(b);
    setShowDialog(true);
  };

  const handleBookingSubmit = async (data) => {
    const payload = { ...data };
    if (editingBooking) {
      await updateMutation.mutateAsync({ id: editingBooking.id, data: payload });
      toast({ title: 'ההזמנה עודכנה' });
    } else {
      await createMutation.mutateAsync(payload);
      toast({ title: 'הזמנה נוצרה בהצלחה' });
    }
  };

  const handleDelete = id => {
    if (!confirm('למחוק הזמנה זו?')) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast({ title: 'ההזמנה נמחקה' }),
      onError: () => toast({ title: 'שגיאה במחיקת ההזמנה', variant: 'destructive' }),
    });
  };

  const counts = useMemo(() => ({
    total:     bookings.length,
    confirmed: bookings.filter(b => ['APPROVED', 'CONFIRMED', 'CHECKED_IN'].includes(b.status)).length,
    pending:   bookings.filter(b => b.status === 'PENDING').length,
    cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
  }), [bookings]);

  const avatarBg = ['bg-blue-100 text-blue-700', 'bg-violet-100 text-violet-700',
    'bg-emerald-100 text-emerald-700', 'bg-rose-100 text-rose-700', 'bg-amber-100 text-amber-700'];

  // ── Bulk helpers ─────────────────────────────────────────────────────────────
  const allFilteredIds = filtered.map(b => b.id);
  const allSelected    = allFilteredIds.length > 0 && allFilteredIds.every(id => selected.has(id));
  const someSelected   = selected.size > 0;

  const toggleSelect = id => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => { const next = new Set(prev); allFilteredIds.forEach(id => next.delete(id)); return next; });
    } else {
      setSelected(prev => new Set([...prev, ...allFilteredIds]));
    }
  };

  const clearSelection = () => setSelected(new Set());

  const handleBulkStatusChange = async status => {
    const ids = [...selected];
    let done = 0;
    for (const id of ids) {
      await updateMutation.mutateAsync({ id, data: { status } }).catch(() => {});
      done++;
    }
    toast({ title: `עודכנו ${done} הזמנות ל-${STATUS_MAP[status]?.label || status}` });
    clearSelection();
    setShowBulkMenu(false);
  };

  const handleBulkDelete = () => {
    if (!confirm(`למחוק ${selected.size} הזמנות?`)) return;
    [...selected].forEach(id => deleteMutation.mutate(id));
    clearSelection();
  };

  // ── CSV Export ───────────────────────────────────────────────────────────────
  const handleExport = () => {
    const data = filtered.map(b => ({
      ...b,
      property_name: properties.find(p => p.id === b.property_id)?.name || '',
    }));
    exportToCSV(data, 'bookings', BOOKING_COLUMNS);
    toast({ title: `יוצאו ${data.length} הזמנות ל-CSV` });
  };

  return (
    <div className="atlas-page-shell max-w-6xl space-y-5" dir="rtl">

      <div className="atlas-page-hero">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shadow-sm">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">ניהול הזמנות</h1>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">כל ההזמנות במקום אחד — צ'ק-אין, צ'ק-אאוט וסטטוס, בלי לקפוץ בין מסכים.</p>
      </div>

      {/* Header row */}
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
        <div className="flex items-center gap-2">
          {/* CSV Export */}
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2 min-h-[44px] h-11 text-sm rounded-xl border-gray-200 hidden sm:flex"
            title="ייצא ל-CSV"
          >
            <Download className="w-4 h-4" />
            ייצוא CSV
          </Button>
          <Button
            onClick={openNew}
            className="gap-2 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold min-h-[44px] h-11 text-sm self-start sm:self-auto shadow-sm shadow-[#00D1C1]/20 px-5 rounded-xl"
          >
            <Plus className="w-4 h-4" />
            הזמנה חדשה
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'סה"כ',    value: counts.total,     icon: CalendarDays, bg: 'bg-slate-50',   text: 'text-slate-700' },
          { label: 'פעילות',  value: counts.confirmed,  icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700' },
          { label: 'ממתינות', value: counts.pending,    icon: Clock,        bg: 'bg-amber-50',   text: 'text-amber-700' },
          { label: 'בוטלו',   value: counts.cancelled,  icon: XCircle,      bg: 'bg-red-50',     text: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-2xl px-4 py-3 flex items-center gap-3 border border-white shadow-sm', s.bg)}>
            <s.icon className={cn('w-5 h-5 flex-shrink-0', s.text)} />
            <div>
              <p className={cn('text-xl font-bold leading-none', s.text)}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
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
            className={cn('min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold transition-all touch-manipulation', statusFilter === 'all' ? 'bg-[#00D1C1] text-[#0B1220]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
          >
            הכל
          </button>
          {STATUS_OPTIONS.slice(0, 4).map(s => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(prev => prev === s.value ? 'all' : s.value)}
              className={cn('min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold transition-all touch-manipulation', statusFilter === s.value ? s.color + ' ring-1 ring-current/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bulk Action Bar ── */}
      {someSelected && (
        <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-2xl">
          <button onClick={clearSelection} className="w-7 h-7 rounded-lg flex items-center justify-center text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-indigo-700">{selected.size} נבחרו</span>
          <div className="mr-auto flex items-center gap-2">
            {/* Bulk status change */}
            <div className="relative">
              <button
                onClick={() => setShowBulkMenu(v => !v)}
                className="flex items-center gap-1.5 min-h-[36px] px-3 rounded-xl text-xs font-semibold bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors"
              >
                שנה סטטוס <ChevronDown className="w-3 h-3" />
              </button>
              {showBulkMenu && (
                <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[150px]">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => handleBulkStatusChange(s.value)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-right hover:bg-gray-50 transition-colors"
                    >
                      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', s.dot)} />
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Bulk delete */}
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 min-h-[36px] px-3 rounded-xl text-xs font-semibold bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              מחק
            </button>
            {/* Bulk CSV export */}
            <button
              onClick={() => {
                const data = filtered.filter(b => selected.has(b.id)).map(b => ({
                  ...b, property_name: properties.find(p => p.id === b.property_id)?.name || '',
                }));
                exportToCSV(data, 'bookings_selected', BOOKING_COLUMNS);
                toast({ title: `יוצאו ${data.length} הזמנות` });
              }}
              className="flex items-center gap-1.5 min-h-[36px] px-3 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              ייצוא
            </button>
          </div>
        </div>
      )}

      {/* Bookings list */}
      <div className="atlas-card-surface overflow-hidden">
        {isError ? (
          <div className="p-4">
            <ErrorFallback />
          </div>
        ) : isLoading || propertiesLoading ? (
          <SkeletonTableFull />
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/80 ring-1 ring-gray-100 flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-600 mb-1">
              {searchTerm || statusFilter !== 'all' ? 'לא נמצאו תוצאות' : 'עדיין אין הזמנות'}
            </p>
            <p className="text-xs text-gray-400 mb-4 max-w-xs mx-auto leading-relaxed">
              {searchTerm || statusFilter !== 'all' ? 'נסה חיפוש אחר.' : 'הוסף הזמנה ראשונה.'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={openNew} size="sm" className="gap-1.5 min-h-[44px] bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold rounded-xl px-5 touch-manipulation">
                <Plus className="w-3.5 h-3.5" /> הוסף הזמנה ראשונה
              </Button>
            )}
          </div>
        ) : (
          <ErrorBoundary
            section="bookings-table"
            variant="inline"
            resetKey={`${selectedPropertyId ?? 'all'}|${statusFilter}|${searchTerm}`}
          >
          <>
            {/* Select all header */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-50 bg-gray-50/50">
              <button onClick={toggleAll} className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors touch-manipulation min-h-[36px]">
                {allSelected
                  ? <CheckSquare className="w-4 h-4 text-indigo-500" />
                  : <Square className="w-4 h-4" />}
                {allSelected ? 'בטל הכל' : `בחר הכל (${filtered.length})`}
              </button>
            </div>
            <div className="divide-y divide-gray-50/80">
              {filtered.map((booking, idx) => {
                const statusInfo = STATUS_MAP[booking.status] || STATUS_MAP.PENDING;
                const property   = properties.find(p => p.id === booking.property_id);
                const isChecked  = selected.has(booking.id);
                return (
                  <div
                    key={booking.id}
                    className={cn('flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/60 transition-colors group', isChecked && 'bg-indigo-50/40')}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelect(booking.id)}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-indigo-400 hover:bg-indigo-50 transition-colors touch-manipulation"
                    >
                      {isChecked ? <CheckSquare className="w-4 h-4 text-indigo-500" /> : <Square className="w-4 h-4" />}
                    </button>

                    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold shadow-sm', avatarBg[idx % avatarBg.length])}>
                      {(booking.guest_name || 'א')[0]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-gray-800 truncate">{booking.guest_name || 'אורח'}</p>
                        <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0', statusInfo.color)}>
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
                          <span className="flex items-center gap-1 text-xs text-gray-400 truncate max-w-[100px] sm:max-w-[120px]">
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{property.name}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {booking.total_price ? (
                        <p className="text-sm font-bold text-gray-800">₪{parseFloat(booking.total_price).toLocaleString('he-IL')}</p>
                      ) : null}
                      <div className="flex items-center gap-1">
                        {booking.guest_phone && (
                          <a href={`tel:${booking.guest_phone}`} onClick={e => e.stopPropagation()}
                            className="min-w-[36px] min-h-[36px] w-9 h-9 rounded-xl flex items-center justify-center text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors touch-manipulation">
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {booking.guest_phone && (
                          <a href={`https://wa.me/${booking.guest_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                            className="min-w-[36px] min-h-[36px] w-9 h-9 rounded-xl flex items-center justify-center text-[#25D366] bg-green-50 hover:bg-green-100 transition-colors touch-manipulation">
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button onClick={() => openEdit(booking)}
                          className="min-w-[36px] min-h-[36px] w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors touch-manipulation">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(booking.id)}
                          className="min-w-[36px] min-h-[36px] w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors touch-manipulation hidden sm:flex">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
          </ErrorBoundary>
        )}
      </div>

      {/* Mobile FAB */}
      <button onClick={openNew}
        className="fixed bottom-20 left-4 z-30 lg:hidden w-14 h-14 rounded-full bg-[#4F46E5] shadow-xl flex items-center justify-center text-white touch-manipulation active:scale-95 transition-transform"
        style={{ boxShadow: '0 4px 24px rgba(79,70,229,0.4)' }}>
        <Plus className="w-6 h-6" />
      </button>

      {/* Dialog */}
      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          const h = bookingDialogInterceptRef.current;
          if (h) {
            h(open);
            return;
          }
          setShowDialog(open);
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">{editingBooking ? 'עריכת הזמנה' : 'הזמנה חדשה'}</DialogTitle>
          </DialogHeader>
          <BookingForm
            key={editingBooking?.id ?? 'new'}
            storageSuffix={editingBooking?.id ?? 'new'}
            defaultValues={bookingEntityToFormValues(editingBooking)}
            properties={properties.map((p) => ({ id: p.id, name: p.name }))}
            onSubmit={handleBookingSubmit}
            onCancel={closeBookingDialog}
            setDialogOpen={setShowDialog}
            onRegisterDialogInterceptor={(fn) => {
              bookingDialogInterceptRef.current = fn;
            }}
            onAfterSubmitSuccess={() => {
              window.setTimeout(closeBookingDialog, 2000);
            }}
            submitLabel={editingBooking ? 'שמור שינויים' : 'צור הזמנה'}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
