/**
 * "חברו מקורות פניות": how inquiries reach the inbox. Every card: what it is (one line), what to do (one button).
 * Reads the catalog from src/lib/leads/sources.js (the integrations hub links here with ?sources=1&source=<id>).
 */
import React, { useEffect, useState } from 'react';
import { Link2, Globe, Zap, Phone, Mail, MessageCircle, Instagram, ExternalLink, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AtlasSheet } from '@/components/ui/sheet/AtlasSheet';
import { useStayMutations } from '@/hooks/useStayData';
import { bookingPageUrl, makeSlug } from '@/lib/stay/guestInfo';
import { readOrgSettings, writeOrgSettings, activeOrgId } from '@/lib/onboarding/orgSettings';
import { isSupabaseConfigured } from '@/api/supabaseClient';
import { atlasToastApi } from '@/components/ui/AtlasToast';
import {
  LEAD_SOURCES, SOURCE_STATUS_LABEL, taggedLink, siteButtonSnippet, whatsappAutoReply, webhookUrl,
} from '@/lib/leads/sources';
import { CopyButton } from './parts';

const ICONS = { link: Link2, 'whatsapp-reply': MessageCircle, 'site-button': Globe, webhook: Zap, phone: Phone, whatsapp: MessageCircle, instagram: Instagram, messenger: MessageCircle, email: Mail };
const TAGS = [
  { src: 'instagram', label: 'לאינסטגרם' },
  { src: 'facebook', label: 'לפייסבוק' },
  { src: 'google', label: 'לגוגל' },
  { src: 'directory', label: 'לאתר צימרים' },
];

export const linkReady = (p) => !!p?.public_slug && p.booking_page_enabled !== false;

/** Turns the inquiry link on for every unit that doesn't have it yet. Returns the units' new state. */
export function useEnableLinks(properties) {
  const { updateProperty } = useStayMutations();
  const [busy, setBusy] = useState(false);
  const enable = async () => {
    setBusy(true);
    try {
      for (const p of properties.filter((x) => !linkReady(x))) {
        await updateProperty.mutateAsync({ id: p.id, data: { public_slug: p.public_slug || makeSlug(p.name), booking_page_enabled: true } });
      }
      atlasToastApi.success('הקישור מוכן. העתיקו אותו והדביקו איפה שאורחים מוצאים אתכם.');
    } catch (e) {
      atlasToastApi.error(/column|schema/i.test(e?.message || '') ? 'כדי להפעיל צריך עדכון קטן מצדנו. כתבו לנו ונסדר.' : 'לא הצלחנו להפעיל. נסו שוב.');
    } finally {
      setBusy(false);
    }
  };
  return { enable, busy };
}

/** Is lead-intake deployed? GET without a token answers {ok:true,service:'lead-intake'}. */
function useWebhookLive() {
  const [live, setLive] = useState(null);
  useEffect(() => {
    if (!isSupabaseConfigured) { setLive(false); return undefined; }
    let alive = true;
    const base = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
    fetch(`${base}/functions/v1/lead-intake`, { method: 'GET' })
      .then((r) => (r.ok ? r.json() : null)).then((j) => { if (alive) setLive(j?.service === 'lead-intake'); })
      .catch(() => { if (alive) setLive(false); });
    return () => { alive = false; };
  }, []);
  return live;
}

function StatusPill({ status }) {
  const live = status === 'live';
  return (
    <span className={cn('inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-[12px] font-semibold', live ? 'bg-[#E3F6EC] text-[#146B3C]' : 'bg-[#EEF0F5] text-[#4A5578]')}>
      {live ? <Check size={12} strokeWidth={2.5} aria-hidden /> : null}{SOURCE_STATUS_LABEL[status]}
    </span>
  );
}

function Card({ id, icon: Icon, title, line, status, children, highlight }) {
  return (
    <section id={`src-${id}`} className={cn('rounded-[20px] border bg-white p-4', highlight ? 'border-brand-600 ring-2 ring-[#ECEAFE]' : 'border-[#E8EAF2]')}>
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ECEAFE] text-brand-600" aria-hidden><Icon size={20} strokeWidth={1.9} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[16px] font-bold text-navy-900">{title}</h3>
            {status ? <StatusPill status={status} /> : null}
          </div>
          <p className="mt-0.5 text-[14px] leading-snug text-ink-600">{line}</p>
        </div>
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}

function LinkBox({ url }) {
  return <p className="truncate rounded-[12px] bg-[#F7F8FB] px-3 py-2.5 text-[14px] text-navy-900" dir="ltr" style={{ textAlign: 'left' }}>{url.replace(/^https?:\/\//, '')}</p>;
}

/** The first, most important source. Used inside the sheet AND as step 1 of the empty inbox. */
export function InquiryLinkCard({ properties, highlight }) {
  const ready = properties.filter(linkReady);
  const { enable, busy } = useEnableLinks(properties);
  const src = LEAD_SOURCES.find((s) => s.id === 'link');
  if (!properties.length) {
    return <Card id="link" icon={Link2} title={src.title} line="קודם מוסיפים יחידה בהגדרות, ואז הקישור מוכן." highlight={highlight} />;
  }
  return (
    <Card id="link" icon={Link2} title={src.title} line={src.line} status={ready.length ? 'live' : undefined} highlight={highlight}>
      {ready.length ? (
        <div className="space-y-4">
          {ready.map((p) => {
            const url = bookingPageUrl(p);
            return (
              <div key={p.id}>
                {ready.length > 1 ? <p className="mb-1.5 text-[14px] font-semibold text-navy-900">{p.name}</p> : null}
                <LinkBox url={url} />
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <CopyButton text={url} label="העתקת הקישור" variant="default" />
                  <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-1.5 px-1 text-[14px] font-semibold text-brand-700">
                    <ExternalLink size={16} strokeWidth={2} aria-hidden />איך האורחים רואים
                  </a>
                </div>
                <details className="group mt-2">
                  <summary className="flex min-h-[44px] cursor-pointer list-none items-center text-[14px] font-semibold text-ink-600 marker:hidden">
                    רוצים לדעת מאיפה הגיעה כל פנייה? (לא חובה)
                  </summary>
                  <p className="text-[13px] text-ink-600">העתיקו קישור נפרד לכל מקום. ליד כל פנייה יופיע מאיפה היא הגיעה.</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {TAGS.map((t) => <CopyButton key={t.src} text={taggedLink(url, t.src)} label={t.label} className="min-h-[44px] px-3 text-[14px]" />)}
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      ) : (
        <Button type="button" onClick={enable} disabled={busy} className="min-h-[48px] w-full text-[16px]">
          {busy ? 'מפעילים…' : 'הפעלת הקישור'}
        </Button>
      )}
    </Card>
  );
}

export function SourcesList({ properties, focus, hostName, onNewLead }) {
  const firstUrl = properties.filter(linkReady).map(bookingPageUrl)[0] || '';
  const webhookLive = useWebhookLive();
  const [token, setToken] = useState(() => readOrgSettings().leads_webhook_token || '');
  const sbUrl = import.meta.env.VITE_SUPABASE_URL || '';

  useEffect(() => {
    if (!focus) return;
    const el = document.getElementById(`src-${focus}`);
    if (el) window.setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250);
  }, [focus]);

  const makeToken = async () => {
    const bytes = new Uint8Array(20); crypto.getRandomValues(bytes);
    const t = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
    await writeOrgSettings(activeOrgId(), { leads_webhook_token: t });
    setToken(t);
  };

  const meta = LEAD_SOURCES.filter((s) => s.status === 'meta_review' || s.status === 'soon');
  const by = (id) => LEAD_SOURCES.find((s) => s.id === id);

  return (
    <div className="space-y-3">
      <InquiryLinkCard properties={properties} highlight={focus === 'link'} />

      <Card id="whatsapp-reply" icon={MessageCircle} title={by('whatsapp-reply').title} line={by('whatsapp-reply').line} status={firstUrl ? 'live' : undefined} highlight={focus === 'whatsapp-reply'}>
        {firstUrl ? (
          <>
            <p className="whitespace-pre-wrap rounded-[12px] bg-[#F7F8FB] p-3 text-[14px] text-navy-900">{whatsappAutoReply(taggedLink(firstUrl, 'whatsapp'), hostName)}</p>
            <CopyButton text={whatsappAutoReply(taggedLink(firstUrl, 'whatsapp'), hostName)} label="העתקת ההודעה" className="mt-2" />
            <p className="mt-2 text-[13px] text-ink-600">מדביקים בוואטסאפ עסקי, בהגדרות של הודעת הפתיחה.</p>
          </>
        ) : <p className="text-[14px] text-ink-600">קודם מפעילים את הקישור למעלה.</p>}
      </Card>

      <Card id="site-button" icon={Globe} title={by('site-button').title} line={by('site-button').line} status={firstUrl ? 'live' : undefined} highlight={focus === 'site-button'}>
        {firstUrl ? <CopyButton text={siteButtonSnippet(taggedLink(firstUrl, 'site'))} label="העתקת הקוד לאתר" /> : <p className="text-[14px] text-ink-600">קודם מפעילים את הקישור למעלה.</p>}
      </Card>

      <Card id="webhook" icon={Zap} title={by('webhook').title} line={by('webhook').line} status={webhookLive ? 'live' : 'needs_deploy'} highlight={focus === 'webhook'}>
        {webhookLive ? (
          token ? (
            <>
              <LinkBox url={webhookUrl(sbUrl, token)} />
              <CopyButton text={webhookUrl(sbUrl, token)} label="העתקת הכתובת" className="mt-2" />
              <p className="mt-2 text-[13px] text-ink-600">ב-Zapier או Make בוחרים Webhook ושולחים: שם, טלפון, אימייל, תאריך הגעה, תאריך עזיבה, הודעה.</p>
            </>
          ) : <Button type="button" variant="outline" className="min-h-[44px]" onClick={makeToken}>יצירת כתובת אישית</Button>
        ) : null}
      </Card>

      <Card id="phone" icon={Phone} title={by('phone').title} line={by('phone').line} highlight={focus === 'phone'}>
        <Button type="button" variant="outline" className="min-h-[44px]" onClick={onNewLead}>רישום פנייה</Button>
      </Card>

      <div className="rounded-[20px] border border-[#E8EAF2] bg-white">
        {meta.map((s, i) => {
          const Icon = ICONS[s.id] || MessageCircle;
          return (
            <div key={s.id} id={`src-${s.id}`} className={cn('flex items-center gap-3 px-4 py-3', i > 0 && 'border-t border-[#EEF0F5]')}>
              <Icon size={20} strokeWidth={1.8} className="shrink-0 text-ink-400" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-navy-900">{s.title}</span>
                <span className="block text-[13px] text-ink-600">{s.line}</span>
              </span>
              <StatusPill status={s.status} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SourcesSheet({ open, onOpenChange, properties, focus, hostName, onNewLead }) {
  return (
    <AtlasSheet open={open} onOpenChange={onOpenChange} title="מאיפה מגיעות פניות" subtitle="כל פנייה מהמקורות האלה נכנסת לשיחות לבד." size="lg">
      <SourcesList properties={properties} focus={focus} hostName={hostName} onNewLead={() => { onOpenChange(false); onNewLead?.(); }} />
    </AtlasSheet>
  );
}

/** Small "איך פניות מגיעות" button row used by both variants. */
export function sourcesSummary(properties) {
  const live = properties.some(linkReady);
  return live ? 'הקישור לפניות פעיל' : 'עוד לא חיברתם מקור פניות';
}

