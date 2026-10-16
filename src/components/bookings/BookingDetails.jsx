import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useUpdateBooking } from '@/data/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Page, StatusPill, channelOf, fmtDay, fmtShort, fmtMoney } from '@/components/ds';
import {
  Phone,
  Mail,
  Calendar,
  Users,
  Wallet,
  MessageSquare,
  Sparkles,
  FileText,
  Plus,
  CheckCircle2,
  Receipt,
  ChevronRight
} from 'lucide-react';
import { parseISO, differenceInDays } from 'date-fns';

const METHOD_LABEL = { cash: 'מזומן', transfer: 'העברה', bank_transfer: 'העברה', card: 'כרטיס', credit_card: 'כרטיס אשראי', bit: 'ביט', paybox: 'פייבוקס' };

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  CONFIRMED: 'bg-green-100 text-green-700 border-green-200',
  CHECKED_IN: 'bg-blue-100 text-blue-700 border-blue-200',
  CHECKED_OUT: 'bg-gray-100 text-gray-700 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200'
};

const statusLabels = {
  PENDING: 'ממתינה',
  CONFIRMED: 'מאושרת',
  CHECKED_IN: 'בשהייה',
  CHECKED_OUT: 'הסתיימה',
  CANCELLED: 'בוטלה'
};

const paymentStatusColors = {
  DUE: 'bg-orange-100 text-orange-700',
  PAID: 'bg-green-100 text-green-700',
  REFUNDED: 'bg-gray-100 text-gray-700'
};

const paymentStatusLabels = {
  DUE: 'לתשלום',
  PAID: 'שולם',
  REFUNDED: 'הוחזר'
};

export default function BookingDetails({ booking, onClose, orgId }) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    type: 'DEPOSIT',
    amount: 0,
    method: 'TRANSFER',
    due_date: '',
    status: 'DUE'
  });
  const queryClient = useQueryClient();

  // Fetch payments for this booking
  const { data: payments = [] } = useQuery({
    queryKey: ['payments', booking.id],
    queryFn: () => base44.entities.Payment.filter({ booking_id: booking.id }),
    enabled: !!booking.id
  });

  // Fetch messages for this booking
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', booking.id],
    queryFn: () => base44.entities.MessageLog.filter({ booking_id: booking.id }),
    enabled: !!booking.id
  });

  // Fetch cleaning tasks for this booking
  const { data: cleaningTasks = [] } = useQuery({
    queryKey: ['cleaningTasks', booking.id],
    queryFn: () => base44.entities.CleaningTask.filter({ booking_id: booking.id }),
    enabled: !!booking.id
  });

  // Fetch contracts for this booking
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', booking.id],
    queryFn: () => base44.entities.ContractInstance.filter({ booking_id: booking.id }),
    enabled: !!booking.id
  });

  const updateBookingMutation = useUpdateBooking();

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: (data) => base44.entities.Payment.create({
      ...data,
      org_id: orgId,
      booking_id: booking.id
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', booking.id] });
      setIsPaymentDialogOpen(false);
      setNewPayment({
        type: 'DEPOSIT',
        amount: 0,
        method: 'TRANSFER',
        due_date: '',
        status: 'DUE'
      });
    }
  });

  // Mark payment as paid
  const markPaidMutation = useMutation({
    mutationFn: (paymentId) => base44.entities.Payment.update(paymentId, {
      status: 'PAID',
      paid_date: new Date().toISOString().split('T')[0]
    }),
    onMutate: async (paymentId) => {
      await queryClient.cancelQueries({ queryKey: ['payments', booking.id] });

      const previousPayments = queryClient.getQueryData(['payments', booking.id]);

      // Optimistically update payment status
      queryClient.setQueryData(['payments', booking.id], (old) =>
        old?.map(p => p.id === paymentId ? { ...p, status: 'PAID', paid_date: new Date().toISOString().split('T')[0] } : p)
      );
      
      return { previousPayments };
    },
    onError: (err, paymentId, context) => {
      queryClient.setQueryData(['payments', booking.id], context.previousPayments);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', booking.id] });
    }
  });

  const nights = booking.check_in_date && booking.check_out_date
    ? differenceInDays(parseISO(booking.check_out_date), parseISO(booking.check_in_date))
    : 0;

  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalDue = payments.filter(p => p.status === 'DUE').reduce((sum, p) => sum + (p.amount || 0), 0);

  const timelineItems = [
    { 
      label: 'ליד', 
      done: !!booking.lead_id, 
      icon: Users 
    },
    { 
      label: 'הזמנה', 
      done: true, 
      icon: Calendar 
    },
    { 
      label: 'תשלומים', 
      done: payments.some(p => p.status === 'PAID'), 
      icon: Wallet 
    },
    { 
      label: 'הודעות', 
      done: messages.length > 0, 
      icon: MessageSquare 
    },
    { 
      label: 'ניקיון', 
      done: cleaningTasks.some(t => t.status === 'DONE'), 
      icon: Sparkles 
    },
    { 
      label: 'חוזה', 
      done: contracts.some(c => c.status === 'SIGNED'), 
      icon: FileText 
    }
  ];

  const outstanding = Math.max(0, (Number(booking.total_price) || 0) - totalPaid);
  const phoneDigits = String(booking.guest_phone || '').replace(/[^0-9]/g, '');
  const waNumber = phoneDigits.startsWith('0') ? `972${phoneDigits.slice(1)}` : phoneDigits;
  const ch = channelOf(booking.booking_source);

  return (
    <>
      <Page className="max-w-[880px]">
        <button type="button" onClick={onClose} className="press -ms-2 mb-3 inline-flex h-11 items-center gap-1 rounded-[10px] px-2 text-[15px] font-medium text-brand-600 hover:bg-brand-50">
          <ChevronRight className="h-5 w-5" />
          הזמנות
        </button>

        {/* Guest + stay */}
        <ErrorBoundary section="guest-details" variant="inline" resetKey={booking.id}>
          <section className="rounded-[20px] border border-line bg-white p-5 shadow-card md:p-6">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[22px] font-extrabold text-brand-700">{booking.guest_name?.charAt(0)}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-[26px] font-extrabold leading-tight text-navy-900">{booking.guest_name}</h1>
                  <StatusPill status={booking.status} />
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[15px] text-ink-600">
                  <span>{booking.property_name || 'יחידה'}</span>
                  <span aria-hidden>·</span>
                  <span>{booking.adults || 2} אורחים</span>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: ch.color }} />{ch.label}</span>
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 rounded-[14px] bg-neutral-50 p-3 text-center md:gap-4 md:p-4">
              <div>
                <p className="text-[13px] text-ink-400">כניסה</p>
                <p className="mt-0.5 text-[16px] font-bold text-navy-900"><span className="hidden sm:inline">{fmtDay(booking.check_in_date)}</span><span className="sm:hidden">{fmtShort(booking.check_in_date)}</span></p>
              </div>
              <div className="border-x border-line">
                <p className="text-[13px] text-ink-400">לילות</p>
                <p className="mt-0.5 text-[16px] font-bold tabular text-navy-900">{nights || booking.nights || 1}</p>
              </div>
              <div>
                <p className="text-[13px] text-ink-400">יציאה</p>
                <p className="mt-0.5 text-[16px] font-bold text-navy-900"><span className="hidden sm:inline">{fmtDay(booking.check_out_date)}</span><span className="sm:hidden">{fmtShort(booking.check_out_date)}</span></p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {booking.guest_phone ? (
                <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="press inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-brand-600 text-[15px] font-bold text-white hover:bg-brand-500">
                  <MessageSquare className="h-5 w-5" />
                  וואטסאפ
                </a>
              ) : null}
              {booking.guest_phone ? (
                <a href={`tel:${booking.guest_phone}`} className="press inline-flex h-12 items-center justify-center gap-2 rounded-[12px] border border-line bg-white text-[15px] font-bold text-navy-900 hover:bg-neutral-50">
                  <Phone className="h-5 w-5" />
                  <span dir="ltr">{booking.guest_phone}</span>
                </a>
              ) : null}
              {booking.guest_email ? (
                <a href={`mailto:${booking.guest_email}`} className="press col-span-2 inline-flex h-12 items-center justify-center gap-2 rounded-[12px] border border-line bg-white text-[15px] font-medium text-navy-900 hover:bg-neutral-50 sm:col-span-1">
                  <Mail className="h-5 w-5" />
                  אימייל
                </a>
              ) : null}
            </div>
          </section>
        </ErrorBoundary>

        <div className="mt-4 grid gap-4 md:grid-cols-[1.3fr_1fr]">
          {/* Money */}
          <section className="rounded-[14px] border border-line bg-white p-5 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[18px] font-bold text-navy-900">תשלומים</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { window.location.href = `/Invoices?booking=${booking.id}`; }}>
                  <Receipt />
                  חשבונית
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setIsPaymentDialogOpen(true)}>
                  <Plus />
                  תשלום
                </Button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-[12px] bg-neutral-50 p-3">
                <p className="text-[13px] text-ink-400">סך ההזמנה</p>
                <p className="mt-0.5 text-[18px] font-extrabold tabular text-navy-900">{fmtMoney(booking.total_price)}</p>
              </div>
              <div className="rounded-[12px] bg-success-50 p-3">
                <p className="text-[13px] text-success-700">שולם</p>
                <p className="mt-0.5 text-[18px] font-extrabold tabular text-success-700">{fmtMoney(totalPaid)}</p>
              </div>
              <div className="rounded-[12px] bg-warning-50 p-3">
                <p className="text-[13px] text-warning-700">יתרה</p>
                <p className="mt-0.5 text-[18px] font-extrabold tabular text-warning-700">{fmtMoney(totalDue || outstanding)}</p>
              </div>
            </div>
            {payments.length > 0 ? (
              <ul className="mt-3 divide-y divide-line">
                {payments.map((payment) => (
                  <li key={payment.id} className="flex min-h-[60px] items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-navy-900">
                        {payment.type === 'DEPOSIT' ? 'מקדמה' : payment.type === 'BALANCE' ? 'יתרה' : payment.type === 'FULL' ? 'תשלום מלא' : 'תשלום'}
                      </p>
                      <p className="text-[13px] text-ink-400">
                        {METHOD_LABEL[String(payment.method || '').toLowerCase()] || 'אחר'}
                        {payment.due_date && ` · עד ${fmtShort(payment.due_date)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold tabular text-navy-900">{fmtMoney(payment.amount)}</span>
                      {payment.status === 'DUE' ? (
                        <Button size="sm" variant="outline" onClick={() => markPaidMutation.mutate(payment.id)}>סימון כשולם</Button>
                      ) : (
                        <StatusPill status={payment.status} label={paymentStatusLabels[payment.status]} />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-[15px] text-ink-600">עדיין לא נרשם תשלום להזמנה הזו.</p>
            )}
          </section>

          <div className="grid content-start gap-4">
            <section className="rounded-[14px] border border-line bg-white p-5 shadow-card">
              <Label className="text-[14px] font-medium text-ink-600">מצב ההזמנה</Label>
              <Select value={booking.status} onValueChange={(value) => updateBookingMutation.mutate({ id: booking.id, data: { status: value } })}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>

            <section className="rounded-[14px] border border-line bg-white p-5 shadow-card">
              <h2 className="text-[18px] font-bold text-navy-900">התקדמות</h2>
              <ol className="mt-3 space-y-1">
                {timelineItems.map((item, i) => (
                  <li key={i} className="flex min-h-[40px] items-center gap-3">
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${item.done ? 'bg-success-50 text-success-600' : 'bg-neutral-100 text-ink-400'}`}>
                      {item.done ? <CheckCircle2 className="h-[18px] w-[18px]" /> : <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />}
                    </span>
                    <span className={`text-[15px] ${item.done ? 'font-semibold text-navy-900' : 'text-ink-600'}`}>{item.label}</span>
                  </li>
                ))}
              </ol>
            </section>

            {booking.notes ? (
              <section className="rounded-[14px] border border-line bg-white p-5 shadow-card">
                <h2 className="text-[18px] font-bold text-navy-900">הערות</h2>
                <p className="mt-2 whitespace-pre-wrap text-[15px] text-ink-600">{booking.notes}</p>
              </section>
            ) : null}
          </div>
        </div>
      </Page>

      {/* Add Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-extrabold text-navy-900">תשלום חדש</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>סוג תשלום</Label>
              <Select 
                value={newPayment.type} 
                onValueChange={(value) => setNewPayment({ ...newPayment, type: value })}
              >
                <SelectTrigger className="mt-1 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEPOSIT">מקדמה</SelectItem>
                  <SelectItem value="BALANCE">יתרה</SelectItem>
                  <SelectItem value="FULL">תשלום מלא</SelectItem>
                  <SelectItem value="OTHER">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>סכום (₪)</Label>
              <Input 
                type="number"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) || 0 })}
                className="mt-1 rounded-xl"
                min={0}
              />
            </div>
            <div>
              <Label>אמצעי תשלום</Label>
              <Select 
                value={newPayment.method} 
                onValueChange={(value) => setNewPayment({ ...newPayment, method: value })}
              >
                <SelectTrigger className="mt-1 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">מזומן</SelectItem>
                  <SelectItem value="TRANSFER">העברה בנקאית</SelectItem>
                  <SelectItem value="CARD">כרטיס אשראי</SelectItem>
                  <SelectItem value="OTHER">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>תאריך יעד</Label>
              <Input 
                type="date"
                value={newPayment.due_date}
                onChange={(e) => setNewPayment({ ...newPayment, due_date: e.target.value })}
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <Label>סטטוס</Label>
              <Select 
                value={newPayment.status} 
                onValueChange={(value) => setNewPayment({ ...newPayment, status: value })}
              >
                <SelectTrigger className="mt-1 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DUE">לתשלום</SelectItem>
                  <SelectItem value="PAID">שולם</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)} className="rounded-xl">
              ביטול
            </Button>
            <Button 
              onClick={() => createPaymentMutation.mutate(newPayment)}
              disabled={newPayment.amount <= 0 || createPaymentMutation.isPending}
              className="bg-brand-600 hover:bg-[#00B8A9] text-white rounded-xl"
            >
              {createPaymentMutation.isPending ? 'שומר...' : 'הוסף תשלום'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}