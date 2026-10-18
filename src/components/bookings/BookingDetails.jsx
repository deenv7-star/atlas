import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useUpdateBooking, useProperties } from '@/data/entities';
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
import { useNavigate } from 'react-router-dom';
import { deleteBookingWithUndo } from '@/components/ui/AtlasToast';
import { createPageUrl } from '@/utils';
import { GuestAvatar } from '@/components/app/atoms';
import { unitPhoto } from '@/lib/stay/unitPhoto';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
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
  ChevronRight,
  Pencil,
  Trash2
} from 'lucide-react';
import { parseISO, differenceInDays } from 'date-fns';
import { heCount } from '@/lib/hebrewCount';

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

/** Paid share as a white ring on the indigo tile. */
function PaidRing({ pct, size = 64, stroke = 7 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`שולם ${pct}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={stroke} />
        <circle className="c-arc" cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#fff" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ '--c': c }} />
      </svg>
      <span aria-hidden className="absolute text-[13px] font-bold tabular text-white" dir="ltr">{pct}%</span>
    </span>
  );
}

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
  const navigate = useNavigate();
  const { data: allProperties = [] } = useProperties();
  const unitName = booking.property_name || allProperties.find((p) => p.id === booking.property_id)?.name || 'יחידה';
  const [confirmDelete, setConfirmDelete] = useState(false);

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
  const outstandingNow = totalDue || outstanding;
  const paidPct = Number(booking.total_price) > 0 ? Math.min(100, Math.round((totalPaid / Number(booking.total_price)) * 100)) : 0;
  const doneCount = timelineItems.filter((t) => t.done).length;

  return (
    <>
      <Page className="max-w-[1120px]">
        <div className="mb-3 flex items-center justify-between gap-2">
          <button type="button" onClick={onClose} className="press -ms-2 inline-flex h-11 items-center gap-1 rounded-full px-3 text-[15px] font-medium text-brand-600 hover:bg-brand-50">
            <ChevronRight className="h-5 w-5" />
            הזמנות
          </button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" className="h-11" onClick={() => navigate(`${createPageUrl('Bookings')}?openBookingId=${encodeURIComponent(booking.id)}`)}>
              <Pencil />
              עריכה
            </Button>
            <Button variant="ghost" size="icon" className="h-11 w-11 text-ink-600 hover:text-danger-600" aria-label="מחיקת הזמנה" onClick={() => setConfirmDelete(true)}>
              <Trash2 />
            </Button>
          </div>
        </div>
        <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <DialogContent className="max-w-[420px]" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-[20px] font-bold text-navy-900">למחוק את ההזמנה?</DialogTitle>
            </DialogHeader>
            <p className="text-[15px] text-ink-600">ההזמנה של {booking.guest_name || 'האורח'} תוסר. אפשר לבטל מיד אחרי המחיקה.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDelete(false)}>ביטול</Button>
              <Button variant="destructive" onClick={() => { setConfirmDelete(false); deleteBookingWithUndo(queryClient, booking.id); navigate(createPageUrl('Bookings')); }}>מחיקה</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* v8 C bento: guest tile + ONE solid-indigo balance tile, then payments beside the unit photo + progress */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:gap-4 lg:grid-cols-12">
          <ErrorBoundary section="guest-details" variant="inline" resetKey={booking.id}>
            <section className="v5-rise v7-card p-5 md:p-6 lg:col-span-7" style={{ '--i': 0 }}>
              <div className="flex items-center gap-4">
                <GuestAvatar name={booking.guest_name || 'אורח'} size={76} ring className="shadow-[0_8px_20px_-10px_rgba(27,38,86,0.5)]" />
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-navy-900 md:text-[30px]">{booking.guest_name}</h1>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-ink-600 md:text-[15px]">
                    <StatusPill status={booking.status} />
                    <span>{unitName}</span>
                    <span aria-hidden className="text-ink-300">·</span>
                    <span>{heCount(booking.adults || 2, 'guest')}</span>
                    <span aria-hidden className="text-ink-300">·</span>
                    <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: ch.color }} />{ch.label}</span>
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-1.5 rounded-[20px] bg-[#F4F4FA] p-1.5 text-center">
                {[
                  { k: 'כניסה', v: booking.check_in_date, day: true },
                  { k: 'לילות', v: nights || booking.nights || 1 },
                  { k: 'יציאה', v: booking.check_out_date, day: true },
                ].map((c) => (
                  <div key={c.k} className={cn('rounded-[15px] px-2 py-3', c.day ? 'bg-white shadow-[0_1px_2px_rgba(27,38,86,0.05)]' : '')}>
                    <p className="text-[12px] font-medium text-ink-400">{c.k}</p>
                    <p className="mt-0.5 text-[16px] font-bold tabular text-navy-900">
                      {c.day ? (<><span className="hidden sm:inline">{fmtDay(c.v)}</span><span className="sm:hidden">{fmtShort(c.v)}</span></>) : c.v}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {booking.guest_phone ? (
                  <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="press inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 text-[15px] font-bold text-white shadow-[0_10px_22px_-10px_rgba(62,43,241,0.7)] hover:bg-brand-500 sm:flex-none">
                    <MessageSquare className="h-5 w-5" />
                    שליחה בוואטסאפ
                  </a>
                ) : null}
                {booking.guest_phone ? (
                  <a href={`tel:${booking.guest_phone}`} aria-label={`שיחה ל־${booking.guest_phone}`} className="press inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#F1F1F8] px-4 text-[15px] font-semibold text-navy-900 hover:bg-[#E8E8F2]">
                    <Phone className="h-[18px] w-[18px]" />
                    <span dir="ltr" className="hidden sm:inline">{booking.guest_phone}</span>
                  </a>
                ) : null}
                {booking.guest_email ? (
                  <a href={`mailto:${booking.guest_email}`} aria-label="אימייל" className="press inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F1F8] text-navy-900 hover:bg-[#E8E8F2]">
                    <Mail className="h-[18px] w-[18px]" />
                  </a>
                ) : null}
              </div>
            </section>
          </ErrorBoundary>

          {/* the one indigo tile: what is still owed */}
          <section className="v5-rise v7-hero flex flex-col p-5 md:p-6 lg:col-span-5" style={{ '--i': 1 }} aria-label="תשלום">
            <div className="flex items-start justify-between gap-3">
              <p className="pt-1 text-[15px] font-medium text-white/85">{outstandingNow > 0 ? 'יתרה לתשלום' : 'שולם במלואו'}</p>
              <PaidRing pct={paidPct} />
            </div>
            <p className="v5-num mt-2 text-[44px] font-extrabold leading-none tracking-[-0.03em] text-white">{fmtMoney(outstandingNow > 0 ? outstandingNow : totalPaid)}</p>
            <p className="mt-2 text-[14px] text-white/85">{outstandingNow > 0 ? `שולמו ${fmtMoney(totalPaid)} מתוך ${fmtMoney(booking.total_price)}` : 'כל התשלומים של ההזמנה התקבלו'}</p>
            <div className="mt-auto flex gap-2 pt-5">
              <button type="button" onClick={() => setIsPaymentDialogOpen(true)} className="press inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-[14px] font-bold text-brand-700 hover:bg-[#F4F3FF]">
                <Plus className="h-4 w-4" strokeWidth={2.25} />
                רישום תשלום
              </button>
              <button type="button" onClick={() => navigate(`/invoices?booking=${booking.id}`)} className="press inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-white/15 px-4 text-[14px] font-semibold text-white hover:bg-white/25">
                <Receipt className="h-4 w-4" />
                חשבונית
              </button>
            </div>
          </section>

          {/* payments + the unit photo */}
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 md:gap-4 lg:col-span-7">
            <section className="v5-rise v7-card p-5 md:p-6" style={{ '--i': 2 }}>
              <h2 className="text-[17px] font-bold text-navy-900">תשלומים</h2>
              {payments.length > 0 ? (
                <ul className="mt-2 divide-y divide-[#F0F0F6]">
                  {payments.map((payment) => (
                    <li key={payment.id} className="flex min-h-[64px] items-center justify-between gap-3 py-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <span aria-hidden className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full', payment.status === 'PAID' ? 'bg-[var(--st-mint-bg)] text-[var(--st-mint-fg)]' : 'bg-[var(--st-lilac-bg)] text-[var(--st-lilac-fg)]')}>
                          {payment.status === 'PAID' ? <CheckCircle2 className="h-[18px] w-[18px]" /> : <Wallet className="h-[18px] w-[18px]" strokeWidth={1.75} />}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-navy-900">
                            {payment.type === 'DEPOSIT' ? 'מקדמה' : payment.type === 'BALANCE' ? 'יתרה' : payment.type === 'FULL' ? 'תשלום מלא' : 'תשלום'}
                          </p>
                          <p className="text-[13px] text-ink-400">
                            {METHOD_LABEL[String(payment.method || '').toLowerCase()] || 'אחר'}
                            {payment.due_date && ` · עד ${fmtShort(payment.due_date)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold tabular text-navy-900">{fmtMoney(payment.amount)}</span>
                        {payment.status === 'DUE' ? (
                          <Button size="sm" variant="secondary" onClick={() => markPaidMutation.mutate(payment.id)}>סימון כשולם</Button>
                        ) : (
                          <StatusPill status={payment.status} label={paymentStatusLabels[payment.status]} />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[15px] text-ink-600">עדיין לא נרשם תשלום להזמנה הזו.</p>
              )}
              {booking.notes ? (
                <div className="mt-4 rounded-[18px] bg-[#F4F4FA] p-4">
                  <p className="text-[13px] font-semibold text-ink-400">הערות</p>
                  <p className="mt-1 whitespace-pre-wrap text-[15px] text-ink-600">{booking.notes}</p>
                </div>
              ) : null}
            </section>
            <Link
              to={createPageUrl('MultiCalendar')}
              className="v5-rise c-photo press v7-lift flex min-h-[168px] flex-col justify-end p-4 text-white"
              style={{ '--i': 3 }}
              aria-label={`${unitName}, ללוח השנה`}
            >
              <img src={unitPhoto(allProperties.find((p) => p.id === booking.property_id) || { id: booking.property_id })} alt="" decoding="async" draggable={false} />
              <p className="text-[18px] font-bold leading-tight">{unitName}</p>
              <p className="mt-0.5 text-[13px] text-white/90">{fmtShort(booking.check_in_date)} עד {fmtShort(booking.check_out_date)}</p>
            </Link>

          </div>

          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 md:gap-4 lg:col-span-5">
            <section className="v5-rise v7-card p-5" style={{ '--i': 4 }}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[17px] font-bold text-navy-900">התקדמות</h2>
                <span className="tabular text-[13px] font-semibold text-ink-400">{doneCount} מתוך {timelineItems.length}</span>
              </div>
              <span aria-hidden className="mt-3 block h-2 overflow-hidden rounded-full bg-[#ECEAFE]"><span className="block h-full rounded-full bg-brand-600" style={{ width: `${(doneCount / timelineItems.length) * 100}%` }} /></span>
              <ol className="mt-3 flex flex-wrap gap-2">
                {timelineItems.map((item, i) => (
                  <li key={i} className={cn('inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px]', item.done ? 'bg-[var(--st-mint-bg)] font-semibold text-[var(--st-mint-fg)]' : 'bg-[#F1F1F8] text-ink-600')}>
                    {item.done ? <CheckCircle2 className="h-4 w-4" /> : <item.icon className="h-4 w-4" strokeWidth={1.6} />}
                    {item.label}
                  </li>
                ))}
              </ol>
              <div className="mt-4 border-t border-[#F0F0F6] pt-4">
                <Label className="text-[13px] font-medium text-ink-400">מצב ההזמנה</Label>
                <Select value={booking.status} onValueChange={(value) => updateBookingMutation.mutate({ id: booking.id, data: { status: value } })}>
                  <SelectTrigger className="mt-1.5 h-12 rounded-full" aria-label="מצב ההזמנה">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>
          </div>
        </div>
      </Page>

      {/* Add Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-bold text-navy-900">תשלום חדש</DialogTitle>
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
              className="bg-brand-600 hover:bg-brand-500 text-white rounded-xl"
            >
              {createPaymentMutation.isPending ? 'שומר...' : 'הוסף תשלום'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}