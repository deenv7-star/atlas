/**
 * דף אורח והזמנה ישירה. feat/pages-clarity (Deen 05.11.2026): an owner of 65 must get it in one look.
 *  - two plain explainers on top: what each page is and what it saves / brings
 *  - two tabs instead of one mixed form: "דף אורח" | "דף הזמנה ישירה"
 *  - a phone showing what the guest really sees, updating as fields change
 *  - פתחו לדוגמה / העתיקו לינק / שלחו לעצמי בוואטסאפ
 *  - a real empty photo state (no lone letter), and a labelled "בחרו יחידה" selector
 * Background: the page sits in StayPage; its opaque canvas is being removed in the shared wrapper by deen-batch-1.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Globe, Copy, ExternalLink, Save, Link2, MessageCircle, ImagePlus, Clock, Wifi, Navigation, Phone, ScrollText, CalendarDays, Smartphone } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { uploadedPhoto } from '@/lib/stay/unitPhoto';
import { useStayData, useStayMutations } from '@/hooks/useStayData';
import { useEnsureGuestToken } from '@/hooks/useGuestToken';
import { guestInfoOf, makeSlug, bookingPageUrl, guestPageUrl, GUEST_INFO_DEFAULTS } from '@/lib/stay/guestInfo';
import { checkOutOf, isActiveBooking, balanceOf } from '@/lib/stay/bookings';
import { formatRangeHe, todayISO } from '@/lib/stay/format';
import { waLink } from '@/lib/stay/whatsapp';
import { StayPage, PageHeader, Btn, Pill } from '@/components/stay/StayUI';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComingSoon } from '@/components/ds';
import { DB_FEATURES } from '@/config/dbFeatures';
import { clarityVariant } from '@/components/pageguide/flag';
import { cn } from '@/lib/utils';
import '@/components/pageguide/guestpages.css';

async function copy(text, msg = 'הקישור הועתק') {
  try { await navigator.clipboard.writeText(text); atlasToastApi.success(msg); } catch { window.prompt('העתיקו את הקישור', text); }
}

function Field({ id, label, children, hint, className }) {
  return (
    <div className={className}>
      <label className="ab-label" htmlFor={id}>{label}</label>
      {children}
      {hint ? <p className="ab-faint mt-1">{hint}</p> : null}
    </div>
  );
}

const EXPLAIN = {
  guest: { icon: Smartphone, title: 'דף אורח', line: 'כל אורח מקבל בוואטסאפ דף אישי עם שעות, ניווט, וויי-פיי וכללי בית.', gain: 'פחות שאלות אליכם בטלפון.' },
  direct: { icon: Globe, title: 'דף הזמנה ישירה', line: 'קישור שאתם שמים באינסטגרם או באתר. אורחים בוחרים תאריכים ושולחים בקשה.', gain: 'הזמנות בלי עמלה של Booking.' },
};

/** The two explainers. A: two cards with the gain. B: the same, compact, pointing at the phone. */
function Explainers({ tab, onTab }) {
  const v = clarityVariant();
  return (
    <div className={cn('gp-explain', v === 'b' && 'gp-explain--b')} data-clarity={v}>
      {Object.entries(EXPLAIN).map(([k, e]) => {
        const Icon = e.icon;
        return (
          <button key={k} type="button" onClick={() => onTab(k)} aria-pressed={tab === k} className={cn('gp-ex', tab === k && 'is-on')}>
            <span className="gp-ex-ic" aria-hidden><Icon size={20} strokeWidth={1.75} /></span>
            <span className="min-w-0">
              <span className="gp-ex-t">{e.title}</span>
              <span className="gp-ex-l">{e.line}</span>
              <span className="gp-ex-g">{e.gain}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** What the guest sees on the phone, built from the current (unsaved) fields. */
function PhonePreview({ kind, property, info, photo }) {
  const name = property?.name || 'היחידה שלכם';
  const rules = String(info.house_rules || '').split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 3);
  return (
    <figure className="gp-phone-wrap" aria-label={kind === 'guest' ? 'כך האורח רואה את דף האורח' : 'כך האורח רואה את דף ההזמנה'}>
      <figcaption className="gp-phone-cap"><span className="gp-pill">דוגמה</span>{kind === 'guest' ? 'כך האורח רואה את הדף' : 'כך נראה דף ההזמנה'}</figcaption>
      <div className="gp-phone" aria-hidden>
        <div className="gp-screen">
          <div className="gp-hero">{photo ? <img src={photo} alt="" /> : <span className="gp-hero-empty"><ImagePlus size={22} strokeWidth={1.5} /></span>}</div>
          <div className="gp-body">
            <p className="gp-unit">{name}</p>
            {kind === 'guest' ? (
              <>
                <p className="gp-hello">שלום נועה, מחכים לכם</p>
                <div className="gp-line"><Clock size={15} strokeWidth={1.75} /><span>כניסה מ-<b dir="ltr">{info.check_in_time || '15:00'}</b> · יציאה עד <b dir="ltr">{info.check_out_time || '11:00'}</b></span></div>
                <div className="gp-line"><Navigation size={15} strokeWidth={1.75} /><span>ניווט: {info.navigation_query || property?.address || 'הכתובת שלכם'}</span></div>
                <div className="gp-line"><Wifi size={15} strokeWidth={1.75} /><span dir="auto">{info.wifi_name ? `${info.wifi_name} · ${info.wifi_password || '••••'}` : 'וויי-פיי: עוד לא מולא'}</span></div>
                {rules.length ? <div className="gp-line gp-line--top"><ScrollText size={15} strokeWidth={1.75} /><span>{rules.join(' · ')}</span></div> : null}
                {info.host_phone ? <div className="gp-line"><Phone size={15} strokeWidth={1.75} /><span dir="ltr">{info.host_phone}</span></div> : null}
                <span className="gp-cta">ניווט בוויז</span>
              </>
            ) : (
              <>
                <p className="gp-hello">בחרו תאריכים ושלחו בקשה</p>
                <div className="gp-cal">{Array.from({ length: 14 }).map((_, i) => <i key={i} className={i === 4 || i === 5 ? 'is-sel' : i === 9 ? 'is-off' : ''}>{i + 8}</i>)}</div>
                <div className="gp-line"><CalendarDays size={15} strokeWidth={1.75} /><span>כניסה {info.check_in_time || '15:00'} · יציאה {info.check_out_time || '11:00'}</span></div>
                <span className="gp-cta">שליחת בקשה</span>
              </>
            )}
          </div>
        </div>
      </div>
    </figure>
  );
}

function PhotoCard({ property }) {
  const { updateProperty } = useStayMutations();
  const [uploading, setUploading] = useState(false);
  const photo = uploadedPhoto(property);
  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\//.test(file.type)) { atlasToastApi.error('צריך לבחור קובץ תמונה'); return; }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateProperty.mutateAsync({ id: property.id, data: { images: [file_url, ...(Array.isArray(property.images) ? property.images.slice(1) : [])] } });
      atlasToastApi.success('התמונה עודכנה');
    } catch { atlasToastApi.error('לא הצלחנו להעלות את התמונה. נסו שוב.'); } finally { setUploading(false); }
  };
  return (
    <section className="ab-card overflow-hidden">
      {photo ? <img src={photo} alt={`תמונה של ${property.name || 'היחידה'}`} className="aspect-[16/7] w-full object-cover" /> : (
        <div className="gp-photo-empty">
          <ImagePlus size={28} strokeWidth={1.5} aria-hidden />
          <p className="gp-photo-empty-t">עוד אין תמונה של {property.name || 'היחידה'}</p>
          <p className="gp-photo-empty-l">תמונה אחת טובה עושה את הדף. היא תופיע גם בלוח היום ובהזמנות.</p>
        </div>
      )}
      <div className="flex items-center gap-3 p-4 sm:p-5">
        <div className="min-w-0 flex-1">
          <h2 className="ab-h3">תמונת היחידה</h2>
          <p className="ab-meta mt-0.5">{photo ? 'מופיעה בדף האורח, בדף ההזמנה ובלוח היום.' : 'צלמו מהטלפון או בחרו מהמחשב.'}</p>
        </div>
        <label className="ab-btn ab-btn-secondary shrink-0 cursor-pointer">
          <ImagePlus size={18} strokeWidth={1.75} />
          {uploading ? 'מעלים…' : photo ? 'החלפת תמונה' : 'העלאת תמונה'}
          <input type="file" accept="image/*" className="sr-only" onChange={onPhoto} disabled={uploading} />
        </label>
      </div>
    </section>
  );
}

function Actions3({ openUrl, copyUrl, sendSelf, openHint }) {
  return (
    <div className="gp-actions">
      <Btn variant="primary" icon={ExternalLink} onClick={openUrl || undefined} disabled={!openUrl}>פתחו לדוגמה</Btn>
      <Btn variant="secondary" icon={Copy} onClick={copyUrl || undefined} disabled={!copyUrl}>העתיקו לינק</Btn>
      <Btn variant="secondary" icon={MessageCircle} onClick={sendSelf || undefined} disabled={!sendSelf}>שלחו לעצמי בוואטסאפ</Btn>
      {openHint ? <p className="ab-meta w-full">{openHint}</p> : null}
    </div>
  );
}

function UnitEditor({ property, tab, upcoming, onSend }) {
  const { updateProperty } = useStayMutations();
  const ensureToken = useEnsureGuestToken();
  const [info, setInfo] = useState(guestInfoOf(property));
  const [enabled, setEnabled] = useState(property.booking_page_enabled !== false && !!property.public_slug);
  const [dirty, setDirty] = useState(false);
  const [guestUrl, setGuestUrl] = useState('');
  useEffect(() => { setInfo(guestInfoOf(property)); setEnabled(property.booking_page_enabled !== false && !!property.public_slug); setDirty(false); }, [property]);
  const next = upcoming[0] || null;
  useEffect(() => { setGuestUrl(next?.guest_token ? guestPageUrl(next) : ''); }, [next]);

  const set = (k) => (e) => { setInfo((s) => ({ ...s, [k]: e.target.value })); setDirty(true); };
  const save = async (overrides = {}) => {
    const slug = property.public_slug || makeSlug(property.name);
    const nextEnabled = overrides.enabled ?? enabled;
    try {
      await updateProperty.mutateAsync({ id: property.id, data: { guest_info: { ...GUEST_INFO_DEFAULTS, ...info }, public_slug: slug, booking_page_enabled: nextEnabled } });
      setDirty(false);
      atlasToastApi.success('השינויים נשמרו');
    } catch (e) {
      atlasToastApi.error(/column|schema/i.test(e?.message || '') ? 'כדי לשמור צריך עדכון קטן מצדנו. כתבו לנו ונסדר.' : 'לא הצלחנו לשמור. נסו שוב.');
    }
  };
  const getGuestUrl = async () => {
    if (guestUrl) return guestUrl;
    if (!next) return '';
    const withToken = await ensureToken(next);
    const url = guestPageUrl(withToken) || '';
    setGuestUrl(url);
    return url;
  };
  const link = property.public_slug ? bookingPageUrl(property) : '';
  const photo = uploadedPhoto(property);

  return (
    <div className="gp-grid">
      <div className="space-y-4 min-w-0">
        {tab === 'guest' ? (
          <>
            <section className="ab-card p-4 sm:p-5">
              <h2 className="ab-h3">דף האורח של {property.name}</h2>
              <p className="ab-meta mt-0.5">ממלאים פעם אחת. כל אורח מקבל את זה בדף האישי שלו ובהודעות הוואטסאפ.</p>
              <Actions3
                openUrl={next ? async () => { const u = await getGuestUrl(); if (u) window.open(u, '_blank', 'noopener'); } : null}
                copyUrl={next ? async () => { const u = await getGuestUrl(); if (u) copy(u, 'הקישור לדף האורח הועתק'); } : null}
                sendSelf={next ? async () => { const u = await getGuestUrl(); if (u) window.open(waLink(info.host_phone || '', `דף האורח של ${property.name}: ${u}`), '_blank', 'noopener'); } : null}
                openHint={next ? null : 'הקישור נוצר לכל הזמנה. אחרי ההזמנה הקרובה הראשונה אפשר לפתוח אותו מכאן.'}
              />
            </section>
            <section className="ab-card p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-3">
                <Field id="gi-in" label="שעת כניסה"><input id="gi-in" type="time" className="ab-input ab-num" value={info.check_in_time} onChange={set('check_in_time')} /></Field>
                <Field id="gi-out" label="שעת יציאה"><input id="gi-out" type="time" className="ab-input ab-num" value={info.check_out_time} onChange={set('check_out_time')} /></Field>
                <Field id="gi-wifi" label="שם רשת וויי-פיי"><input id="gi-wifi" className="ab-input" dir="ltr" style={{ textAlign: 'right' }} value={info.wifi_name} onChange={set('wifi_name')} /></Field>
                <Field id="gi-wifipw" label="סיסמת וויי-פיי"><input id="gi-wifipw" className="ab-input" dir="ltr" style={{ textAlign: 'right' }} value={info.wifi_password} onChange={set('wifi_password')} /></Field>
                <Field id="gi-host" label="שם המארחים"><input id="gi-host" className="ab-input" value={info.host_name} onChange={set('host_name')} placeholder="למשל: דין ושירה" /></Field>
                <Field id="gi-phone" label="טלפון המארחים"><input id="gi-phone" type="tel" className="ab-input" dir="ltr" style={{ textAlign: 'right' }} value={info.host_phone} onChange={set('host_phone')} /></Field>
                <Field id="gi-nav" label="יעד לניווט" className="col-span-2" hint="כתובת או שם מקום כמו שמחפשים בוויז. אם תשאירו ריק, נשתמש בכתובת המתחם.">
                  <input id="gi-nav" className="ab-input" value={info.navigation_query} onChange={set('navigation_query')} placeholder={property.address || ''} />
                </Field>
                <Field id="gi-arrive" label="הוראות הגעה" className="col-span-2">
                  <textarea id="gi-arrive" className="ab-input" rows={3} value={info.arrival_instructions} onChange={set('arrival_instructions')} placeholder="למשל: חונים ליד השער הירוק, המפתח בתיבה ליד הדלת." />
                </Field>
                <Field id="gi-rules" label="כללי הבית (שורה לכל כלל)" className="col-span-2">
                  <textarea id="gi-rules" className="ab-input" rows={4} value={info.house_rules} onChange={set('house_rules')} placeholder={'שקט אחרי 23:00\nאין עישון בתוך היחידה'} />
                </Field>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Btn variant="primary" icon={Save} onClick={() => save()} disabled={!dirty || updateProperty.isPending}>{updateProperty.isPending ? 'שומרים…' : 'שמירה'}</Btn>
                {dirty ? <span className="ab-meta">השינויים עוד לא נשמרו</span> : null}
              </div>
            </section>
            <PhotoCard property={property} />
            <section className="ab-card overflow-hidden">
              <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                <span className="ab-icon-tile"><Link2 size={20} strokeWidth={1.75} /></span>
                <h2 className="ab-h3">הקישורים להזמנות הקרובות</h2>
              </div>
              {upcoming.length === 0 ? <p className="ab-meta px-4 pb-4">אין הזמנות קרובות ב{property.name}. כשתהיה הזמנה, הקישור שלה יופיע כאן.</p> : upcoming.map((b) => (
                <div key={b.id} className="px-4 py-3 border-t" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold truncate flex-1">{b.guest_name || 'אורח'}</span>
                    {b.guest_token ? <Pill tone="brand">קישור פעיל</Pill> : null}
                  </div>
                  <p className="ab-meta">{formatRangeHe(b.check_in_date, checkOutOf(b))}</p>
                  <div className="flex gap-2 mt-2">
                    <Btn size="sm" variant="secondary" icon={Copy} onClick={async () => { const w = await ensureToken(b); const u = guestPageUrl(w); if (u) copy(u, 'הקישור לדף האורח הועתק'); else atlasToastApi.error('לא הצלחנו ליצור קישור. נסו שוב בעוד רגע.'); }}>העתקת קישור</Btn>
                    <Btn size="sm" variant="ghost" icon={MessageCircle} onClick={() => onSend(b)}>שליחה לאורח</Btn>
                  </div>
                </div>
              ))}
            </section>
          </>
        ) : (
          <section className="ab-card p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="ab-h3">דף ההזמנה של {property.name}</h2>
                <p className="ab-meta mt-0.5">{enabled ? 'הדף פתוח. כל בקשה נכנסת לפניות, בלי עמלה.' : 'הדף כבוי. הדליקו כדי לקבל קישור.'}</p>
              </div>
              <Switch className="data-[state=checked]:bg-[#3E2BF1] shrink-0" dir="ltr" checked={enabled} aria-label="דף הזמנה ישירה פתוח"
                onCheckedChange={(v) => { setEnabled(v); save({ enabled: v }); }} />
            </div>
            {enabled && link ? (
              <>
                <div className="ab-input mt-4 flex items-center min-w-0 ab-num text-[15px]" dir="ltr"><span className="truncate">{link}</span></div>
                <Actions3 openUrl={() => window.open(link, '_blank', 'noopener')} copyUrl={() => copy(link)} sendSelf={() => window.open(waLink(info.host_phone || '', `דף ההזמנה של ${property.name}: ${link}`), '_blank', 'noopener')} />
                <p className="ab-meta mt-3">איפה לשים: בביו של האינסטגרם, בפייסבוק, באתר, ובחתימה בוואטסאפ.</p>
              </>
            ) : null}
          </section>
        )}
      </div>
      <PhonePreview kind={tab} property={property} info={info} photo={photo} />
    </div>
  );
}

export default function GuestPagesPage(props) {
  if (!DB_FEATURES.guestPages) {
    return (
      <StayPage>
        <PageHeader title="דף אורח והזמנה ישירה" subtitle="דף אישי לכל אורח, ודף הזמנה ישירה לכל יחידה." />
        <ComingSoon icon={Globe} title="דפי אורח והזמנה ישירה יגיעו בקרוב" description="ברגע שהם מוכנים תוכלו לשלוח לכל אורח קישור אישי ולקבל הזמנות ישירות, בלי עמלה." />
      </StayPage>
    );
  }
  return <GuestPagesScreen {...props} />;
}

function GuestPagesScreen({ user, orgId }) {
  const data = useStayData({ withCleaning: false });
  const [selected, setSelected] = useState('');
  const [tab, setTab] = useState('guest');
  const [composer, setComposer] = useState(null);
  const properties = data.properties;
  useEffect(() => { if (!selected && properties.length) setSelected(properties[0].id); }, [properties, selected]);
  const property = properties.find((p) => p.id === selected);
  const upcoming = useMemo(() => {
    const today = todayISO();
    return data.bookings
      .filter((b) => isActiveBooking(b) && checkOutOf(b) >= today && (!selected || b.property_id === selected))
      .sort((a, b) => a.check_in_date.localeCompare(b.check_in_date))
      .slice(0, 8);
  }, [data.bookings, selected]);

  return (
    <StayPage wide>
      <PageHeader title="דף אורח והזמנה ישירה" subtitle="שני דפים שאורחים רואים בטלפון. אתם ממלאים פעם אחת." />
      {data.isLoading ? <Skeleton className="h-64 rounded-[24px]" /> : properties.length === 0 ? (
        <div className="ab-card p-6 text-center">
          <p className="font-bold">עוד אין יחידות.</p>
          <p className="ab-meta mt-1">הוסיפו יחידה בהגדרות כדי ליצור דפים לאורחים.</p>
          <a href="/settings" className="ab-btn ab-btn-primary mt-3">להגדרות</a>
        </div>
      ) : (
        <div className="space-y-5">
          <Explainers tab={tab} onTab={setTab} />
          <div className="gp-bar">
            <div role="tablist" aria-label="איזה דף" className="gp-tabs">
              {[['guest', 'דף אורח'], ['direct', 'דף הזמנה ישירה']].map(([k, l]) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} className={cn('gp-tab', tab === k && 'is-on')} onClick={() => setTab(k)}>{l}</button>
              ))}
            </div>
            {properties.length > 1 ? (
              <div className="gp-unit-pick">
                <label htmlFor="gp-unit" className="ab-label !mb-0 whitespace-nowrap">בחרו יחידה</label>
                <Select value={selected} onValueChange={setSelected}>
                  <SelectTrigger id="gp-unit" className="min-w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
          {property ? <UnitEditor key={property.id} property={property} tab={tab} upcoming={upcoming} onSend={setComposer} /> : null}
        </div>
      )}
      <WhatsAppComposer
        open={!!composer}
        onOpenChange={(o) => { if (!o) setComposer(null); }}
        booking={composer}
        property={composer ? data.propertyById.get(composer.property_id) : null}
        balance={composer ? balanceOf(composer, data.paymentsByBooking.get(composer.id) || []) : null}
        initialTemplate="confirmation"
        orgId={orgId}
        orgName={user?.organization_name || ''}
      />
    </StayPage>
  );
}
