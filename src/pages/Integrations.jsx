/**
 * חיבורים (integrations hub, 05.11.2026): every connection an owner may want, each with one plain line of what it
 * does and an honest status (מחובר / חברו עכשיו / בקרוב / לפי בקשה). Claims: qa/integrations/CATALOG.md.
 * Calendar links per unit are still managed here (below the calendar tiles).
 *
 * Before:
 * ערוצים וחיבורים: only what really works is shown as working.
 *   יומנים (real, 013): per unit, import Airbnb / Booking.com / any iCal feed (server sync every 15 minutes + "עדכון עכשיו"),
 *            and an export feed to paste into each channel. Status, last sync, errors and conflicts come from the server.
 *   הודעות / תשלומים / הנהלת חשבונות: an honest status per provider (what works today, what is coming, what it needs).
 */
import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays, RefreshCw, Trash2, Copy, Check, Plus,
  AlertTriangle, ChevronDown, Info,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { PageHeader, SkelLine, Card, StatusPill } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { UnitPhoto } from '@/components/app/atoms';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { DB_FEATURES } from '@/config/dbFeatures';
import { callEdge, icalExportUrl, minutesAgoHe } from '@/lib/real/edge';
import { formatDayHe } from '@/lib/stay/format';
import { cn } from '@/lib/utils';
import ConnectFlow from '@/components/channels/ConnectWizard';
import ChannelLogo from '@/components/channels/ChannelLogo';
import { INTEGRATIONS, CATEGORIES, statusOf } from '@/components/integrations/catalog';
import { HubA, HubB } from '@/components/integrations/Hubs';
import { HUB_VARIANT } from '@/components/integrations/variant';
import { useIntegrations } from '@/components/integrations/useIntegrations';
import { CalendarConnect, CalendarExport, InfoSheet, InvoiceConnect, AutomationConnect } from '@/components/integrations/sheets';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const PROVIDERS = {
  AIRBNB: { name: 'Airbnb', short: 'A', tone: 'bg-[#FFE8EA] text-[#C2273B]', channel: 'airbnb' },
  BOOKING_COM: { name: 'Booking.com', short: 'B', tone: 'bg-[#E4ECFF] text-[#1D3FAE]', channel: 'booking' },
  ICAL: { name: 'יומן אחר (iCal)', short: 'i', tone: 'bg-[#EEF0F6] text-ink-600', channel: '' },
  GOOGLE: { name: 'Google Calendar', short: 'G', tone: 'bg-[#EEF0F6] text-ink-600', channel: 'google' },
  OUTLOOK: { name: 'Outlook', short: 'O', tone: 'bg-[#EEF0F6] text-ink-600', channel: 'outlook' },
};

/** More busy dates than one unit realistically has, from a link that is not Airbnb / Booking.com. */
export const SUSPICIOUS_FEED_EVENTS = 100;
export function isSuspiciousFeed(url, events) {
  const u = String(url || '');
  if (/airbnb\.|booking\.com/i.test(u)) return false;
  return Number(events) > SUSPICIOUS_FEED_EVENTS;
}

function CopyRow({ label, hint, value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1600); atlasToastApi.success('הקישור הועתק'); }
    catch { atlasToastApi.error('ההעתקה נחסמה בדפדפן. סמנו את הקישור והעתיקו ידנית'); }
  };
  return (
    <div className="flex flex-col gap-2 rounded-[16px] bg-[#F7F8FB] p-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-navy-900">{label}</p>
        {hint ? <p className="text-[12px] text-ink-400">{hint}</p> : null}
        <p className="mt-1 truncate text-[12px] text-ink-400" dir="ltr" style={{ textAlign: 'right' }}>{value}</p>
      </div>
      <Button type="button" variant="secondary" className="h-11 shrink-0 px-4" onClick={copy} aria-label={`העתקת ${label}`}>
        {copied ? <Check className="h-4 w-4" strokeWidth={2} /> : <Copy className="h-4 w-4" strokeWidth={1.75} />}
        {copied ? 'הועתק' : 'העתקה'}
      </Button>
    </div>
  );
}

function Help({ children, title }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-[16px] border border-[#ECEEF4]">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="press flex min-h-[48px] w-full items-center gap-2 px-3 text-right text-[14px] font-semibold text-navy-900">
        <Info className="h-4 w-4 shrink-0 text-brand-600" strokeWidth={1.75} />
        <span className="flex-1">{title}</span>
        <ChevronDown className={cn('h-4 w-4 text-ink-300 transition-transform duration-200', open && 'rotate-180')} strokeWidth={1.75} />
      </button>
      {open ? <div className="space-y-3 px-4 pb-4 text-[14px] leading-relaxed text-ink-600">{children}</div> : null}
    </div>
  );
}

function SyncRow({ sync, onSync, syncing, onToggle, onDelete }) {
  const p = PROVIDERS[sync.provider] || PROVIDERS.ICAL;
  const paused = sync.sync_status === 'PAUSED';
  const error = sync.sync_status === 'ERROR';
  const warning = sync.sync_status === 'WARNING';
  const conflicts = Array.isArray(sync.conflicts) ? sync.conflicts : [];
  const [confirm, setConfirm] = useState(false);
  return (
    <li className="min-w-0 rounded-[16px] border border-[#ECEEF4] p-3" data-sync-id={sync.id}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <ChannelLogo channel={PROVIDERS[sync.provider] && ['AIRBNB', 'BOOKING_COM'].includes(sync.provider) ? sync.provider : 'ICAL'} size={40} />
        <div className="min-w-[160px] flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] font-semibold text-navy-900">
            <span className="min-w-0 truncate">{sync.label || p.name}</span>
            <StatusPill tone={error ? 'red' : paused ? 'slate' : warning || conflicts.length ? 'amber' : 'mint'} label={error ? 'לא מתעדכן' : paused ? 'מושהה' : warning ? 'לבדיקה' : conflicts.length ? 'חפיפה' : 'פעיל'} />
          </p>
          <p className="mt-0.5 truncate text-[13px] text-ink-400">
            <span data-testid="sync-ago">{minutesAgoHe(sync.last_success_at || sync.last_sync_at)}</span>
            {sync.last_success_at ? <> · <span className="tabular">{sync.events_count || 0}</span> תאריכים תפוסים בערוץ</> : null}
          </p>
        </div>
        <div className="ms-auto flex shrink-0 items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="h-11 w-11" onClick={() => onSync(sync)} disabled={syncing} aria-label={`סנכרון ${p.name} עכשיו`}>
            <RefreshCw className={cn('h-4 w-4 text-ink-400', syncing && 'animate-spin')} strokeWidth={1.75} />
          </Button>
          <Switch checked={!paused} onCheckedChange={(v) => onToggle(sync, v)} aria-label={paused ? `הפעלת סנכרון ${p.name}` : `השהיית סנכרון ${p.name}`} />
          <Button type="button" variant="ghost" size="icon" className="h-11 w-11" onClick={() => setConfirm(true)} aria-label={`הסרת ${p.name}`}>
            <Trash2 className="h-4 w-4 text-ink-400" strokeWidth={1.75} />
          </Button>
        </div>
      </div>
      {sync.error_message && error ? (
        <p role="alert" className="mt-2 flex items-start gap-2 rounded-[12px] bg-[var(--st-red-bg,#FDECEC)] px-3 py-2 text-[13px] text-[var(--st-red-fg,#B42318)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />{sync.error_message}
        </p>
      ) : null}
      {sync.error_message && warning ? (
        <p role="alert" className="mt-2 flex items-start gap-2 whitespace-pre-line rounded-[12px] bg-[#FFF6E5] px-3 py-2 text-[13px] text-[#8A5A00]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />{sync.error_message}
        </p>
      ) : null}
      {conflicts.length ? (
        <div role="alert" className="mt-2 break-words rounded-[12px] bg-[#FFF6E5] px-3 py-2 text-[13px] text-[#8A5A00]">
          <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" strokeWidth={1.75} />{conflicts.length === 1 ? 'הזמנה כפולה אפשרית' : `${conflicts.length} הזמנות כפולות אפשריות`}</p>
          <ul className="mt-1 space-y-1">
            {conflicts.slice(0, 5).map((c) => (
              <li key={c.uid} data-testid="conflict">
                {p.name}: {formatDayHe(c.start, { weekday: false })} עד {formatDayHe(c.end, { weekday: false })} חופף ל{c.with_guest ? `הזמנה של ${c.with_guest}` : 'הזמנה קיימת'}{c.with_source ? ` (${c.with_source})` : ''}. atlas לא דרס את ההזמנה הקיימת; בדקו בערוץ ובטלו אחת מהן.
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {confirm ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-[12px] bg-[#F7F8FB] px-3 py-2">
          <p className="flex-1 text-[13px] text-ink-600">להפסיק לקבל הזמנות מ-{p.name}? הזמנות שכבר נכנסו יישארו בלוח.</p>
          <Button type="button" variant="outline" className="h-11" onClick={() => setConfirm(false)}>ביטול</Button>
          <Button type="button" className="h-11 bg-red-600 hover:bg-red-700" onClick={() => onDelete(sync)}>הסרה</Button>
        </div>
      ) : null}
    </li>
  );
}

function UnitChannels({ property, syncs, onSync, syncingId, onToggle, onDelete, onConnect }) {
  const last = syncs.map((s) => s.last_success_at).filter(Boolean).sort().pop();
  const has = (k) => syncs.some((s) => s.provider === k);
  return (
    <Card as="section" className="overflow-hidden" aria-label={`יומנים של ${property.name}`} data-unit-id={property.id}>
      <div className="flex items-center gap-3 px-5 pt-5 md:px-6">
        <UnitPhoto property={property} className="h-12 w-12" rounded="rounded-[16px]" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[18px] font-bold text-navy-900">{property.name}</h2>
          <p className="truncate text-[15px] text-ink-500">
            {syncs.length ? `${syncs.length} ${syncs.length === 1 ? 'ערוץ מחובר' : 'ערוצים מחוברים'} · ${minutesAgoHe(last)}` : 'עוד לא חובר ערוץ'}
          </p>
        </div>
      </div>
      <div className="space-y-3 p-5 md:px-6">
        {syncs.length ? (
          <ul className="space-y-2">
            {syncs.map((s) => <SyncRow key={s.id} sync={s} onSync={onSync} syncing={syncingId === s.id || syncingId === 'all'} onToggle={onToggle} onDelete={onDelete} />)}
          </ul>
        ) : (
          <div className="flex items-center gap-2" aria-hidden>
            {['AIRBNB', 'BOOKING_COM'].map((k) => <ChannelLogo key={k} channel={k} size={36} />)}
            <span className="text-[15px] text-ink-500">Airbnb, Booking ואתרים אחרים. בחינם.</span>
          </div>
        )}
        <button type="button" onClick={() => onConnect(property)} className="ch-btn is-primary ch-press ch-entry-btn" data-testid="connect-channel">
          <Plus strokeWidth={2.25} aria-hidden />{CONNECT_LABEL(syncs.length, has)}
        </button>
        {property.ical_export_token && syncs.length ? (
          <Help title="הקישורים של atlas להדבקה בערוצים">
            <CopyRow label="להדבקה ב-Airbnb" hint="כל ההזמנות חוץ מאלה שהגיעו מ-Airbnb" value={icalExportUrl(property, 'airbnb')} />
            <CopyRow label="להדבקה ב-Booking.com" hint="כל ההזמנות חוץ מאלה שהגיעו מ-Booking" value={icalExportUrl(property, 'booking')} />
            <CopyRow label="קישור כללי" hint="לכל אתר או יומן אחר" value={icalExportUrl(property)} />
          </Help>
        ) : null}
      </div>
    </Card>
  );
}

function CONNECT_LABEL(n, has) {
  if (!n) return 'חיבור Airbnb או Booking';
  if (has('AIRBNB') && !has('BOOKING_COM')) return 'חיבור Booking או ערוץ נוסף';
  if (has('BOOKING_COM') && !has('AIRBNB')) return 'חיבור Airbnb או ערוץ נוסף';
  return 'חיבור ערוץ נוסף';
}

export default function IntegrationsPage({ orgId: orgIdProp, user }) {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  // ?tab= deep links (the help bot links messaging / accounting too): aliases map to our four tabs.
  // Old deep links (?tab=messages …) land on the matching category; no tab = everything.
  const TAB_ALIAS = { messaging: 'messages', whatsapp: 'messages', accounting: 'invoices', pms: 'calendars', ical: 'calendars' };
  const rawTab = params.get('tab') || 'all';
  const tab = ['all', ...CATEGORIES.map((c) => c.id)].includes(TAB_ALIAS[rawTab] || rawTab) ? (TAB_ALIAS[rawTab] || rawTab) : 'all';
  const setTab = (t) => setParams((p) => { const n = new URLSearchParams(p); if (t === 'all') n.delete('tab'); else n.set('tab', t); return n; }, { replace: true });
  const [q, setQ] = useState('');
  const [openItem, setOpenItem] = useState(null);
  const integ = useIntegrations();
  const navigate = useNavigate();
  const orgId = orgIdProp ?? user?.organization_id ?? user?.org_id ?? null;
  const [syncingId, setSyncingId] = useState(null);
  const [connectFor, setConnectFor] = useState(null);
  const connectParam = params.get('connect');

  const propsQ = useQuery({
    queryKey: ['properties', orgId],
    queryFn: () => base44.entities.Property.filter(orgId ? { org_id: orgId } : {}, 'created_at', 200),
    enabled: !!orgId,
  });
  const syncsQ = useQuery({
    queryKey: ['calendar-syncs', orgId],
    queryFn: () => base44.entities.CalendarSync.filter(orgId ? { org_id: orgId } : {}, 'created_at', 500),
    enabled: !!orgId,
    refetchInterval: 60_000,
  });
  const properties = propsQ.data || [];
  const syncs = syncsQ.data || [];
  const focusUnit = params.get('unit');
  const ordered = useMemo(() => (focusUnit ? [...properties].sort((a, b) => (a.id === focusUnit ? -1 : b.id === focusUnit ? 1 : 0)) : properties), [properties, focusUnit]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['calendar-syncs'] });
    qc.invalidateQueries({ queryKey: ['bookings'] });
    qc.invalidateQueries({ queryKey: ['stay'] });
  };

  const report = (r, url = '') => {
    if (!r) return;
    if (!r.ok) { atlasToastApi.error('לא הצלחנו לעדכן את הלוח. הפרטים מופיעים ליד הערוץ'); return; }
    if (r.skipped === 'rate_limited') { atlasToastApi.success('הלוח התעדכן לפני רגע. אפשר לסנכרן שוב בעוד דקה.'); return; }
    if (r.warning) { atlasToastApi.error('היומן של הערוץ חזר ריק או חלקי, ולא ביטלנו הזמנות.', 'הפרטים מופיעים ליד הערוץ.'); return; }
    // A link that is not Airbnb / Booking.com with this many busy dates is probably not one unit's export
    // (a holidays or a whole-hotel calendar): say so instead of a plain "synced".
    if (isSuspiciousFeed(url, r.events)) {
      atlasToastApi.error(
        `בקישור הזה יש ${r.events} תאריכים תפוסים, הרבה יותר ממה שיש בדרך כלל ביחידה אחת.`,
        'אם זה לא קישור הייצוא של היחידה מהערוץ, הסירו אותו מהרשימה כדי שהיומן לא ייחסם בטעות.',
      );
      return;
    }
    const parts = [`נמצאו ${r.events} תאריכים תפוסים`];
    if (r.created) parts.push(`${r.created} נוספו ליומן`);
    if (r.cancelled) parts.push(`${r.cancelled} בוטלו בערוץ`);
    if (r.conflicts) { atlasToastApi.error(`${parts.join(', ')}. ${r.conflicts} התנגשויות: בדקו את היחידה`); return; }
    atlasToastApi.success(`${parts.join(', ')}.`);
  };

  const runSync = async (sync) => {
    setSyncingId(sync ? sync.id : 'all');
    try {
      const res = await callEdge('ical-sync', sync ? { sync_id: sync.id } : {});
      if (sync) report(res?.results?.[0], sync.ical_url);
      else {
        const rs = res?.results || [];
        const bad = rs.filter((r) => !r.ok).length;
        const conf = rs.reduce((s, r) => s + (r.conflicts || 0), 0);
        if (!rs.length) atlasToastApi.success('אין עדיין ערוצים מחוברים');
        else if (bad || conf) atlasToastApi.error(`עודכנו ${rs.length - bad} מתוך ${rs.length} ערוצים${conf ? `, ${conf} חפיפות` : ''}`);
        else atlasToastApi.success(`כל ${rs.length} הערוצים עודכנו`);
      }
    } catch (e) {
      atlasToastApi.error(e.message || 'לא הצלחנו לעדכן את הלוח. נסו שוב.');
    } finally {
      setSyncingId(null);
      refresh();
    }
  };

  const toggle = useMutation({
    mutationFn: ({ sync, on }) => base44.entities.CalendarSync.update(sync.id, { sync_status: on ? 'ACTIVE' : 'PAUSED' }),
    onSuccess: (_, { on }) => { refresh(); atlasToastApi.success(on ? 'הסנכרון הופעל' : 'הסנכרון הושהה'); },
    onError: () => atlasToastApi.error('לא הצלחנו לעדכן את הסנכרון'),
  });
  const remove = useMutation({
    mutationFn: (sync) => base44.entities.CalendarSync.delete(sync.id),
    onSuccess: () => { refresh(); atlasToastApi.success('הערוץ הוסר. ההזמנות שכבר נכנסו נשארו בלוח'); },
    onError: () => atlasToastApi.error('לא הצלחנו להסיר את הערוץ'),
  });

  const loading = propsQ.isLoading || syncsQ.isLoading;
  const imports = syncs.filter((s) => String(s.sync_direction || '').toUpperCase() !== 'EXPORT');
  const has = (fn) => imports.some(fn);
  const lbl = (s) => String(s.label || '').toLowerCase();
  const CONNECTED = {
    airbnb: has((s) => s.provider === 'AIRBNB'),
    booking: has((s) => s.provider === 'BOOKING_COM'),
    vrbo: has((s) => lbl(s) === 'vrbo'),
    expedia: has((s) => lbl(s) === 'expedia'),
    'gcal-in': has((s) => s.provider === 'GOOGLE'),
    'ical-any': has((s) => (s.provider === 'ICAL' || s.provider === 'OUTLOOK') && !['vrbo', 'expedia'].includes(lbl(s))),
    morning: !!integ.has('MORNING'),
    icount: !!integ.has('ICOUNT'),
    zapier: !!integ.has('WEBHOOK') && /zapier/i.test(integ.has('WEBHOOK')?.hint || ''),
    make: !!integ.has('WEBHOOK') && /make\.com|integromat/i.test(integ.has('WEBHOOK')?.hint || ''),
    n8n: !!integ.has('WEBHOOK') && !/zapier|make\.com|integromat/i.test(integ.has('WEBHOOK')?.hint || ''),
  };
  const items = INTEGRATIONS.map((it) => ({ ...it, s: statusOf(it, { connected: !!CONNECTED[it.id] }) }));
  const counts = items.reduce((m, it) => { if (it.s === 'connected') { m[it.cat] = (m[it.cat] || 0) + 1; m.all = (m.all || 0) + 1; } return m; }, {});
  const Hub = HUB_VARIANT === 'B' ? HubB : HubA;
  const openFor = (it) => {
    if (it.flow === 'link') { navigate(createPageUrl(it.to.replace('/', ''))); return; }
    setOpenItem(it);
  };
  const askOther = () => setOpenItem({ id: 'other-request', name: 'חיבור אחר', cat: 'more', mono: '?', flow: 'request', status: 'request', gain: 'ספרו לנו מה אתם רוצים לחבר, ונבדוק אם אפשר.', why: '' });
  const closeSheet = () => setOpenItem(null);

  const calendarsManager = loading ? (
    <div className="space-y-3" role="status" aria-busy="true" aria-label="טוען"><SkelLine className="h-40 rounded-[24px]" /></div>
  ) : properties.length && imports.length ? (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[18px] font-bold text-navy-900">היומנים שלכם לפי יחידה</h3>
        {DB_FEATURES.realCore ? (
          <Button variant="outline" className="h-11" onClick={() => runSync(null)} disabled={!!syncingId}>
            <RefreshCw className={cn('h-4 w-4', syncingId === 'all' && 'animate-spin')} strokeWidth={1.75} />
            עדכון עכשיו
          </Button>
        ) : null}
      </div>
      {ordered.map((p) => (
        <UnitChannels
          key={p.id}
          property={p}
          syncs={imports.filter((s) => s.property_id === p.id)}
          onSync={runSync}
          syncingId={syncingId}
          onToggle={(sync, on) => toggle.mutate({ sync, on })}
          onDelete={(sync) => remove.mutate(sync)}
          onConnect={(prop) => setConnectFor(prop.id)}
        />
      ))}
    </div>
  ) : null;

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6 px-5 pb-16 pt-6 md:px-10 md:pt-10" dir="rtl">
      <PageHeader
        title="ערוצים וחיבורים"
        help="integrations.page"
        subtitle="מחברים את מה שאתם כבר עובדים איתו, והכול מסתדר במקום אחד."
        className="!mb-0"
      />

      <Hub items={items} q={q} setQ={setQ} cat={tab} setCat={setTab} onOpen={openFor} onAsk={askOther} counts={counts}>
        {calendarsManager}
      </Hub>

      {openItem && openItem.flow === 'ical' ? (
        <CalendarConnect item={openItem} units={properties} orgId={orgId} syncs={syncs} onClose={closeSheet} onDone={refresh} />
      ) : null}
      {openItem && openItem.flow === 'ical-export' ? <CalendarExport item={openItem} units={properties} onClose={closeSheet} /> : null}
      {openItem && openItem.flow === 'apikey' ? <InvoiceConnect item={openItem} integ={integ} orgId={orgId} onClose={closeSheet} /> : null}
      {openItem && openItem.flow === 'webhook' ? <AutomationConnect item={openItem} integ={integ} onClose={closeSheet} /> : null}
      {openItem && (openItem.flow === 'request' || openItem.flow === 'builtin') ? <InfoSheet item={openItem} user={user} onClose={closeSheet} /> : null}

      {(() => {
        const id = connectFor || connectParam;
        const prop = id ? properties.find((p) => p.id === id) : null;
        if (!prop) return null;
        const close = () => { setConnectFor(null); if (connectParam) setParams((p) => { const n = new URLSearchParams(p); n.delete('connect'); n.delete('channel'); return n; }, { replace: true }); };
        return (
          <ConnectFlow
            property={prop} orgId={orgId} existing={syncs}
            initialChannel={['AIRBNB', 'BOOKING_COM', 'ICAL'].includes(params.get('channel')) ? params.get('channel') : ''}
            onClose={close} onDone={refresh}
          />
        );
      })()}
      {!DB_FEATURES.realCore ? <p className="text-[14px] text-ink-500">חשבון דוגמה: אפשר לעבור על כל חיבור, אבל שום דבר לא נשלח החוצה.</p> : null}
      <p className="flex items-center gap-2 text-[14px] text-ink-500"><CalendarDays className="h-4 w-4" strokeWidth={1.75} aria-hidden />חיבור שמסומן "בקרוב" או "לפי בקשה" עוד לא שולח ולא גובה כלום.</p>
    </div>
  );
}
