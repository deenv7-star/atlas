import React, { useState, useMemo, useRef, useEffect } from 'react';
import { askConfirm } from '@/components/common/confirmDialog';
import FinanceTabs from '@/components/app/FinanceTabs';
import { paymentFormToPayload } from '@/lib/entityPayloads';
import { useLocation, useNavigate } from 'react-router-dom';
import { readCommandPaletteFlag } from '@/lib/commandPaletteNavigationState';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FinancialTable } from '@/components/tables/FinancialTable';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  Wallet, Plus, Search, Clock, AlertCircle, CheckCircle2, Trash2,
} from 'lucide-react';
import { exportToCSV, PAYMENT_COLUMNS } from '@/lib/csvExport';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { emptyPaymentFormValues } from '@/components/forms/atlasFormSchemas';
import { cn } from '@/lib/utils';
import { useProperties } from '@/data/entities';
import { ErrorFallback } from '@/components/common/ErrorFallback';
import StaleIndicator from '@/components/app/StaleIndicator';
import { loadStateOf, canShowValues } from '@/lib/stay/loadState';
import { useStayData } from '@/hooks/useStayData';
import { openBalances } from '@/lib/stay/bookings';
import { Page, PageHeader, StatTile, SegmentedControl, EmptyState as DsEmptyState, StatusPill, SkelRows, fmtMoney, fmtShort } from '@/components/ds';

const HE_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const METHOD_LABEL = { cash: 'מזומן', transfer: 'העברה', bank_transfer: 'העברה', card: 'כרטיס', credit_card: 'כרטיס אשראי', bit: 'ביט', paybox: 'פייבוקס' };

const PAYMENT_STATUSES = [
  { value: 'PENDING',  label: 'ממתין', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'PAID',     label: 'שולם',  color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'PARTIAL',  label: 'שולם חלקית',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'FAILED',   label: 'לא עבר',  color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'REFUNDED', label: 'הוחזר', color: 'bg-gray-100 text-gray-500 border-gray-200' },
  { value: 'OVERDUE',  label: 'באיחור', color: 'bg-orange-100 text-orange-700 border-orange-200' },
];

function paymentEntityToFormValues(p) {
  if (!p) return { ...emptyPaymentFormValues };
  return {
    ...emptyPaymentFormValues,
    booking_id: p.booking_id || '',
    amount: p.amount != null && p.amount !== '' ? String(p.amount) : '',
    currency: p.currency || 'ILS',
    status: p.status || 'PENDING',
    method: p.method || 'credit_card',
    description: p.description || '',
    due_date: p.due_date || '',
    paid_date: p.paid_date || '',
  };
}

/** Round status mark beside each payment: mint check (paid), lilac clock (waiting), soft red (late). */
function PayIcon({ status }) {
  const st = String(status || '').toUpperCase();
  const [Icon, bg, fg] = st === 'PAID' ? [CheckCircle2, 'var(--st-mint-bg)', 'var(--st-mint-fg)']
    : st === 'OVERDUE' || st === 'FAILED' ? [AlertCircle, 'var(--st-red-bg)', 'var(--st-red-fg)']
      : [Clock, 'var(--st-lilac-bg)', 'var(--st-lilac-fg)'];
  return (
    <span aria-hidden className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: bg, color: fg }}>
      <Icon className="h-5 w-5" strokeWidth={1.75} />
    </span>
  );
}

export default function PaymentsPage({ user, selectedPropertyId, orgId }) {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDialog, setShowDialog]     = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const paymentDialogInterceptRef = useRef(null);

  useEffect(() => {
    if (!showDialog) paymentDialogInterceptRef.current = null;
  }, [showDialog]);

  useEffect(() => {
    if (!readCommandPaletteFlag(location.state, 'newPayment')) return;
    setEditingPayment(null);
    setShowDialog(true);
    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      { replace: true, state: null },
    );
  }, [location.state, location.pathname, location.search, location.hash, navigate]);

  const paymentsQ = useQuery({
    queryKey: ['payments', orgId],
    queryFn: () =>
      orgId ? base44.entities.Payment.filter({ org_id: orgId }, '-created_date') : Promise.resolve([]),
    staleTime: 2 * 60 * 1000,
  });
  const { isLoading, isError, error: paymentsError } = paymentsQ;
  const payments = useMemo(() => paymentsQ.data || [], [paymentsQ.data]);
  // Audit 04.11 #2/#5: no totals until the payments are really loaded; a failed refresh keeps the list.
  const moneyKnown = canShowValues(loadStateOf(paymentsQ));
  const loadFailed = isError && paymentsQ.data === undefined;

  const [confirmPaymentDelete, setConfirmPaymentDelete] = useState(false);
  useEffect(() => { if (!showDialog) setConfirmPaymentDelete(false); }, [showDialog]);
  const { data: properties = [] } = useProperties();
  const { data: bookingOptions = [] } = useQuery({
    queryKey: ['bookings', orgId],
    queryFn: () => base44.entities.Booking.filter({ org_id: orgId }, '-created_at', 300),
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      if (!orgId) throw new Error('missing_org');
      return base44.entities.Payment.create({ ...payload, org_id: orgId, amount: parseFloat(payload.amount) || 0 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data: payload }) => {
      const next = { ...payload };
      if (next.amount !== undefined && next.amount !== null && next.amount !== '')
        next.amount = parseFloat(String(next.amount).replace(',', '.')) || 0;
      return base44.entities.Payment.update(id, next);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Payment.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payments'] }); toast({ title: 'התשלום נמחק' }); },
    onError: () => toast({ title: 'לא הצלחנו למחוק את התשלום. נסו שוב.', variant: 'destructive' }),
  });

  // M2 (audit 04.11): "התקבל" is cash in this month: PAID payments dated this month, labelled with the month.
  // fix/today-tiles-c: "ממתין לגבייה" and "באיחור" are the unpaid balances of non-cancelled bookings, from the
  // same openBalances() the Today tile "ממתינים לתשלום" reads. (It used to sum Payment rows with status PENDING,
  // so a booking with no payment row at all counted as nothing owed: ₪0 here, ₪6,250 on Today.)
  const monthName = HE_MONTHS[new Date().getMonth()];
  const stay = useStayData({ withCleaning: false });
  const owedKnown = canShowValues(stay.paymentsState) && canShowValues(stay.bookingsState);
  const owed = useMemo(() => openBalances(stay.bookings, stay.paymentsByBooking), [stay.bookings, stay.paymentsByBooking]);
  const stats = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const amt = (p) => parseFloat(p.amount) || 0;
    const paidMonth = (p) => String(p.paid_date || p.created_date || p.created_at || '').slice(0, 7) === ym;
    return {
      paid:    payments.filter((p) => p.status === 'PAID' && paidMonth(p)).reduce((s, p) => s + amt(p), 0),
      pending: owed.total,
      pendingCount: owed.count,
      overdue: owed.overdue,
    };
  }, [payments, owed]);

  // M1 (audit 04.11): who paid. Booking → guest name and unit, from the bookings already loaded for the form.
  const bookingById = useMemo(() => new Map(bookingOptions.map((b) => [b.id, b])), [bookingOptions]);
  const unitById = useMemo(() => new Map(properties.map((p) => [p.id, p.name])), [properties]);
  const whoOf = (p) => {
    const b = p.booking_id ? bookingById.get(p.booking_id) : null;
    const guest = b?.guest_name || '';
    const unit = b ? (unitById.get(b.property_id) || b.property_name || '') : '';
    return { guest, unit };
  };

  const filtered = useMemo(() => payments
    .filter(p => {
      const q = searchTerm.trim().toLowerCase();
      const { guest, unit } = whoOf(p);
      const matchSearch = !q ||
        guest.toLowerCase().includes(q) ||
        unit.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [payments, searchTerm, statusFilter, bookingById, unitById]);
  // M6: an empty list gets one sentence + one button; no zero totals, no filters, no second CTA.
  const listEmpty = !!orgId && !isLoading && !loadFailed && payments.length === 0;

  const closePaymentDialog = () => {
    setShowDialog(false);
    setEditingPayment(null);
  };

  const openNew = () => {
    setEditingPayment(null);
    setShowDialog(true);
  };
  const openEdit = payment => {
    setEditingPayment(payment);
    setShowDialog(true);
  };

  const handlePaymentSubmit = async (data) => {
    if (!orgId) {
      throw new Error('כדי לרשום תשלומים, קודם מסיימים את ההגדרה הקצרה.');
    }
    if (editingPayment) {
      await updateMutation.mutateAsync({ id: editingPayment.id, data: paymentFormToPayload(data) });
      toast({ title: 'התשלום עודכן' });
    } else {
      await createMutation.mutateAsync({ ...paymentFormToPayload(data), org_id: orgId });
      toast({ title: 'התשלום נשמר' });
    }
  };

  // ── CSV Export ───────────────────────────────────────────────────────────────
  const handleExport = () => {
    exportToCSV(filtered, 'payments', PAYMENT_COLUMNS);
    toast({ title: `ירד קובץ לאקסל עם ${filtered.length === 1 ? 'תשלום אחד' : `${filtered.length} תשלומים`}` });
  };

  return (
    <Page>
      <FinanceTabs />

      {!orgId && (
        <div className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-navy-900 text-right">
          <p className="font-semibold">התשלומים יופיעו אחרי ההגדרה הקצרה</p>
          <p className="text-ink-600 mt-1">כדי לרשום תשלומים, קודם מסיימים את ההגדרה הקצרה. <a href="/setup" className="font-semibold text-brand-700 underline underline-offset-2">המשך ההגדרה</a></p>
        </div>
      )}

      <PageHeader
        title="תשלומים"
        help="payments.page"
        tour="payments-page"
        subtitle="מקדמות, יתרות ותשלומים שהתקבלו."
        actions={
          <>
            <StaleIndicator queries={[paymentsQ]} onRetry={() => paymentsQ.refetch()} />
            {listEmpty ? null : (
              <Button onClick={openNew} disabled={!orgId}>
                <Plus strokeWidth={2.25} />
                תשלום חדש
              </Button>
            )}
          </>
        }
      />

      {listEmpty || loadFailed ? null : (
      <ErrorBoundary section="financial-summary" variant="inline" resetKey={orgId ?? 'no-org'}>
        <div className="stat-row mb-5" data-tour="payments-stats">
          <StatTile hero label={`התקבל ב${monthName}`} hint="תשלומים ששולמו החודש" help="payments.received" value={moneyKnown ? fmtMoney(stats.paid) : '—'} loading={!moneyKnown && isLoading} icon={CheckCircle2} tone="success" />
          <StatTile label="ממתין לגבייה" hint={owedKnown && stats.pendingCount ? (stats.pendingCount === 1 ? 'הזמנה אחת עם יתרה' : `${stats.pendingCount} הזמנות עם יתרה`) : undefined} help="payments.pending" value={owedKnown ? fmtMoney(stats.pending) : '—'} loading={!owedKnown && stay.isLoading} icon={Clock} tone="amber" />
          <StatTile label="באיחור" help="payments.overdue" value={owedKnown ? stats.overdue : '—'} loading={!owedKnown && stay.isLoading} icon={AlertCircle} tone={stats.overdue ? 'danger' : undefined} />
        </div>
      </ErrorBoundary>
      )}

      <div className={cn('mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between', (listEmpty || loadFailed) && 'hidden')}>
        <SegmentedControl
          ariaLabel="סינון לפי מצב"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[{ value: 'all', label: 'הכל' }, ...PAYMENT_STATUSES.slice(0, 3).map((x) => ({ value: x.value, label: x.label }))]}
        />
        <div className="relative lg:w-[320px]">
          <Search className="pointer-events-none absolute right-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-400" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="חיפוש לפי אורח או יחידה" className="rounded-full pr-10" aria-label="חיפוש תשלום לפי אורח או יחידה" />
        </div>
      </div>

      {/* Financial / payments table */}
      <div className="v7-card overflow-hidden">
        {!orgId ? (
          <div className="p-6 text-center text-sm text-ink-600">התשלומים יופיעו כאן אחרי שתסיימו את ההגדרה הקצרה.</div>
        ) : loadFailed ? (
          <div className="p-4"><ErrorFallback title="לא הצלחנו לטעון את התשלומים" onRetry={() => paymentsQ.refetch()} /></div>
        ) : filtered.length === 0 && !isLoading ? (
          <DsEmptyState
            icon={Wallet}
            face={searchTerm || statusFilter !== 'all' ? undefined : 'sleepy'}
            title={searchTerm || statusFilter !== 'all' ? 'אין תשלומים שמתאימים' : 'עדיין אין תשלומים'}
            description={searchTerm || statusFilter !== 'all' ? 'נסו חיפוש אחר.' : 'אורח שילם מקדמה או יתרה? לוחצים "תשלום חדש" ורושמים כמה. זה יופיע גם בהזמנה.'}
            action={!searchTerm && statusFilter === 'all' ? <Button variant="outline" onClick={openNew} disabled={!orgId}><Plus strokeWidth={2.25} />תשלום חדש</Button> : null}
          />
        ) : (
          <>
          <ul className="divide-y divide-[#EEF0F5]">
            {isLoading ? <li className="p-4"><SkelRows rows={5} /></li> : filtered.map((p) => {
              const st = PAYMENT_STATUSES.find((x) => x.value === p.status);
              const { guest, unit } = whoOf(p);
              const title = guest || p.description || 'תשלום ללא הזמנה';
              const when = p.status === 'PAID' ? `שולם ${fmtShort(p.paid_date || p.created_date)}` : `עד ${fmtShort(p.due_date || p.created_date)}`;
              const meta = [unit, guest && p.description ? p.description : (METHOD_LABEL[String(p.method || '').toLowerCase()] || ''), when].filter(Boolean).join(' · ');
              return (
                <li key={p.id}>
                  <button type="button" onClick={() => openEdit(p)} className="press v7-row flex min-h-[76px] w-full items-center gap-4 px-5 py-3 text-start md:px-6">
                    <PayIcon status={p.status} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-navy-900" dir="auto">{title}</span>
                      <span className="block truncate text-[13px] text-ink-400">{meta}</span>
                    </span>
                    <StatusPill status={p.status} label={st?.label} className="hidden sm:inline-flex" />
                    <span className="flex flex-col items-end gap-1 sm:w-[104px]">
                      <span className="v5-num text-[15px] font-bold text-navy-900">{fmtMoney(p.amount)}</span>
                      <StatusPill status={p.status} label={st?.label} className="sm:hidden" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="hidden">
          <FinancialTable
            payments={filtered}
            isLoading={isLoading}
            error={isError ? (paymentsError instanceof Error ? paymentsError : new Error('לא הצלחנו לטעון את התשלומים')) : null}
            onEdit={openEdit}
            onDelete={(id) => {
              askConfirm({ title: 'למחוק את התשלום?', description: 'התשלום יימחק לצמיתות.' })
                .then((ok) => { if (ok) deleteMutation.mutate(id); });
            }}
            onBulkDelete={(rows) => {
              rows.forEach((r) => deleteMutation.mutate(r.id));
            }}
          />
          </div>
          </>
        )}
      </div>

      {/* Dialog */}
      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          const h = paymentDialogInterceptRef.current;
          if (h) {
            h(open);
            return;
          }
          setShowDialog(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-right">
            <DialogTitle className="text-[22px] font-bold text-navy-900">{editingPayment ? 'עריכת תשלום' : 'תשלום חדש'}</DialogTitle>
          </DialogHeader>
          <PaymentForm
            key={editingPayment?.id ?? 'new'}
            storageSuffix={editingPayment?.id ?? 'new'}
            defaultValues={paymentEntityToFormValues(editingPayment)}
            bookings={bookingOptions}
            onSubmit={handlePaymentSubmit}
            onCancel={closePaymentDialog}
            setDialogOpen={setShowDialog}
            onRegisterDialogInterceptor={(fn) => {
              paymentDialogInterceptRef.current = fn;
            }}
            onAfterSubmitSuccess={() => {
              window.setTimeout(closePaymentDialog, 2000);
            }}
            submitLabel="שמירה"
          />
          {editingPayment ? (
            <div className="-mt-1 flex justify-start border-t border-line pt-3">
              <Button
                variant="ghost"
                className="h-11 text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (!confirmPaymentDelete) { setConfirmPaymentDelete(true); return; }
                  deleteMutation.mutate(editingPayment.id, { onSuccess: () => { setConfirmPaymentDelete(false); closePaymentDialog(); } });
                }}
              >
                <Trash2 />
                {confirmPaymentDelete ? 'לחצו שוב כדי למחוק' : 'מחיקת תשלום'}
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Page>
  );
}
