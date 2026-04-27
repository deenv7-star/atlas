import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  Wallet, Plus, Search, Edit, Trash2,
  TrendingUp, Clock, AlertCircle, CheckCircle2, Download,
} from 'lucide-react';
import { formatIsoSafe } from '@/lib/formatIsoSafe';
import { exportToCSV, PAYMENT_COLUMNS } from '@/lib/csvExport';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { emptyPaymentFormValues } from '@/components/forms/atlasFormSchemas';

const PAYMENT_STATUSES = [
  { value: 'PENDING',  label: 'ממתין', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'PAID',     label: 'שולם',  color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'PARTIAL',  label: 'חלקי',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'FAILED',   label: 'נכשל',  color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'REFUNDED', label: 'הוחזר', color: 'bg-gray-100 text-gray-500 border-gray-200' },
  { value: 'OVERDUE',  label: 'באיחור', color: 'bg-orange-100 text-orange-700 border-orange-200' },
];

const STATUS_MAP = Object.fromEntries(PAYMENT_STATUSES.map(s => [s.value, s]));
const METHOD_ICONS = {
  credit_card: '💳', bank_transfer: '🏦', cash: '💵',
  paypal: '🅿️', bit: '📱', other: '💰',
};

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

export default function PaymentsPage({ user, selectedPropertyId, orgId }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDialog, setShowDialog]     = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const paymentDialogInterceptRef = useRef(null);

  useEffect(() => {
    if (!showDialog) paymentDialogInterceptRef.current = null;
  }, [showDialog]);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', orgId],
    queryFn: () =>
      orgId ? base44.entities.Payment.filter({ org_id: orgId }, '-created_date') : Promise.resolve([]),
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
      throw new Error('חסר ארגון — השלם הגדרה');
    }
    if (editingPayment) {
      await updateMutation.mutateAsync({ id: editingPayment.id, data: { ...data } });
      toast({ title: 'התשלום עודכן' });
    } else {
      await createMutation.mutateAsync({ ...data, org_id: orgId });
      toast({ title: 'תשלום נוצר בהצלחה' });
    }
  };

  // ── CSV Export ───────────────────────────────────────────────────────────────
  const handleExport = () => {
    exportToCSV(filtered, 'payments', PAYMENT_COLUMNS);
    toast({ title: `יוצאו ${filtered.length} תשלומים ל-CSV` });
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto animate-fade-in" dir="rtl">

      {!orgId && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 text-right">
          <p className="font-semibold">תשלומים זמינים אחרי קישור ארגון</p>
          <p className="text-amber-900/80 mt-1">רענן את הדף לאחר השלמת תהליך ההקמה.</p>
        </div>
      )}

      <div className="bg-gradient-to-br from-indigo-50/80 to-white rounded-2xl border border-indigo-100/50 p-5 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול תשלומים</h1>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed mr-12">עקוב אחר כל התשלומים שלך — שהתקבלו, ממתינים ובאיחור.</p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shadow-sm flex-shrink-0">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">תשלומים</h1>
            <p className="text-xs text-gray-400">{payments.length} תשלומים</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* CSV Export button */}
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2 min-h-[44px] h-11 text-sm rounded-xl border-gray-200 hidden sm:flex"
            disabled={filtered.length === 0}
          >
            <Download className="w-4 h-4" />
            ייצוא CSV
          </Button>
          <Button
            onClick={openNew}
            disabled={!orgId}
            className="gap-1.5 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold h-9 text-sm rounded-xl shadow-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> תשלום חדש
          </Button>
        </div>
      </div>

      {/* Stats */}
      <ErrorBoundary section="financial-summary" variant="inline" resetKey={orgId ?? 'no-org'}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'סה"כ הכנסות', value: `₪${stats.total.toLocaleString()}`, icon: TrendingUp, iconClass: 'icon-teal',  bg: 'stat-teal' },
          { label: 'שולם',         value: `₪${stats.paid.toLocaleString()}`,   icon: CheckCircle2, iconClass: 'icon-green', bg: 'stat-green' },
          { label: 'ממתין',        value: `₪${stats.pending.toLocaleString()}`, icon: Clock,    iconClass: 'icon-amber', bg: 'stat-amber' },
          { label: 'באיחור',       value: stats.overdue,                        icon: AlertCircle, iconClass: 'icon-rose',  bg: 'stat-rose' },
        ].map(({ label, value, icon: Icon, iconClass, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-3 flex items-center gap-3`}>
            <div className={`${iconClass} w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-gray-800 truncate">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>
      </ErrorBoundary>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="חפש תשלום..." className="h-9 pr-9 text-sm rounded-xl border-gray-200 bg-white" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[{ value: 'all', label: 'הכל' }, ...PAYMENT_STATUSES.slice(0, 3)].map(s => (
            <button key={s.value} onClick={() => setStatusFilter(s.value)}
              className={`h-8 px-3 rounded-full text-xs font-medium transition-all border ${statusFilter === s.value ? 'bg-[#0B1220] text-white border-[#0B1220]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Payments list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <Wallet className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">אין תשלומים</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(payment => {
              const statusInfo = STATUS_MAP[payment.status] || STATUS_MAP.PENDING;
              const methodIcon = METHOD_ICONS[payment.method] || '💰';
              const paidLabel  = formatIsoSafe(payment.paid_date, 'dd/MM/yy');
              const dueLabel   = formatIsoSafe(payment.due_date, 'dd/MM/yy');
              return (
                <div key={payment.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors group">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 border border-emerald-100 flex items-center justify-center flex-shrink-0 text-base">
                    {methodIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {payment.description || `תשלום${payment.booking_id ? ' #' + payment.booking_id.slice(-4) : ''}`}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${statusInfo.color}`}>{statusInfo.label}</span>
                      {paidLabel && <span className="text-xs text-gray-400">{paidLabel}</span>}
                      {payment.due_date && payment.status === 'PENDING' && dueLabel && <span className="text-xs text-gray-400">לתשלום: {dueLabel}</span>}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900 flex-shrink-0 tabular-nums">₪{parseFloat(payment.amount || 0).toLocaleString()}</p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => openEdit(payment)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { if (confirm('למחוק תשלום זה?')) deleteMutation.mutate(payment.id); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{editingPayment ? 'עריכת תשלום' : 'תשלום חדש'}</DialogTitle>
          </DialogHeader>
          <PaymentForm
            key={editingPayment?.id ?? 'new'}
            storageSuffix={editingPayment?.id ?? 'new'}
            defaultValues={paymentEntityToFormValues(editingPayment)}
            onSubmit={handlePaymentSubmit}
            onCancel={closePaymentDialog}
            setDialogOpen={setShowDialog}
            onRegisterDialogInterceptor={(fn) => {
              paymentDialogInterceptRef.current = fn;
            }}
            onAfterSubmitSuccess={() => {
              window.setTimeout(closePaymentDialog, 2000);
            }}
            submitLabel="שמור"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
