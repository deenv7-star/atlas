import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { readCommandPaletteFlag } from '@/lib/commandPaletteNavigationState';
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
import { CalendarDays, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Page, PageHeader, SegmentedControl, EmptyState as DsEmptyState, StatusPill, ChannelDot, SkelRows, fmtMoney, monthShort, dayNum,
} from '@/components/ds';
import { cn } from '@/lib/utils';
import { exportToCSV, BOOKING_COLUMNS } from '@/lib/csvExport';
import { BookingForm } from '@/components/forms/BookingForm';
import { emptyBookingFormValues } from '@/components/forms/atlasFormSchemas';
import { format, parse, startOfDay, endOfDay, parseISO } from 'date-fns';
import { useBookingsUrlState } from '@/hooks/url-state/useBookingsUrlState';
import { sortBookings } from '@/hooks/url-state/bookingTableSort';
import { ShareViewButton } from '@/components/ui/ShareViewButton';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'ממתינה' },
  { value: 'APPROVED', label: 'מאושרת' },
  { value: 'CONFIRMED', label: 'מאושרת סופית' },
  { value: 'CHECKED_IN', label: 'בשהייה' },
  { value: 'CHECKED_OUT', label: 'הסתיימה' },
  { value: 'CANCELLED', label: 'בוטלה' },
  { value: 'WAITLIST', label: 'המתנה' },
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
  const location = useLocation();
  const navigate = useNavigate();
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
  const [filtersOpen, setFiltersOpen] = useState(false);
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

  useEffect(() => {
    if (!readCommandPaletteFlag(location.state, 'newBooking')) return;
    setEditingBooking(null);
    setShowDialog(true);
    setOpenBookingId(null);
    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      { replace: true, state: null },
    );
  }, [location.state, location.pathname, location.search, location.hash, navigate, setOpenBookingId]);

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
      success('ההזמנה נשמרה');
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

  const filtersActive = statusFilterArr.length > 0 || !!dateFrom || !!dateTo || !!urlPropertyId;
  const propName = (id) => properties.find((p) => p.id === id)?.name || '';
  const hasQuery = !!search || tab !== 'all' || filtersActive;

  return (
    <Page>
      <PageHeader
        title="הזמנות"
        subtitle={`${counts.total} הזמנות · ${counts.confirmed} פעילות · ${counts.pending} ממתינות לאישור`}
        actions={
          <>
            <ShareViewButton className="hidden h-11 rounded-[10px] md:inline-flex" />
            <Button onClick={openNew} className="hidden md:inline-flex">
              <Plus strokeWidth={2.25} />
              הזמנה חדשה
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedControl
          ariaLabel="סינון לפי מצב"
          value={tab}
          onChange={(v) => void setUrlState({ tab: v, page: 1 })}
          options={[
            { value: 'all', label: 'הכל', count: counts.total },
            { value: 'active', label: 'פעילות', count: counts.confirmed },
            { value: 'pending', label: 'ממתינות', count: counts.pending },
            { value: 'cancelled', label: 'בוטלו', count: counts.cancelled },
          ]}
        />
        <div className="flex gap-2">
          <div className="relative flex-1 lg:w-[320px] lg:flex-none">
            <Search className="pointer-events-none absolute right-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-400" />
            <Input
              value={search}
              onChange={(e) => void setUrlState({ search: e.target.value, page: 1 })}
              placeholder="חיפוש לפי שם אורח"
              className="pr-10"
              aria-label="חיפוש לפי שם אורח"
            />
          </div>
          <Button variant={filtersActive ? 'secondary' : 'outline'} onClick={() => setFiltersOpen(true)} aria-label="סינון">
            <SlidersHorizontal />
            <span className="hidden sm:inline">סינון</span>
            {filtersActive ? <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[12px] text-white">{statusFilterArr.length + (dateFrom || dateTo ? 1 : 0) + (urlPropertyId ? 1 : 0)}</span> : null}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-line bg-white shadow-card">
        {isError ? (
          <div className="p-4"><ErrorFallback /></div>
        ) : sorted.length === 0 && !isLoading && !propertiesLoading ? (
          <DsEmptyState
            icon={CalendarDays}
            title={hasQuery ? 'לא נמצאו הזמנות' : 'עדיין אין הזמנות'}
            description={hasQuery ? 'נסו חיפוש אחר או נקו את הסינון.' : 'הזמנה ראשונה לוקחת פחות מדקה: שם, תאריכים וערוץ.'}
            action={hasQuery ? (
              <Button variant="outline" onClick={() => void setUrlState({ search: '', tab: 'all', status: [], dateFrom: null, dateTo: null, propertyId: null, page: 1 })}>ניקוי הסינון</Button>
            ) : (
              <Button onClick={openNew}><Plus strokeWidth={2.25} />הזמנה חדשה</Button>
            )}
          />
        ) : (
          <ErrorBoundary section="bookings-table" variant="inline" resetKey={`${effectivePropertyId ?? 'all'}|${tab}|${search}|${page}|${pageSize}`}>
            {/* Phones: cards. Desktop: the full table with bulk actions. */}
            <ul className="divide-y divide-line md:hidden">
              {isLoading ? (
                <li className="p-4"><SkelRows rows={5} /></li>
              ) : paged.map((b) => (
                <li key={b.id}>
                  <Link to={`${createPageUrl('BookingDetail')}/${b.id}`} className="press flex min-h-[76px] items-center gap-3 px-4 py-3 active:bg-neutral-50">
                    <span className="flex w-12 shrink-0 flex-col items-center rounded-[10px] bg-neutral-100 py-1.5">
                      <span className="text-[12px] text-ink-600">{monthShort(b.check_in_date)}</span>
                      <span className="text-[18px] font-extrabold leading-tight tabular text-navy-900">{dayNum(b.check_in_date)}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-semibold text-navy-900">{b.guest_name || 'אורח'}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-ink-400">
                        <ChannelDot source={b.booking_source} />
                        {propName(b.property_id) || b.property_name} · {b.nights || 1} לילות{b.total_price ? ` · ${fmtMoney(b.total_price)}` : ''}
                      </span>
                    </span>
                    <StatusPill status={b.status} />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="hidden md:block">
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
            </div>
            {sorted.length > pageSize ? (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-[14px] text-ink-600">
                <span>עמוד {page} מתוך {totalPages} · {sorted.length} הזמנות</span>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => void setUrlState({ page: page - 1 })}>הקודם</Button>
                  <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => void setUrlState({ page: page + 1 })}>הבא</Button>
                  <select
                    className="h-10 rounded-[10px] border border-line bg-white px-2 text-[14px]"
                    value={String(pageSize)}
                    onChange={(e) => void setUrlState({ pageSize: Number(e.target.value), page: 1 })}
                    aria-label="הזמנות בעמוד"
                  >
                    <option value="10">10 בעמוד</option>
                    <option value="25">25 בעמוד</option>
                    <option value="50">50 בעמוד</option>
                  </select>
                </div>
              </div>
            ) : null}
          </ErrorBoundary>
        )}
      </div>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-right">
            <DialogTitle className="text-[22px] font-extrabold text-navy-900">סינון הזמנות</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[14px] font-medium text-ink-600">מצב ההזמנה</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((s) => {
                  const on = statusFilterArr.includes(s.value);
                  return (
                    <button
                      key={s.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        const next = on ? statusFilterArr.filter((x) => x !== s.value) : [...statusFilterArr, s.value];
                        void setUrlState({ status: next, page: 1 });
                      }}
                      className={cn('press h-10 rounded-full border px-4 text-[14px] font-medium', on ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line bg-white text-navy-900')}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[14px] font-medium text-ink-600">תאריך כניסה</p>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={dateInputValue(dateFrom)} onChange={onDateFromInput} aria-label="מתאריך" dir="ltr" />
                <Input type="date" value={dateInputValue(dateTo)} onChange={onDateToInput} aria-label="עד תאריך" dir="ltr" />
              </div>
            </div>
            {properties.length > 0 ? (
              <div>
                <p className="mb-2 text-[14px] font-medium text-ink-600">יחידה</p>
                <select
                  className="h-11 w-full rounded-[10px] border border-line bg-white px-3 text-[15px]"
                  value={urlPropertyId ?? ''}
                  onChange={(e) => void setUrlState({ propertyId: e.target.value || null, page: 1 })}
                  aria-label="יחידה"
                >
                  <option value="">כל היחידות</option>
                  {properties.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
                </select>
              </div>
            ) : null}
            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
              <Button variant="outline" onClick={() => void setUrlState({ status: [], dateFrom: null, dateTo: null, propertyId: null, page: 1 })}>ניקוי</Button>
              <Button onClick={() => setFiltersOpen(false)}>הצגת {sorted.length} הזמנות</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="text-right">
            <DialogTitle className="text-[22px] font-extrabold text-navy-900">{editingBooking ? 'עריכת הזמנה' : 'הזמנה חדשה'}</DialogTitle>
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
            submitLabel={editingBooking ? 'שמירת שינויים' : 'שמירת הזמנה'}
          />
        </DialogContent>
      </Dialog>
    </Page>
  );
}
