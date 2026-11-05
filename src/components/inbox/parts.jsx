/**
 * Inbox ("שיחות") building blocks shared by variant A (split inbox) and B (cards).
 * Standing rule (Deen 05.11 20:24): older owners too. Every block says what it is and what to do in one line,
 * one primary action, calm, no clutter.
 */
import React, { useState } from 'react';
import {
  MessageCircle, Instagram, Facebook, Link2, Globe, Zap, Mail, Phone, PenLine, Search as SearchIcon,
  CalendarCheck, CalendarX, CalendarRange, Clock3, Copy, Check, BedDouble, ChevronRight, Send, MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FriendlyText } from '@/components/magic/FriendlyText';
import { GuestAvatar } from '@/components/app/atoms';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDayHe, formatRangeHe, todayISO, addDays, nightsBetween } from '@/lib/stay/format';
import { heCount } from '@/lib/hebrewCount';
import {
  INBOX_CHANNELS, LEAD_STATES, availabilityLabel, agoHe, VIA_PREFIX,
} from '@/lib/inbox/model';

/* ── Channel icon ───────────────────────────────────────────────────────── */
const CH_STYLE = {
  whatsapp: { Icon: MessageCircle, bg: '#E3F6EC', fg: '#178A4C' },
  messenger: { Icon: MessageCircle, bg: '#E6F0FF', fg: '#0A66E0' },
  instagram: { Icon: Instagram, bg: '#FCE8F3', fg: '#B42D7A' },
  facebook: { Icon: Facebook, bg: '#E7EEFD', fg: '#1D5BD8' },
  google: { Icon: SearchIcon, bg: '#E8F0FE', fg: '#2B63D9' },
  link: { Icon: Link2, bg: '#ECEAFE', fg: '#3E2BF1' },
  form: { Icon: Globe, bg: '#ECEAFE', fg: '#3E2BF1' },
  webhook: { Icon: Zap, bg: '#ECEAFE', fg: '#3E2BF1' },
  email: { Icon: Mail, bg: '#EEF0F5', fg: '#4A5578' },
  phone: { Icon: Phone, bg: '#EEF0F5', fg: '#4A5578' },
  manual: { Icon: PenLine, bg: '#EEF0F5', fg: '#4A5578' },
  booking: { Icon: BedDouble, bg: '#E6E9F2', fg: '#1B2656' },
  airbnb: { Icon: BedDouble, bg: '#FDECEC', fg: '#C2393A' },
  direct: { Icon: BedDouble, bg: '#ECEAFE', fg: '#3E2BF1' },
};
export function channelLabel(ch) {
  return INBOX_CHANNELS[ch]?.label || 'פנייה';
}
export function ChannelIcon({ channel, size = 20, className }) {
  const s = CH_STYLE[channel] || CH_STYLE.manual;
  const box = Math.round(size * 1.1);
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full ring-2 ring-white', className)}
      style={{ width: box, height: box, background: s.bg, color: s.fg }}
      aria-hidden
    >
      <s.Icon size={Math.round(size * 0.62)} strokeWidth={2} />
    </span>
  );
}

/** Avatar with the channel badge on its corner (where the person wrote from). */
export function ThreadAvatar({ name, channel, size = 44 }) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <GuestAvatar name={name || 'פנייה'} size={size} photo={false} />
      <ChannelIcon channel={channel} size={18} className="absolute -bottom-1 -left-1" />
    </span>
  );
}

/* ── Chips ──────────────────────────────────────────────────────────────── */
const AV_TONE = {
  free: { bg: '#E3F6EC', fg: '#146B3C', Icon: CalendarCheck },
  partial: { bg: '#E3F6EC', fg: '#146B3C', Icon: CalendarCheck },
  busy: { bg: '#FDECEC', fg: '#A32A2B', Icon: CalendarX },
  nodates: { bg: '#EEF0F5', fg: '#4A5578', Icon: CalendarRange },
};
export function AvailabilityChip({ av, className }) {
  if (!av || !AV_TONE[av.state]) return null;
  const t = AV_TONE[av.state];
  return (
    <span className={cn('inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold', className)} style={{ background: t.bg, color: t.fg }}>
      <t.Icon size={14} strokeWidth={2} aria-hidden />
      {availabilityLabel(av)}
    </span>
  );
}

const STATE_TONE = {
  new: { bg: '#ECEAFE', fg: '#3E2BF1' },
  replied: { bg: '#E6F0FB', fg: '#1F5C99' },
  booked: { bg: '#E3F6EC', fg: '#146B3C' },
  dropped: { bg: '#EEF0F5', fg: '#5B6584' },
  guest: { bg: '#EEF0F5', fg: '#1B2656' },
};
/** Where a guest is in their stay, in words: "מגיעים מחר", "בשהייה", "בעוד 9 ימים". */
export function guestStayLabel(booking, today = todayISO()) {
  if (!booking?.check_in_date) return 'אורח';
  const ci = booking.check_in_date; const co = booking.check_out_date || ci;
  if (ci === today) return 'מגיעים היום';
  if (ci === addDays(today, 1)) return 'מגיעים מחר';
  if (ci < today && co > today) return 'בשהייה';
  if (co === today) return 'עוזבים היום';
  if (co < today) return 'עזבו';
  const n = nightsBetween(today, ci);
  return n <= 30 ? `בעוד ${heCount(n, 'day')}` : 'הזמנה עתידית';
}

export function StateChip({ state, className, booking }) {
  const label = state === 'guest' ? guestStayLabel(booking) : LEAD_STATES[state]?.label;
  if (!label) return null;
  const t = STATE_TONE[state] || STATE_TONE.guest;
  return <span className={cn('inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-[13px] font-semibold', className)} style={{ background: t.bg, color: t.fg }}>{label}</span>;
}

export function WaitingChip({ thread }) {
  if (!thread?.needsReply) return null;
  const late = thread.overdue;
  return (
    <span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[13px] font-semibold" style={{ background: late ? '#FFF1E6' : '#ECEAFE', color: late ? '#9A4A0B' : '#3E2BF1' }}>
      <Clock3 size={14} strokeWidth={2} aria-hidden />
      {late ? `מחכה ${thread.waitingHours >= 24 ? heCount(Math.floor(thread.waitingHours / 24), 'day') : `${thread.waitingHours} שעות`}` : 'מחכה לתשובה'}
    </span>
  );
}

/* ── One line about the stay ────────────────────────────────────────────── */
export function stayLine(thread, unitName) {
  const src = thread.booking || thread.lead || {};
  const parts = [];
  if (src.check_in_date) parts.push(src.check_out_date ? formatRangeHe(src.check_in_date, src.check_out_date) : formatDayHe(src.check_in_date));
  const guests = (Number(src.adults) || 0) + (Number(src.children) || 0);
  if (guests) parts.push(heCount(guests, 'guest'));
  if (unitName) parts.push(unitName);
  return parts.join(' · ');
}

/* ── Copy button (44px, says "הועתק" for 1.6s) ──────────────────────────── */
export function CopyButton({ text, label = 'העתקה', className, variant = 'outline', onCopied }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch { /* ignore */ }
      ta.remove();
    }
    setDone(true); onCopied?.();
    window.setTimeout(() => setDone(false), 1600);
  };
  return (
    <Button type="button" variant={variant} onClick={copy} className={cn('min-h-[44px] gap-1.5', className)} aria-live="polite">
      {done ? <Check size={16} strokeWidth={2.25} aria-hidden /> : <Copy size={16} strokeWidth={2} aria-hidden />}
      {done ? 'הועתק' : label}
    </Button>
  );
}

/* ── Thread row (list) ──────────────────────────────────────────────────── */
export function ThreadRow({ thread, unitName, av, active, onOpen, now }) {
  const line = stayLine(thread, unitName);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'press flex min-h-[84px] w-full items-start gap-3 border-b border-[#EEF0F5] px-4 py-3.5 text-right transition-colors duration-150 hover:bg-[#F7F8FB]',
        active && 'bg-[#F1F0FE] hover:bg-[#F1F0FE]',
      )}
    >
      <ThreadAvatar name={thread.name} channel={thread.channel} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className={cn('truncate text-[16px] text-navy-900', thread.needsReply ? 'font-bold' : 'font-semibold')}>{thread.name}</span>
          <span className="shrink-0 text-[13px] text-ink-400 tabular">{agoHe(thread.lastAt, now)}</span>
        </span>
        <span className="mt-0.5 block truncate text-[14px] text-ink-600">{line || channelLabel(thread.channel)}</span>
        <span className="mt-2 flex flex-wrap items-center gap-1.5">
          {thread.kind === 'lead' && thread.needsReply ? <WaitingChip thread={thread} /> : <StateChip state={thread.state} booking={thread.booking} />}
          {thread.kind === 'lead' && thread.state !== 'booked' && thread.state !== 'dropped' ? <AvailabilityChip av={av} /> : null}
        </span>
      </span>
    </button>
  );
}

/* ── Thread view (detail) ───────────────────────────────────────────────── */
function Bubble({ m }) {
  const out = (m.direction || 'outbound') !== 'inbound';
  const at = m.created_at || m.created_date;
  return (
    <div className={cn('flex', out ? 'justify-start' : 'justify-end')}>
      <div className={cn('max-w-[85%] rounded-[20px] px-3.5 py-2.5 text-[15px] leading-relaxed', out ? 'rounded-tr-[6px] bg-brand-600 text-white' : 'rounded-tl-[6px] border border-[#E8EAF2] bg-white text-navy-900')}>
        <p className="whitespace-pre-wrap"><FriendlyText text={m.body} asLinks linkClassName={out ? 'underline underline-offset-2 text-white' : 'underline underline-offset-2 text-brand-700'} /></p>
        <p className={cn('mt-1 text-[12px] tabular', out ? 'text-white/85' : 'text-ink-400')}>
          {at ? new Date(at).toLocaleString('he-IL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
          {m.status === 'logged' ? ' · נרשם' : out ? ' · נשלח מהוואטסאפ שלכם' : ''}
        </p>
      </div>
    </div>
  );
}

/** The inquiry itself, as the first "message" of a lead thread. */
function InquiryCard({ lead, unitName, av }) {
  const lines = String(lead.notes || '').split('\n').map((x) => x.trim()).filter(Boolean);
  const via = lines.find((x) => x.startsWith(VIA_PREFIX));
  const text = lines.filter((x) => !x.startsWith(VIA_PREFIX) && !x.startsWith('פנייה מדף ההזמנה הישירה') && !x.startsWith('פנייה מחיבור אוטומטי')).join('\n');
  const at = lead.created_at || lead.created_date;
  return (
    <div className="rounded-[20px] border border-[#E8EAF2] bg-white p-4">
      <p className="text-[13px] font-semibold text-ink-400">
        פנייה{via ? ` · ${via.replace(VIA_PREFIX, 'דרך').trim()}` : ''}{at ? ` · ${new Date(at).toLocaleString('he-IL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}
      </p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[15px]">
        <dt className="text-ink-600">תאריכים</dt>
        <dd className="font-semibold text-navy-900">{lead.check_in_date ? (lead.check_out_date ? formatRangeHe(lead.check_in_date, lead.check_out_date) : formatDayHe(lead.check_in_date)) : 'לא צוינו'}</dd>
        {(lead.adults || lead.children) ? (<><dt className="text-ink-600">אורחים</dt><dd className="font-semibold text-navy-900">{heCount((Number(lead.adults) || 0) + (Number(lead.children) || 0), 'guest')}</dd></>) : null}
        {unitName ? (<><dt className="text-ink-600">יחידה</dt><dd className="font-semibold text-navy-900">{unitName}</dd></>) : null}
        {lead.phone ? (<><dt className="text-ink-600">טלפון</dt><dd className="font-semibold text-navy-900" dir="ltr" style={{ textAlign: 'right' }}>{lead.phone}</dd></>) : null}
      </dl>
      {av && av.state !== 'nodates' ? <AvailabilityChip av={av} className="mt-3" /> : null}
      {text ? <p className="mt-3 whitespace-pre-wrap rounded-[14px] bg-[#F7F8FB] p-3 text-[15px] text-navy-900"><FriendlyText text={text} asLinks linkClassName="underline underline-offset-2 text-brand-700" /></p> : null}
    </div>
  );
}

/**
 * actions: { reply(thread, text), convert(thread), openBooking(thread), setState(thread, key) }
 * suggestion: { title, text, subject } for guest threads (the WhatsApp message that is due today), optional.
 */
export function ThreadView({ thread, unitName, av, actions, suggestion, onBack, compact = false }) {
  const isLead = thread.kind === 'lead';
  // A new inquiry opens with a ready answer (dates + whether they are free) the owner can edit, then one tap sends it.
  const [draft, setDraft] = useState(() => (isLead && thread.state === 'new' ? actions.leadReplyText(thread) : ''));
  const [menu, setMenu] = useState(false);
  const canReply = !!String(thread.phone || '').replace(/\D/g, '');
  const send = (text, subject) => {
    const body = String(text || '').trim();
    if (!body) return;
    actions.reply(thread, body, subject);
    setDraft('');
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#F7F8FB]">
      <div className="flex items-center gap-3 border-b border-[#E8EAF2] bg-white px-4 py-3">
        {onBack ? (
          <button type="button" onClick={onBack} aria-label="חזרה לרשימה" className="press -mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-600 hover:bg-[#F1F2F7]">
            <ChevronRight size={22} strokeWidth={1.75} />
          </button>
        ) : null}
        <ThreadAvatar name={thread.name} channel={thread.channel} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-bold text-navy-900">{thread.name}</p>
          <p className="truncate text-[13px] text-ink-600">{channelLabel(thread.channel)}{unitName ? ` · ${unitName}` : ''}</p>
        </div>
        {isLead && thread.state !== 'dropped' && thread.state !== 'booked' ? (
          <div className="relative">
            <button type="button" aria-label="עוד פעולות" aria-expanded={menu} onClick={() => setMenu((v) => !v)} className="press inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-600 hover:bg-[#F1F2F7]">
              <MoreHorizontal size={20} strokeWidth={1.75} />
            </button>
            {menu ? (
              <div role="menu" className="absolute left-0 top-12 z-20 w-56 overflow-hidden rounded-[16px] border border-[#E8EAF2] bg-white py-1 shadow-[0_16px_40px_-12px_rgba(27,38,86,0.25)]">
                {thread.state === 'new' ? <button role="menuitem" type="button" className="flex min-h-[44px] w-full items-center px-4 text-right text-[15px] hover:bg-[#F7F8FB]" onClick={() => { setMenu(false); actions.setState(thread, 'replied'); }}>סימון: ענינו</button> : null}
                <button role="menuitem" type="button" className="flex min-h-[44px] w-full items-center px-4 text-right text-[15px] hover:bg-[#F7F8FB]" onClick={() => { setMenu(false); actions.setState(thread, 'dropped'); }}>סימון: לא רלוונטית</button>
                <button role="menuitem" type="button" className="flex min-h-[44px] w-full items-center px-4 text-right text-[15px] hover:bg-[#F7F8FB]" onClick={() => { setMenu(false); actions.edit(thread); }}>עריכת פרטים</button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className={cn('flex-1 space-y-3 overflow-y-auto p-4', !compact && 'md:p-6')}>
        {isLead && thread.lead ? <InquiryCard lead={thread.lead} unitName={unitName} av={av} /> : null}
        {!isLead && thread.booking ? (
          <div className="rounded-[20px] border border-[#E8EAF2] bg-white p-4">
            <p className="text-[13px] font-semibold text-ink-400">הזמנה</p>
            <p className="mt-1 text-[15px] font-semibold text-navy-900">{stayLine(thread, unitName) || 'בלי תאריכים'}</p>
          </div>
        ) : null}
        {thread.messages.map((m, i) => <Bubble key={m.id || i} m={m} />)}
        {suggestion && canReply ? (
          <div className="rounded-[20px] border border-dashed border-[#C9C3FB] bg-white p-4">
            <p className="text-[13px] font-semibold text-brand-700">מוכנה לשליחה היום: {suggestion.title}</p>
            <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-[15px] text-navy-900"><FriendlyText text={suggestion.text} linkClassName="underline underline-offset-2 text-brand-700" /></p>
            <Button type="button" className="mt-3 min-h-[44px] gap-1.5" onClick={() => send(suggestion.text, suggestion.subject)}>
              <MessageCircle size={18} strokeWidth={2} aria-hidden /> שליחה בוואטסאפ
            </Button>
          </div>
        ) : null}
      </div>

      <div className="border-t border-[#E8EAF2] bg-white p-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
        {isLead && thread.state !== 'booked' && thread.state !== 'dropped' ? (
          <div className="mb-3 grid grid-cols-2 gap-2">
            <Button type="button" className="min-h-[48px] gap-1.5 whitespace-normal px-3 text-[15px] leading-tight" disabled={!canReply} onClick={() => send(draft || actions.leadReplyText(thread))}>
              <MessageCircle size={18} strokeWidth={2} aria-hidden /> תשובה בוואטסאפ
            </Button>
            <Button type="button" variant="outline" className="min-h-[48px] gap-1.5 whitespace-normal px-3 text-[15px] leading-tight" onClick={() => actions.convert(thread)}>
              <CalendarCheck size={18} strokeWidth={2} aria-hidden /> הפכו להזמנה
            </Button>
          </div>
        ) : null}
        {!isLead && thread.booking ? (
          <div className="mb-3">
            <Button type="button" variant="outline" className="min-h-[44px] w-full" onClick={() => actions.openBooking(thread)}>פתיחת ההזמנה</Button>
          </div>
        ) : null}
        {canReply ? (
          <>
          {isLead && thread.state === 'new' && draft ? <p className="mb-1.5 text-[13px] font-semibold text-ink-600">ההודעה מוכנה. אפשר לשנות לפני השליחה:</p> : null}
          <div className="flex items-end gap-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="כתיבת הודעה (תישלח מהוואטסאפ שלכם)"
              aria-label="כתיבת הודעה, תישלח מהוואטסאפ שלכם"
              rows={draft.length > 60 ? 3 : 1}
              className="max-h-[132px] min-h-[44px] flex-1 resize-none text-[16px] leading-snug"
            />
            <Button type="button" size="icon" aria-label="שליחה בוואטסאפ" className="h-11 w-11 shrink-0" disabled={!draft.trim()} onClick={() => send(draft)}>
              <Send className="h-[18px] w-[18px] -scale-x-100" strokeWidth={1.75} />
            </Button>
          </div>
          </>
        ) : (
          <p className="text-center text-[14px] text-ink-600">אין טלפון בפנייה הזו. הוסיפו אותו בעריכת פרטים כדי לענות בוואטסאפ.</p>
        )}
      </div>
    </div>
  );
}
