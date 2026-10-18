/**
 * Personal guest page per booking (public link, no login): /g/:token
 * Stay dates, navigation, check-in time, Wi-Fi, house rules, host contact, balance due.
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Wifi, Copy, Check, Phone, MessageCircle, ScrollText, KeyRound, Wallet, Navigation, CalendarDays, ClipboardCheck } from 'lucide-react';
import { fetchGuestStay, submitGuestCheckin } from '@/lib/stay/publicApi';
import { formatDayHe, formatMoney, firstName, withPrefix } from '@/lib/stay/format';
import { navigationTarget, wazeUrl, googleMapsUrl } from '@/lib/stay/guestInfo';
import { waLink } from '@/lib/stay/whatsapp';
import { Wordmark, LinkBtn, Btn } from '@/components/stay/StayUI';
import '@/styles/atlas-brand.css';
import { heCount } from '@/lib/hebrewCount';

function Card({ icon: Icon, title, children }) {
  return (
    <section className="ab-card p-4 sm:p-5 ab-enter">
      <div className="flex items-center gap-3 mb-3">
        <span className="ab-icon-tile"><Icon size={20} strokeWidth={1.75} aria-hidden /></span>
        <h2 className="ab-h3">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard blocked */ }
  };
  return (
    <div className="flex items-center gap-3 py-2.5" style={{ borderTop: '1px solid var(--line)' }}>
      <div className="flex-1 min-w-0">
        <p className="ab-faint">{label}</p>
        <p className="font-bold text-[17px] truncate" dir="ltr" style={{ textAlign: 'right' }}>{value}</p>
      </div>
      <button type="button" onClick={copy} className="ab-btn ab-btn-secondary ab-btn-sm" aria-label={`העתקת ${label}`}>
        {copied ? <Check size={16} strokeWidth={2} /> : <Copy size={16} strokeWidth={1.75} />}
        {copied ? 'הועתק' : 'העתקה'}
      </button>
    </div>
  );
}

const ARRIVAL_TIMES = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];

/** Online check-in (014): the guest leaves a phone, the name as on their ID, arrival time, and accepts the house rules. */
function CheckInCard({ token, booking, checkin, rules, onDone }) {
  const [open, setOpen] = useState(!checkin?.completed);
  const [form, setForm] = useState({
    id_name: checkin?.id_name || (booking.guest_name && !/^אורח |^חסום/.test(booking.guest_name) ? booking.guest_name : ''),
    phone: '', arrival_time: checkin?.arrival_time || '', guests: (Number(booking.adults) || 0) + (Number(booking.children) || 0) || '',
    rules_accepted: false, marketing_consent: false,
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (form.id_name.trim().length < 2) { setErr('כתבו שם מלא כמו בתעודה'); return; }
    if (form.phone.replace(/\D/g, '').length < 9) { setErr('כתבו מספר טלפון נייד'); return; }
    if (!form.rules_accepted) { setErr('צריך לאשר את כללי המקום'); return; }
    setBusy(true);
    try {
      await submitGuestCheckin(token, form);
      setOpen(false);
      onDone();
    } catch (ex) {
      const m = String(ex?.message || '');
      setErr(/rate_limited/.test(m) ? 'רגע, כבר שמרנו. נסו שוב בעוד כמה שניות' : /missing_fields|rules/.test(m) ? 'חסרים פרטים בטופס' : 'לא הצלחנו לשמור. נסו שוב');
    } finally {
      setBusy(false);
    }
  };

  if (checkin?.completed && !open) {
    return (
      <section className="ab-card p-4 sm:p-5 ab-enter" aria-label="צ'ק-אין" data-testid="checkin-done">
        <div className="flex items-center gap-3">
          <span className="ab-icon-tile" style={{ background: 'var(--st-mint-bg, #E6F6EE)', color: 'var(--st-mint-fg, #11603A)' }}><Check size={20} strokeWidth={2} aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <h2 className="ab-h3">הצ׳ק-אין הושלם</h2>
            <p className="ab-meta">{checkin.arrival_time ? `מחכים לכם בסביבות ${checkin.arrival_time}.` : 'תודה, קיבלנו את הפרטים.'}</p>
          </div>
          <Btn variant="ghost" size="sm" onClick={() => setOpen(true)}>עדכון</Btn>
        </div>
      </section>
    );
  }

  return (
    <section className="ab-card p-4 sm:p-5 ab-enter" aria-label="צ'ק-אין אונליין" data-testid="checkin-form">
      <div className="flex items-center gap-3 mb-1">
        <span className="ab-icon-tile"><ClipboardCheck size={20} strokeWidth={1.75} aria-hidden /></span>
        <h2 className="ab-h3">צ׳ק-אין אונליין</h2>
      </div>
      <p className="ab-meta mb-4">דקה אחת, ואנחנו מוכנים לקראתכם. הטלפון משמש רק לעדכונים על השהייה.</p>
      <form onSubmit={submit} noValidate className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="ab-label" htmlFor="ci-name">שם מלא כמו בתעודה</label>
          <input id="ci-name" className="ab-input" autoComplete="name" value={form.id_name} onChange={set('id_name')} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="ab-label" htmlFor="ci-phone">טלפון נייד</label>
          <input id="ci-phone" className="ab-input" type="tel" inputMode="tel" dir="ltr" style={{ textAlign: 'right' }} autoComplete="tel" placeholder="050-0000000" value={form.phone} onChange={set('phone')} />
        </div>
        <div className="col-span-1">
          <label className="ab-label" htmlFor="ci-time">שעת הגעה משוערת</label>
          <select id="ci-time" className="ab-input ab-num" value={form.arrival_time} onChange={set('arrival_time')}>
            <option value="">לא בטוחים</option>
            {ARRIVAL_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="col-span-1">
          <label className="ab-label" htmlFor="ci-guests">מספר אורחים</label>
          <input id="ci-guests" className="ab-input ab-num" type="number" inputMode="numeric" min={1} max={40} value={form.guests} onChange={set('guests')} />
        </div>
        {rules.length ? (
          <ul className="col-span-2 space-y-1.5 rounded-[14px] p-3" style={{ background: 'var(--canvas, #F7F8FB)' }}>
            {rules.map((r) => <li key={r} className="text-[14px]" style={{ color: 'var(--ink-600)' }}>• {r}</li>)}
          </ul>
        ) : null}
        <label className="col-span-2 flex min-h-[44px] items-start gap-3 text-[15px]">
          <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[#3E2BF1]" checked={form.rules_accepted} onChange={set('rules_accepted')} />
          <span>קראתי ואני מאשר/ת את כללי המקום{rules.length ? '' : ' כפי שיימסרו על ידי המארחים'}</span>
        </label>
        <label className="col-span-2 flex min-h-[44px] items-start gap-3 text-[14px]" style={{ color: 'var(--ink-600)' }}>
          <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[#3E2BF1]" checked={form.marketing_consent} onChange={set('marketing_consent')} />
          <span>אשמח לקבל מהמארחים הטבות ועדכונים (דיוור). אפשר להסיר בכל עת. לא חובה.</span>
        </label>
        {err ? <p role="alert" className="col-span-2 text-[14px] font-bold" style={{ color: 'var(--status-danger)' }}>{err}</p> : null}
        <button type="submit" className="ab-btn ab-btn-primary ab-btn-lg col-span-2" disabled={busy}>{busy ? 'שומרים…' : 'סיום צ׳ק-אין'}</button>
      </form>
    </section>
  );
}

function Shell({ children }) {
  return (
    <div dir="rtl" className="ab-root min-h-[100dvh]" style={{ background: 'var(--canvas)' }}>
      {children}
      <footer className="py-8 flex flex-col items-center gap-1.5">
        <span className="ab-faint">הדף נוצר עם</span>
        <Wordmark size={16} />
      </footer>
    </div>
  );
}

export default function GuestStayPage() {
  const { token } = useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['guest-stay', token], queryFn: () => fetchGuestStay(token), retry: false, staleTime: 60_000 });

  useEffect(() => {
    const name = q.data?.property?.name;
    document.title = name ? `השהייה שלכם ${withPrefix('ב', name)}` : 'פרטי השהייה';
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'robots'); document.head.appendChild(meta); }
    meta.setAttribute('content', 'noindex, nofollow');
  }, [q.data]);

  if (q.isLoading) {
    return (
      <Shell>
        <div className="h-48" style={{ background: 'linear-gradient(180deg, #EEF0FF 0%, #F7F8FB 100%)' }} />
        <div className="max-w-xl mx-auto px-4 -mt-10 space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="ab-card h-28 animate-pulse" />)}
        </div>
      </Shell>
    );
  }

  if (q.isError || !q.data) {
    return (
      <Shell>
        <div className="max-w-md mx-auto px-6 pt-24 text-center">
          <span className="ab-icon-tile mx-auto"><KeyRound size={20} strokeWidth={1.75} /></span>
          <h1 className="ab-h3 mt-4">הקישור לא נמצא</h1>
          <p className="ab-meta mt-2">ייתכן שההזמנה עודכנה. בקשו מהמארחים קישור חדש.</p>
        </div>
      </Shell>
    );
  }

  const { booking, property, host, money } = q.data;
  const info = property.guest_info || {};
  const nav = navigationTarget(property);
  const name = firstName(booking.guest_name);
  const guests = (Number(booking.adults) || 0) + (Number(booking.children) || 0);
  const rules = String(info.house_rules || '').split('\n').map((s) => s.replace(/^[•\-*\s]+/, '').trim()).filter(Boolean);
  const hero = Array.isArray(property.images) && property.images[0] ? (property.images[0].url || property.images[0]) : null;

  return (
    <Shell>
      <header className="relative overflow-hidden" style={{ background: hero ? 'var(--navy-900)' : 'linear-gradient(180deg, #EEF0FF 0%, #F7F8FB 100%)' }}>
        {hero ? <img src={hero} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" /> : null}
        <div className="relative max-w-xl mx-auto px-5 pt-10 pb-16">
          <p className="text-[15px] font-medium" style={{ color: hero ? '#C9CDF9' : 'var(--brand-600, #3E2BF1)' }}>{name ? `שלום ${name},` : 'שלום,'}</p>
          <h1 className="mt-1 text-[30px] sm:text-[34px] leading-[1.15] font-extrabold" style={{ color: hero ? '#FFFFFF' : '#1B2656' }}>השהייה שלכם {withPrefix('ב', property.name)}</h1>
          <p className="mt-2 text-[15px]" style={{ color: hero ? '#DADDF6' : '#4A5578' }}>
            {heCount(booking.nights, 'night')}{guests ? ` · ${heCount(guests, 'guest')}` : ''}
          </p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 -mt-10 space-y-3 relative">
        <section className="ab-card p-4 sm:p-5 ab-enter">
          <div className="grid grid-cols-2">
            <div className="pl-4" style={{ borderLeft: '1px solid var(--line)' }}>
              <p className="ab-faint flex items-center gap-1.5"><CalendarDays size={14} strokeWidth={1.75} /> כניסה</p>
              <p className="font-extrabold text-[16px] sm:text-[18px] mt-1 whitespace-nowrap">{formatDayHe(booking.check_in_date)}</p>
              <p className="ab-meta ab-num">מ-{info.check_in_time || '15:00'}</p>
            </div>
            <div className="pr-4">
              <p className="ab-faint flex items-center gap-1.5"><CalendarDays size={14} strokeWidth={1.75} /> יציאה</p>
              <p className="font-extrabold text-[16px] sm:text-[18px] mt-1 whitespace-nowrap">{formatDayHe(booking.check_out_date)}</p>
              <p className="ab-meta ab-num">עד {info.check_out_time || '11:00'}</p>
            </div>
          </div>
        </section>

        <CheckInCard token={token} booking={booking} checkin={q.data.checkin} rules={rules} onDone={() => qc.invalidateQueries({ queryKey: ['guest-stay', token] })} />

        {nav ? (
          <Card icon={MapPin} title="איך מגיעים">
            {property.address ? <p className="text-[16px] mb-3">{property.address}</p> : null}
            <div className="grid grid-cols-2 gap-2">
              <LinkBtn variant="primary" size="lg" icon={Navigation} href={wazeUrl(nav)} target="_blank" rel="noreferrer">Waze</LinkBtn>
              <LinkBtn variant="secondary" size="lg" icon={MapPin} href={googleMapsUrl(nav)} target="_blank" rel="noreferrer">Google Maps</LinkBtn>
            </div>
            {info.arrival_instructions ? (
              <p className="mt-4 whitespace-pre-line text-[15px]" style={{ color: 'var(--ink-600)' }}>{info.arrival_instructions}</p>
            ) : null}
          </Card>
        ) : null}

        {info.wifi_name ? (
          <Card icon={Wifi} title="וויי-פיי">
            <CopyField label="רשת" value={info.wifi_name} />
            {info.wifi_password ? <CopyField label="סיסמה" value={info.wifi_password} /> : null}
          </Card>
        ) : null}

        {rules.length ? (
          <Card icon={ScrollText} title="כללי המקום">
            <ul className="space-y-2">
              {rules.map((r) => (
                <li key={r} className="flex gap-2.5 text-[15px]">
                  <span className="mt-[9px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--brand-600)' }} aria-hidden />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {money && money.total > 0 ? (
          <Card icon={Wallet} title="תשלום">
            {money.balance > 0 ? (
              <>
                <p className="text-[15px]" style={{ color: 'var(--ink-600)' }}>יתרה לתשלום{money.dueDate ? ` עד ${formatDayHe(money.dueDate)}` : ''}</p>
                <p className="ab-num text-[28px] font-extrabold mt-0.5">{formatMoney(money.balance)}</p>
                <p className="ab-faint mt-1">שולם עד עכשיו {formatMoney(money.paid)} מתוך {formatMoney(money.total)}. לתשלום דברו עם המארחים.</p>
              </>
            ) : (
              <p className="text-[16px] font-bold" style={{ color: 'var(--status-success)' }}>התשלום הושלם. תודה.</p>
            )}
          </Card>
        ) : null}

        {host?.phone || host?.name ? (
          <Card icon={Phone} title={host.name ? `המארחים: ${host.name}` : 'המארחים'}>
            <p className="ab-meta mb-3">צריכים משהו? אנחנו זמינים.</p>
            {host.phone ? (
              <div className="grid grid-cols-2 gap-2">
                <LinkBtn variant="primary" size="lg" icon={MessageCircle} href={waLink(host.phone, `שלום, כאן ${booking.guest_name || 'אורח'} מהשהייה ${withPrefix('ב', property.name)}.`)} target="_blank" rel="noreferrer">וואטסאפ</LinkBtn>
                <LinkBtn variant="secondary" size="lg" icon={Phone} href={`tel:${host.phone}`}>שיחה</LinkBtn>
              </div>
            ) : null}
          </Card>
        ) : null}
      </main>
    </Shell>
  );
}
