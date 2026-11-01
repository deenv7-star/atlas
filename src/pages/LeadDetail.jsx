import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLead, useUpdateLead, useDeleteLead, useProperties } from '@/data/entities';
import { atlasToastApi } from '@/components/ui/AtlasToast';
import { ChevronRight, Pencil, Trash2, MessageSquare, Phone, Mail, ArrowLeftRight, CalendarDays } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { optimisticEntityClassName } from '@/lib/optimistic/entityVisualState';
import { heCount } from '@/lib/hebrewCount';
import { Page, StatusPill, fmtDay, fmtMoney } from '@/components/ds';
import { GuestAvatar } from '@/components/app/atoms';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { isDialable, telHref, whatsappHref } from '@/lib/phone';
import { formatRangeHe, firstName } from '@/lib/stay/format';
import { nightsBetween } from '@/lib/entityPayloads';

const STATUS = {
  NEW: { label: 'חדש', tone: 'brand' },
  CONTACTED: { label: 'נוצר קשר', tone: 'warning' },
  OFFER_SENT: { label: 'הצעה נשלחה', tone: 'sky' },
  CONFIRMED: { label: 'מאושר', tone: 'sky' },
  WON: { label: 'נסגר', tone: 'success' },
  LOST: { label: 'לא רלוונטי', tone: 'neutral' },
};

const SOURCE = {
  FACEBOOK: 'פייסבוק',
  WHATSAPP: 'וואטסאפ',
  WEBSITE: 'אתר',
  PHONE: 'טלפון',
  OTHER: 'אחר',
};

/** Opening line for the WhatsApp reply, written as the host to the guest. */
function replyText(lead) {
  const name = firstName(lead.full_name);
  const hi = name ? `שלום ${name}` : 'שלום';
  const dates = lead.check_in_date && lead.check_out_date ? ` לתאריכים ${formatRangeHe(lead.check_in_date, lead.check_out_date)}` : '';
  return `${hi}, תודה על הפנייה${dates}. אשמח לספר על הזמינות והמחיר.`;
}

/** Lead → booking form values (the host still picks the unit and checks price before saving). */
function leadToBookingPreset(lead) {
  const budget = Number(lead.budget);
  return {
    guest_name: lead.full_name || '',
    guest_phone: lead.phone || '',
    guest_email: lead.email || '',
    property_id: lead.property_id || '',
    check_in_date: lead.check_in_date || '',
    check_out_date: lead.check_out_date || '',
    nights: lead.nights || nightsBetween(lead.check_in_date, lead.check_out_date) || 1,
    adults: lead.adults || 2,
    children: lead.children || 0,
    total_price: Number.isFinite(budget) && budget > 0 ? String(budget) : '',
    notes: lead.notes || '',
    status: 'PENDING',
    booking_source: 'direct',
  };
}

function Section({ title, children, className }) {
  return (
    <section className={cn('v7-card p-5 md:p-6', className)}>
      <h2 className="mb-3 text-[17px] font-bold text-navy-900">{title}</h2>
      {children}
    </section>
  );
}

function Fact({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[13px] font-medium text-ink-400">{label}</p>
      <p className="mt-0.5 truncate text-[16px] font-semibold text-navy-900">{children}</p>
    </div>
  );
}

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: lead, isLoading } = useLead(id);
  const { data: properties = [] } = useProperties();
  const updateMutation = useUpdateLead();
  const deleteLead = useDeleteLead();
  const quickBooking = useQuickBooking();
  const [notesDraft, setNotesDraft] = useState('');
  const [notesInvalid, setNotesInvalid] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [converting, setConverting] = useState(false);

  // ENG-04: one lead → one booking. If it was already converted, the button opens that booking.
  const linked = useQuery({
    queryKey: ['bookings', 'by-lead', id],
    queryFn: async () => {
      const rows = await base44.entities.Booking.filter({ lead_id: id }, '-created_at', 5);
      return (rows || []).find((b) => !['CANCELLED', 'CANCELED'].includes(String(b.status || '').toUpperCase())) || null;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
  const linkedBooking = linked.data || null;

  useEffect(() => {
    if (lead?.notes != null) setNotesDraft(String(lead.notes));
  }, [lead?.notes, lead?.id]);

  useEffect(() => {
    const onValidation = (e) => {
      const d = e.detail;
      if (d?.entity === 'lead' && d?.id === id) {
        setNotesInvalid(true);
        window.setTimeout(() => setNotesInvalid(false), 4000);
      }
    };
    window.addEventListener('atlas:entity-validation-error', onValidation);
    return () => window.removeEventListener('atlas:entity-validation-error', onValidation);
  }, [id]);

  const unitName = useMemo(
    () => (lead?.property_id ? properties.find((p) => p.id === lead.property_id)?.name || '' : ''),
    [lead?.property_id, properties],
  );

  // APP-022: open the booking form prefilled from the lead (unit, dates, price, overlap check) instead of
  // inserting a half-empty booking. The form's own submit lock prevents a double save.
  const openConvert = () => {
    if (!lead || converting) return;
    if (linkedBooking) {
      navigate(`${createPageUrl('BookingDetail')}/${linkedBooking.id}`);
      return;
    }
    setConverting(true);
    quickBooking.open(leadToBookingPreset(lead), {
      leadId: lead.id,
      title: 'הזמנה מהליד',
      onClose: () => setConverting(false),
      onCreated: async (booking) => {
        try {
          await updateMutation.mutateAsync({ id: lead.id, data: { status: 'WON' } });
        } catch {
          atlasToastApi.error('ההזמנה נשמרה, אבל לא הצלחנו לסמן את הליד כנסגר. סמנו אותו ידנית.');
        }
        linked.refetch();
        if (booking?.id) window.setTimeout(() => navigate(`${createPageUrl('BookingDetail')}/${booking.id}`), 750);
      },
    });
  };

  const saveNotes = () => {
    if (!lead) return;
    const next = notesDraft.trim();
    if (next === (lead.notes || '').trim()) return;
    updateMutation.mutate({ id: lead.id, data: { notes: next } });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-[18px] font-bold text-navy-900">לא מצאנו את הליד</h1>
        <p className="mt-1 text-[16px] text-ink-600">אולי הוא נמחק, או שהקישור ישן.</p>
      </div>
    );
  }

  const status = STATUS[lead.status] || STATUS.NEW;
  const phoneOk = isDialable(lead.phone);
  const hasDates = !!(lead.check_in_date || lead.check_out_date);
  const nights = nightsBetween(lead.check_in_date, lead.check_out_date);
  const guests = (Number(lead.adults) || 0) + (Number(lead.children) || 0);
  const budget = Number(lead.budget);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className={optimisticEntityClassName(lead.id)}
    >
      <Page className="max-w-[760px]">
        <div className="mb-3 flex items-center justify-between gap-2">
          <button type="button" onClick={() => navigate(createPageUrl('Leads'))} className="press -ms-2 inline-flex h-11 items-center gap-1 rounded-full px-3 text-[15px] font-medium text-brand-600 hover:bg-brand-50">
            <ChevronRight className="h-5 w-5" />
            לידים
          </button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" className="h-11" onClick={() => navigate(`${createPageUrl('Leads')}?openGuestId=${encodeURIComponent(lead.id)}`)}>
              <Pencil />
              עריכה
            </Button>
            <Button variant="ghost" size="icon" className="h-11 w-11 text-ink-600 hover:text-danger-600" aria-label="מחיקת ליד" onClick={() => setConfirmDelete(true)}>
              <Trash2 />
            </Button>
          </div>
        </div>

        <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <DialogContent className="max-w-[420px]" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-[20px] font-bold text-navy-900">למחוק את הליד?</DialogTitle>
            </DialogHeader>
            <p className="text-[15px] text-ink-600">{lead.full_name || 'הליד'} יוסר מרשימת הלידים.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDelete(false)}>ביטול</Button>
              <Button variant="destructive" disabled={deleteLead.isPending} onClick={() => { const leadId = lead.id; setConfirmDelete(false); navigate(createPageUrl('Leads')); deleteLead.mutate(leadId, { onSuccess: () => atlasToastApi.success('הליד נמחק'), onError: () => atlasToastApi.error('לא הצלחנו למחוק את הליד. נסו שוב.') }); }}>מחיקה</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="space-y-4">
          <section className="v5-rise v7-card p-5 md:p-6">
            <div className="flex items-center gap-4">
              <GuestAvatar name={lead.full_name || 'ליד'} size={64} ring />
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-navy-900 md:text-[30px]">{lead.full_name || 'ליד'}</h1>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-ink-600 md:text-[15px]">
                  <StatusPill label={status.label} tone={status.tone} />
                  {SOURCE[lead.source] ? <span>מ{SOURCE[lead.source]}</span> : null}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {phoneOk ? (
                <>
                  <a
                    href={whatsappHref(lead.phone, replyText(lead))}
                    target="_blank"
                    rel="noreferrer"
                    className="press inline-flex h-12 min-w-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 text-[15px] font-bold text-white shadow-[0_10px_22px_-10px_rgba(62,43,241,0.7)] hover:bg-brand-500 sm:flex-none"
                  >
                    <MessageSquare className="h-5 w-5" aria-hidden />
                    תשובה בוואטסאפ
                  </a>
                  <a
                    href={telHref(lead.phone)}
                    aria-label={`שיחה ל-${lead.full_name || 'ליד'}`}
                    className="press inline-flex h-12 min-w-[48px] items-center justify-center gap-2 rounded-full bg-[#F1F1F8] px-4 text-[15px] font-semibold text-navy-900 hover:bg-[#E8E8F2]"
                  >
                    <Phone className="h-[18px] w-[18px]" aria-hidden />
                    <span dir="ltr" className="tabular">{lead.phone}</span>
                  </a>
                </>
              ) : lead.phone ? (
                <p className="text-[14px] text-ink-600">
                  המספר <span dir="ltr">{lead.phone}</span> לא נראה תקין. ערכו את הליד כדי לחייג או לשלוח וואטסאפ.
                </p>
              ) : (
                <p className="text-[14px] text-ink-600">אין טלפון בליד. הוסיפו אותו בעריכה כדי לענות בוואטסאפ.</p>
              )}
              {lead.email ? (
                <a href={`mailto:${lead.email}`} aria-label={`מייל ל-${lead.full_name || 'ליד'}`} className="press inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F1F8] text-navy-900 hover:bg-[#E8E8F2]">
                  <Mail className="h-[18px] w-[18px]" aria-hidden />
                </a>
              ) : null}
            </div>
          </section>

          <Section title="מה ביקשו">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Fact label="תאריכים">
                {hasDates ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
                    {lead.check_in_date && lead.check_out_date ? formatRangeHe(lead.check_in_date, lead.check_out_date) : fmtDay(lead.check_in_date || lead.check_out_date)}
                  </span>
                ) : 'עוד לא נקבעו'}
              </Fact>
              <Fact label="לילות">{nights ? heCount(nights, 'night') : '-'}</Fact>
              <Fact label="אורחים">{guests ? heCount(guests, 'guest') : '-'}</Fact>
              {unitName ? <Fact label="יחידה">{unitName}</Fact> : null}
              {Number.isFinite(budget) && budget > 0 ? <Fact label="תקציב">{fmtMoney(budget)}</Fact> : null}
            </div>
          </Section>

          <Section title="הערות" className={cn(notesInvalid && 'ring-2 ring-red-500/70 ring-offset-2')}>
            <Label htmlFor="lead-notes" className="mb-1.5 block text-[13px] text-ink-400">
              נשמר לבד
            </Label>
            <Textarea
              id="lead-notes"
              dir="rtl"
              rows={4}
              maxLength={2000}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={saveNotes}
              placeholder="רק אתם רואים את זה"
              className="min-h-[100px] resize-y rounded-xl text-base md:text-[15px]"
            />
          </Section>

          <Section title="מצב הליד">
            <Select value={lead.status} onValueChange={(value) => updateMutation.mutate({ id: lead.id, data: { status: value } })}>
              <SelectTrigger className="h-12 rounded-xl text-base md:text-[15px]" aria-label="מצב הליד">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS).map(([key, s]) => (
                  <SelectItem key={key} value={key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Section>

          <Button
            type="button"
            className="h-12 w-full rounded-xl bg-brand-600 text-[16px] font-semibold text-white hover:bg-brand-500"
            onClick={openConvert}
            disabled={converting || linked.isLoading}
            aria-busy={converting || undefined}
          >
            <ArrowLeftRight className="ml-2 h-4 w-4" aria-hidden />
            {linkedBooking ? 'פתיחת ההזמנה' : 'הפיכה להזמנה'}
          </Button>
          {linkedBooking ? (
            <p className="text-center text-[14px] text-ink-600">כבר יצרתם הזמנה מהליד הזה.</p>
          ) : null}
        </div>
      </Page>
    </motion.div>
  );
}
