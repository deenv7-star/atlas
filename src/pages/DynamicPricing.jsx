/**
 * תמחור לפי חגים וסופ"ש (014): the owner sets base / weekend / holiday uplift / single-night discount per unit,
 * ATLAS suggests a price for every night of the next 8 weeks from the Hebrew calendar (Hebcal → il_calendar)
 * and the unit's real bookings. Suggestions only: nothing is pushed to Airbnb / Booking (iCal carries dates only).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Save, Star, CalendarDays, Moon } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';
import { useStayData, useStayMutations } from '@/hooks/useStayData';
import { PageHeader, Card, SegmentedControl, SkelLine, fmtMoney } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { todayISO, addDays, parseDay, formatDayHe } from '@/lib/stay/format';
import { rulesOf, bookedNights, holidayMap, suggestRange } from '@/lib/real/pricing';
import { cn } from '@/lib/utils';

const WEEKS = 8;
const DOW = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

function useIlCalendar(from, to) {
  return useQuery({
    queryKey: ['il_calendar', from, to],
    enabled: isSupabaseConfigured,
    staleTime: 6 * 3600_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('il_calendar').select('day, kind, title_he, title_en, yomtov, price_relevant').eq('kind', 'holiday').gte('day', from).lte('day', to).order('day');
      if (error) throw error;
      return data || [];
    },
  });
}

function Field({ id, label, hint, suffix, value, onChange }) {
  return (
    <div className="min-w-0">
      <Label htmlFor={id} className="text-[14px] font-semibold text-navy-900">{label}</Label>
      <div className="relative mt-1.5">
        <Input id={id} inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, '').slice(0, 6))} className="h-12 pe-3 ps-10 tabular" dir="ltr" style={{ textAlign: 'right' }} />
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[14px] text-ink-400">{suffix}</span>
      </div>
      {hint ? <p className="mt-1 text-[12px] text-ink-400">{hint}</p> : null}
    </div>
  );
}

const KIND_STYLE = {
  holiday: 'bg-[#ECEAFE] text-brand-700 ring-1 ring-inset ring-[#D9D4FD]',
  weekend: 'bg-[#F1F3FA] text-navy-900',
  gap: 'bg-[#E8F7EF] text-[#11603A] ring-1 ring-inset ring-[#CBEBD9]',
  base: 'bg-white text-navy-900 ring-1 ring-inset ring-[#EEF0F5]',
  booked: 'bg-[#F7F8FB] text-ink-300',
};

export default function DynamicPricing() {
  const data = useStayData({ withCleaning: false });
  const { updateProperty } = useStayMutations();
  const properties = data.properties || [];
  const [unitId, setUnitId] = useState('');
  const unit = properties.find((p) => p.id === unitId) || properties[0] || null;
  useEffect(() => { if (!unitId && properties[0]) setUnitId(properties[0].id); }, [unitId, properties]);

  const saved = useMemo(() => rulesOf(unit), [unit]);
  const [form, setForm] = useState(null);
  const [initial, setInitial] = useState('');
  useEffect(() => {
    if (!unit) return;
    const f = {
      base: saved.base ? String(saved.base) : '',
      weekend: saved.weekend ? String(saved.weekend) : '',
      holiday_uplift_pct: String(saved.holiday_uplift_pct),
      gap_night_discount_pct: String(saved.gap_night_discount_pct),
      min: saved.min ? String(saved.min) : '',
    };
    setForm(f);
    setInitial(JSON.stringify(f));
  }, [unit?.id, JSON.stringify(unit?.pricing || {}), unit?.base_price]); // eslint-disable-line react-hooks/exhaustive-deps

  const rules = useMemo(() => (form ? rulesOf({ pricing: { ...form, base: Number(form.base) || 0 }, base_price: 0 }) : saved), [form, saved]);

  // calendar starts on this week's Sunday
  const today = todayISO();
  const start = addDays(today, -parseDay(today).getDay());
  const end = addDays(start, WEEKS * 7);
  const cal = useIlCalendar(start, end);
  const holidays = useMemo(() => holidayMap(cal.data), [cal.data]);
  const booked = useMemo(() => (unit ? bookedNights(data.bookings, unit.id) : new Set()), [data.bookings, unit]);
  const nights = useMemo(() => suggestRange(start, WEEKS * 7, rules, { booked, holidays }), [start, rules, booked, holidays]);
  const upcoming = useMemo(() => nights.filter((n) => n.day >= today && (n.kind === 'holiday' || n.kind === 'gap')).slice(0, 8), [nights, today]);

  const dirty = !!form && (JSON.stringify(form) !== initial || !saved.saved);

  const save = async () => {
    if (!unit || !form) return;
    const base = Number(form.base) || 0;
    if (!base) { atlasToastApi.error('הכניסו מחיר בסיס ללילה'); return; }
    const pricing = {
      ...(unit.pricing || {}),
      base,
      weekend: Number(form.weekend) || rules.weekend,
      holiday_uplift_pct: Math.min(300, Number(form.holiday_uplift_pct) || 0),
      gap_night_discount_pct: Math.min(90, Number(form.gap_night_discount_pct) || 0),
      min: Number(form.min) || null,
      updated_at: new Date().toISOString(),
    };
    try {
      await updateProperty.mutateAsync({ id: unit.id, data: { pricing, base_price: base } });
      atlasToastApi.success(`המחירים של ${unit.name} נשמרו`);
    } catch {
      atlasToastApi.error('לא הצלחנו לשמור את המחירים');
    }
  };

  if (data.isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1200px] px-5 pt-6 md:px-10 md:pt-10" role="status" aria-busy="true" aria-label="טוען">
        <SkelLine className="h-8 w-48" /><SkelLine className="mt-6 h-56 rounded-[24px]" /><SkelLine className="mt-4 h-80 rounded-[24px]" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5 px-5 pb-16 pt-6 md:px-10 md:pt-10" dir="rtl">
      <PageHeader title="תמחור חגים וסופ״ש" subtitle="מחיר בסיס, סוף שבוע וחגים. ATLAS מציעה מחיר לכל לילה לפי הלוח העברי וההזמנות שלכם." className="!mb-0" />

      {properties.length === 0 ? (
        <Card className="p-6 text-center"><p className="text-[16px] font-semibold text-navy-900">עוד אין יחידות</p><p className="mt-1 text-[14px] text-ink-400">הוסיפו יחידה כדי לקבוע לה מחירים.</p></Card>
      ) : (
        <>
          {properties.length > 1 ? (
            <SegmentedControl ariaLabel="יחידה" value={unit?.id} onChange={setUnitId} options={properties.map((p) => ({ value: p.id, label: p.name }))} />
          ) : null}

          <Card as="section" aria-label="חוקי מחיר" className="p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[17px] font-bold text-navy-900">המחירים של {unit?.name}</h2>
                <p className="mt-1 text-[13px] text-ink-400">לילות סוף שבוע: חמישי ושישי. חגים, ערבי חג וחול המועד לפי Hebcal.</p>
              </div>
              <Button onClick={save} disabled={!dirty || updateProperty.isPending} className="h-11">
                <Save className="h-4 w-4" strokeWidth={1.75} />{updateProperty.isPending ? 'שומר…' : 'שמירה'}
              </Button>
            </div>
            {form ? (
              <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-5">
                <Field id="p-base" label="מחיר בסיס ללילה" suffix="₪" value={form.base} onChange={(v) => setForm({ ...form, base: v })} />
                <Field id="p-weekend" label="לילה בסוף שבוע" suffix="₪" hint={form.weekend ? '' : 'ברירת מחדל: בסיס +25%'} value={form.weekend} onChange={(v) => setForm({ ...form, weekend: v })} />
                <Field id="p-holiday" label="תוספת בחגים" suffix="%" value={form.holiday_uplift_pct} onChange={(v) => setForm({ ...form, holiday_uplift_pct: v })} />
                <Field id="p-gap" label="הנחה ללילה בודד" suffix="%" hint="לילה פנוי בין שתי הזמנות" value={form.gap_night_discount_pct} onChange={(v) => setForm({ ...form, gap_night_discount_pct: v })} />
                <Field id="p-min" label="מחיר מינימום" suffix="₪" value={form.min} onChange={(v) => setForm({ ...form, min: v })} />
              </div>
            ) : null}
          </Card>

          <div className="grid gap-4 lg:grid-cols-12">
            <Card as="section" aria-label="מחיר מוצע לכל לילה" className="min-w-0 p-4 md:p-6 lg:col-span-8">
              <h2 className="text-[17px] font-bold text-navy-900">מחיר מוצע ל-8 השבועות הקרובים</h2>
              {!rules.base ? (
                <p className="mt-3 text-[14px] text-ink-400">הכניסו מחיר בסיס כדי לראות הצעות מחיר.</p>
              ) : (
                <>
                  <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[12px] font-semibold text-ink-400" aria-hidden>
                    {DOW.map((d) => <span key={d}>{d}</span>)}
                  </div>
                  <ol className="mt-1 grid grid-cols-7 gap-1" aria-label="לילות">
                    {nights.map((n) => {
                      const past = n.day < today;
                      const dnum = parseDay(n.day).getDate();
                      return (
                        <li
                          key={n.day}
                          title={n.reason || undefined}
                          aria-label={`${formatDayHe(n.day)}: ${n.kind === 'booked' ? 'תפוס' : n.price ? fmtMoney(n.price) : ''}${n.label ? `, ${n.label}` : ''}`}
                          className={cn('flex min-h-[58px] flex-col items-center justify-center rounded-[12px] px-0.5 py-1', KIND_STYLE[n.kind], past && 'opacity-40')}
                          data-kind={n.kind}
                        >
                          <span className="text-[11px] leading-none text-ink-400">{dnum}</span>
                          <span className="tabular mt-1 text-[12px] font-bold leading-none md:text-[14px]">{n.kind === 'booked' ? 'תפוס' : n.price ? `₪${n.price.toLocaleString('he-IL')}` : ''}</span>
                          {n.label && n.kind !== 'booked' ? <span className="mt-1 max-w-full truncate text-[10px] leading-none">{n.label}</span> : null}
                        </li>
                      );
                    })}
                  </ol>
                  <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-400">
                    <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#ECEAFE] ring-1 ring-[#D9D4FD]" />חג</span>
                    <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#F1F3FA] ring-1 ring-[#E3E6EF]" />סוף שבוע</span>
                    <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#E8F7EF] ring-1 ring-[#CBEBD9]" />לילה בודד</span>
                  </p>
                </>
              )}
            </Card>

            <Card as="section" aria-label="מה כדאי לעדכן" className="min-w-0 p-4 md:p-6 lg:col-span-4">
              <h2 className="text-[17px] font-bold text-navy-900">כדאי לעדכן בערוצים</h2>
              {cal.isLoading ? <SkelLine className="mt-4 h-24" /> : upcoming.length === 0 ? (
                <p className="mt-3 text-[14px] text-ink-400">אין חגים או לילות בודדים ב-8 השבועות הקרובים.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {upcoming.map((n) => (
                    <li key={n.day} className="flex items-center gap-3 rounded-[14px] bg-[#F7F8FB] px-3 py-2.5">
                      <span className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full', n.kind === 'holiday' ? 'bg-[#ECEAFE] text-brand-600' : 'bg-[#E8F7EF] text-[#11603A]')} aria-hidden>
                        {n.kind === 'holiday' ? <Star className="h-4 w-4" strokeWidth={1.75} /> : <Moon className="h-4 w-4" strokeWidth={1.75} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-navy-900">{formatDayHe(n.day)} · {n.label}</p>
                        <p className="truncate text-[12px] text-ink-400">{n.reason}</p>
                      </div>
                      <span className="tabular shrink-0 text-[15px] font-bold text-navy-900">{fmtMoney(n.price)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 flex gap-2 text-[12px] leading-relaxed text-ink-400">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
                אלה הצעות. ATLAS עוד לא משנה מחירים ב-Airbnb או ב-Booking, כי סנכרון יומנים מעביר רק תאריכים. עדכנו את המחיר בערוץ, והשתמשו בו בהצעות מחיר ללידים.
              </p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
