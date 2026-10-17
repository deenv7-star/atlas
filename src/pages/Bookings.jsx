import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { readCommandPaletteFlag } from '@/lib/commandPaletteNavigationState';
import { useBookings, useCreateBooking, useUpdateBooking, useDeleteBooking } from '@/data/entities';
import { useQueryClient } from '@tanstack/react-query';
import { useToast, deleteBookingWithUndo } from '@/components/ui/AtlasToast';
import { useProperties, usePayments } from '@/data/entities';
import { balanceOf, groupPaymentsByBooking } from '@/lib/stay/bookings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorFallback } from '@/components/common/ErrorFallback';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { BookingsTable } from '@/components/tables/BookingsTable';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { CalendarDays, Plus, Search, SlidersHorizontal, Download, Filter, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Page, PageHeader, ChannelDot, ChannelBadge, fmtMoney, fmtShort, SegmentedControl, EmptyState as DsEmptyState, StatusPill, SkelRows,
} from '@/components/ds';
import { cn } from '@/lib/utils';
import { exportToCSV, BOOKING_COLUMNS } from '@/lib/csvExport';
import { BookingForm } from '@/components/forms/BookingForm';
import { emptyBookingFormValues } from '@/components/forms/atlasFormSchemas';
import { bookingFormToPayload } from '@/lib/entityPayloads';
import { format, parse, startOfDay, endOfDay, parseISO, addDays as addDaysFns } from 'date-fns';
import { useBookingsUrlState } from '@/hooks/url-state/useBookingsUrlState';
import { sortBookings } from '@/hooks/url-state/bookingTableSort';
import { Rise, GuestAvatar, AvatarStack } from '@/components/app/atoms';

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
  const { data: allPayments = [] } = usePayments({}, '-created_at', 3000);
  const payByBooking = useMemo(() => groupPaymentsByBooking(allPayments), [allPayments]);
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

  const todayD = startOfDay(new Date());
  const weekEnd = endOfDay(addDaysFns(todayD, 6));
  const arrivingWeek = bookings.filter((b) => b.check_in_date && !['CANCELLED', 'WAITLIST'].includes(b.status) && parseISO(b.check_in_date) >= todayD && parseISO(b.check_in_date) <= weekEnd);
  const inHouse = bookings.filter((b) => b.status === 'CHECKED_IN');
  const pendingList = bookings.filter((b) => ['PENDING', 'WAITLIST'].includes(b.status));
  const tileOn = {
    pending: tab === 'pending' && !statusFilterArr.length && !dateFrom,
    week: !!dateFrom && !!dateTo && format(dateFrom, 'yyyy-MM-dd') === format(todayD, 'yyyy-MM-dd') && format(dateTo, 'yyyy-MM-dd') === format(weekEnd, 'yyyy-MM-dd'),
    inhouse: statusFilterArr.length === 1 && statusFilterArr[0] === 'CHECKED_IN',
  };
  const clearAll = { search: '', tab: 'all', status: [], dateFrom: null, dateTo: null, propertyId: null, page: 1 };
  const tiles = [
    { key: 'pending', label: 'ממתינות לאישור', head: 'e-tint-lilac text-[var(--st-lilac-fg)]', list: pendingList, hint: 'לאשר או לדחות', on: tileOn.pending, set: tileOn.pending ? clearAll : { ...clearAll, tab: 'pending' } },
    { key: 'week', label: 'מגיעים השבוע', head: 'e-tint-sky text-[var(--st-sky-fg)]', list: arrivingWeek, hint: 'ב־7 הימים הקרובים', on: tileOn.week, set: tileOn.week ? clearAll : { ...clearAll, dateFrom: todayD, dateTo: weekEnd } },
    { key: 'inhouse', label: 'בשהייה עכשיו', head: 'e-tint-mint text-[var(--st-mint-fg)]', list: inHouse, hint: 'אורחים במתחם', on: tileOn.inhouse, set: tileOn.inhouse ? clearAll : { ...clearAll, status: ['CHECKED_IN'] } },
  ];
  const chips = [
    ...statusFilterArr.map((s) => ({ key: `s-${s}`, label: STATUS_MAP[s]?.label || s, clear: { status: statusFilterArr.filter((x) => x !== s), page: 1 } })),
    ...(dateFrom || dateTo ? [{ key: 'dates', label: `${dateFrom ? fmtShort(dateFrom) : ''}${dateFrom && dateTo ? ' – ' : ''}${dateTo ? fmtShort(dateTo) : ''}`, clear: { dateFrom: null, dateTo: null, page: 1 } }] : []),
    ...(urlPropertyId ? [{ key: 'prop', label: propName(urlPropertyId) || 'יחידה', clear: { propertyId: null, page: 1 } }] : []),
  ];
  const COLS = 'md:grid-cols-[minmax(0,2.1fr)_minmax(0,1.25fr)_minmax(0,0.9fr)_minmax(0,1.15fr)_120px]';

  return (
    <Page className="max-w-[var(--page-max,1280px)] md:px-8">
      <PageHeader
        title="הזמנות"
        subtitle={`${counts.total} הזמנות · ${counts.confirmed} פעילות · ${counts.pending} ממתינות לאישור`}
        className="mb-6"
        actions={
          <>
            <Button variant="ghost" onClick={handleExport} className="hidden h-12 md:inline-flex">
              <Download strokeWidth={1.75} />
              ייצוא
            </Button>
            <Button onClick={openNew} className="hidden h-12 px-6 md:inline-flex">
              <Plus strokeWidth={2.25} />
              הזמנה חדשה
            </Button>
          </>
        }
      />

      {/* Order-list tiles: tinted head, a big count, the faces. Each one is also a filter. */}
      <div className="v7-strip -mx-5 mb-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0">
        {tiles.map((t, i) => (
          <Rise key={t.key} i={i} as="button" type="button" aria-pressed={t.on} onClick={() => void setUrlState(t.set)} className="e-tile press w-[78%] shrink-0 text-start md:w-auto">
            <span className={cn('e-tile-head', t.head)}>
              {t.label}
              {t.on ? <X className="h-4 w-4" strokeWidth={2} aria-hidden /> : null}
            </span>
            <span className="flex items-end justify-between gap-3 px-4 pb-4 pt-3">
              <span>
                <span className="block text-[34px] font-extrabold leading-none tabular text-navy-900">{t.list.length}</span>
                <span className="mt-1.5 block text-[13px] text-ink-400">{t.hint}</span>
              </span>
              {t.list.length ? <AvatarStack names={t.list.map((b) => b.guest_name || 'אורח')} size={32} max={3} /> : null}
            </span>
          </Rise>
        ))}
      </div>

      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 lg:w-[340px] lg:flex-none">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-400" />
            <Input
              value={search}
              onChange={(e) => void setUrlState({ search: e.target.value, page: 1 })}
              placeholder="חיפוש לפי שם אורח"
              className="h-12 rounded-full border-0 bg-white pr-11 shadow-[0_1px_2px_rgba(27,38,86,0.05)] ring-1 ring-inset ring-[#E8EAF2]"
              aria-label="חיפוש לפי שם אורח"
            />
          </div>
          <span className="hidden whitespace-nowrap text-[14px] text-ink-400 lg:inline"><span className="font-bold tabular text-navy-900">{sorted.length}</span> הזמנות</span>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <SegmentedControl
            ariaLabel="סינון לפי מצב"
            value={tab}
            onChange={(v) => void setUrlState({ tab: v, page: 1 })}
            className="min-w-0"
            options={[
              { value: 'all', label: 'הכל' },
              { value: 'active', label: 'פעילות' },
              { value: 'pending', label: 'ממתינות' },
            ]}
          />
          <Button variant={filtersActive ? 'secondary' : 'outline'} onClick={() => setFiltersOpen(true)} aria-label="סינון" className="h-11 shrink-0 rounded-full">
            <SlidersHorizontal />
            <span className="hidden sm:inline">סינון</span>
            {filtersActive ? <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[12px] text-white">{statusFilterArr.length + (dateFrom || dateTo ? 1 : 0) + (urlPropertyId ? 1 : 0)}</span> : null}
          </Button>
        </div>
      </div>
      {chips.length ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-ink-400" strokeWidth={1.75} aria-hidden />
          {chips.map((c) => (
            <button key={c.key} type="button" onClick={() => void setUrlState(c.clear)} aria-label={`הסרת סינון ${c.label}`} className="press inline-flex h-11 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-navy-900 ring-1 ring-inset ring-[#E3E6EF] hover:ring-[#C9CEDD]">
              {c.label}<X className="h-3.5 w-3.5 text-ink-400" strokeWidth={2} aria-hidden />
            </button>
          ))}
          <button type="button" onClick={() => void setUrlState(clearAll)} className="press inline-flex h-11 items-center px-2 text-[13px] font-semibold text-brand-600">ניקוי הכל</button>
        </div>
      ) : null}

      <div className="v7-card overflow-hidden p-0 md:p-2">
        {isError ? (
          <div className="p-4"><ErrorFallback /></div>
        ) : sorted.length === 0 && !isLoading && !propertiesLoading ? (
          <DsEmptyState
            icon={CalendarDays}
            title={hasQuery ? 'לא נמצאו הזמנות' : 'עדיין אין הזמנות'}
            description={hasQuery ? 'נסו חיפוש אחר או נקו את הסינון.' : 'הזמנה ראשונה לוקחת פחות מדקה: שם, תאריכים וערוץ.'}
            action={hasQuery ? (
              <Button variant="outline" onClick={() => void setUrlState(clearAll)}>ניקוי הסינון</Button>
            ) : (
              <Button onClick={openNew}><Plus strokeWidth={2.25} />הזמנה חדשה</Button>
            )}
          />
        ) : (
          <ErrorBoundary section="bookings-table" variant="inline" resetKey={`${effectivePropertyId ?? 'all'}|${tab}|${search}|${page}|${pageSize}`}>
            <div aria-hidden className={cn('hidden overflow-hidden rounded-[16px] bg-[#F5F6FA] md:grid', COLS)}>
              <span className="e-th">אורח</span>
              <span className="e-th">תאריכים</span>
              <span className="e-th">ערוץ</span>
              <span className="e-th">תשלום</span>
              <span className="e-th">מצב</span>
            </div>
            <ul className="divide-y divide-[#EEF0F5]">
              {isLoading ? (
                <li className="p-4"><SkelRows rows={5} /></li>
              ) : paged.map((b, idx) => {
                const bal = balanceOf(b, payByBooking.get(b.id) || []);
                const pct = bal.total > 0 ? Math.round((bal.paid / bal.total) * 100) : 0;
                return (
                  <Rise as="li" i={Math.min(idx, 8)} key={b.id}>
                    <Link to={`${createPageUrl('BookingDetail')}/${b.id}`} className={cn('press v7-row flex min-h-[80px] items-center gap-3.5 px-4 py-3 md:grid md:gap-0 md:rounded-[16px] md:px-0', COLS)}>
                      <span className="flex min-w-0 flex-1 items-center gap-3.5 md:px-4">
                        <GuestAvatar name={b.guest_name || 'אורח'} record={b} size={46} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-bold text-navy-900">{b.guest_name || 'אורח'}</span>
                          <span className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-ink-400">
                            <ChannelDot source={b.booking_source || b.source} className="h-1.5 w-1.5 md:hidden" />
                            <span className="truncate">{propName(b.property_id) || b.property_name}<span className="md:hidden"> · {fmtShort(b.check_in_date)}</span> · {b.nights || 1} לילות</span>
                          </span>
                        </span>
                      </span>
                      <span className="hidden truncate px-4 text-[14px] font-semibold tabular text-navy-900 md:block">{fmtShort(b.check_in_date)} – {fmtShort(b.check_out_date)}</span>
                      <span className="hidden px-4 md:block"><ChannelBadge source={b.booking_source || b.source} /></span>
                      <span className="hidden px-4 md:block">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="text-[15px] font-bold tabular text-navy-900">{fmtMoney(b.total_price)}</span>
                          <span className="text-[12px] font-semibold tabular text-ink-400">{bal.total > 0 ? (bal.balance > 0 ? `${pct}%` : 'שולם') : ''}</span>
                        </span>
                        {bal.total > 0 ? <span className="e-prog mt-2 block" aria-hidden><span style={{ width: `${Math.max(4, pct)}%`, background: bal.balance > 0 ? (bal.overdue ? '#EF5B5B' : '#3E2BF1') : undefined }} /></span> : null}
                      </span>
                      <span className="shrink-0 md:px-4"><StatusPill status={b.status} /></span>
                    </Link>
                  </Rise>
                );
              })}
            </ul>
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
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-[14px] text-ink-600">
                <span>עמוד {page} מתוך {totalPages} · {sorted.length} הזמנות</span>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => void setUrlState({ page: page - 1 })}>הקודם</Button>
                  <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => void setUrlState({ page: page + 1 })}>הבא</Button>
                  <select
                    className="h-11 rounded-full border border-line bg-white px-3 text-[14px]"
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
    </Page>
  );
}
