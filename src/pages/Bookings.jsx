/**
 * /bookings v2 (05.11.2026, after "I don't understand what this page is"). The page answers:
 * what bookings do I have, which need me, what do I do next.
 *  - simple chips: קרובות (default) / ממתינות לאישור / חסר תשלום / עבר / בוטלו
 *  - rows grouped היום / השבוע / בהמשך, each: guest, unit, dates + nights, amount + payment, source, status
 *  - a row opens a light booking drawer (phone: bottom sheet) with עריכה, רישום תשלום, וואטסאפ, ביטול, מחיקה
 * A/B behind ?bk=a|b (remembered). A = full-width list + drawer (default). B = "מחכות לכם" first + split view.
 */
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { askConfirm } from '@/components/common/confirmDialog';
import { useLocation, useNavigate } from 'react-router-dom';
import { readCommandPaletteFlag } from '@/lib/commandPaletteNavigationState';
import { useBookings, useCreateBooking, useUpdateBooking } from '@/data/entities';
import { useQueryClient } from '@tanstack/react-query';
import { useToast, deleteBookingWithUndo } from '@/components/ui/AtlasToast';
import { useProperties } from '@/data/entities';
import { ErrorFallback } from '@/components/common/ErrorFallback';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { AtlasSheet } from '@/components/ui/sheet/index';
import { displayUnits } from '@/lib/unitName';
import { Plus, Search, Download, CalendarPlus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToCSV, BOOKING_COLUMNS } from '@/lib/csvExport';
import { BookingForm } from '@/components/forms/BookingForm';
import { emptyBookingFormValues } from '@/components/forms/atlasFormSchemas';
import { bookingFormToPayload } from '@/lib/entityPayloads';
import { useBookingsUrlState } from '@/hooks/url-state/useBookingsUrlState';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { RecordPaymentSheet } from '@/components/stay/RecordPaymentSheet';
import { dueTemplateFor } from '@/lib/stay/whatsapp';
import { formatRangeHe } from '@/lib/stay/format';
import { checkOutOf } from '@/lib/stay/bookings';
import { useTodayModel, guestLabel } from '@/ui-direction/y/model';
import { BookingGroups } from '@/features/bookings-v2/BookingsList';
import { BookingDrawer } from '@/features/bookings-v2/BookingDrawer';
import { BookingDetailBody } from '@/features/bookings-v2/BookingDetail';
import {
  CHIPS, isOwnerBlock, matchesChip, chipFromTab, groupRows, searchMatch, nextStepOf, readBookingsVariant,
} from '@/features/bookings-v2/model';
import '@/features/bookings-v2/bookings-v2.css';

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

function useWide(q = '(min-width: 1024px)') {
  const get = () => typeof window !== 'undefined' && window.matchMedia(q).matches;
  const [m, setM] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [q]);
  return m;
}

const heCountBookings = (n) => (n === 1 ? 'הזמנה אחת' : `${n} הזמנות`);

export default function BookingsPage({ selectedPropertyId, user, orgId }) {
  const { success } = useToast();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const { tab, search, propertyId: urlPropertyId, openBookingId, setUrlState, setOpenBookingId } = useBookingsUrlState();
  const [variant] = useState(readBookingsVariant);
  const wide = useWide();
  const split = variant === 'b' && wide;

  const effectivePropertyId = urlPropertyId ?? selectedPropertyId ?? null;
  const filters = useMemo(() => (effectivePropertyId ? { property_id: effectivePropertyId } : {}), [effectivePropertyId]);

  const [chip, setChip] = useState(() => chipFromTab(tab));
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const formInterceptRef = useRef(null);
  const m = useTodayModel({ orgId });
  const [selId, setSelId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [composer, setComposer] = useState(null);
  const [paying, setPaying] = useState(null);

  useEffect(() => { if (!showForm) formInterceptRef.current = null; }, [showForm]);

  const bookingsQ = useBookings(filters, '-created_at', 200);
  const bookings = useMemo(() => (bookingsQ.data || []).filter((b) => !isOwnerBlock(b)), [bookingsQ.data]);
  const loadFailed = bookingsQ.isError && bookingsQ.data === undefined;
  const { data: properties = [], isLoading: propertiesLoading } = useProperties();
  const createMutation = useCreateBooking();
  const updateMutation = useUpdateBooking();
  const loading = bookingsQ.isLoading || propertiesLoading;

  const day = m.day;
  const unitName = (b) => m.prop(b.property_id)?.name || '';
  const searched = useMemo(() => bookings.filter((b) => searchMatch(search, b, unitName(b))), [bookings, search, m.data.propertyById]); // eslint-disable-line react-hooks/exhaustive-deps
  const counts = useMemo(() => Object.fromEntries(CHIPS.map((c) => [c.key, searched.filter((b) => matchesChip(c.key, b, day, m.balanceFor(b))).length])), [searched, day, m]);
  const rows = useMemo(() => searched.filter((b) => matchesChip(chip, b, day, m.balanceFor(b))), [searched, chip, day, m]);
  const groups = useMemo(() => groupRows(chip, rows, day), [chip, rows, day]);
  const attention = useMemo(() => (variant === 'b' && chip === 'upcoming'
    ? rows.map((b) => ({ b, s: nextStepOf(b, m.balanceFor(b), day) }))
      .filter((x) => x.s && (x.s.key === 'approve' || x.s.key === 'pay'))
      .sort((x, y) => Number(y.s.key === 'approve') - Number(x.s.key === 'approve'))
      .slice(0, 4).map((x) => x.b)
    : []), [variant, chip, rows, day, m]);

  const sel = bookings.find((b) => b.id === selId) || null;
  const paneBooking = split ? (sel && rows.some((r) => r.id === sel.id) ? sel : groups[0]?.rows[0] || null) : null;

  // ?openBookingId= (from the full booking page's "עריכה") opens the edit form, as before
  useEffect(() => {
    if (!openBookingId || !bookings.length) return;
    const b = bookings.find((x) => x.id === openBookingId);
    if (b) { setEditing(b); setShowForm(true); }
  }, [openBookingId, bookings]);

  useEffect(() => {
    if (!readCommandPaletteFlag(location.state, 'newBooking')) return;
    setEditing(null); setShowForm(true); setOpenBookingId(null);
    navigate({ pathname: location.pathname, search: location.search, hash: location.hash }, { replace: true, state: null });
  }, [location.state, location.pathname, location.search, location.hash, navigate, setOpenBookingId]);

  const closeForm = () => { setShowForm(false); setEditing(null); setOpenBookingId(null); };
  const openNew = () => { setEditing(null); setShowForm(true); setOpenBookingId(null); };

  const openBooking = (b) => {
    setSelId(b.id);
    if (!split) setDrawerOpen(true);
  };

  const handleSubmit = async (data) => {
    const payload = bookingFormToPayload(data);
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data: payload });
      success('ההזמנה עודכנה');
    } else {
      await createMutation.mutateAsync(payload);
      success('ההזמנה נשמרה');
    }
  };

  const who = (b) => (b.guest_name ? `של ${b.guest_name}` : '');
  const setStatus = async (b, status, msg) => {
    try {
      await updateMutation.mutateAsync({ id: b.id, data: { status } });
      success(msg);
    } catch { /* useUpdateBooking rolls back and shows the error toast */ }
  };

  const actions = {
    approve: (b) => setStatus(b, 'CONFIRMED', `ההזמנה ${who(b)} אושרה`.replace('  ', ' ')),
    restore: (b) => setStatus(b, 'CONFIRMED', 'ההזמנה חזרה. התאריכים תפוסים שוב ביומן.'),
    cancel: async (b) => {
      const ok = await askConfirm({
        title: `לבטל את ההזמנה ${who(b)}?`.replace('  ', ' '),
        description: 'התאריכים יתפנו ביומן, וההזמנה תישאר ברשימת "בוטלו". אפשר להחזיר אותה בכל רגע.',
        confirmLabel: 'ביטול ההזמנה',
        cancelLabel: 'חזרה',
      });
      if (!ok) return;
      setDrawerOpen(false);
      await setStatus(b, 'CANCELLED', 'ההזמנה בוטלה. התאריכים התפנו ביומן.');
    },
    remove: async (b) => {
      const ok = await askConfirm({
        title: `למחוק את ההזמנה ${who(b)}?`.replace('  ', ' '),
        description: 'ההזמנה תימחק לגמרי, גם מהיומן. אם האורח פשוט לא מגיע, עדיף לבטל: ההזמנה נשמרת ותמיד אפשר להחזיר אותה.',
        confirmLabel: 'מחיקה',
        cancelLabel: 'חזרה',
      });
      if (!ok) return;
      setDrawerOpen(false);
      if (selId === b.id) setSelId(null);
      deleteBookingWithUndo(queryClient, b.id);
    },
    edit: (b) => { setDrawerOpen(false); setEditing(b); setShowForm(true); },
    pay: (b, bal) => { setDrawerOpen(false); setPaying({ booking: b, balance: bal }); },
    whatsapp: (b) => { setDrawerOpen(false); setComposer({ booking: b, template: dueTemplateFor(b, m.sentOf(b), day) || 'confirmation' }); },
  };

  const handleExport = () => {
    const data = rows.map((b) => ({ ...b, property_name: unitName(b) }));
    exportToCSV(data, 'bookings', BOOKING_COLUMNS);
    success(`ירד קובץ לאקסל עם ${heCountBookings(data.length)}`);
  };

  const pending = counts.pending || 0;
  const unpaid = counts.unpaid || 0;
  const summary = loading ? '\u00a0' : !bookings.length ? 'כל ההזמנות שלכם, מכל הערוצים, במקום אחד.'
    : pending || unpaid
      ? [pending ? (pending === 1 ? 'הזמנה אחת מחכה לאישור' : `${pending} הזמנות מחכות לאישור`) : '', unpaid ? (unpaid === 1 ? 'אחת עם תשלום חסר' : `${unpaid} עם תשלום חסר`) : ''].filter(Boolean).join(' · ')
      : `${heCountBookings(counts.upcoming || 0)} קרובות. אין משהו שמחכה לכם.`;

  const units = displayUnits(properties);
  const noneAtAll = !loading && bookings.length === 0 && !search;
  const chipEmpty = {
    upcoming: 'אין הזמנות קרובות',
    pending: 'אין הזמנות שממתינות לאישור',
    unpaid: 'כל ההזמנות שולמו',
    past: 'עדיין אין שהיות שהסתיימו',
    cancelled: 'אין הזמנות שבוטלו',
  };

  const listEl = (
    <>
      {attention.length ? (
        <section className="bk2-att" aria-labelledby="bk2-att-h">
          <h2 id="bk2-att-h" className="bk2-att-h">מחכות לכם</h2>
          <ul className="bk2-att-list">
            {attention.map((b) => {
              const s = nextStepOf(b, m.balanceFor(b), day);
              return (
                <li key={b.id}>
                  <button type="button" className={cn('bk2-att-card press', paneBooking?.id === b.id && 'is-sel')} onClick={() => openBooking(b)}>
                    <i className={cn('bk2-dot', s.key === 'approve' ? 'bk2-dot--ind' : 'bk2-dot--amber')} aria-hidden />
                    <span><b dir="auto">{guestLabel(b)}</b><small>{s.key === 'pay' ? `נשאר לגבות ₪${Math.round(m.balanceFor(b).balance).toLocaleString('he-IL')}` : `${formatRangeHe(b.check_in_date, checkOutOf(b))} · מחכה לאישור`}</small></span>
                    <em>{s.key === 'approve' ? 'לאשר' : 'לגבות'}</em>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      {loading ? (
        <ul className="bk2-rows bk2-rows--sk" aria-hidden>{[0, 1, 2, 3].map((i) => <li key={i}><span className="bk2-row bk2-row--sk" /></li>)}</ul>
      ) : groups.length ? (
        <BookingGroups groups={groups} model={m} selId={split ? paneBooking?.id : selId} onOpen={openBooking} />
      ) : (
        <div className="bk2-empty bk2-empty--chip">
          <b>{search ? 'לא מצאנו הזמנה כזאת' : chipEmpty[chip]}</b>
          {search ? <small>בדקו את האיות, או חפשו לפי טלפון.</small> : null}
          {search ? <button type="button" className="bk2-btn press" onClick={() => void setUrlState({ search: '' })}>ניקוי החיפוש</button> : null}
        </div>
      )}
    </>
  );

  return (
    <div className={cn('y2 bk2', `bk2--${variant}`)} dir="rtl" data-variant={variant}>
      <div className="bk2-card">
        <header className="bk2-h" data-tour="bookings-page">
          <div className="min-w-0">
            <h1 className="bk2-h1">הזמנות</h1>
            <p className="bk2-sub" aria-live="polite">{summary}</p>
            {bookings.length ? <p className="bk2-hint">לחצו על הזמנה כדי לראות פרטים ופעולות.</p> : null}
          </div>
          <div className="bk2-h-acts">
            {bookings.length ? (
              <button type="button" onClick={handleExport} className="bk2-btn bk2-btn--ghost bk2-hide-m press" aria-label="ייצוא לאקסל">
                <Download aria-hidden strokeWidth={1.75} />ייצוא
              </button>
            ) : null}
            {noneAtAll ? null : <button type="button" onClick={openNew} className="bk2-btn bk2-btn--pri bk2-new press"><Plus aria-hidden strokeWidth={2} />הזמנה חדשה</button>}
          </div>
        </header>

        {loadFailed ? (
          <div className="bk2-err"><ErrorFallback onRetry={() => bookingsQ.refetch()} /></div>
        ) : noneAtAll ? (
          <div className="bk2-empty">
            <span className="bk2-empty-ic" aria-hidden><CalendarPlus strokeWidth={1.6} /></span>
            <b>עדיין אין הזמנות</b>
            <small>כאן יופיעו כל ההזמנות שלכם: מי מגיע, מתי, לאיזו יחידה וכמה שילמו.</small>
            <div className="bk2-example" aria-label="דוגמה להזמנה ברשימה">
              <span className="bk2-example-tag">דוגמה</span>
              <span className="bk2-example-row" aria-hidden>
                <span className="x-face" style={{ width: 44, height: 44, fontSize: 16 }}>דכ</span>
                <span className="bk2-row-who"><b>דנה כהן</b><small>12-14 בנוב׳ · 2 לילות</small></span>
                <span className="bk2-row-money"><b dir="ltr">₪1,800</b><span className="bk2-chip bk2-chip--partial">שולמה מקדמה</span></span>
              </span>
            </div>
            <button type="button" className="bk2-btn bk2-btn--pri press" onClick={openNew}><Plus aria-hidden strokeWidth={2} />הוספת הזמנה ראשונה</button>
          </div>
        ) : (
          <ErrorBoundary section="bookings-list" variant="inline" resetKey={`${effectivePropertyId ?? 'all'}|${chip}|${search}`}>
            <div className="bk2-tools">
              <label className="bk2-search">
                <Search aria-hidden strokeWidth={1.75} />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => void setUrlState({ search: e.target.value, page: 1 })}
                  placeholder="חיפוש אורח"
                  aria-label="חיפוש הזמנה לפי שם, טלפון או יחידה"
                />
              </label>
              {units.length > 1 ? (
                <label className="bk2-unit">
                  <span className="sr-only">יחידה</span>
                  <select value={urlPropertyId ?? ''} onChange={(e) => void setUrlState({ propertyId: e.target.value || null, page: 1 })}>
                    <option value="">כל היחידות</option>
                    {units.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <ChevronDown aria-hidden strokeWidth={1.75} />
                </label>
              ) : null}
            </div>
            <div className="bk2-chips" role="group" aria-label="איזה הזמנות להציג">
              {CHIPS.map((c) => (
                <button key={c.key} type="button" aria-pressed={chip === c.key} className={cn('bk2-fchip press', chip === c.key && 'on')} onClick={() => { setChip(c.key); if (!split) setSelId(null); }}>
                  {c.label}{counts[c.key] ? <em>{counts[c.key]}</em> : null}
                </button>
              ))}
            </div>

            {split ? (
              <div className="bk2-split">
                <div className="bk2-split-l">{listEl}</div>
                <aside className="bk2-pane" aria-label="פרטי ההזמנה">
                  {paneBooking ? <BookingDetailBody booking={paneBooking} model={m} actions={actions} TitleTag="h2" /> : <p className="bk2-pane-empty">בחרו הזמנה כדי לראות את הפרטים</p>}
                </aside>
              </div>
            ) : listEl}
          </ErrorBoundary>
        )}
      </div>

      <BookingDrawer booking={sel} open={drawerOpen && !!sel} onOpenChange={setDrawerOpen} model={m} actions={actions} />
      <RecordPaymentSheet open={!!paying} onOpenChange={(o) => { if (!o) setPaying(null); }} booking={paying?.booking} balance={paying?.balance} orgId={orgId} />
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

      <AtlasSheet
        open={showForm}
        onOpenChange={(open) => {
          const h = formInterceptRef.current;
          if (h) { h(open); return; }
          setShowForm(open);
          if (!open) setOpenBookingId(null);
        }}
        title={editing ? 'עריכת הזמנה' : 'הזמנה חדשה'}
        subtitle={editing ? null : 'את השאר אפשר להשלים אחר כך.'}
      >
        <BookingForm
          key={editing?.id ?? 'new'}
          storageSuffix={editing?.id ?? 'new'}
          defaultValues={bookingEntityToFormValues(editing)}
          properties={properties.map((p) => ({ id: p.id, name: p.name }))}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          setDialogOpen={setShowForm}
          onRegisterDialogInterceptor={(fn) => { formInterceptRef.current = fn; }}
          onAfterSubmitSuccess={() => { window.setTimeout(closeForm, 2000); }}
          submitLabel={editing ? 'שמירת שינויים' : 'שמירת הזמנה'}
        />
      </AtlasSheet>
    </div>
  );
}
