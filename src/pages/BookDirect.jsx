/**
 * Direct-booking / availability page per property (public, no login): /book/:slug
 * Shows free dates and an inquiry form that creates a Lead, so owners skip the commission.
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Users, BedDouble, Clock, Check, CalendarSearch, Send } from 'lucide-react';
import { fetchPublicProperty, submitDirectInquiry } from '@/lib/stay/publicApi';
import { formatDayHe, formatMoney, nightsBetween } from '@/lib/stay/format';
import { AvailabilityCalendar } from '@/components/stay/AvailabilityCalendar';
import { Wordmark, Btn } from '@/components/stay/StayUI';
import '@/styles/atlas-brand.css';
import { heCount } from '@/lib/hebrewCount';
import TermsConsent from '@/components/legal/TermsConsent';

function Shell({ children }) {
  return (
    <div dir="rtl" className="ab-root min-h-[100dvh]" style={{ background: 'var(--canvas)' }}>
      {children}
      <footer className="py-8 flex flex-col items-center gap-1.5">
        <span className="ab-faint">הזמנה ישירה מהמארחים, בלי עמלות</span>
        <Wordmark size={16} />
      </footer>
    </div>
  );
}

const PHONE_RE = /^[\d\s+\-()]{9,}$/;

export default function BookDirectPage() {
  const { slug } = useParams();
  const q = useQuery({ queryKey: ['public-property', slug], queryFn: () => fetchPublicProperty(slug), retry: false, staleTime: 60_000 });
  const [range, setRange] = useState({ ci: '', co: '' });
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', adults: 2, children: 0, notes: '' });
  const [touched, setTouched] = useState(false);
  // Upay/Bit requirement: active consent (unchecked by default) on every page we send to customers.
  const [agreed, setAgreed] = useState(false);
  const submit = useMutation({ mutationFn: (payload) => submitDirectInquiry(slug, payload) });

  useEffect(() => {
    if (q.data?.property?.name) document.title = `${q.data.property.name} · הזמנה ישירה`;
  }, [q.data]);

  if (q.isLoading) {
    return <Shell><div className="h-56" style={{ background: 'linear-gradient(180deg, #EEF0FF 0%, #F7F8FB 100%)' }} /><div className="max-w-3xl mx-auto px-4 -mt-10"><div className="ab-card h-80 animate-pulse" /></div></Shell>;
  }
  if (q.isError || !q.data) {
    return (
      <Shell>
        <div className="max-w-md mx-auto px-6 pt-24 text-center">
          <span className="ab-icon-tile mx-auto"><CalendarSearch size={20} strokeWidth={1.75} /></span>
          <h1 className="ab-h3 mt-4">הדף לא זמין כרגע</h1>
          <p className="ab-meta mt-2">ייתכן שהמארחים סגרו את ההזמנות הישירות. נסו ליצור איתם קשר.</p>
        </div>
      </Shell>
    );
  }

  const { property, host, busy } = q.data;
  const nights = nightsBetween(range.ci, range.co);
  const estimate = property.base_price && nights ? property.base_price * nights : 0;
  const guests = (Number(form.adults) || 0) + (Number(form.children) || 0);
  const tooMany = property.max_guests && guests > property.max_guests;
  const errors = {
    full_name: !form.full_name.trim() ? 'נא למלא שם' : '',
    phone: !PHONE_RE.test(form.phone.trim()) ? 'נא למלא טלפון תקין' : '',
    dates: !range.ci || !range.co ? 'נא לבחור תאריכי כניסה ויציאה בלוח' : '',
    guests: tooMany ? `עד ${property.max_guests} אורחים` : '',
    consent: !agreed ? 'consent' : '',
  };
  const valid = !Object.values(errors).some(Boolean);

  const onSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) {
      if (!errors.full_name && !errors.phone && !errors.dates && !errors.guests && errors.consent) document.getElementById('bd-consent')?.focus();
      return;
    }
    submit.mutate({ ...form, check_in_date: range.ci, check_out_date: range.co });
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const hero = Array.isArray(property.images) && property.images[0] ? (property.images[0].url || property.images[0]) : null;

  return (
    <Shell>
      <header className="relative overflow-hidden" style={{ background: hero ? 'var(--navy-900)' : 'linear-gradient(180deg, #EEF0FF 0%, #F7F8FB 100%)' }}>
        {hero ? <img src={hero} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" /> : null}
        <div className="relative max-w-3xl mx-auto px-5 pt-10 pb-16">
          {host?.name ? <p className="text-[15px] font-medium" style={{ color: hero ? '#C9CDF9' : 'var(--brand-600, #3E2BF1)' }}>{host.name}</p> : null}
          <h1 className="mt-1 text-[32px] sm:text-[40px] leading-[1.15] font-extrabold" style={{ color: hero ? '#FFFFFF' : '#1B2656' }}>{property.name}</h1>
          {property.address ? <p className="mt-2 text-[15px]" style={{ color: hero ? '#DADDF6' : '#4A5578' }}>{property.address}</p> : null}
          {property.description ? <p className="mt-3 text-[16px] max-w-[52ch]" style={{ color: hero ? '#FFFFFF' : '#1B2656' }}>{property.description}</p> : null}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[14px]" style={{ color: hero ? '#DADDF6' : '#4A5578' }}>
            {property.max_guests ? <span className="inline-flex items-center gap-1.5"><Users size={16} strokeWidth={1.75} /> עד {property.max_guests} אורחים</span> : null}
            {property.bedrooms ? <span className="inline-flex items-center gap-1.5"><BedDouble size={16} strokeWidth={1.75} /> {property.bedrooms} חדרי שינה</span> : null}
            <span className="inline-flex items-center gap-1.5"><Clock size={16} strokeWidth={1.75} /> כניסה {property.check_in_time || '15:00'} · יציאה {property.check_out_time || '11:00'}</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 -mt-10 relative space-y-3">
        {submit.isSuccess ? (
          <section className="ab-card p-6 text-center ab-enter">
            <span className="ab-icon-tile mx-auto" style={{ background: '#E3F6EE', color: 'var(--status-success)' }}><Check size={20} strokeWidth={2} /></span>
            <h2 className="ab-h3 mt-3">הפנייה נשלחה</h2>
            <p className="mt-2" style={{ color: 'var(--ink-600)' }}>
              ביקשתם {formatDayHe(range.ci)} עד {formatDayHe(range.co)}. המארחים יחזרו אליכם לטלפון {form.phone} בהקדם.
            </p>
          </section>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-3">
            <section className="ab-card p-4 sm:p-5">
              <h2 className="ab-h3">בחרו תאריכים</h2>
              <p className="ab-meta mt-0.5 mb-4">לחצו על יום הכניסה ואז על יום היציאה.</p>
              <AvailabilityCalendar busy={busy || []} value={range} onChange={setRange} />
              <div className="mt-4 rounded-[10px] px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1" style={{ background: range.ci ? 'var(--brand-50)' : '#F0F2F7' }}>
                {range.ci ? (
                  <>
                    <span className="font-bold">{formatDayHe(range.ci)}{range.co ? ` עד ${formatDayHe(range.co)}` : ''}</span>
                    {nights ? <span className="ab-meta ab-num">{heCount(nights, 'night')}</span> : <span className="ab-meta">בחרו יום יציאה</span>}
                    {estimate ? <span className="ab-meta">מחיר משוער: <b className="ab-num" style={{ color: 'var(--ink-900)' }}>{formatMoney(estimate)}</b></span> : null}
                  </>
                ) : <span className="ab-meta">עדיין לא נבחרו תאריכים</span>}
              </div>
              {touched && errors.dates ? <p className="mt-2 text-[13px] font-bold" style={{ color: 'var(--status-danger)' }}>{errors.dates}</p> : null}
            </section>

            <section className="ab-card p-4 sm:p-5">
              <h2 className="ab-h3 mb-4">פרטים ליצירת קשר</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="ab-label" htmlFor="bd-name">שם מלא</label>
                  <input id="bd-name" className="ab-input" autoComplete="name" value={form.full_name} onChange={set('full_name')} aria-invalid={touched && !!errors.full_name} />
                  {touched && errors.full_name ? <p className="mt-1 text-[13px] font-bold" style={{ color: 'var(--status-danger)' }}>{errors.full_name}</p> : null}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="ab-label" htmlFor="bd-phone">טלפון</label>
                  <input id="bd-phone" className="ab-input" type="tel" inputMode="tel" dir="ltr" style={{ textAlign: 'right' }} autoComplete="tel" value={form.phone} onChange={set('phone')} aria-invalid={touched && !!errors.phone} />
                  {touched && errors.phone ? <p className="mt-1 text-[13px] font-bold" style={{ color: 'var(--status-danger)' }}>{errors.phone}</p> : null}
                </div>
                <div className="col-span-2">
                  <label className="ab-label" htmlFor="bd-email">אימייל (לא חובה)</label>
                  <input id="bd-email" className="ab-input" type="email" dir="ltr" style={{ textAlign: 'right' }} autoComplete="email" value={form.email} onChange={set('email')} />
                </div>
                <div>
                  <label className="ab-label" htmlFor="bd-adults">מבוגרים</label>
                  <input id="bd-adults" className="ab-input ab-num" type="number" min={1} max={30} value={form.adults} onChange={set('adults')} />
                </div>
                <div>
                  <label className="ab-label" htmlFor="bd-children">ילדים</label>
                  <input id="bd-children" className="ab-input ab-num" type="number" min={0} max={30} value={form.children} onChange={set('children')} />
                </div>
                {errors.guests ? <p className="col-span-2 -mt-1 text-[13px] font-bold" style={{ color: 'var(--status-danger)' }}>{errors.guests}</p> : null}
                <div className="col-span-2">
                  <label className="ab-label" htmlFor="bd-notes">משהו שחשוב לנו לדעת? (לא חובה)</label>
                  <textarea id="bd-notes" className="ab-input" rows={3} value={form.notes} onChange={set('notes')} />
                </div>
              </div>
              {submit.isError ? <p className="mt-3 text-[14px] font-bold" style={{ color: 'var(--status-danger)' }}>הפנייה לא נשלחה. נסו שוב בעוד רגע.</p> : null}
              <TermsConsent id="bd-consent" className="mt-4" refundLine={false} checked={agreed} onChange={setAgreed} error={touched && !agreed} />
              <Btn type="submit" variant="primary" size="lg" icon={Send} className="w-full mt-4" disabled={submit.isPending}>
                {submit.isPending ? 'שולח…' : 'שליחת בקשה להזמנה'}
              </Btn>
              <p className="ab-faint text-center mt-2">זו בקשה בלבד. ההזמנה נסגרת אחרי אישור המארחים.</p>
            </section>
          </form>
        )}
      </main>
    </Shell>
  );
}
