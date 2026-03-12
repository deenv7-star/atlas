import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Wallet, Plus, Search, Filter, Check, Edit, Trash2,
  TrendingUp, TrendingDown, Clock, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const PAYMENT_STATUSES = [
  { value: 'PENDING', label: 'ממתין', color: 'bg-amber-100 text-amber-700' },
  { value: 'PAID', label: 'שולם', color: 'bg-green-100 text-green-700' },
  { value: 'PARTIAL', label: 'חלקי', color: 'bg-blue-100 text-blue-700' },
  { value: 'FAILED', label: 'נכשל', color: 'bg-red-100 text-red-700' },
  { value: 'REFUNDED', label: 'הוחזר', color: 'bg-gray-100 text-gray-500' },
  { value: 'OVERDUE', label: 'באיחור', color: 'bg-orange-100 text-orange-700' },
];

const PAYMENT_METHODS = [
  { value: 'credit_card', label: 'כרטיס אשראי' },
  { value: 'bank_transfer', label: 'העברה בנקאית' },
  { value: 'cash', label: 'מזומן' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'bit', label: 'Bit' },
  { value: 'other', label: 'אחר' },
];

const STATUS_MAP = Object.fromEntries(PAYMENT_STATUSES.map(s => [s.value, s]));

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
    const total = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const paid = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const pending = payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const overdue = payments.filter(p => p.status === 'OVERDUE').length;
    return { total, paid, pending, overdue };
  }, [payments]);

  const filtered = useMemo(() => {
    return payments.filter(p => {
      const matchSearch = !searchTerm ||
        (p.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.booking_id || '').includes(searchTerm);
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [payments, searchTerm, statusFilter]);

  const openEdit = (payment) => {
    setEditingPayment(payment);
    setForm({
      booking_id: payment.booking_id || '',
      amount: payment.amount || '',
      currency: payment.currency || 'ILS',
      status: payment.status || 'PENDING',
      method: payment.method || 'credit_card',
      description: payment.description || '',
      due_date: payment.due_date || '',
      paid_date: payment.paid_date || '',
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
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#00D1C1]" />
            תשלומים
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{payments.length} תשלומים</p>
        </div>
        <Button
          onClick={() => { setEditingPayment(null); setForm(emptyPayment); setShowDialog(true); }}
          className="gap-1.5 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold h-9 text-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          תשלום חדש
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'סה"כ הכנסות', value: `₪${stats.total.toLocaleString()}`, color: 'text-gray-700' },
          { label: 'שולם', value: `₪${stats.paid.toLocaleString()}`, color: 'text-green-600' },
          { label: 'ממתין לתשלום', value: `₪${stats.pending.toLocaleString()}`, color: 'text-amber-600' },
          { label: 'באיחור', value: stats.overdue, color: 'text-red-600' },
        ].map(stat => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="חפש תשלום..."
            className="h-9 pr-9 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 text-sm w-full sm:w-40">
            <SelectValue placeholder="כל הסטטוסים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            {PAYMENT_STATUSES.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">אין תשלומים</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered
                .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))
                .map(payment => {
                  const statusInfo = STATUS_MAP[payment.status] || STATUS_MAP.PENDING;
                  return (
                    <div key={payment.id} className="flex items-center gap-3 p-3 hover:bg-gray-50/80 transition-colors group">
                      <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                        <Wallet className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {payment.description || `תשלום ${payment.booking_id ? '#' + payment.booking_id.slice(-4) : ''}`}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className={`${statusInfo.color} text-[10px] py-0 px-1.5 border-0`}>{statusInfo.label}</Badge>
                          {payment.paid_date && (
                            <span className="text-xs text-gray-400">
                              {format(parseISO(payment.paid_date), 'dd/MM/yy')}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-800 flex-shrink-0">
                        ₪{parseFloat(payment.amount || 0).toLocaleString()}
                      </p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400" onClick={() => openEdit(payment)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                          onClick={() => { if (confirm('למחוק?')) deleteMutation.mutate(payment.id); }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{editingPayment ? 'עריכת תשלום' : 'תשלום חדש'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">תיאור</Label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="תיאור התשלום" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">סכום (₪) *</Label>
              <Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">אמצעי תשלום</Label>
              <Select value={form.method} onValueChange={val => setForm(p => ({ ...p, method: val }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">סטטוס</Label>
              <Select value={form.status} onValueChange={val => setForm(p => ({ ...p, status: val }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">תאריך תשלום</Label>
              <Input type="date" value={form.paid_date} onChange={e => setForm(p => ({ ...p, paid_date: e.target.value }))} className="h-9 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDialog(false)} className="h-9">ביטול</Button>
            <Button
              size="sm" onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="h-9 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <div className="w-4 h-4 border-2 border-[#0B1220] border-t-transparent rounded-full animate-spin" />
              ) : <Check className="w-4 h-4" />}
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}