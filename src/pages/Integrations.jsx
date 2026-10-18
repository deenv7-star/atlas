/**
 * ערוצים וחיבורים: only what really works is shown as working.
 *   יומנים (real, 013): per unit, import Airbnb / Booking.com / any iCal feed (server sync every 15 minutes + "סנכרן עכשיו"),
 *            and an export feed to paste into each channel. Status, last sync, errors and conflicts come from the server.
 *   הודעות / תשלומים / חשבוניות: an honest status per provider (what works today, what is coming, what it needs).
 */
import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays, RefreshCw, Trash2, Copy, Check, Plus,
  AlertTriangle, ChevronDown, ArrowDownToLine, ArrowUpFromLine, Info,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { PageHeader, SegmentedControl, SkelLine, Card, StatusPill } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { UnitPhoto } from '@/components/app/atoms';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { DB_FEATURES } from '@/config/dbFeatures';
import { callEdge, icalExportUrl, minutesAgoHe } from '@/lib/real/edge';
import { formatDayHe } from '@/lib/stay/format';
import { cn } from '@/lib/utils';

const PROVIDERS = {
  AIRBNB: { name: 'Airbnb', short: 'A', tone: 'bg-[#FFE8EA] text-[#C2273B]', channel: 'airbnb' },
  BOOKING_COM: { name: 'Booking.com', short: 'B', tone: 'bg-[#E4ECFF] text-[#1D3FAE]', channel: 'booking' },
  ICAL: { name: 'יומן אחר (iCal)', short: 'i', tone: 'bg-[#EEF0F6] text-ink-600', channel: '' },
  GOOGLE: { name: 'Google Calendar', short: 'G', tone: 'bg-[#EEF0F6] text-ink-600', channel: 'google' },
  OUTLOOK: { name: 'Outlook', short: 'O', tone: 'bg-[#EEF0F6] text-ink-600', channel: 'outlook' },
};

function guessProvider(url) {
  if (/airbnb\./i.test(url)) return 'AIRBNB';
  if (/booking\.com/i.test(url)) return 'BOOKING_COM';
  if (/google\.com/i.test(url)) return 'GOOGLE';
  if (/outlook|office365|live\.com/i.test(url)) return 'OUTLOOK';
  return 'ICAL';
}

function validUrl(raw) {
  const v = String(raw || '').trim().replace(/^webcal:\/\//i, 'https://');
  try {
    const u = new URL(v);
    return /^https?:$/.test(u.protocol) ? v : '';
  } catch { return ''; }
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
  const conflicts = Array.isArray(sync.conflicts) ? sync.conflicts : [];
  const [confirm, setConfirm] = useState(false);
  return (
    <li className="rounded-[18px] border border-[#ECEEF4] p-3" data-sync-id={sync.id}>
      <div className="flex items-center gap-3">
        <span aria-hidden className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[15px] font-bold', p.tone)}>{p.short}</span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 truncate text-[15px] font-semibold text-navy-900">
            {sync.label || p.name}
            <StatusPill tone={error ? 'red' : paused ? 'slate' : conflicts.length ? 'amber' : 'mint'} label={error ? 'שגיאה' : paused ? 'מושהה' : conflicts.length ? 'התנגשות' : 'פעיל'} />
          </p>
          <p className="mt-0.5 truncate text-[13px] text-ink-400">
            <span data-testid="sync-ago">{minutesAgoHe(sync.last_success_at || sync.last_sync_at)}</span>
            {sync.last_success_at ? <> · <span className="tabular">{sync.events_count || 0}</span> תאריכים תפוסים בערוץ</> : null}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
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
      {conflicts.length ? (
        <div role="alert" className="mt-2 rounded-[12px] bg-[#FFF6E5] px-3 py-2 text-[13px] text-[#8A5A00]">
          <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" strokeWidth={1.75} />{conflicts.length === 1 ? 'הזמנה כפולה אפשרית' : `${conflicts.length} הזמנות כפולות אפשריות`}</p>
          <ul className="mt-1 space-y-1">
            {conflicts.slice(0, 5).map((c) => (
              <li key={c.uid} data-testid="conflict">
                {p.name}: {formatDayHe(c.start, { weekday: false })} עד {formatDayHe(c.end, { weekday: false })} חופף ל{c.with_guest ? `הזמנה של ${c.with_guest}` : 'הזמנה קיימת'}{c.with_source ? ` (${c.with_source})` : ''}. ATLAS לא דרס את ההזמנה הקיימת; בדקו בערוץ ובטלו אחת מהן.
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {confirm ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-[12px] bg-[#F7F8FB] px-3 py-2">
          <p className="flex-1 text-[13px] text-ink-600">להפסיק לסנכרן את {p.name}? הזמנות שכבר נוספו יישארו ביומן.</p>
          <Button type="button" variant="outline" className="h-11" onClick={() => setConfirm(false)}>ביטול</Button>
          <Button type="button" className="h-11 bg-red-600 hover:bg-red-700" onClick={() => onDelete(sync)}>הסרה</Button>
        </div>
      ) : null}
    </li>
  );
}

function AddFeed({ property, onAdd, busy }) {
  const [url, setUrl] = useState('');
  const [provider, setProvider] = useState('');
  const [err, setErr] = useState('');
  const effective = provider || (url ? guessProvider(url) : 'AIRBNB');
  const submit = (e) => {
    e.preventDefault();
    const v = validUrl(url);
    if (!v) { setErr('הדביקו קישור מלא שמתחיל ב-https (קישור הייצוא מהערוץ, בדרך כלל נגמר ב-.ics)'); return; }
    setErr('');
    onAdd({ property, url: v, provider: effective }).then((ok) => { if (ok) { setUrl(''); setProvider(''); } });
  };
  return (
    <form onSubmit={submit} className="space-y-2" aria-label={`חיבור יומן ל${property.name}`}>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="מאיזה ערוץ">
        {['AIRBNB', 'BOOKING_COM', 'ICAL'].map((k) => (
          <button
            key={k} type="button" role="radio" aria-checked={effective === k} onClick={() => setProvider(k)}
            className={cn('press inline-flex h-11 items-center rounded-full px-4 text-[14px] font-semibold', effective === k ? 'bg-navy-900 text-white' : 'bg-white text-ink-600 ring-1 ring-inset ring-[#E3E6EF]')}
          >{PROVIDERS[k].name}</button>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={url} onChange={(e) => { setUrl(e.target.value); setErr(''); }} dir="ltr" inputMode="url" autoComplete="off"
          placeholder="https://www.airbnb.com/calendar/ical/....ics" aria-label={`קישור ייצוא מ-${PROVIDERS[effective].name}`}
          aria-invalid={!!err} className="h-12 flex-1 text-left"
        />
        <Button type="submit" className="h-12 shrink-0 px-5" disabled={busy || !url.trim()}>
          {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" strokeWidth={2} />}
          {busy ? 'מחבר ומסנכרן…' : 'חיבור וסנכרון'}
        </Button>
      </div>
      {err ? <p role="alert" className="text-[13px] text-[var(--st-red-fg,#B42318)]">{err}</p> : null}
    </form>
  );
}

function UnitChannels({ property, syncs, onSync, syncingId, onToggle, onDelete, onAdd, adding }) {
  const last = syncs.map((s) => s.last_success_at).filter(Boolean).sort().pop();
  return (
    <Card as="section" className="overflow-hidden" aria-label={`יומנים של ${property.name}`} data-unit-id={property.id}>
      <div className="flex items-center gap-3 px-5 pt-5 md:px-6">
        <UnitPhoto property={property} className="h-12 w-12" rounded="rounded-[14px]" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[17px] font-bold text-navy-900">{property.name}</h2>
          <p className="truncate text-[13px] text-ink-400">
            {syncs.length ? `${syncs.length} ${syncs.length === 1 ? 'ערוץ מחובר' : 'ערוצים מחוברים'} · ${minutesAgoHe(last)}` : 'עוד לא חובר ערוץ'}
          </p>
        </div>
      </div>
      <div className="grid gap-5 p-5 md:grid-cols-2 md:px-6">
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-[14px] font-bold text-navy-900"><ArrowDownToLine className="h-4 w-4 text-brand-600" strokeWidth={1.75} />ייבוא: הזמנות מהערוצים אל ATLAS</h3>
          {syncs.length ? (
            <ul className="space-y-2">
              {syncs.map((s) => <SyncRow key={s.id} sync={s} onSync={onSync} syncing={syncingId === s.id || syncingId === 'all'} onToggle={onToggle} onDelete={onDelete} />)}
            </ul>
          ) : null}
          <AddFeed property={property} onAdd={onAdd} busy={adding === property.id} />
        </div>
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-[14px] font-bold text-navy-900"><ArrowUpFromLine className="h-4 w-4 text-brand-600" strokeWidth={1.75} />ייצוא: הזמנות מ-ATLAS אל הערוצים</h3>
          {property.ical_export_token ? (
            <>
              <CopyRow label="להדבקה ב-Airbnb" hint="כל ההזמנות חוץ מאלה שהגיעו מ-Airbnb" value={icalExportUrl(property, 'airbnb')} />
              <CopyRow label="להדבקה ב-Booking.com" hint="כל ההזמנות חוץ מאלה שהגיעו מ-Booking" value={icalExportUrl(property, 'booking')} />
              <CopyRow label="קישור כללי" hint="ל-Google Calendar או לכל ערוץ אחר" value={icalExportUrl(property)} />
            </>
          ) : <p className="text-[14px] text-ink-400">קישור הייצוא נוצר בשמירה הבאה של היחידה.</p>}
        </div>
      </div>
      <div className="space-y-2 px-5 pb-5 md:px-6">
        <Help title="איך מחברים את Airbnb">
          <p><b>1. מ-Airbnb ל-ATLAS:</b> ב-Airbnb נכנסים ללוח השנה ← בוחרים את המודעה ← זמינות ← <i>חיבור לוחות שנה</i> ← <i>ייצוא לוח שנה</i>. מעתיקים את הקישור ומדביקים אותו למעלה ב"ייבוא".</p>
          <p><b>2. מ-ATLAS ל-Airbnb:</b> באותו מסך בוחרים <i>ייבוא לוח שנה</i>, מדביקים את "להדבקה ב-Airbnb", ונותנים שם ATLAS.</p>
        </Help>
        <Help title="איך מחברים את Booking.com">
          <p><b>1. מ-Booking ל-ATLAS:</b> ב-Extranet נכנסים ל<i>תעריפים וזמינות</i> ← <i>סנכרון לוחות שנה</i> ← בוחרים את סוג החדר ← <i>ייצוא לוח שנה</i>. מעתיקים ומדביקים למעלה.</p>
          <p><b>2. מ-ATLAS ל-Booking:</b> באותו מסך <i>הוספת חיבור לוח שנה</i> ← מדביקים את "להדבקה ב-Booking.com".</p>
        </Help>
        <Help title="מה חשוב לדעת">
          <p>ATLAS בודקת את הערוצים כל 15 דקות, ואפשר ללחוץ על סנכרון בכל רגע. הערוצים עצמם מושכים את היומן של ATLAS בקצב שלהם: Booking בערך כל שעתיים, Airbnb בערך כל 3 שעות. בחלון הזה עדיין אפשרית הזמנה כפולה, ולכן כשיש חפיפה ATLAS לא דורסת הזמנה קיימת ומסמנת התנגשות.</p>
          <p>יומן iCal מעביר רק תאריכים תפוסים, בלי שם, טלפון או מחיר. כדי לקבל את הטלפון של האורח שלחו לו את קישור הצ'ק-אין מתוך ההזמנה.</p>
        </Help>
      </div>
    </Card>
  );
}

function ProviderStatus({ items }) {
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.name}>
          <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start md:px-6">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-[16px] font-bold text-navy-900">
                {it.name}
                <StatusPill tone={it.live ? 'mint' : 'slate'} label={it.live ? 'פעיל' : 'בקרוב'} />
              </p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-600">{it.text}</p>
              {it.needs ? <p className="mt-1.5 text-[13px] text-ink-400">דורש חיבור: {it.needs}</p> : null}
            </div>
            {it.action ? <div className="shrink-0">{it.action}</div> : null}
          </Card>
        </li>
      ))}
    </ul>
  );
}

export default function IntegrationsPage({ orgId: orgIdProp, user }) {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'calendars';
  const setTab = (t) => setParams((p) => { const n = new URLSearchParams(p); n.set('tab', t); return n; }, { replace: true });
  const orgId = orgIdProp ?? user?.organization_id ?? user?.org_id ?? null;
  const [syncingId, setSyncingId] = useState(null);
  const [adding, setAdding] = useState(null);

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

  const report = (r) => {
    if (!r) return;
    if (!r.ok) { atlasToastApi.error('הסנכרון נכשל. הפרטים מופיעים ליד הערוץ'); return; }
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
      if (sync) report(res?.results?.[0]);
      else {
        const rs = res?.results || [];
        const bad = rs.filter((r) => !r.ok).length;
        const conf = rs.reduce((s, r) => s + (r.conflicts || 0), 0);
        if (!rs.length) atlasToastApi.success('אין עדיין ערוצים מחוברים');
        else if (bad || conf) atlasToastApi.error(`סונכרנו ${rs.length - bad} מתוך ${rs.length} ערוצים${conf ? `, ${conf} התנגשויות` : ''}`);
        else atlasToastApi.success(`כל ${rs.length} הערוצים סונכרנו`);
      }
    } catch (e) {
      atlasToastApi.error(e.message || 'הסנכרון נכשל');
    } finally {
      setSyncingId(null);
      refresh();
    }
  };

  const add = async ({ property, url, provider }) => {
    setAdding(property.id);
    try {
      const created = await base44.entities.CalendarSync.create({
        org_id: orgId, property_id: property.id, provider, ical_url: url, sync_direction: 'IMPORT', sync_status: 'ACTIVE', is_active: true,
      });
      qc.invalidateQueries({ queryKey: ['calendar-syncs'] });
      const res = await callEdge('ical-sync', { sync_id: created.id });
      report(res?.results?.[0]);
      return true;
    } catch (e) {
      atlasToastApi.error(e.message || 'לא הצלחנו לחבר את היומן');
      return false;
    } finally {
      setAdding(null);
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
    onSuccess: () => { refresh(); atlasToastApi.success('הערוץ הוסר. ההזמנות שכבר נוספו נשארו ביומן'); },
    onError: () => atlasToastApi.error('לא הצלחנו להסיר את הערוץ'),
  });

  const loading = propsQ.isLoading || syncsQ.isLoading;

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6 px-5 pb-16 pt-6 md:px-10 md:pt-10" dir="rtl">
      <PageHeader
        title="ערוצים וחיבורים"
        subtitle="סנכרון יומנים עם Airbnb ו-Booking.com, והמצב האמיתי של כל חיבור."
        className="!mb-0"
        actions={tab === 'calendars' && DB_FEATURES.realCore && syncs.length ? (
          <Button variant="outline" className="h-11" onClick={() => runSync(null)} disabled={!!syncingId}>
            <RefreshCw className={cn('h-4 w-4', syncingId === 'all' && 'animate-spin')} strokeWidth={1.75} />
            סנכרן עכשיו
          </Button>
        ) : null}
      />
      <SegmentedControl
        ariaLabel="סוג חיבור"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'calendars', label: 'יומנים' },
          { value: 'messages', label: 'הודעות' },
          { value: 'payments', label: 'תשלומים' },
          { value: 'invoices', label: 'חשבוניות' },
        ]}
      />

      {tab === 'calendars' ? (
        !DB_FEATURES.realCore ? (
          <Card className="p-6"><p className="text-[15px] text-ink-600">סנכרון יומנים רץ בשרת של ATLAS, ולכן הוא זמין בחשבון מחובר ולא במצב ההדגמה.</p></Card>
        ) : loading ? (
          <div className="space-y-3" role="status" aria-busy="true" aria-label="טוען"><SkelLine className="h-64 rounded-[24px]" /><SkelLine className="h-64 rounded-[24px]" /></div>
        ) : properties.length === 0 ? (
          <Card className="p-6 text-center"><p className="text-[16px] font-semibold text-navy-900">עוד אין יחידות</p><p className="mt-1 text-[14px] text-ink-400">הוסיפו יחידה ואז חברו לה את Airbnb או Booking.com.</p></Card>
        ) : (
          <div className="space-y-4">
            {ordered.map((p) => (
              <UnitChannels
                key={p.id}
                property={p}
                syncs={syncs.filter((s) => s.property_id === p.id && String(s.sync_direction || '').toUpperCase() !== 'EXPORT')}
                onSync={runSync}
                syncingId={syncingId}
                onToggle={(sync, on) => toggle.mutate({ sync, on })}
                onDelete={(sync) => remove.mutate(sync)}
                onAdd={add}
                adding={adding}
              />
            ))}
          </div>
        )
      ) : null}

      {tab === 'messages' ? (
        <ProviderStatus items={[
          { name: 'WhatsApp בלחיצה אחת', live: true, text: 'ATLAS מכינה את ההודעות לפי מסע האורח (אישור, יום לפני, יום ההגעה, בקשת ביקורת) ושומרת על שקט בשבת ובחג. בלוח "היום" כל הודעה מוכנה נפתחת בוואטסאפ עם הטקסט, ושולחים בלחיצה.' },
          { name: 'WhatsApp אוטומטי (Meta Cloud API)', live: false, text: 'שליחה בלי לגעת: ההודעות יוצאות לבד מהמספר העסקי של המתחם, עם תבניות מאושרות.', needs: 'חשבון WhatsApp Business מאומת אצל Meta ומספר ייעודי.' },
          { name: 'SMS', live: false, text: 'גיבוי לאורחים בלי וואטסאפ.', needs: 'ספק SMS ישראלי (חבילת הודעות).' },
          { name: 'אימייל יוצא', live: false, text: 'עד שיחובר שירות דיוור, "שליחה במייל" פותחת את תוכנת המייל שלכם עם הטקסט מוכן.', needs: 'שירות שליחת מיילים.' },
        ]} />
      ) : null}

      {tab === 'payments' ? (
        <ProviderStatus items={[
          { name: 'תיעוד תשלומים ויתרות', live: true, text: 'רושמים מקדמה ויתרה לכל הזמנה, רואים מה פתוח במסך "יתרות", ושולחים תזכורת בוואטסאפ.' },
          { name: 'קישור תשלום למקדמה (Grow / PayPlus)', live: false, text: 'האורח משלם בקישור, וההזמנה מתעדכנת ל"שולם" לבד.', needs: 'מסוף סליקה על שם העסק.' },
        ]} />
      ) : null}

      {tab === 'invoices' ? (
        <ProviderStatus items={[
          { name: 'חשבונית ירוקה (Morning) / iCount', live: false, text: 'חשבונית מס/קבלה חוקית לכל תשלום, נשלחת לאורח לבד. מסמך חוקי מופק רק בתוכנה רשומה ברשות המסים, ולכן עד החיבור ATLAS רק מתעדת מספרי מסמכים שהופקו אצלכם.', needs: 'חשבון Morning או iCount עם גישת API.' },
        ]} />
      ) : null}

      <p className="flex items-center gap-2 text-[13px] text-ink-400"><CalendarDays className="h-4 w-4" strokeWidth={1.75} aria-hidden />חיבור שמסומן "בקרוב" לא שולח ולא גובה כלום עדיין.</p>
    </div>
  );
}

