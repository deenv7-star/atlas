import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useBookings, useCreateBooking, useUpdateBooking, useDeleteBooking } from '@/data/entities';
import { useQueryClient } from '@tanstack/react-query';
import { useToast, deleteBookingWithUndo } from '@/components/ui/AtlasToast';
import { useProperties } from '@/data/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorFallback } from '@/components/common/ErrorFallback';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { BookingsTable } from '@/components/tables/BookingsTable';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  CalendarDays, Plus, Search,
  Clock, CheckCircle2, XCircle,
  Download,
} from 'lucide-react';
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
  const { success } = useToast();
  const queryClient = useQueryClient();
  const filters = useMemo(() => (selectedPropertyId ? { property_id: selectedPropertyId } : {}), [selectedPropertyId]);

  const [searchTerm, setSearchTerm]         = useState('');
  const [statusFilter, setStatusFilter]     = useState('all');
  const [showDialog, setShowDialog]         = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const bookingDialogInterceptRef = useRef(null);

  useEffect(() => {
    if (!showDialog) bookingDialogInterceptRef.current = null;
  }, [showDialog]);

  const { data: bookings = [], isLoading, isError, error: bookingsError } = useBookings(filters, '-created_at', 200);
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
      success('ההזמנה עודכנה');
    } else {
      await createMutation.mutateAsync(payload);
      success('הזמנה נוצרה בהצלחה');
    }
  };

  const handleDelete = id => {
    if (!confirm('למחוק הזמנה זו?')) return;
    deleteBookingWithUndo(queryClient, id);
  };

  const counts = useMemo(() => ({
    total:     bookings.length,
    confirmed: bookings.filter(b => ['APPROVED', 'CONFIRMED', 'CHECKED_IN'].includes(b.status)).length,
    pending:   bookings.filter(b => b.status === 'PENDING').length,
    cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
  }), [bookings]);

  const handleBulkSetStatus = async (rows, status) => {
    let done = 0;
    for (const row of rows) {
      await updateMutation.mutateAsync({ id: row.id, data: { status } }).catch(() => {});
      done++;
    }
    success(`עודכנו ${done} הזמנות ל-${STATUS_MAP[status]?.label || status}`);
  };

  const handleBulkDeleteRows = rows => {
    rows.forEach(row => deleteMutation.mutate({ id: row.id }));
  };

  // ── CSV Export ───────────────────────────────────────────────────────────────
  const handleExport = () => {
    const data = filtered.map(b => ({
      ...b,
      property_name: properties.find(p => p.id === b.property_id)?.name || '',
    }));
    exportToCSV(data, 'bookings', BOOKING_COLUMNS);
    success(`יוצאו ${data.length} הזמנות ל-CSV`);
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

      {/* Bookings table */}
      <div className="atlas-card-surface overflow-hidden">
        {isError ? (
          <div className="p-4">
            <ErrorFallback />
          </div>
        ) : filtered.length === 0 && !isLoading && !propertiesLoading ? (
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
            <BookingsTable
              bookings={filtered}
              properties={properties}
              isLoading={isLoading || propertiesLoading}
              error={isError ? (bookingsError instanceof Error ? bookingsError : new Error('שגיאת טעינה')) : null}
              onEdit={openEdit}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDeleteRows}
              onBulkSetStatus={handleBulkSetStatus}
            />
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
