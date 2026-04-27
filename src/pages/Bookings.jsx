import React, { useMemo, useRef, useEffect, useState } from 'react';
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
import { format, parse, startOfDay, endOfDay, parseISO } from 'date-fns';
import { useBookingsUrlState } from '@/hooks/url-state/useBookingsUrlState';
import { sortBookings } from '@/hooks/url-state/bookingTableSort';
import { ShareViewButton } from '@/components/ui/ShareViewButton';

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

const TAB_OPTIONS = [
  { key: 'all', label: 'הכל' },
  { key: 'active', label: 'פעילות' },
  { key: 'pending', label: 'ממתינות' },
  { key: 'cancelled', label: 'בוטלו' },
];

function bookingMatchesTab(tab, b) {
  const s = b.status || '';
  if (tab === 'all') return true;
  if (tab === 'active') return ['APPROVED', 'CONFIRMED', 'CHECKED_IN'].includes(s);
  if (tab === 'pending') return ['PENDING', 'WAITLIST'].includes(s);
  if (tab === 'cancelled') return s === 'CANCELLED';
  return true;
}

function bookingMatchesStatusArray(arr, b) {
  if (!arr.length) return true;
  return arr.includes(b.status);
}

function bookingMatchesDates(dateFrom, dateTo, b) {
  if (!dateFrom && !dateTo) return true;
  if (!b.check_in_date) return true;
  let d;
  try {
    d = parseISO(b.check_in_date);
  } catch {
    return true;
  }
  if (Number.isNaN(d.getTime())) return true;
  if (dateFrom && d < startOfDay(dateFrom)) return false;
  if (dateTo && d > endOfDay(dateTo)) return false;
  return true;
}

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

export default function BookingsPage({ selectedPropertyId }) {
  const { success } = useToast();
  const queryClient = useQueryClient();
  const url = useBookingsUrlState();

  const {
    tab,
    page,
    pageSize,
    sorting,
    setSorting,
    search,
    dateFrom,
    dateTo,
    status: statusFilterArr,
    propertyId: urlPropertyId,
    openBookingId,
    setUrlState,
    setOpenBookingId,
  } = url;

  const effectivePropertyId = urlPropertyId ?? selectedPropertyId ?? null;
  const filters = useMemo(
    () => (effectivePropertyId ? { property_id: effectivePropertyId } : {}),
    [effectivePropertyId],
  );

  const [showDialog, setShowDialog] = useState(false);
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

  const filtered = useMemo(() => {
    const q = (search || '').trim().toLowerCase();
    return bookings.filter((b) => {
      const matchSearch =
        !q ||
        (b.guest_name || '').toLowerCase().includes(q) ||
        (b.guest_email || '').toLowerCase().includes(q);
      return (
        matchSearch &&
        bookingMatchesTab(tab, b) &&
        bookingMatchesStatusArray(statusFilterArr, b) &&
        bookingMatchesDates(dateFrom, dateTo, b)
      );
    });
  }, [bookings, search, tab, statusFilterArr, dateFrom, dateTo]);

  const sorted = useMemo(() => sortBookings(filtered, sorting), [filtered, sorting]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize) || 1);

  useEffect(() => {
    if (page > totalPages) void setUrlState({ page: totalPages });
  }, [page, totalPages, setUrlState]);

  useEffect(() => {
    if (!openBookingId || !bookings.length) return;
    const b = bookings.find((x) => x.id === openBookingId);
    if (b) {
      setEditingBooking(b);
      setShowDialog(true);
    }
  }, [openBookingId, bookings]);

  const closeBookingDialog = () => {
    setShowDialog(false);
    setEditingBooking(null);
    setOpenBookingId(null);
  };

  const openNew = () => {
    setEditingBooking(null);
    setShowDialog(true);
    setOpenBookingId(null);
  };
  const openEdit = (b) => {
    setEditingBooking(b);
    setShowDialog(true);
    setOpenBookingId(b.id);
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

  const handleDelete = (id) => {
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

  const handleExport = () => {
    const data = sorted.map(b => ({
      ...b,
      property_name: properties.find(p => p.id === b.property_id)?.name || '',
    }));
    exportToCSV(data, 'bookings', BOOKING_COLUMNS);
    success(`יוצאו ${data.length} הזמנות ל-CSV`);
  };

  const dateInputValue = (d) => (d ? format(d, 'yyyy-MM-dd') : '');

  const onDateFromInput = (e) => {
    const v = e.target.value;
    void setUrlState({
      dateFrom: v ? startOfDay(parse(v, 'yyyy-MM-dd', new Date())) : null,
      page: 1,
    });
  };
  const onDateToInput = (e) => {
    const v = e.target.value;
    void setUrlState({
      dateTo: v ? endOfDay(parse(v, 'yyyy-MM-dd', new Date())) : null,
      page: 1,
    });
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
        <div className="flex flex-wrap items-center gap-2">
          <ShareViewButton className="h-11 rounded-xl text-sm" />
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

      <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm p-3 flex flex-col gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => void setUrlState({ search: e.target.value, page: 1 })}
            placeholder="חפש לפי שם אורח..."
            className="h-9 pr-9 text-sm bg-gray-50/50 border-gray-200 focus:bg-white rounded-xl"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {TAB_OPTIONS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => void setUrlState({ tab: t.key, page: 1 })}
              className={cn(
                'min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold transition-all touch-manipulation',
                tab === t.key ? 'bg-[#00D1C1] text-[#0B1220]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[11px] font-medium text-gray-500 w-full sm:w-auto">סטטוסים ספציפיים (בנוסף לטאב):</span>
          {STATUS_OPTIONS.map((s) => {
            const on = statusFilterArr.includes(s.value);
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  const next = on ? statusFilterArr.filter((x) => x !== s.value) : [...statusFilterArr, s.value];
                  void setUrlState({ status: next, page: 1 });
                }}
                className={cn(
                  'rounded-lg px-2 py-1 text-[11px] font-semibold border transition-colors',
                  on ? s.color + ' ring-1 ring-current/20' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50',
                )}
              >
                {s.label}
              </button>
            );
          })}
          {statusFilterArr.length > 0 ? (
            <button
              type="button"
              className="text-[11px] text-indigo-600 underline"
              onClick={() => void setUrlState({ status: [], page: 1 })}
            >
              נקה סטטוסים
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
          <span className="font-medium text-gray-500">צ׳ק-אין מתאריך:</span>
          <Input type="date" value={dateInputValue(dateFrom)} onChange={onDateFromInput} className="h-9 w-[150px] rounded-xl text-sm" dir="ltr" />
          <span>עד</span>
          <Input type="date" value={dateInputValue(dateTo)} onChange={onDateToInput} className="h-9 w-[150px] rounded-xl text-sm" dir="ltr" />
        </div>
        {properties.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500">נכס:</span>
            <select
              className="h-9 rounded-xl border border-gray-200 bg-white px-2 text-sm min-w-[160px]"
              value={urlPropertyId ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                void setUrlState({ propertyId: v || null, page: 1 });
              }}
            >
              <option value="">כל הנכסים{selectedPropertyId && !urlPropertyId ? ' (ברירת מחדל מהתפריט)' : ''}</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name || p.id}</option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div className="atlas-card-surface overflow-hidden">
        {isError ? (
          <div className="p-4">
            <ErrorFallback />
          </div>
        ) : sorted.length === 0 && !isLoading && !propertiesLoading ? (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/80 ring-1 ring-gray-100 flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-600 mb-1">
              {search || tab !== 'all' || statusFilterArr.length || dateFrom || dateTo ? 'לא נמצאו תוצאות' : 'עדיין אין הזמנות'}
            </p>
            <p className="text-xs text-gray-400 mb-4 max-w-xs mx-auto leading-relaxed">
              {search || tab !== 'all' || statusFilterArr.length || dateFrom || dateTo ? 'נסה חיפוש אחר.' : 'הוסף הזמנה ראשונה.'}
            </p>
            {!search && tab === 'all' && !statusFilterArr.length && !dateFrom && !dateTo && (
              <Button onClick={openNew} size="sm" className="gap-1.5 min-h-[44px] bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold rounded-xl px-5 touch-manipulation">
                <Plus className="w-3.5 h-3.5" /> הוסף הזמנה ראשונה
              </Button>
            )}
          </div>
        ) : (
          <ErrorBoundary
            section="bookings-table"
            variant="inline"
            resetKey={`${effectivePropertyId ?? 'all'}|${tab}|${search}|${page}|${pageSize}`}
          >
            <BookingsTable
              bookings={paged}
              properties={properties}
              isLoading={isLoading || propertiesLoading}
              error={isError ? (bookingsError instanceof Error ? bookingsError : new Error('שגיאת טעינה')) : null}
              onEdit={openEdit}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDeleteRows}
              onBulkSetStatus={handleBulkSetStatus}
              sorting={sorting}
              onSortingChange={setSorting}
              manualSorting
              highlightRowId={openBookingId}
            />
            {sorted.length > pageSize ? (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-3 py-2 text-sm text-gray-600">
                <span>עמוד {page} מתוך {totalPages} · {sorted.length} רשומות</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9"
                    disabled={page <= 1}
                    onClick={() => void setUrlState({ page: page - 1 })}
                  >
                    הקודם
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9"
                    disabled={page >= totalPages}
                    onClick={() => void setUrlState({ page: page + 1 })}
                  >
                    הבא
                  </Button>
                  <select
                    className="h-9 rounded-lg border border-gray-200 px-2 text-sm"
                    value={String(pageSize)}
                    onChange={(e) => void setUrlState({ pageSize: Number(e.target.value), page: 1 })}
                  >
                    <option value="10">10 לעמוד</option>
                    <option value="25">25 לעמוד</option>
                    <option value="50">50 לעמוד</option>
                  </select>
                </div>
              </div>
            ) : null}
          </ErrorBoundary>
        )}
      </div>

      <button onClick={openNew}
        className="fixed bottom-20 left-4 z-30 lg:hidden w-14 h-14 rounded-full bg-[#4F46E5] shadow-xl flex items-center justify-center text-white touch-manipulation active:scale-95 transition-transform"
        style={{ boxShadow: '0 4px 24px rgba(79,70,229,0.4)' }}>
        <Plus className="w-6 h-6" />
      </button>

      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          const h = bookingDialogInterceptRef.current;
          if (h) {
            h(open);
            return;
          }
          setShowDialog(open);
          if (!open) setOpenBookingId(null);
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
