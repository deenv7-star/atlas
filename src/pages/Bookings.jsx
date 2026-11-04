import React, { useMemo, useRef, useEffect, useState } from 'react';
import { askConfirm } from '@/components/common/confirmDialog';
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
import { Plus, Search, SlidersHorizontal, Download } from 'lucide-react';

import { cn } from '@/lib/utils';
import { exportToCSV, BOOKING_COLUMNS } from '@/lib/csvExport';
import { BookingForm } from '@/components/forms/BookingForm';
import { emptyBookingFormValues } from '@/components/forms/atlasFormSchemas';
import { bookingFormToPayload } from '@/lib/entityPayloads';
import { format, parse, startOfDay, endOfDay, parseISO } from 'date-fns';
import { useBookingsUrlState } from '@/hooks/url-state/useBookingsUrlState';
import { sortBookings } from '@/hooks/url-state/bookingTableSort';
import { heCount } from '@/lib/hebrewCount';
import HelpHint from '@/components/help/HelpHint';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { BookingsPanel, BookingSheet } from '@/ui-direction/y/Bookings';
import { useTodayModel } from '@/ui-direction/y/model';

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

export default function BookingsPage({ selectedPropertyId, user, orgId }) {
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
  // Y3: the same navy bookings panel as Today (list + the chosen booking beside it; phone: a sheet)
  const m = useTodayModel({ orgId });
  const [selId, setSelId] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [composer, setComposer] = useState(null);

  useEffect(() => {
    if (!showDialog) bookingDialogInterceptRef.current = null;
  }, [showDialog]);

  const bookingsQ = useBookings(filters, '-created_at', 200);
  const { isLoading, isError } = bookingsQ;
  const bookings = useMemo(() => bookingsQ.data || [], [bookingsQ.data]);
  // Audit 04.11 #5: a failed refresh keeps the list on screen (the shell strip offers a retry);
  // the error card shows only when there is nothing to show.
  const loadFailed = isError && bookingsQ.data === undefined;
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

  const handleDelete = async (id) => {
    const b = bookings.find((x) => x.id === id);
    const ok = await askConfirm({
      title: b?.guest_name ? `למחוק את ההזמנה של ${b.guest_name}?` : 'למחוק את ההזמנה?',
      description: 'ההזמנה תיעלם מהיומן ומהרשימה. ב-5 השניות הראשונות אפשר לבטל מההודעה שתופיע.',
    });
    if (!ok) return;
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
    success(`${done === 1 ? 'הזמנה אחת עכשיו במצב' : `${done} הזמנות עכשיו במצב`}: ${STATUS_MAP[status]?.label || status}`);
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
    success(`ירד קובץ לאקסל עם ${data.length === 1 ? 'הזמנה אחת' : `${data.length} הזמנות`}`);
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
  const hasQuery = !!search || tab !== 'all' || filtersActive;

  const listLoading = isLoading || propertiesLoading;
  const panelTabs = [
    { key: 'all', label: 'הכל', count: counts.total },
    { key: 'active', label: 'פעילות', count: counts.confirmed },
    { key: 'pending', label: 'ממתינות', count: counts.pending },
  ];

  return (
    <div className="y2 y3-bk" dir="rtl">
      <div className="y2-win y3-bk-win">
        <header className="y2-hello y3-bk-h" data-tour="bookings-page">
          <div className="min-w-0">
            <h1 className="y2-h1 y3-bk-h1"><span>הזמנות</span><HelpHint id="bookings.page" /></h1>
            <p className="y2-sub">כל ההזמנות, מכל הערוצים.</p>
          </div>
          <button type="button" onClick={openNew} className="y3-bk-new press"><Plus strokeWidth={2} />הזמנה חדשה</button>
        </header>

        {loadFailed ? (
          <div className="y3-bk-err"><ErrorFallback onRetry={() => bookingsQ.refetch()} /></div>
        ) : (
          <ErrorBoundary section="bookings-table" variant="inline" resetKey={`${effectivePropertyId ?? 'all'}|${tab}|${search}|${page}|${pageSize}`}>
            <BookingsPanel
              data-tour="bookings-list"
              className="y3-panel--page"
              title="כל ההזמנות"
              model={m}
              list={paged}
              loading={listLoading}
              limit={Infinity}
              tabs={panelTabs}
              tab={tab}
              onTab={(k) => void setUrlState({ tab: k, page: 1 })}
              selId={selId}
              setSelId={setSelId}
              onOpen={setSheet}
              onWhatsApp={(b, t) => setComposer({ booking: b, template: t })}
              toolbar={(
                <div className="y3-bk-tools">
                  <label className="y3-bk-search">
                    <Search strokeWidth={1.75} aria-hidden />
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => void setUrlState({ search: e.target.value, page: 1 })}
                      placeholder="חיפוש לפי שם אורח"
                      aria-label="חיפוש לפי שם אורח"
                    />
                  </label>
                  <button type="button" onClick={() => setFiltersOpen(true)} aria-label="סינון" className={cn('y3-bk-tb press', filtersActive && 'on')}>
                    <SlidersHorizontal strokeWidth={1.75} />
                    <span className="y3-bk-tb-l">סינון</span>
                    {filtersActive ? <em dir="ltr">{statusFilterArr.length + (dateFrom || dateTo ? 1 : 0) + (urlPropertyId ? 1 : 0)}</em> : null}
                  </button>
                  <button type="button" onClick={handleExport} className="y3-bk-tb y3-bk-exp press" aria-label="ייצוא ל-CSV">
                    <Download strokeWidth={1.75} /><span className="y3-bk-tb-l">ייצוא</span>
                  </button>
                </div>
              )}
              empty={sorted.length === 0 && !listLoading ? (
                <span className="y3-bk-empty">
                  <b>{hasQuery ? 'אין הזמנות שמתאימות לחיפוש' : 'עדיין אין הזמנות'}</b>
                  <small>{hasQuery ? 'נסו חיפוש אחר או נקו את הסינון.' : 'מוסיפים הזמנה ראשונה בפחות מדקה: שם האורח, תאריכים ומאיפה הגיע.'}</small>
                  {hasQuery ? (
                    <button type="button" className="y3-bk-tb press" onClick={() => void setUrlState({ search: '', tab: 'all', status: [], dateFrom: null, dateTo: null, propertyId: null, page: 1 })}>ניקוי הסינון</button>
                  ) : (
                    <button type="button" className="y3-bk-new press" onClick={openNew}><Plus strokeWidth={2} />הזמנה חדשה</button>
                  )}
                </span>
              ) : null}
              footer={sorted.length > pageSize ? (
                <div className="y3-bk-pages">
                  <span>עמוד {page} מתוך {totalPages} · {heCount(sorted.length, 'booking')}</span>
                  <div>
                    <button type="button" className="y3-bk-tb press" disabled={page <= 1} onClick={() => void setUrlState({ page: page - 1 })}>הקודם</button>
                    <button type="button" className="y3-bk-tb press" disabled={page >= totalPages} onClick={() => void setUrlState({ page: page + 1 })}>הבא</button>
                    <select
                      className="y3-bk-tb"
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
            />
            <div className="hidden">
              <BookingsTable
                bookings={paged}
                properties={properties}
                isLoading={listLoading}
                error={null}
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
          </ErrorBoundary>
        )}
      </div>

      <BookingSheet open={!!sheet} onOpenChange={(o) => !o && setSheet(null)} booking={sheet} model={m}
        onWhatsApp={(b, t) => { setSheet(null); setComposer({ booking: b, template: t }); }} />
      <WhatsAppComposer
        open={!!composer}
        onOpenChange={(o) => { if (!o) setComposer(null); }}
        booking={composer?.booking}
        property={composer ? m.prop(composer.booking.property_id) : null}
        balance={composer && m.moneyKnown ? m.balanceFor(composer.booking) : undefined}
        initialTemplate={composer?.template}
        orgId={orgId}
        orgName={user?.organization_name || ''}
        onSent={(key) => { if (composer) { m.markSent(composer.booking.id, composer.template); m.markSent(composer.booking.id, key); } }}
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
              <Button onClick={() => setFiltersOpen(false)}>{sorted.length === 1 ? "הצגת הזמנה אחת" : `הצגת ${sorted.length} הזמנות`}</Button>
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
    </div>
  );
}
