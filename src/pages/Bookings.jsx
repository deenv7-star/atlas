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
import { CalendarDays, Plus, Search, SlidersHorizontal, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  fmtMoney, channelOf, EmptyState as DsEmptyState, StatusPill, SkelRows,
} from '@/components/ds';
import { cn } from '@/lib/utils';
import { exportToCSV, BOOKING_COLUMNS } from '@/lib/csvExport';
import { BookingForm } from '@/components/forms/BookingForm';
import { emptyBookingFormValues } from '@/components/forms/atlasFormSchemas';
import { bookingFormToPayload } from '@/lib/entityPayloads';
import { format, parse, startOfDay, endOfDay, parseISO } from 'date-fns';
import { useBookingsUrlState } from '@/hooks/url-state/useBookingsUrlState';
import { sortBookings } from '@/hooks/url-state/bookingTableSort';
import { Rise, GuestAvatar, AvatarStack } from '@/components/app/atoms';
import { DPage, DSplit, DTitle, CountChip, Tag, ProgressRing } from '@/components/app/DSplit';
import { todayISO, nightsBetween, formatRangeHe } from '@/lib/stay/format';

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
    booking_source: b.source || b.booking_source || 'direct',
    payment_status: b.payment_status || 'pending',
  };
}

/** Where the stay is: before arrival, during (night x of n), after. */
function stayOf(b, today = todayISO()) {
  const ci = b.check_in_date;
  const co = b.check_out_date || ci;
  const n = Math.max(1, Number(b.nights) || nightsBetween(ci, co) || 1);
  if (b.status === 'CANCELLED') return { pct: 0, label: 'בוטלה' };
  if (!ci) return { pct: 0, label: '' };
  if (today < ci) {
    const d = nightsBetween(today, ci);
    // countdown ring: fills as the arrival gets closer (a month out = almost empty)
    return { pct: Math.max(6, Math.round(100 - (Math.min(d, 30) / 30) * 100)), label: d === 1 ? 'מגיעים מחר' : `מגיעים בעוד ${d} ימים`, days: d };
  }
  if (today === ci) return { pct: Math.round(100 / (n + 1)), label: 'מגיעים היום' };
  if (today < co) { const x = nightsBetween(ci, today) + 1; return { pct: Math.round((x / n) * 100), label: `לילה ${x} מתוך ${n}` }; }
  return { pct: 100, label: 'השהייה הסתיימה' };
}

function BookingCard({ booking: b, unit }) {
  const st = stayOf(b);
  const ch = channelOf(b.booking_source || b.source);
  const paid = String(b.payment_status || '').toLowerCase() === 'paid';
  return (
    <Link to={`${createPageUrl('BookingDetail')}/${b.id}`} className="press d-card d-lift flex h-full flex-col p-4 md:p-5">
      <div className="flex items-center gap-3">
        <GuestAvatar name={b.guest_name || 'אורח'} size={48} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-bold text-navy-900">{b.guest_name || 'אורח'}</p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-ink-400">
            <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: ch.color }} />
            <span className="truncate">{unit} · {ch.label}</span>
          </p>
        </div>
        <StatusPill status={b.status} />
      </div>
      <div className="mb-4 mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#F3F4F9] px-3 text-[13px] font-semibold text-navy-900">
          <CalendarDays className="h-4 w-4 text-ink-400" strokeWidth={1.75} aria-hidden />
          <span className="tabular">{formatRangeHe(b.check_in_date, b.check_out_date)}</span>
        </span>
        <span className="inline-flex h-9 items-center rounded-full bg-[#F3F4F9] px-3 text-[13px] font-semibold text-navy-900"><span className="tabular">{b.nights || 1}</span>&nbsp;לילות</span>
        {b.status !== 'CANCELLED' ? <Tag tone={paid ? 'mint' : 'lilac'}>{paid ? 'שולם' : 'ממתין לתשלום'}</Tag> : null}
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#F0F1F6] pt-3.5">
        <span className="flex min-w-0 items-center gap-2.5">
          <ProgressRing pct={st.pct} size={38} stroke={4}>
            {st.days != null ? <span className="tabular text-[12px] font-bold text-navy-900">{st.days}</span> : null}
          </ProgressRing>
          <span className="truncate text-[13px] font-medium text-ink-600">{st.label}</span>
        </span>
        <span className="text-[17px] font-extrabold tabular text-navy-900">{fmtMoney(b.total_price)}</span>
      </div>
    </Link>
  );
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
    const payload = bookingFormToPayload(data);
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
    <DPage>
      <DTitle sub={`${counts.total} הזמנות · ${counts.pending} ממתינות לאישור`}>הזמנות</DTitle>
      <DSplit
        asideLabel="סיכום וסינון"
        main={(
          <>
      <div role="group" aria-label="סינון לפי מצב" className="d-strip -mx-5 mb-3 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0">
        {[
          { value: 'all', label: 'הכל', n: counts.total },
          { value: 'active', label: 'פעילות', n: counts.confirmed },
          { value: 'pending', label: 'ממתינות', n: counts.pending },
          { value: 'cancelled', label: 'בוטלו', n: counts.cancelled },
        ].map((t) => (
          <CountChip key={t.value} on={tab === t.value} count={t.n} aria-pressed={tab === t.value} onClick={() => void setUrlState({ tab: t.value, page: 1 })}>{t.label}</CountChip>
        ))}
      </div>
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-400" />
          <Input
            value={search}
            onChange={(e) => void setUrlState({ search: e.target.value, page: 1 })}
            placeholder="חיפוש לפי שם אורח"
            className="h-12 rounded-full border-0 bg-white pr-11 shadow-[0_1px_2px_rgba(27,38,86,0.05)]"
            aria-label="חיפוש לפי שם אורח"
          />
        </div>
        <button type="button" onClick={() => setFiltersOpen(true)} aria-label="סינון" className={cn('press relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-[0_1px_2px_rgba(27,38,86,0.05)]', filtersActive ? 'bg-navy-900 text-white' : 'bg-white text-navy-900')}>
          <SlidersHorizontal className="h-[19px] w-[19px]" strokeWidth={1.75} />
          {filtersActive ? <span className="absolute -top-0.5 end-0 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white ring-2 ring-[var(--canvas)]">{statusFilterArr.length + (dateFrom || dateTo ? 1 : 0) + (urlPropertyId ? 1 : 0)}</span> : null}
        </button>
      </div>

      <div>
        {isError ? (
          <div className="d-card p-4"><ErrorFallback /></div>
        ) : sorted.length === 0 && !isLoading && !propertiesLoading ? (
          <DsEmptyState className="d-card"
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
            {/* v8 D: every booking is a rich card (photo, tinted status, date chips, stay ring, amount). */}
            {isLoading ? (
              <div className="d-card p-4"><SkelRows rows={5} /></div>
            ) : (
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2 md:gap-4">
                {paged.map((b, idx) => (
                  <Rise as="li" i={Math.min(idx, 8)} key={b.id} className="min-w-0">
                    <BookingCard booking={b} unit={propName(b.property_id) || b.property_name} />
                  </Rise>
                ))}
              </ul>
            )}
            <div className="hidden">
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
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-full bg-white px-4 py-2 text-[14px] text-ink-600">
                <span>עמוד {page} מתוך {totalPages} · {sorted.length} הזמנות</span>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => void setUrlState({ page: page - 1 })}>הקודם</Button>
                  <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => void setUrlState({ page: page + 1 })}>הבא</Button>
                  <select
                    className="h-11 rounded-[10px] border border-line bg-white px-2 text-[14px]"
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

          </>
        )}
        aside={(
          <>
            <section className="v7-hero p-5" aria-label="ממתינות לאישור">
              <p className="text-[15px] font-medium text-white/85">ממתינות לאישור</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <span className="v5-num text-[44px] font-extrabold leading-none text-white">{counts.pending}</span>
                <AvatarStack names={bookings.filter((b) => b.status === 'PENDING').map((b) => b.guest_name || 'אורח')} size={34} max={3} ringClass="ring-brand-600" />
              </div>
              <button type="button" onClick={() => void setUrlState({ tab: 'pending', page: 1 })} className="press mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-white text-[14px] font-bold text-brand-700 hover:bg-[#F4F3FF]">
                להצגת הממתינות
              </button>
            </section>
            <section className="d-card p-5" aria-label="פעולות">
              <h2 className="text-[15px] font-bold text-navy-900">עוד פעולות</h2>
              <div className="mt-3 grid gap-2">
                <button type="button" onClick={() => setFiltersOpen(true)} className="press flex min-h-[48px] items-center gap-3 rounded-[16px] bg-[#F3F4F9] px-4 text-[14px] font-semibold text-navy-900 hover:bg-[#E9EBF3]">
                  <SlidersHorizontal className="h-[18px] w-[18px] text-ink-400" strokeWidth={1.75} />סינון לפי תאריך, מצב או יחידה
                </button>
                <button type="button" onClick={handleExport} className="press flex min-h-[48px] items-center gap-3 rounded-[16px] bg-[#F3F4F9] px-4 text-[14px] font-semibold text-navy-900 hover:bg-[#E9EBF3]">
                  <Download className="h-[18px] w-[18px] text-ink-400" strokeWidth={1.75} />ייצוא לקובץ CSV
                </button>
              </div>
            </section>
          </>
        )}
        asideOnPhone={false}
      />

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-right">
            <DialogTitle className="text-[22px] font-bold text-navy-900">סינון הזמנות</DialogTitle>
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
            <DialogTitle className="text-[22px] font-bold text-navy-900">{editingBooking ? 'עריכת הזמנה' : 'הזמנה חדשה'}</DialogTitle>
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
    </DPage>
  );
}
