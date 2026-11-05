/**
 * שיחות (feat/leads-v2, 05.11.2026): ONE inbox for inquiries (פניות) and guests (was two pages: פניות + הודעות).
 *
 *   - every inquiry from every connected source lands here (inquiry link per unit, WhatsApp auto-reply link,
 *     site button, lead-intake webhook once deployed; WhatsApp / Messenger / Instagram after Meta approval)
 *   - each person is one thread: the inquiry, dates, whether they are free, and what was sent from atlas
 *   - one tap: answer on WhatsApp (ready text with dates + availability) or turn it into a booking
 *   - guests (with a booking) live in the same list, with the WhatsApp message that is due today
 *
 * Two layouts behind ?v= (default A = recommendation): A "תיבה אחת" split inbox, B "כרטיסים" cards with inline actions.
 * /messages redirects here (?f=guests). Data model: src/lib/inbox/model.js. Sources: src/lib/leads/sources.js.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Plug, Clock3, CalendarCheck, MessageCircle, Link2, ChevronLeft, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';
import { Page, PageHeader, SegmentedControl, SkelRows } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AtlasSheet } from '@/components/ui/sheet/AtlasSheet';
import { useToast } from '@/components/ui/AtlasToast';
import { ErrorFallback } from '@/components/common/ErrorFallback';
import StaleIndicator from '@/components/app/StaleIndicator';
import { GuestForm } from '@/components/forms/GuestForm';
import { emptyGuestFormValues } from '@/components/forms/atlasFormSchemas';
import { leadFormToPayload } from '@/lib/entityPayloads';
import { exportToCSV, LEAD_COLUMNS } from '@/lib/csvExport';
import {
  useLeads, useCreateLead, useUpdateLead, useProperties, useBookings, useMessageLogs, useCreateMessageLog,
} from '@/data/entities';
import { useQuickBooking } from '@/components/app/QuickBooking';
import { openExternal } from '@/lib/openExternal';
import { whatsappHref } from '@/lib/phone';
import { formatDayHe, nightsBetween } from '@/lib/stay/format';
import { dueTemplateFor, renderTemplate, templateByKey, logSubjectFor } from '@/lib/stay/whatsapp';
import {
  buildThreads, filterThreads, countThreads, availabilityFor, leadReplyText, STATE_TO_STATUS, LEAD_STATES,
} from '@/lib/inbox/model';
import { SOURCE_STATUS_LABEL } from '@/lib/leads/sources';
import {
  ThreadRow, ThreadView, ThreadAvatar, AvailabilityChip, WaitingChip, StateChip, stayLine,
} from '@/components/inbox/parts';
import { SourcesSheet, InquiryLinkCard, linkReady } from '@/components/inbox/Sources';

const VARIANT_KEY = 'atlas.inbox.variant';
function useVariant(params) {
  const fromUrl = params.get('v');
  useEffect(() => { if (fromUrl === 'a' || fromUrl === 'b') { try { localStorage.setItem(VARIANT_KEY, fromUrl); } catch { /* ignore */ } } }, [fromUrl]);
  if (fromUrl === 'a' || fromUrl === 'b') return fromUrl;
  try { return localStorage.getItem(VARIANT_KEY) === 'b' ? 'b' : 'a'; } catch { return 'a'; }
}

function useDesktop() {
  const q = '(min-width: 1024px)';
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q); const on = () => setM(mq.matches);
    mq.addEventListener('change', on); return () => mq.removeEventListener('change', on);
  }, []);
  return m;
}

function leadToBookingPreset(lead) {
  const budget = Number(lead.budget);
  return {
    guest_name: lead.full_name || '', guest_phone: lead.phone || '', guest_email: lead.email || '',
    property_id: lead.property_id || '', check_in_date: lead.check_in_date || '', check_out_date: lead.check_out_date || '',
    nights: lead.nights || nightsBetween(lead.check_in_date, lead.check_out_date) || 1,
    adults: lead.adults || 2, children: lead.children || 0,
    total_price: Number.isFinite(budget) && budget > 0 ? String(budget) : '',
    notes: lead.notes || '', status: 'PENDING', booking_source: 'direct',
  };
}

function leadToFormValues(lead) {
  if (!lead) return { ...emptyGuestFormValues };
  return {
    ...emptyGuestFormValues,
    full_name: lead.full_name || '', email: lead.email || '', phone: lead.phone || '', property_id: lead.property_id || '',
    check_in_date: lead.check_in_date || '', check_out_date: lead.check_out_date || '', adults: lead.adults || 2, children: lead.children || 0,
    status: lead.status || 'NEW', source: lead.source || '', notes: lead.notes || '', budget: lead.budget != null && lead.budget !== '' ? String(lead.budget) : '',
  };
}

/* ── Empty inbox: what it is, how it works, an example, one action ─────── */
function SampleRow() {
  const sample = { name: 'מיכל כהן', channel: 'instagram', needsReply: true, overdue: false, kind: 'lead', state: 'new' };
  return (
    <div className="pointer-events-none select-none rounded-[20px] border border-[#E8EAF2] bg-white p-4" aria-label="דוגמה לפנייה">
      <div className="flex items-start gap-3">
        <ThreadAvatar name={sample.name} channel={sample.channel} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[16px] font-bold text-navy-900">{sample.name}</span>
            <span className="rounded-full bg-[#EEF0F5] px-2 py-0.5 text-[12px] font-semibold text-ink-600">דוגמה</span>
          </div>
          <p className="mt-0.5 text-[14px] text-ink-600">12-14 בדצמ׳ · 2 אורחים · דרך אינסטגרם</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <WaitingChip thread={sample} />
            <AvailabilityChip av={{ state: 'free', freeUnits: 1, totalUnits: 1 }} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <span className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-brand-600 text-[14px] font-semibold text-white"><MessageCircle size={16} aria-hidden />תשובה בוואטסאפ</span>
            <span className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-[#E8EAF2] text-[14px] font-semibold text-navy-900"><CalendarCheck size={16} aria-hidden />הפכו להזמנה</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyInbox({ properties, onNewLead }) {
  const steps = [
    { n: 1, t: 'מפעילים קישור לבדיקת תאריכים', d: 'קישור אחד לכל יחידה. לוקח דקה.' },
    { n: 2, t: 'שמים אותו איפה שמחפשים אתכם', d: 'אינסטגרם, פייסבוק, גוגל, וואטסאפ.' },
    { n: 3, t: 'כל פנייה מגיעה לכאן לבד', d: 'עם תאריכים, בדיקה אם פנוי והתראה לטלפון.' },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr] lg:items-start">
      <div className="space-y-4">
        <section className="rounded-[24px] border border-[#E8EAF2] bg-white p-5">
          <h2 className="text-[20px] font-bold text-navy-900">כך זה עובד</h2>
          <ol className="mt-4 space-y-4">
            {steps.map((s) => (
              <li key={s.n} className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ECEAFE] text-[15px] font-bold text-brand-600 tabular" aria-hidden>{s.n}</span>
                <span><span className="block text-[16px] font-semibold text-navy-900">{s.t}</span><span className="block text-[14px] text-ink-600">{s.d}</span></span>
              </li>
            ))}
          </ol>
        </section>
        <InquiryLinkCard properties={properties} highlight />
        <button type="button" onClick={onNewLead} className="press min-h-[44px] w-full rounded-full text-[15px] font-semibold text-brand-700 hover:bg-[#F4F3FF]">מישהו התקשר? רישום פנייה ידנית</button>
      </div>
      <section aria-labelledby="inbox-sample-h">
        <h2 id="inbox-sample-h" className="mb-2 text-[15px] font-semibold text-ink-600">כך תיראה פנייה שמגיעה</h2>
        <SampleRow />
        <p className="mt-3 text-[14px] leading-relaxed text-ink-600">לוחצים על &quot;תשובה בוואטסאפ&quot; וההודעה כבר כתובה, עם התאריכים ואם הם פנויים. לוחצים על &quot;הפכו להזמנה&quot; וההזמנה נפתחת עם כל הפרטים.</p>
      </section>
    </div>
  );
}

/* ── Sources line (both variants, filled state) ─────────────────────────── */
function SourcesLine({ properties, onOpen }) {
  const live = properties.some(linkReady);
  return (
    <button type="button" onClick={onOpen} className="press flex min-h-[52px] w-full items-center gap-3 rounded-[16px] border border-[#E8EAF2] bg-white px-4 py-2 text-right hover:bg-[#F7F8FB]">
      <Link2 size={18} strokeWidth={1.9} className="shrink-0 text-brand-600" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-navy-900">{live ? 'הקישור לפניות פעיל' : 'עוד לא חיברתם מקור פניות'}</span>
        <span className="block text-[13px] leading-snug text-ink-600">{`וואטסאפ, אינסטגרם ומסנג׳ר: ${SOURCE_STATUS_LABEL.meta_review}`}</span>
      </span>
      <span className="shrink-0 text-[14px] font-semibold text-brand-700">{live ? 'ניהול' : 'חיבור'}</span>
      <ChevronLeft size={16} className="shrink-0 text-brand-700" aria-hidden />
    </button>
  );
}

/* ── Thread overlay (phone: full screen; desktop B: side panel) ─────────── */
function ThreadOverlay({ open, onClose, side, label, children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]" dir="rtl">
      {side ? <button type="button" aria-label="סגירה" className="absolute inset-0 bg-[rgba(27,38,86,0.28)]" onClick={onClose} /> : null}
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn('absolute flex flex-col bg-white outline-none', side ? 'inset-y-0 left-0 w-[480px] max-w-full shadow-[0_0_60px_rgba(27,38,86,0.25)]' : 'inset-0 pt-[env(safe-area-inset-top)]')}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Card (variant B) ───────────────────────────────────────────────────── */
function ThreadCard({ thread, unitName, av, actions, onOpen }) {
  const isLead = thread.kind === 'lead';
  const open = isLead && thread.state !== 'booked' && thread.state !== 'dropped';
  const canWa = !!String(thread.phone || '').replace(/\D/g, '');
  return (
    <article className="rounded-[20px] border border-[#E8EAF2] bg-white p-4">
      <button type="button" onClick={onOpen} className="press flex w-full items-start gap-3 text-right" aria-label={`פתיחת השיחה עם ${thread.name}`}>
        <ThreadAvatar name={thread.name} channel={thread.channel} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16px] font-bold text-navy-900">{thread.name}</span>
          <span className="mt-0.5 block truncate text-[14px] text-ink-600">{stayLine(thread, unitName) || 'בלי תאריכים'}</span>
          <span className="mt-2 flex flex-wrap gap-1.5">
            {isLead && thread.needsReply ? <WaitingChip thread={thread} /> : <StateChip state={thread.state} booking={thread.booking} />}
            {open ? <AvailabilityChip av={av} /> : null}
          </span>
        </span>
      </button>
      {open ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button type="button" className="min-h-[48px] gap-1.5 whitespace-normal px-3 text-[15px] leading-tight" disabled={!canWa} onClick={() => actions.reply(thread, actions.leadReplyText(thread))}>
            <MessageCircle size={18} strokeWidth={2} aria-hidden />תשובה בוואטסאפ
          </Button>
          <Button type="button" variant="outline" className="min-h-[48px] gap-1.5 whitespace-normal px-3 text-[15px] leading-tight" onClick={() => actions.convert(thread)}>
            <CalendarCheck size={18} strokeWidth={2} aria-hidden />הפכו להזמנה
          </Button>
        </div>
      ) : !isLead && thread.booking ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" className="min-h-[44px] gap-1.5" disabled={!canWa} onClick={onOpen}><MessageCircle size={16} aria-hidden />הודעה</Button>
          <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => actions.openBooking(thread)}>ההזמנה</Button>
        </div>
      ) : null}
    </article>
  );
}

export default function LeadsPage({ user, selectedPropertyId, orgId }) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const variant = useVariant(params);
  const desktop = useDesktop();
  const { success, error: toastError } = useToast();
  const quickBooking = useQuickBooking();

  const leadFilters = useMemo(() => (selectedPropertyId ? { property_id: selectedPropertyId } : {}), [selectedPropertyId]);
  const leadsQ = useLeads(leadFilters, '-created_at', 300);
  const bookingsQ = useBookings(leadFilters, '-check_in_date', 500);
  const logsQ = useMessageLogs(selectedPropertyId ? { property_id: selectedPropertyId } : {}, '-created_date', 300);
  const { data: properties = [] } = useProperties();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const createLog = useCreateMessageLog();

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => { const t = window.setInterval(() => setNowMs(Date.now()), 60_000); return () => window.clearInterval(t); }, []);

  const threads = useMemo(() => buildThreads({
    leads: leadsQ.data || [], bookings: bookingsQ.data || [], logs: logsQ.data || [], now: new Date(nowMs),
  }), [leadsQ.data, bookingsQ.data, logsQ.data, nowMs]);
  const counts = useMemo(() => countThreads(threads), [threads]);
  const unitName = (pid) => properties.find((p) => p.id === pid)?.name || '';
  const avOf = (t) => (t.kind === 'lead' && t.lead ? availabilityFor(t.lead, bookingsQ.data || [], properties) : null);

  const fParam = params.get('f') || params.get('view');
  const filter = fParam === 'guests' || fParam === 'all' || fParam === 'leads' ? fParam : (counts.leads ? 'leads' : counts.guests ? 'guests' : 'all');
  const [query, setQuery] = useState('');
  const visible = useMemo(() => filterThreads(threads, filter, query), [threads, filter, query]);
  const openKey = params.get('t') || '';
  const current = threads.find((t) => t.key === openKey) || null;

  const setParam = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => { if (v == null || v === '') next.delete(k); else next.set(k, v); });
    setParams(next, { replace: true });
  };
  const openThread = (t) => setParam({ t: t?.key || '' });

  // Desktop A: show the first thread instead of an empty pane.
  useEffect(() => {
    if (variant !== 'a' || !desktop || openKey || !visible.length) return;
    setParam({ t: visible[0].key });
  }, [variant, desktop, openKey, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const sourcesOpen = params.get('sources') === '1';
  const sourceFocus = params.get('source') || '';

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const interceptRef = useRef(null);

  const loading = leadsQ.isLoading || bookingsQ.isLoading;
  const loadFailed = leadsQ.isError && leadsQ.data === undefined;
  const empty = !loading && !loadFailed && threads.length === 0;
  const hostName = user?.organization_name || '';

  const actions = {
    leadReplyText: (t) => leadReplyText(t.lead, { hostName, unitName: unitName(t.lead?.property_id), av: avOf(t) }, (d) => formatDayHe(d)),
    reply: (t, text, subject) => {
      const href = whatsappHref(t.phone, text);
      if (!href) { toastError('אין מספר טלפון תקין. הוסיפו אותו בעריכת פרטים.'); return; }
      openExternal(href); // inside the tap, so phones allow it
      const org = orgId || user?.organization_id;
      createLog.mutate({
        ...(org ? { org_id: org } : {}),
        guest_name: t.name, recipient: t.phone, body: text, channel: 'whatsapp', direction: 'outbound', status: 'sent',
        subject: subject || 'וואטסאפ · הודעה ידנית',
        lead_id: t.lead?.id || null, booking_id: t.booking?.id || null, property_id: t.propertyId || null,
      });
      if (t.kind === 'lead' && t.state === 'new') updateLead.mutate({ id: t.lead.id, data: { status: STATE_TO_STATUS.replied } });
      success('וואטסאפ נפתח עם ההודעה. שלחו אותה שם.');
    },
    convert: (t) => {
      if (!t.lead) return;
      quickBooking.open(leadToBookingPreset(t.lead), {
        leadId: t.lead.id,
        title: 'הזמנה מהפנייה',
        onCreated: async (booking) => {
          try { await updateLead.mutateAsync({ id: t.lead.id, data: { status: STATE_TO_STATUS.booked } }); } catch { toastError('ההזמנה נשמרה, אבל לא הצלחנו לסמן את הפנייה. סמנו אותה ידנית.'); }
          if (booking?.id) setParam({ t: `b:${booking.id}` });
        },
      });
    },
    openBooking: (t) => t.booking && navigate(`${createPageUrl('BookingDetail')}/${t.booking.id}`),
    setState: (t, key) => {
      if (!t.lead) return;
      updateLead.mutate({ id: t.lead.id, data: { status: STATE_TO_STATUS[key] } }, {
        onSuccess: () => success(`הפנייה סומנה: ${LEAD_STATES[key].label}`),
        onError: () => toastError('לא הצלחנו לעדכן. נסו שוב.'),
      });
    },
    edit: (t) => { setEditing(t.lead); setFormOpen(true); },
  };

  const suggestionFor = (t) => {
    if (!t || t.kind !== 'guest' || !t.booking) return null;
    const sent = new Set(t.messages.map((m) => m.subject).filter(Boolean));
    const key = dueTemplateFor(t.booking, sent);
    if (!key) return null;
    const property = properties.find((p) => p.id === t.booking.property_id) || {};
    return { title: templateByKey(key).label, text: renderTemplate(key, { booking: t.booking, property, orgName: hostName }), subject: logSubjectFor(key) };
  };

  const onSubmitLead = async (formData) => {
    const data = leadFormToPayload(formData);
    if (editing) { await updateLead.mutateAsync({ id: editing.id, data }); success('הפנייה עודכנה'); }
    else {
      const row = await createLead.mutateAsync({ ...data, source: data.source || 'phone' });
      success('הפנייה נשמרה');
      if (row?.id) setParam({ f: 'leads', t: `l:${row.id}` });
    }
  };
  const newLead = () => { setEditing(null); setFormOpen(true); };

  const exportCsv = () => {
    const rows = (leadsQ.data || []).map((l) => ({ ...l, property_name: unitName(l.property_id) }));
    exportToCSV(rows, 'leads', LEAD_COLUMNS);
  };

  const chips = (
    <SegmentedControl
      ariaLabel="סינון שיחות"
      value={filter}
      onChange={(v) => setParam({ f: v, t: '' })}
      options={[
        { value: 'leads', label: 'פניות חדשות', count: counts.leads },
        { value: 'guests', label: 'אורחים', count: counts.guests },
        { value: 'all', label: 'הכול' },
      ]}
    />
  );
  const search = (
    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="חיפוש לפי שם או טלפון" aria-label="חיפוש שיחה" className="rounded-full text-[16px]" />
  );
  const waitingLine = counts.waiting && filter !== 'guests' ? (
    <p className="flex items-center gap-1.5 text-[14px] font-semibold text-[#9A4A0B]"><Clock3 size={16} aria-hidden />{counts.waiting === 1 ? 'פנייה אחת מחכה לתשובה' : `${counts.waiting} פניות מחכות לתשובה`}</p>
  ) : null;
  const emptyFilter = (
    <div className="px-6 py-10 text-center">
      <p className="text-[16px] font-semibold text-navy-900">{query ? 'אין שיחה בשם הזה' : filter === 'leads' ? 'אין פניות פתוחות' : filter === 'guests' ? 'אין אורחים קרובים' : 'אין שיחות'}</p>
      <p className="mt-1 text-[14px] text-ink-600">{query ? 'נסו שם אחר.' : filter === 'leads' ? 'פנייה חדשה תופיע כאן ברגע שתגיע.' : 'אורחים שמגיעים בשבועיים הקרובים יופיעו כאן.'}</p>
    </div>
  );

  const threadView = current ? (
    <ThreadView
      key={current.key}
      thread={current}
      unitName={unitName(current.propertyId)}
      av={avOf(current)}
      actions={actions}
      suggestion={suggestionFor(current)}
      onBack={variant === 'a' && desktop ? null : () => openThread(null)}
      compact={variant === 'b'}
    />
  ) : null;

  return (
    <Page wide={variant === 'a'} className="pb-28 lg:pb-16">
      <PageHeader
        title="שיחות"
        help="leads.page"
        tour="leads-page"
        subtitle="כל מי שפונה אליכם, במקום אחד. עונים בוואטסאפ בלחיצה."
        actions={empty || loadFailed ? null : (
          <>
            <StaleIndicator queries={[leadsQ]} onRetry={() => leadsQ.refetch()} />
            <Button type="button" variant="outline" className="min-h-[44px] gap-1.5" onClick={() => setParam({ sources: '1' })}><Plug size={16} strokeWidth={2} aria-hidden />מקורות פניות</Button>
            <Button type="button" variant="outline" className="min-h-[44px] gap-1.5" onClick={newLead}><Plus size={16} strokeWidth={2.25} aria-hidden />רישום פנייה</Button>
          </>
        )}
      />

      {loadFailed ? <div className="v7-card p-4"><ErrorFallback title="לא הצלחנו לטעון את השיחות" onRetry={() => leadsQ.refetch()} /></div>
        : loading ? <div className="v7-card p-4"><SkelRows rows={5} /></div>
          : empty ? <EmptyInbox properties={properties} onNewLead={newLead} />
            : variant === 'a' ? (
              <div className="grid grid-cols-1 gap-3">
                <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[24px] border border-[#E8EAF2] bg-white lg:h-[calc(100dvh-240px)] lg:min-h-[560px] lg:flex-row">
                  <div className="flex min-h-0 w-full flex-col border-[#E8EAF2] lg:w-[400px] lg:shrink-0 lg:border-l">
                    <div className="space-y-3 border-b border-[#EEF0F5] p-4">
                      {chips}
                      {search}
                      {waitingLine}
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto" data-tour="leads-list">
                      {visible.length ? visible.map((t) => (
                        <ThreadRow key={t.key} thread={t} unitName={unitName(t.propertyId)} av={avOf(t)} active={desktop && t.key === openKey} onOpen={() => openThread(t)} now={nowMs} />
                      )) : emptyFilter}
                    </div>
                  </div>
                  {desktop ? (threadView || <div className="hidden flex-1 items-center justify-center bg-[#F7F8FB] text-[15px] text-ink-600 lg:flex">בחרו שיחה מהרשימה</div>) : null}
                </div>
                <SourcesLine properties={properties} onOpen={() => setParam({ sources: '1' })} />
                {(leadsQ.data || []).length ? <button type="button" onClick={exportCsv} className="press mx-auto inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-4 text-[14px] text-ink-600 hover:bg-white"><Download size={16} aria-hidden />ייצוא הפניות לאקסל</button> : null}
              </div>
            ) : (
              <div className="mx-auto grid max-w-[760px] grid-cols-1 gap-3">
                <SourcesLine properties={properties} onOpen={() => setParam({ sources: '1' })} />
                <div className="grid grid-cols-1 gap-3">{chips}{search}{waitingLine}</div>
                <div className="grid gap-3" data-tour="leads-list">
                  {visible.length ? visible.map((t) => (
                    <ThreadCard key={t.key} thread={t} unitName={unitName(t.propertyId)} av={avOf(t)} actions={actions} onOpen={() => openThread(t)} />
                  )) : <div className="rounded-[20px] border border-[#E8EAF2] bg-white">{emptyFilter}</div>}
                </div>
                {(leadsQ.data || []).length ? <button type="button" onClick={exportCsv} className="press mx-auto flex min-h-[44px] items-center gap-1.5 rounded-full px-4 text-[14px] text-ink-600 hover:bg-white"><Download size={16} aria-hidden />ייצוא הפניות לאקסל</button> : null}
              </div>
            )}

      {/* Phone (both variants) and desktop B: the conversation opens over the list */}
      <ThreadOverlay open={!!current && !(variant === 'a' && desktop)} side={variant === 'b' && desktop} onClose={() => openThread(null)} label={current ? `שיחה עם ${current.name}` : ''}>
        {threadView}
      </ThreadOverlay>

      <SourcesSheet
        open={sourcesOpen}
        onOpenChange={(o) => setParam({ sources: o ? '1' : '', source: o ? sourceFocus : '' })}
        properties={properties}
        focus={sourceFocus}
        hostName={hostName}
        onNewLead={newLead}
      />

      <AtlasSheet
        open={formOpen}
        onOpenChange={(o) => { const h = interceptRef.current; if (h) { h(o); return; } setFormOpen(o); }}
        title={editing ? 'עריכת פנייה' : 'רישום פנייה'}
        subtitle={editing ? null : 'שם וטלפון מספיקים כדי להתחיל.'}
      >
        <GuestForm
          key={editing?.id ?? 'new'}
          storageSuffix={editing?.id ?? 'new'}
          defaultValues={leadToFormValues(editing)}
          properties={properties.map((p) => ({ id: p.id, name: p.name }))}
          onSubmit={onSubmitLead}
          onCancel={() => setFormOpen(false)}
          setDialogOpen={setFormOpen}
          onRegisterDialogInterceptor={(fn) => { interceptRef.current = fn; }}
          onAfterSubmitSuccess={() => { window.setTimeout(() => setFormOpen(false), 900); }}
          submitLabel={editing ? 'שמירה' : 'שמירת פנייה'}
        />
      </AtlasSheet>
    </Page>
  );
}

