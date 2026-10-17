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
import { StatusPill, channelOf, fmtDay, fmtShort, fmtMoney } from '@/components/ds';
import { DPage, DSplit, Tag, ProgressRing } from '@/components/app/DSplit';
import { checkInTime, checkOutTime } from '@/components/today/TodayBoard';
import { cn } from '@/lib/utils';
import { todayISO, nightsBetween } from '@/lib/stay/format';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  Receipt,
  ChevronRight,
  Pencil,
  Trash2,
  MoreHorizontal,
  Check,
  LogIn,
  LogOut
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
  const unitProp = allProperties.find((p) => p.id === booking.property_id);
  const inTime = checkInTime(booking, unitProp);
  const outTime = checkOutTime(booking, unitProp);
  const today0 = todayISO();
  const stayPct = !booking.check_in_date || today0 < booking.check_in_date ? 0 : today0 >= (booking.check_out_date || '') ? 100 : Math.round(((nightsBetween(booking.check_in_date, today0) + 1) / Math.max(1, nights || 1)) * 100);

  return (
    <>
      <DPage className="max-w-[1180px]">
        {/* app bar: round back, title, round ⋯ (edit / delete) */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <button type="button" onClick={onClose} aria-label="חזרה להזמנות" className="press inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-navy-900 shadow-[0_1px_2px_rgba(27,38,86,0.05)] hover:bg-[#FAFAFD]">
            <ChevronRight className="h-5 w-5" />
          </button>
          <p className="text-[15px] font-semibold text-navy-900">פרטי הזמנה</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="עוד פעולות" className="press inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-navy-900 shadow-[0_1px_2px_rgba(27,38,86,0.05)] hover:bg-[#FAFAFD]">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52 rounded-[16px]" dir="rtl">
              <DropdownMenuItem className="min-h-11 gap-2.5 text-[15px]" onSelect={() => navigate(`${createPageUrl('Bookings')}?openBookingId=${encodeURIComponent(booking.id)}`)}>
                <Pencil className="h-[18px] w-[18px] text-ink-600" />עריכה
              </DropdownMenuItem>
              <DropdownMenuItem className="min-h-11 gap-2.5 text-[15px] text-danger-600 focus:text-danger-700" onSelect={() => setConfirmDelete(true)}>
                <Trash2 className="h-[18px] w-[18px]" />מחיקת הזמנה
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

        <DSplit
          asideLabel="תשלום ומצב"
          main={(
            <div className="space-y-4">
              <ErrorBoundary section="guest-details" variant="inline" resetKey={booking.id}>
                <section className="v5-rise">
                  <div className="flex items-center gap-4">
                    <GuestAvatar name={booking.guest_name || 'אורח'} size={68} ring className="shadow-[0_8px_20px_-10px_rgba(27,38,86,0.5)]" />
                    <div className="min-w-0 flex-1">
                      <h1 className="text-[28px] font-extrabold leading-[1.1] tracking-[-0.025em] text-navy-900 md:text-[36px]">{booking.guest_name}</h1>
                      <p className="mt-1 flex items-center gap-1.5 truncate text-[14px] text-ink-400">
                        <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: ch.color }} />
                        {unitName} · {ch.label}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusPill status={booking.status} />
                    <Tag tone="slate">{booking.adults || 2} אורחים</Tag>
                    <Tag tone={outstandingNow > 0 ? 'lilac' : 'mint'}>{outstandingNow > 0 ? `יתרה ${fmtMoney(outstandingNow)}` : 'שולם במלואו'}</Tag>
                  </div>
                </section>
              </ErrorBoundary>

              {/* stay */}
              <section className="v5-rise d-card p-4 md:p-5" aria-label="השהייה">
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                  <div className="rounded-[20px] bg-[#F3F4F9] p-3.5">
                    <p className="flex items-center gap-1.5 text-[12px] font-medium text-ink-400"><LogIn className="h-3.5 w-3.5" aria-hidden />כניסה</p>
                    <p className="mt-1 text-[16px] font-bold text-navy-900"><span className="hidden sm:inline">{fmtDay(booking.check_in_date)}</span><span className="sm:hidden">{fmtShort(booking.check_in_date)}</span></p>
                    <p className="mt-0.5 text-[13px] tabular text-ink-600">מ־{inTime}</p>
                  </div>
                  <ProgressRing pct={stayPct} size={64} stroke={6} label={`${nights || booking.nights || 1} לילות`}>
                    <span className="flex flex-col items-center leading-none"><span className="tabular text-[18px] font-extrabold text-navy-900">{nights || booking.nights || 1}</span><span className="mt-0.5 text-[10px] text-ink-400">לילות</span></span>
                  </ProgressRing>
                  <div className="rounded-[20px] bg-[#F3F4F9] p-3.5">
                    <p className="flex items-center gap-1.5 text-[12px] font-medium text-ink-400"><LogOut className="h-3.5 w-3.5" aria-hidden />יציאה</p>
                    <p className="mt-1 text-[16px] font-bold text-navy-900"><span className="hidden sm:inline">{fmtDay(booking.check_out_date)}</span><span className="sm:hidden">{fmtShort(booking.check_out_date)}</span></p>
                    <p className="mt-0.5 text-[13px] tabular text-ink-600">עד {outTime}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {booking.guest_phone ? (
                    <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="press inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 text-[15px] font-bold text-white shadow-[0_10px_22px_-10px_rgba(62,43,241,0.7)] hover:bg-brand-500">
                      <MessageSquare className="h-5 w-5" />
                      שליחה בוואטסאפ
                    </a>
                  ) : null}
                  {booking.guest_phone ? (
                    <a href={`tel:${booking.guest_phone}`} aria-label={`שיחה ל־${booking.guest_phone}`} className="press inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F9] text-navy-900 hover:bg-[#E9EBF3]">
                      <Phone className="h-[18px] w-[18px]" />
                    </a>
                  ) : null}
                  {booking.guest_email ? (
                    <a href={`mailto:${booking.guest_email}`} aria-label="אימייל" className="press inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F9] text-navy-900 hover:bg-[#E9EBF3]">
                      <Mail className="h-[18px] w-[18px]" />
                    </a>
                  ) : null}
                </div>
              </section>

              {/* checklist (the task-app "to do") */}
              <section className="v5-rise d-card p-4 md:p-5" aria-label="התקדמות">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[17px] font-bold text-navy-900">מה כבר מוכן</h2>
                  <Tag tone={doneCount === timelineItems.length ? 'mint' : 'indigo'}>{doneCount} מתוך {timelineItems.length}</Tag>
                </div>
                <ul className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
                  {timelineItems.map((item, i) => (
                    <li key={i} className="flex min-h-[52px] items-center gap-3 rounded-[18px] bg-[#F7F8FB] px-3.5">
                      <span aria-hidden className={cn('inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full', item.done ? 'bg-[var(--st-mint-fg)] text-white' : 'border-2 border-[#D5D9E6] bg-white')}>
                        {item.done ? <Check className="h-4 w-4" strokeWidth={2.75} /> : null}
                      </span>
                      <item.icon className="h-[18px] w-[18px] shrink-0 text-ink-400" strokeWidth={1.6} aria-hidden />
                      <span className={cn('flex-1 text-[15px]', item.done ? 'font-semibold text-navy-900' : 'text-ink-600')}>{item.label}<span className="sr-only">{item.done ? ', בוצע' : ', עוד לא'}</span></span>
                    </li>
                  ))}
                </ul>
              </section>

              {booking.notes ? (
                <section className="v5-rise d-card p-4 md:p-5">
                  <h2 className="text-[17px] font-bold text-navy-900">הערות</h2>
                  <p className="mt-2 whitespace-pre-wrap text-[15px] text-ink-600">{booking.notes}</p>
                </section>
              ) : null}
            </div>
          )}
          aside={(
            <>
              <section className="v5-rise d-card p-5" aria-label="תשלומים">
                <div className="flex items-center gap-4">
                  <ProgressRing pct={paidPct} size={84} stroke={9} track="#E8F7F1" color="#22B07D" label={`שולם ${paidPct}%`}>
                    <span className="tabular text-[18px] font-extrabold text-navy-900" dir="ltr">{paidPct}<span className="text-[0.6em] text-ink-400">%</span></span>
                  </ProgressRing>
                  <div className="min-w-0">
                    <p className="text-[13px] text-ink-400">{outstandingNow > 0 ? 'יתרה לתשלום' : 'שולם במלואו'}</p>
                    <p className="v5-num text-[28px] font-extrabold leading-tight text-navy-900">{fmtMoney(outstandingNow > 0 ? outstandingNow : totalPaid)}</p>
                    <p className="text-[13px] text-ink-400">מתוך {fmtMoney(booking.total_price)}</p>
                  </div>
                </div>
                {payments.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {payments.map((payment) => (
                      <li key={payment.id} className="flex min-h-[60px] items-center justify-between gap-3 rounded-[18px] bg-[#F7F8FB] px-3.5 py-2">
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-navy-900">
                            {payment.type === 'DEPOSIT' ? 'מקדמה' : payment.type === 'BALANCE' ? 'יתרה' : payment.type === 'FULL' ? 'תשלום מלא' : 'תשלום'}
                            <span className="ms-2 tabular font-bold">{fmtMoney(payment.amount)}</span>
                          </p>
                          <p className="text-[13px] text-ink-400">
                            {METHOD_LABEL[String(payment.method || '').toLowerCase()] || 'אחר'}
                            {payment.due_date && ` · עד ${fmtShort(payment.due_date)}`}
                          </p>
                        </div>
                        {payment.status === 'DUE' ? (
                          <Button size="sm" variant="secondary" onClick={() => markPaidMutation.mutate(payment.id)}>סימון כשולם</Button>
                        ) : (
                          <StatusPill status={payment.status} label={paymentStatusLabels[payment.status]} />
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-[15px] text-ink-600">עדיין לא נרשם תשלום להזמנה הזו.</p>
                )}
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" className="h-11 flex-1 rounded-full" onClick={() => setIsPaymentDialogOpen(true)}>
                    <Plus />
                    רישום תשלום
                  </Button>
                  <Button variant="ghost" className="h-11 rounded-full" onClick={() => navigate(`/invoices?booking=${booking.id}`)}>
                    <Receipt />
                    חשבונית
                  </Button>
                </div>
              </section>

              <section className="v5-rise d-card p-5">
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
              </section>
            </>
          )}
        />
      </DPage>

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