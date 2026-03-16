import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  Wallet, Plus, Search, Check, Edit, Trash2,
  TrendingUp, Clock, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const PAYMENT_STATUSES = [
  { value: 'PENDING',  label: 'ממתין', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'PAID',     label: 'שולם',  color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'PARTIAL',  label: 'חלקי',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'FAILED',   label: 'נכשל',  color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'REFUNDED', label: 'הוחזר', color: 'bg-gray-100 text-gray-500 border-gray-200' },
  { value: 'OVERDUE',  label: 'באיחור', color: 'bg-orange-100 text-orange-700 border-orange-200' },
];

const PAYMENT_METHODS = [
  { value: 'credit_card',   label: 'כרטיס אשראי' },
  { value: 'bank_transfer', label: 'העברה בנקאית' },
  { value: 'cash',          label: 'מזומן' },
  { value: 'paypal',        label: 'PayPal' },
  { value: 'bit',           label: 'Bit' },
  { value: 'other',         label: 'אחר' },
];

const STATUS_MAP = Object.fromEntries(PAYMENT_STATUSES.map(s => [s.value, s]));

const METHOD_ICONS = {
  credit_card: '💳',
  bank_transfer: '🏦',
  cash: '💵',
  paypal: '🅿️',
  bit: '📱',
  other: '💰',
};

const emptyPayment = {
  booking_id: '',
  amount: '',
  currency: 'ILS',
  status: 'PENDING',
  method: 'credit_card',
  description: '',
  due_date: '',
  paid_date: '',
};

export default function PaymentsPage({ user, selectedPropertyId }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [form, setForm] = useState(emptyPayment);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment.list(),
    staleTime: 2 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Payment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
      toast({ title: 'תשלום נוצר' });
      setShowDialog(false);
      setForm(emptyPayment);
    },
    onError: () => toast({ title: 'שגיאה ביצירה', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Payment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
      toast({ title: 'תשלום עודכן' });
      setShowDialog(false);
    },
    onError: () => toast({ title: 'שגיאה בעדכון', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Payment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
      toast({ title: 'תשלום נמחק' });
    },
    onError: () => toast({ title: 'שגיאה במחיקה', variant: 'destructive' }),
  });

  const stats = useMemo(() => {
    const total   = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    const paid    = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    const pending = payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    const overdue = payments.filter(p => p.status === 'OVERDUE').length;
    return { total, paid, pending, overdue };
  }, [payments]);

  const filtered = useMemo(() => {
    return payments
      .filter(p => {
        const matchSearch = !searchTerm ||
          (p.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.booking_id || '').includes(searchTerm);
        const matchStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
  }, [payments, searchTerm, statusFilter]);

  const openNew = () => {
    setEditingPayment(null);
    setForm(emptyPayment);
    setShowDialog(true);
  };

  const openEdit = (payment) => {
    setEditingPayment(payment);
    setForm({
      booking_id:  payment.booking_id  || '',
      amount:      payment.amount      || '',
      currency:    payment.currency    || 'ILS',
      status:      payment.status      || 'PENDING',
      method:      payment.method      || 'credit_card',
      description: payment.description || '',
      due_date:    payment.due_date    || '',
      paid_date:   payment.paid_date   || '',
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.amount) {
      toast({ title: 'נא להזין סכום', variant: 'destructive' });
      return;
    }
    if (editingPayment) {
      updateMutation.mutate({ id: editingPayment.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto animate-fade-in" dir="rtl">

      <div className="bg-gradient-to-br from-indigo-50/80 to-white rounded-2xl border border-indigo-100/50 p-5 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול תשלומים</h1>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed mr-12">עקוב אחר כל התשלומים שלך. צפה בתשלומים שהתקבלו, ממתינים ובאיחור.</p>
        <p className="text-indigo-500 text-xs mt-1 mr-12">טיפ: תשלומים באדום דורשים טיפול מיידי</p>
      </div>

      {/* ── Page header ── */}
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
        <Button
          onClick={openNew}
          className="gap-1.5 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold h-9 text-sm rounded-xl shadow-sm"
        >
          <Plus className="w-4 h-4" />
          תשלום חדש
        </Button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'סה"כ הכנסות',
            value: `₪${stats.total.toLocaleString()}`,
            icon: TrendingUp,
            iconClass: 'icon-teal',
            bg: 'stat-teal',
          },
          {
            label: 'שולם',
            value: `₪${stats.paid.toLocaleString()}`,
            icon: CheckCircle2,
            iconClass: 'icon-green',
            bg: 'stat-green',
          },
          {
            label: 'ממתין',
            value: `₪${stats.pending.toLocaleString()}`,
            icon: Clock,
            iconClass: 'icon-amber',
            bg: 'stat-amber',
          },
          {
            label: 'באיחור',
            value: stats.overdue,
            icon: AlertCircle,
            iconClass: 'icon-rose',
            bg: 'stat-rose',
          },
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

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="חפש תשלום..."
            className="h-9 pr-9 text-sm rounded-xl border-gray-200 bg-white"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[{ value: 'all', label: 'הכל' }, ...PAYMENT_STATUSES.slice(0, 3)].map(s => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`h-8 px-3 rounded-full text-xs font-medium transition-all border ${
                statusFilter === s.value
                  ? 'bg-[#0B1220] text-white border-[#0B1220]'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Payments list ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
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
              return (
                <div
                  key={payment.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors group"
                >
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 border border-emerald-100 flex items-center justify-center flex-shrink-0 text-base">
                    {methodIcon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {payment.description || `תשלום${payment.booking_id ? ' #' + payment.booking_id.slice(-4) : ''}`}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      {payment.paid_date && (
                        <span className="text-xs text-gray-400">
                          {format(parseISO(payment.paid_date), 'dd/MM/yy')}
                        </span>
                      )}
                      {payment.due_date && payment.status === 'PENDING' && (
                        <span className="text-xs text-gray-400">
                          לתשלום: {format(parseISO(payment.due_date), 'dd/MM/yy')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <p className="text-sm font-bold text-gray-900 flex-shrink-0 tabular-nums">
                    ₪{parseFloat(payment.amount || 0).toLocaleString()}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => openEdit(payment)}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      onClick={() => { if (confirm('למחוק תשלום זה?')) deleteMutation.mutate(payment.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Dialog ── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingPayment ? 'עריכת תשלום' : 'תשלום חדש'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs text-gray-500">תיאור</Label>
              <Input
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="תיאור התשלום"
                className="h-9 text-sm rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">סכום (₪) *</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="0"
                className="h-9 text-sm rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">אמצעי תשלום</Label>
              <Select value={form.method} onValueChange={val => setForm(p => ({ ...p, method: val }))}>
                <SelectTrigger className="h-9 text-sm rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">סטטוס</Label>
              <Select value={form.status} onValueChange={val => setForm(p => ({ ...p, status: val }))}>
                <SelectTrigger className="h-9 text-sm rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">תאריך תשלום</Label>
              <Input
                type="date"
                value={form.paid_date}
                onChange={e => setForm(p => ({ ...p, paid_date: e.target.value }))}
                className="h-9 text-sm rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">תאריך לתשלום</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                className="h-9 text-sm rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDialog(false)}
              className="h-9 rounded-xl"
            >
              ביטול
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="h-9 gap-1.5 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold rounded-xl"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <div className="w-4 h-4 border-2 border-[#0B1220] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
