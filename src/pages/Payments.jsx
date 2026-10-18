import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import { Page, PageHeader, StatTile, SegmentedControl, EmptyState as DsEmptyState, StatusPill, SkelRows, fmtMoney, fmtShort } from '@/components/ds';
import { heCount } from '@/lib/hebrewCount';

const METHOD_LABEL = { cash: 'מזומן', transfer: 'העברה', bank_transfer: 'העברה', card: 'כרטיס', credit_card: 'כרטיס אשראי', bit: 'ביט', paybox: 'פייבוקס' };

const PAYMENT_STATUSES = [
  { value: 'PENDING',  label: 'ממתין', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'PAID',     label: 'שולם',  color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'PARTIAL',  label: 'חלקי',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'FAILED',   label: 'נכשל',  color: 'bg-red-100 text-red-700 border-red-200' },
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

  const { data: payments = [], isLoading, isError, error: paymentsError } = useQuery({
    queryKey: ['payments', orgId],
    queryFn: () =>
      orgId ? base44.entities.Payment.filter({ org_id: orgId }, '-created_date') : Promise.resolve([]),
    staleTime: 2 * 60 * 1000,
  });

  const [confirmPaymentDelete, setConfirmPaymentDelete] = useState(false);
  useEffect(() => { if (!showDialog) setConfirmPaymentDelete(false); }, [showDialog]);
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
    onError: () => toast({ title: 'שגיאה במחיקת התשלום', variant: 'destructive' }),
  });

  const stats = useMemo(() => ({
    total:   payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0),
    paid:    payments.filter(p => p.status === 'PAID').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0),
    pending: payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0),
    overdue: payments.filter(p => p.status === 'OVERDUE').length,
  }), [payments]);

  const filtered = useMemo(() => payments
    .filter(p => {
      const matchSearch = !searchTerm ||
        (p.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.booking_id || '').includes(searchTerm);
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
  [payments, searchTerm, statusFilter]);

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
      throw new Error('חסר ארגון, השלם הגדרה');
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
    toast({ title: `${filtered.length === 1 ? 'יוצא תשלום אחד' : `יוצאו ${filtered.length} תשלומים`} ל-CSV` });
  };

  return (
    <Page>
      <FinanceTabs />

      {!orgId && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 text-right">
          <p className="font-semibold">תשלומים זמינים אחרי קישור ארגון</p>
          <p className="text-amber-900/80 mt-1">רענן את הדף לאחר השלמת תהליך ההקמה.</p>
        </div>
      )}

      <PageHeader
        title="תשלומים"
        subtitle="מקדמות, יתרות ותשלומים שהתקבלו."
        actions={
          <>
            <Button onClick={openNew} disabled={!orgId}>
              <Plus strokeWidth={2.25} />
              תשלום חדש
            </Button>
          </>
        }
      />

      <ErrorBoundary section="financial-summary" variant="inline" resetKey={orgId ?? 'no-org'}>
        <div className="stat-row mb-5">
          <StatTile hero label="התקבל" value={fmtMoney(stats.paid, { compact: true })} icon={CheckCircle2} tone="success" />
          <StatTile label="ממתין לגבייה" value={fmtMoney(stats.pending, { compact: true })} icon={Clock} tone="amber" />
          <StatTile label="באיחור" value={stats.overdue} icon={AlertCircle} tone={stats.overdue ? 'danger' : undefined} />
        </div>
      </ErrorBoundary>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedControl
          ariaLabel="סינון לפי מצב"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[{ value: 'all', label: 'הכל' }, ...PAYMENT_STATUSES.slice(0, 3).map((x) => ({ value: x.value, label: x.label }))]}
        />
        <div className="relative lg:w-[320px]">
          <Search className="pointer-events-none absolute right-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-400" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="חיפוש תשלום" className="rounded-full pr-10" aria-label="חיפוש תשלום" />
        </div>
      </div>

      {/* Financial / payments table */}
      <div className="v7-card overflow-hidden">
        {!orgId ? (
          <div className="p-6 text-center text-sm text-gray-500">התחבר לארגון כדי לראות תשלומים</div>
        ) : filtered.length === 0 && !isLoading ? (
          <DsEmptyState
            icon={Wallet}
            title={searchTerm || statusFilter !== 'all' ? 'לא נמצאו תשלומים' : 'עדיין אין תשלומים'}
            description={searchTerm || statusFilter !== 'all' ? 'נסו חיפוש אחר.' : 'מקדמה או יתרה שתרשמו כאן תופיע גם בהזמנה ובמסך היום.'}
            action={!searchTerm && statusFilter === 'all' ? <Button onClick={openNew} disabled={!orgId}><Plus strokeWidth={2.25} />תשלום חדש</Button> : null}
          />
        ) : (
          <>
          <ul className="divide-y divide-[#EEF0F5]">
            {isLoading ? <li className="p-4"><SkelRows rows={5} /></li> : filtered.map((p) => {
              const st = PAYMENT_STATUSES.find((x) => x.value === p.status);
              return (
                <li key={p.id}>
                  <button type="button" onClick={() => openEdit(p)} className="press v7-row flex min-h-[76px] w-full items-center gap-4 px-5 py-3 text-start md:px-6">
                    <PayIcon status={p.status} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-navy-900">{p.description || 'תשלום'}</span>
                      <span className="block truncate text-[13px] text-ink-400">
                        {METHOD_LABEL[String(p.method || '').toLowerCase()] || 'תשלום'} · {p.status === 'PAID' ? `שולם ${fmtShort(p.paid_date || p.created_date)}` : `עד ${fmtShort(p.due_date || p.created_date)}`}
                      </span>
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
            error={isError ? (paymentsError instanceof Error ? paymentsError : new Error('שגיאת טעינה')) : null}
            onEdit={openEdit}
            onDelete={(id) => {
              if (confirm('למחוק תשלום זה?')) deleteMutation.mutate(id);
            }}
            onBulkDelete={(rows) => {
              if (!confirm(`למחוק ${heCount(rows.length, 'payment')}?`)) return;
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
                {confirmPaymentDelete ? 'ללחוץ שוב כדי למחוק' : 'מחיקת תשלום'}
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Page>
  );
}
