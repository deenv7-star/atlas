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
import { useNavigate, Link } from 'react-router-dom';
import { deleteBookingWithUndo } from '@/components/ui/AtlasToast';
import { createPageUrl } from '@/utils';
import { GuestAvatar, UnitPhoto } from '@/components/app/atoms';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { balanceOf } from '@/lib/stay/bookings';
import { todayISO, firstName as firstNameOf } from '@/lib/stay/format';
import { cn } from '@/lib/utils';
import { useBookings } from '@/data/entities';
import { Page, StatusPill, channelOf, fmtShort, fmtMoney } from '@/components/ds';
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
  Trash2,
  Send
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
  const [composerOpen, setComposerOpen] = useState(false);
  const { data: siblings = [] } = useBookings({}, '-created_at', 200);

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

  const property = allProperties.find((p) => p.id === booking.property_id) || null;
  const bal = balanceOf(booking, payments);
  const paidPct = bal.total > 0 ? Math.min(100, Math.round((bal.paid / bal.total) * 100)) : 0;
  const thread = [...messages].sort((a, b) => String(a.sent_at || a.created_at || '').localeCompare(String(b.sent_at || b.created_at || '')));
  const worklist = [...siblings]
    .filter((b) => !['CANCELLED'].includes(b.status) && b.check_out_date >= todayISO())
    .sort((a, b) => String(a.check_in_date).localeCompare(String(b.check_in_date)))
    .slice(0, 7);
  if (!worklist.some((b) => b.id === booking.id)) worklist.unshift(booking);
  const msgTime = (m) => {
    const d = new Date(m.sent_at || m.created_at || Date.now());
    return `${fmtShort(d)} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const actions = [
    booking.guest_phone ? { key: 'wa', label: 'וואטסאפ', icon: MessageSquare, primary: true, onClick: () => setComposerOpen(true) } : null,
    booking.guest_phone ? { key: 'tel', label: 'שיחה', icon: Phone, href: `tel:${booking.guest_phone}` } : null,
    booking.guest_email ? { key: 'mail', label: 'אימייל', icon: Mail, href: `mailto:${booking.guest_email}` } : null,
    { key: 'edit', label: 'עריכה', icon: Pencil, onClick: () => navigate(`${createPageUrl('Bookings')}?openBookingId=${encodeURIComponent(booking.id)}`) },
  ].filter(Boolean);

  return (
    <>
      <Page className="max-w-[var(--page-max,1280px)] md:px-8">
        <div className="mb-4 flex items-center justify-between gap-2">
          <button type="button" onClick={onClose} className="press -ms-2 inline-flex h-11 items-center gap-1 rounded-full px-3 text-[15px] font-semibold text-brand-600 hover:bg-brand-50">
            <ChevronRight className="h-5 w-5" />
            הזמנות
          </button>
          <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full text-ink-600 hover:text-danger-600" aria-label="מחיקת הזמנה" onClick={() => setConfirmDelete(true)}>
            <Trash2 />
          </Button>
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

        <div className="grid gap-4 lg:grid-cols-[272px_minmax(0,1fr)_330px] lg:gap-5">
          {/* Worklist: who else is coming, the open one highlighted (CRM ref) */}
          <aside aria-label="הזמנות קרובות" className="hidden lg:block">
            <div className="sticky top-[92px] rounded-[26px] bg-[#EBEDF5] p-2.5">
              <p className="px-3 pb-2 pt-2 text-[13px] font-bold text-ink-600">רשימת עבודה</p>
              <ul className="space-y-1.5">
                {worklist.map((b) => {
                  const on = b.id === booking.id;
                  return (
                    <li key={b.id}>
                      <Link to={`${createPageUrl('BookingDetail')}/${b.id}`} aria-current={on ? 'page' : undefined} className="e-work-item press flex min-h-[64px] items-center gap-3 rounded-[18px] px-3 py-2.5">
                        <GuestAvatar name={b.guest_name || 'אורח'} record={b} size={40} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-bold text-navy-900">{b.guest_name || 'אורח'}</span>
                          <span className="block truncate text-[12px] text-ink-400">{b.property_name || allProperties.find((p) => p.id === b.property_id)?.name} · {fmtShort(b.check_in_date)}</span>
                        </span>
                        {on ? <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-brand-600" /> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          {/* Main: the guest */}
          <div className="contents lg:block lg:min-w-0 lg:space-y-4">
            <ErrorBoundary section="guest-details" variant="inline" resetKey={booking.id}>
              <section className="v7-card relative order-1 overflow-hidden p-5 md:p-7 lg:order-none">
                <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-center md:text-start">
                  <GuestAvatar name={booking.guest_name || 'אורח'} record={booking} size={104} ring className="shadow-[0_14px_30px_-14px_rgba(27,38,86,0.45)]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                      <h1 className="text-[30px] font-extrabold leading-tight tracking-[-0.025em] text-navy-900 md:text-[34px]">{booking.guest_name}</h1>
                      <StatusPill status={booking.status} />
                    </div>
                    <p className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 text-[15px] text-ink-600 md:justify-start">
                      <span>{unitName}</span>
                      <span aria-hidden className="text-ink-300">·</span>
                      <span>{(booking.adults || 2) + (booking.children || 0)} אורחים</span>
                      <span aria-hidden className="text-ink-300">·</span>
                      <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: ch.color }} />{ch.label}</span>
                    </p>
                    {booking.guest_phone || booking.guest_email ? (
                      <p className="mt-1 text-[14px] text-ink-400"><span dir="ltr">{[booking.guest_phone, booking.guest_email].filter(Boolean).join(' · ')}</span></p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-5 flex items-start justify-center gap-4 md:hidden">
                  {actions.map((a) => {
                    const Icon = a.icon;
                    const circle = cn('inline-flex h-14 w-14 items-center justify-center rounded-full', a.primary ? 'bg-brand-600 text-white shadow-[0_10px_22px_-10px_rgba(62,43,241,0.7)]' : 'bg-[#F1F2F7] text-navy-900');
                    const inner = <><span className={circle}><Icon className="h-[22px] w-[22px]" strokeWidth={1.75} aria-hidden /></span><span className="text-[12px] font-semibold text-navy-900">{a.label}</span></>;
                    const cls = 'press flex w-[64px] flex-col items-center gap-1.5';
                    return a.href ? <a key={a.key} href={a.href} className={cls}>{inner}</a> : <button key={a.key} type="button" onClick={a.onClick} className={cls}>{inner}</button>;
                  })}
                </div>
                <div className="mt-5 hidden flex-wrap items-center justify-start gap-3 md:flex md:ps-[120px]">
                  {actions.map((a) => {
                    const Icon = a.icon;
                    const cls = cn('press inline-flex h-12 items-center gap-2 rounded-full px-5 text-[15px] font-semibold', a.primary ? 'bg-brand-600 text-white shadow-[0_10px_22px_-10px_rgba(62,43,241,0.7)] hover:bg-brand-500' : 'bg-[#F1F2F7] text-navy-900 hover:bg-[#E8EAF2]');
                    return a.href
                      ? <a key={a.key} href={a.href} className={cls}><Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />{a.label}</a>
                      : <button key={a.key} type="button" onClick={a.onClick} className={cls}><Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />{a.label}</button>;
                  })}
                </div>
              </section>
            </ErrorBoundary>

            {/* Conversation (WhatsApp / SMS / email log) */}
            <section className="v7-card order-4 p-5 md:p-6 lg:order-none" aria-labelledby="e-thread">
              <div className="flex items-center justify-between gap-2">
                <h2 id="e-thread" className="text-[18px] font-bold text-navy-900">שיחה עם האורח</h2>
                <span className="text-[13px] text-ink-400">{thread.length ? `${thread.length} הודעות` : ''}</span>
              </div>
              {thread.length ? (
                <ol className="mt-4 space-y-3">
                  {thread.map((m) => {
                    const inbound = m.direction === 'inbound';
                    return (
                      <li key={m.id} className={cn('flex items-end gap-2', inbound ? '' : 'flex-row-reverse')}>
                        {inbound ? <GuestAvatar name={booking.guest_name || 'אורח'} record={booking} size={30} /> : null}
                        <div className={cn('e-bub', inbound ? 'e-bub-in' : 'e-bub-out')}>
                          {m.subject && !inbound ? <p className="mb-0.5 text-[12px] font-semibold opacity-80">{m.subject}</p> : null}
                          <p className="whitespace-pre-wrap">{m.body || m.content}</p>
                          <p className={cn('mt-1 text-[11px] tabular', inbound ? 'text-ink-600' : 'text-white/90')}>{msgTime(m)}{m.channel && m.channel !== 'whatsapp' ? ` · ${m.channel === 'sms' ? 'SMS' : 'אימייל'}` : ''}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="mt-3 text-[15px] text-ink-600">עוד לא נשלחו הודעות לאורח הזה.</p>
              )}
              {booking.guest_phone ? (
                <button type="button" onClick={() => setComposerOpen(true)} className="press mt-4 flex h-12 w-full items-center gap-3 rounded-full bg-[#F4F5F9] pe-1.5 ps-5 text-[14px] text-ink-400 hover:bg-[#EEF0F6]">
                  <span className="flex-1 text-start">הודעה בוואטסאפ ל{firstNameOf(booking.guest_name)}</span>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white"><Send className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden /></span>
                </button>
              ) : null}
            </section>

            <section className="v7-card order-6 p-5 md:p-6 lg:order-none" aria-labelledby="e-progress">
              <h2 id="e-progress" className="text-[18px] font-bold text-navy-900">התקדמות</h2>
              <ol className="mt-4 flex flex-wrap gap-2">
                {timelineItems.map((item, i) => (
                  <li key={i} className={cn('inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-[14px]', item.done ? 'bg-[var(--st-mint-bg)] font-semibold text-[var(--st-mint-fg)]' : 'bg-[#F1F2F7] text-ink-600')}>
                    {item.done ? <CheckCircle2 className="h-[17px] w-[17px]" aria-hidden /> : <item.icon className="h-[17px] w-[17px]" strokeWidth={1.5} aria-hidden />}
                    {item.label}
                    <span className="sr-only">{item.done ? ' (בוצע)' : ' (עוד לא)'}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          {/* Side: tinted cards */}
          <div className="contents lg:grid lg:content-start lg:gap-4">
            <section className="e-side e-tint-lilac order-2 p-5 lg:order-none" aria-labelledby="e-stay">
              <div className="flex items-center justify-between">
                <h2 id="e-stay" className="text-[15px] font-bold text-[var(--st-lilac-fg)]">השהייה</h2>
                <UnitPhoto property={property} className="h-11 w-11" rounded="rounded-[14px]" />
              </div>
              <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-[18px] bg-white/80 p-3.5 text-center">
                <div>
                  <p className="text-[12px] text-ink-400">כניסה</p>
                  <p className="mt-0.5 text-[15px] font-bold text-navy-900">{fmtShort(booking.check_in_date)}</p>
                </div>
                <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[var(--st-lilac-bg)] px-2 text-[13px] font-bold tabular text-[var(--st-lilac-fg)]">{nights || booking.nights || 1}<span className="sr-only"> לילות</span></span>
                <div>
                  <p className="text-[12px] text-ink-400">יציאה</p>
                  <p className="mt-0.5 text-[15px] font-bold text-navy-900">{fmtShort(booking.check_out_date)}</p>
                </div>
              </div>
              <Label className="mt-4 block text-[13px] font-semibold text-ink-600" htmlFor="e-status">מצב ההזמנה</Label>
              <Select value={booking.status} onValueChange={(value) => updateBookingMutation.mutate({ id: booking.id, data: { status: value } })}>
                <SelectTrigger id="e-status" className="mt-2 h-12 rounded-full border-0 bg-white" aria-label="מצב ההזמנה">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>

            <section className="e-side e-tint-mint order-3 p-5 lg:order-none" aria-labelledby="e-pay">
              <div className="flex items-center justify-between gap-2">
                <h2 id="e-pay" className="text-[15px] font-bold text-[var(--st-mint-fg)]">תשלומים</h2>
                <span className="text-[13px] font-semibold tabular text-[var(--st-mint-fg)]">{paidPct}%</span>
              </div>
              <p className="mt-3 flex items-baseline gap-2">
                <span className="text-[30px] font-extrabold leading-none tabular text-navy-900">{fmtMoney(totalPaid)}</span>
                <span className="text-[14px] text-ink-400">מתוך {fmtMoney(booking.total_price)}</span>
              </p>
              <div className="e-prog mt-3 bg-white/80" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={paidPct} aria-label="שולם מתוך ההזמנה">
                <span style={{ width: `${Math.max(3, paidPct)}%` }} />
              </div>
              {(totalDue || outstanding) > 0 ? (
                <p className="mt-2 text-[13px] font-semibold text-[var(--st-red-fg)]">יתרה {fmtMoney(totalDue || outstanding)}</p>
              ) : <p className="mt-2 text-[13px] font-semibold text-[var(--st-mint-fg)]">הכל שולם</p>}
              {payments.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {payments.map((payment) => (
                    <li key={payment.id} className="flex min-h-[60px] items-center justify-between gap-2 rounded-[16px] bg-white/85 px-3.5 py-2">
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-navy-900">
                          {payment.type === 'DEPOSIT' ? 'מקדמה' : payment.type === 'BALANCE' ? 'יתרה' : payment.type === 'FULL' ? 'תשלום מלא' : 'תשלום'} · <span className="tabular">{fmtMoney(payment.amount)}</span>
                        </p>
                        <p className="text-[12px] text-ink-400">
                          {METHOD_LABEL[String(payment.method || '').toLowerCase()] || 'אחר'}
                          {payment.due_date && ` · עד ${fmtShort(payment.due_date)}`}
                        </p>
                      </div>
                      {payment.status === 'DUE' || payment.status === 'PENDING' ? (
                        <Button size="sm" variant="outline" className="h-11 rounded-full bg-white" onClick={() => markPaidMutation.mutate(payment.id)}>סימון כשולם</Button>
                      ) : (
                        <StatusPill status={payment.status} label={paymentStatusLabels[payment.status]} />
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[14px] text-ink-600">עדיין לא נרשם תשלום.</p>
              )}
              <div className="mt-3 flex gap-2">
                <Button variant="outline" className="h-11 flex-1 rounded-full border-0 bg-white" onClick={() => setIsPaymentDialogOpen(true)}>
                  <Plus />
                  תשלום
                </Button>
                <Button variant="outline" className="h-11 flex-1 rounded-full border-0 bg-white" onClick={() => navigate(`/invoices?booking=${booking.id}`)}>
                  <Receipt />
                  חשבונית
                </Button>
              </div>
            </section>

            <section className="e-side e-tint-sky order-5 p-5 lg:order-none" aria-labelledby="e-notes">
              <h2 id="e-notes" className="text-[15px] font-bold text-[var(--st-sky-fg)]">הערות</h2>
              {booking.notes ? (
                <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-navy-900">{booking.notes}</p>
              ) : (
                <button type="button" onClick={() => navigate(`${createPageUrl('Bookings')}?openBookingId=${encodeURIComponent(booking.id)}`)} className="press mt-2 inline-flex h-11 items-center text-[14px] font-semibold text-[var(--st-sky-fg)]">הוספת הערה</button>
              )}
            </section>
          </div>
        </div>
      </Page>

      <WhatsAppComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        booking={booking}
        property={property}
        balance={bal}
        orgId={orgId}
        orgName=""
        onSent={() => queryClient.invalidateQueries({ queryKey: ['messages', booking.id] })}
      />

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