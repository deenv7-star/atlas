/**
 * Owner settings for the public pages: guest info per property (shown on each guest page)
 * and the direct-booking page link. Replaces the old static "פורטל אורחים" mock at /guest-portal.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Globe, Copy, ExternalLink, Save, Link2, MessageCircle, Home } from 'lucide-react';
import { useStayData, useStayMutations } from '@/hooks/useStayData';
import { useEnsureGuestToken } from '@/hooks/useGuestToken';
import { guestInfoOf, makeSlug, bookingPageUrl, guestPageUrl, GUEST_INFO_DEFAULTS } from '@/lib/stay/guestInfo';
import { checkOutOf, isActiveBooking, balanceOf } from '@/lib/stay/bookings';
import { formatRangeHe, todayISO } from '@/lib/stay/format';
import { StayPage, PageHeader, Btn, Pill, Segmented } from '@/components/stay/StayUI';
import { WhatsAppComposer } from '@/components/stay/WhatsAppComposer';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';

async function copy(text, msg = 'הקישור הועתק') {
  try {
    await navigator.clipboard.writeText(text);
    atlasToastApi.success(msg);
  } catch {
    window.prompt('העתיקו את הקישור', text);
  }
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

function PropertyEditor({ property, onSaved }) {
  const { updateProperty } = useStayMutations();
  const [info, setInfo] = useState(guestInfoOf(property));
  const [enabled, setEnabled] = useState(property.booking_page_enabled !== false && !!property.public_slug);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setInfo(guestInfoOf(property));
    setEnabled(property.booking_page_enabled !== false && !!property.public_slug);
    setDirty(false);
  }, [property]);

  const set = (k) => (e) => { setInfo((s) => ({ ...s, [k]: e.target.value })); setDirty(true); };

  const save = async (overrides = {}) => {
    const slug = property.public_slug || makeSlug(property.name);
    const nextEnabled = overrides.enabled ?? enabled;
    try {
      await updateProperty.mutateAsync({
        id: property.id,
        data: { guest_info: { ...GUEST_INFO_DEFAULTS, ...info }, public_slug: slug, booking_page_enabled: nextEnabled },
      });
      setDirty(false);
      atlasToastApi.success('השינויים נשמרו');
      onSaved?.();
    } catch (e) {
      atlasToastApi.error(/column|schema/i.test(e?.message || '') ? 'השמירה דורשת עדכון מסד נתונים (מיגרציה 008).' : 'השמירה נכשלה');
    }
  };

  const link = property.public_slug ? bookingPageUrl(property) : '';

  return (
    <div className="space-y-4">
      <section className="ab-card p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="ab-icon-tile"><Globe size={20} strokeWidth={1.75} /></span>
          <div className="flex-1 min-w-0">
            <h2 className="ab-h3">דף הזמנה ישירה</h2>
            <p className="ab-meta mt-0.5">אורחים רואים תאריכים פנויים ושולחים בקשה. כל בקשה נכנסת ללידים, בלי עמלה.</p>
          </div>
          <Switch
            className="data-[state=checked]:bg-[#3E2BF1] shrink-0"
            dir="ltr"
            checked={enabled}
            aria-label="הפעלת דף הזמנה ישירה"
            onCheckedChange={(v) => { setEnabled(v); save({ enabled: v }); }}
          />
        </div>
        {enabled && link ? (
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <div className="ab-input flex items-center min-w-0 flex-1 ab-num text-[14px]" dir="ltr"><span className="truncate">{link}</span></div>
            <div className="flex gap-2">
              <Btn variant="secondary" icon={Copy} onClick={() => copy(link)} className="flex-1 sm:flex-none">העתקה</Btn>
              <a className="ab-btn ab-btn-secondary flex-1 sm:flex-none" href={link} target="_blank" rel="noreferrer"><ExternalLink size={18} strokeWidth={1.75} /> צפייה</a>
            </div>
          </div>
        ) : null}
      </section>

      <section className="ab-card p-4 sm:p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="ab-icon-tile"><Home size={20} strokeWidth={1.75} /></span>
          <div className="flex-1 min-w-0">
            <h2 className="ab-h3">מה האורחים רואים בדף האורח</h2>
            <p className="ab-meta mt-0.5">הפרטים נכנסים לדף האישי של כל הזמנה ולהודעות הוואטסאפ.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field id="gi-in" label="שעת כניסה"><input id="gi-in" type="time" className="ab-input ab-num" value={info.check_in_time} onChange={set('check_in_time')} /></Field>
          <Field id="gi-out" label="שעת יציאה"><input id="gi-out" type="time" className="ab-input ab-num" value={info.check_out_time} onChange={set('check_out_time')} /></Field>
          <Field id="gi-wifi" label="שם רשת וויי-פיי"><input id="gi-wifi" className="ab-input" dir="ltr" style={{ textAlign: 'right' }} value={info.wifi_name} onChange={set('wifi_name')} /></Field>
          <Field id="gi-wifipw" label="סיסמת וויי-פיי"><input id="gi-wifipw" className="ab-input" dir="ltr" style={{ textAlign: 'right' }} value={info.wifi_password} onChange={set('wifi_password')} /></Field>
          <Field id="gi-host" label="שם המארחים"><input id="gi-host" className="ab-input" value={info.host_name} onChange={set('host_name')} placeholder="למשל: דין ושירה" /></Field>
          <Field id="gi-phone" label="טלפון המארחים"><input id="gi-phone" type="tel" className="ab-input" dir="ltr" style={{ textAlign: 'right' }} value={info.host_phone} onChange={set('host_phone')} /></Field>
          <Field id="gi-nav" label="יעד לניווט" className="col-span-2" hint="כתובת או שם מקום כפי שמחפשים בוויז. ריק = כתובת הנכס.">
            <input id="gi-nav" className="ab-input" value={info.navigation_query} onChange={set('navigation_query')} placeholder={property.address || ''} />
          </Field>
          <Field id="gi-arrive" label="הוראות הגעה" className="col-span-2">
            <textarea id="gi-arrive" className="ab-input" rows={3} value={info.arrival_instructions} onChange={set('arrival_instructions')} placeholder="למשל: חונים ליד השער הירוק, המפתח בתיבה ליד הדלת." />
          </Field>
          <Field id="gi-rules" label="כללי המקום (שורה לכל כלל)" className="col-span-2">
            <textarea id="gi-rules" className="ab-input" rows={4} value={info.house_rules} onChange={set('house_rules')} placeholder={'שקט אחרי 23:00\nאין עישון בתוך היחידה'} />
          </Field>
        </div>
        <div className="mt-4 flex gap-2">
          <Btn variant="primary" icon={Save} onClick={() => save()} disabled={!dirty || updateProperty.isPending}>{updateProperty.isPending ? 'שומר…' : 'שמירה'}</Btn>
          {dirty ? <span className="ab-meta self-center">יש שינויים שלא נשמרו</span> : null}
        </div>
      </section>
    </div>
  );
}

export default function GuestPagesPage({ user, orgId }) {
  const data = useStayData({ withCleaning: false });
  const ensureToken = useEnsureGuestToken();
  const [selected, setSelected] = useState('');
  const [composer, setComposer] = useState(null);

  const properties = data.properties;
  useEffect(() => {
    if (!selected && properties.length) setSelected(properties[0].id);
  }, [properties, selected]);
  const property = properties.find((p) => p.id === selected);

  const upcoming = useMemo(() => {
    const today = todayISO();
    return data.bookings
      .filter((b) => isActiveBooking(b) && checkOutOf(b) >= today && (!selected || b.property_id === selected))
      .sort((a, b) => a.check_in_date.localeCompare(b.check_in_date))
      .slice(0, 8);
  }, [data.bookings, selected]);

  const copyGuestLink = async (b) => {
    const withToken = await ensureToken(b);
    const url = guestPageUrl(withToken);
    if (!url) { atlasToastApi.error('קישור אישי דורש עדכון מסד נתונים (מיגרציה 008).'); return; }
    copy(url, 'הקישור לדף האורח הועתק');
  };

  return (
    <StayPage>
      <PageHeader
        title="דף אורח והזמנה ישירה"
        subtitle="דף אישי לכל אורח עם כל פרטי השהייה, ודף הזמנה ישירה לכל יחידה."
      />
      {data.isLoading ? <Skeleton className="h-64 rounded-[14px]" /> : properties.length === 0 ? (
        <div className="ab-card p-6 text-center">
          <p className="font-bold">עוד אין יחידות במערכת.</p>
          <p className="ab-meta mt-1">הוסיפו נכס בהגדרות כדי ליצור דפים לאורחים.</p>
          <a href="/settings" className="ab-btn ab-btn-primary mt-3">להגדרות</a>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto -mx-4 px-4">
            <Segmented label="בחירת יחידה" value={selected} onChange={setSelected} options={properties.map((p) => ({ value: p.id, label: p.name }))} />
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_340px] items-start">
            {property ? <PropertyEditor property={property} /> : null}
            <section className="ab-card overflow-hidden">
              <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                <span className="ab-icon-tile"><Link2 size={20} strokeWidth={1.75} /></span>
                <h2 className="ab-h3">דפי אורח להזמנות קרובות</h2>
              </div>
              {upcoming.length === 0 ? (
                <p className="ab-meta px-4 pb-4">אין הזמנות קרובות ביחידה הזו.</p>
              ) : upcoming.map((b) => (
                <div key={b.id} className="px-4 py-3 border-t" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold truncate flex-1">{b.guest_name || 'אורח'}</span>
                    {b.guest_token ? <Pill tone="brand">קישור פעיל</Pill> : null}
                  </div>
                  <p className="ab-meta">{formatRangeHe(b.check_in_date, checkOutOf(b))}</p>
                  <div className="flex gap-2 mt-2">
                    <Btn size="sm" variant="secondary" icon={Copy} onClick={() => copyGuestLink(b)}>העתקת קישור</Btn>
                    <Btn size="sm" variant="ghost" icon={MessageCircle} onClick={() => setComposer(b)}>שליחה</Btn>
                  </div>
                </div>
              ))}
            </section>
          </div>
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
