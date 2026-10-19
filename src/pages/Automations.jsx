/**
 * אוטומציות = מסע האורח (014). Four steps the server really runs every 15 minutes (automation-runner):
 * it prepares each message at the right time, keeps quiet on Shabbat and Yom Tov, and puts it in
 * "לשלוח עכשיו" on the Today board, where one tap opens WhatsApp with the text ready.
 * Older free-form rules stay listed; the ones the runner cannot execute say so.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Moon, Trash2, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { PageHeader, SkelLine, Card, StatusPill } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { DB_FEATURES } from '@/config/dbFeatures';
import { JOURNEY_STEPS, stepOfRule, ruleForStep } from '@/lib/real/journey';
import { renderTemplate } from '@/lib/stay/whatsapp';
import { todayISO, addDays } from '@/lib/stay/format';
import { cn } from '@/lib/utils';

const TEMPLATES_OK = new Set(['confirmation', 'arrival_eve', 'welcome', 'thanks_review', 'balance_reminder', 'checkin_link']);
function runnable(rule) {
  if (!['BOOKING_CONFIRMED', 'BOOKING_CREATED', 'CHECKIN_DAY', 'CHECKOUT_DAY'].includes(rule?.trigger)) return false;
  const acts = Array.isArray(rule?.actions) ? rule.actions : [];
  return acts.some((a) => a?.type === 'REQUEST_REVIEW' || (a?.type === 'SEND_WHATSAPP' && TEMPLATES_OK.has(a?.config?.template)));
}

const SAMPLE = {
  booking: { guest_name: 'נועה לוי', check_in_date: addDays(todayISO(), 7), check_out_date: addDays(todayISO(), 9), guest_token: 'example' },
  property: { name: 'הצימר שלכם', guest_info: { check_in_time: '15:00', check_out_time: '11:00', wifi_name: 'atlas-guest' } },
};

function StepCard({ step, rule, onSave, busy, respectShabbat }) {
  const on = !!rule?.is_active;
  const cond = rule && !Array.isArray(rule.conditions) ? rule.conditions || {} : {};
  const [time, setTime] = useState(cond.send_time || step.defaultTime || '');
  const [preview, setPreview] = useState(false);
  const text = useMemo(() => renderTemplate(step.template, { ...SAMPLE, orgName: '' }), [step.template]);
  return (
    <Card as="li" className="p-5 md:p-6" data-step={step.key}>
      <div className="flex items-start gap-3">
        <span className={cn('inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full', on ? 'bg-[#E9E7FE] text-brand-600' : 'bg-[#F1F3FA] text-ink-400')} aria-hidden>
          <MessageCircle className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[16px] font-bold text-navy-900">
            {step.title}
            {on ? <StatusPill tone="mint" label="פועל" /> : <StatusPill tone="slate" label="כבוי" />}
          </p>
          <p className="mt-1 text-[14px] text-ink-600">{step.why}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[14px] text-ink-600">
            <span>{step.when}</span>
            {step.defaultTime ? (
              <label className="inline-flex items-center gap-2">
                <span>בשעה</span>
                <Input
                  type="time" value={time} step={900} aria-label={`שעת שליחה: ${step.title}`}
                  onChange={(e) => setTime(e.target.value)}
                  onBlur={() => { if (on && time && time !== cond.send_time) onSave(step, { on: true, sendTime: time }); }}
                  className="h-11 w-[110px] tabular" dir="ltr"
                />
              </label>
            ) : null}
          </div>
          <button type="button" onClick={() => setPreview((v) => !v)} aria-expanded={preview} className="press mt-2 inline-flex min-h-[44px] items-center gap-1 text-[14px] font-semibold text-brand-600">
            {preview ? 'הסתרת ההודעה' : 'איך ההודעה נראית'}
            <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', preview && 'rotate-180')} strokeWidth={1.75} />
          </button>
          {preview ? <p className="mt-1 whitespace-pre-line rounded-[16px] bg-[#E7F8EE] p-3 text-[14px] leading-relaxed text-navy-900">{text}</p> : null}
        </div>
        <Switch
          checked={on} disabled={busy}
          onCheckedChange={(v) => onSave(step, { on: v, sendTime: time, respectShabbat })}
          aria-label={on ? `כיבוי: ${step.title}` : `הפעלה: ${step.title}`}
        />
      </div>
    </Card>
  );
}

export default function AutomationsPage({ orgId }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['automations', orgId],
    queryFn: () => (orgId ? base44.entities.AutomationRule.filter({ org_id: orgId }, 'created_at', 200) : Promise.resolve([])),
    enabled: !!orgId,
  });
  const rules = q.data || [];
  const byStep = useMemo(() => {
    const m = new Map();
    for (const r of rules) { const s = stepOfRule(r); if (s && !m.has(s.key)) m.set(s.key, r); }
    return m;
  }, [rules]);
  const others = rules.filter((r) => !stepOfRule(r));
  const journeyRules = [...byStep.values()];
  const respectShabbat = journeyRules.length ? journeyRules.every((r) => (r.conditions || {}).respect_shabbat !== false) : true;
  const [busy, setBusy] = useState(false);

  const save = async (step, { on, sendTime, respectShabbat: rs = respectShabbat }) => {
    setBusy(true);
    try {
      const existing = byStep.get(step.key);
      const payload = { ...ruleForStep(step, { sendTime, respectShabbat: rs }), is_active: on };
      if (existing) await base44.entities.AutomationRule.update(existing.id, payload);
      else await base44.entities.AutomationRule.create({ ...payload, org_id: orgId, execution_count: 0 });
      atlasToastApi.success(on ? `${step.title}: פועל` : `${step.title}: כבוי`);
    } catch {
      atlasToastApi.error('לא הצלחנו לשמור');
    } finally {
      setBusy(false);
      qc.invalidateQueries({ queryKey: ['automations'] });
      qc.invalidateQueries({ queryKey: ['message_queue'] });
    }
  };

  const setShabbat = async (v) => {
    setBusy(true);
    try {
      await Promise.all(journeyRules.map((r) => base44.entities.AutomationRule.update(r.id, { conditions: { ...(r.conditions || {}), respect_shabbat: v } })));
      atlasToastApi.success(v ? 'לא נשלח הודעות בשבת ובחג' : 'הודעות יישלחו גם בשבת ובחג');
    } catch { atlasToastApi.error('לא הצלחנו לשמור'); }
    finally { setBusy(false); qc.invalidateQueries({ queryKey: ['automations'] }); }
  };

  const turnAllOn = async () => {
    for (const s of JOURNEY_STEPS) if (!byStep.get(s.key)?.is_active) await save(s, { on: true, sendTime: s.defaultTime });
  };

  const removeOther = useMutation({
    mutationFn: (id) => base44.entities.AutomationRule.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['automations'] }); atlasToastApi.success('האוטומציה נמחקה'); },
  });
  const toggleOther = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.AutomationRule.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  });

  if (q.isLoading) {
    return (
      <div className="mx-auto w-full max-w-[960px] px-5 pt-6 md:px-10 md:pt-10" role="status" aria-busy="true" aria-label="טוען">
        <SkelLine className="h-8 w-40" /><div className="mt-6 space-y-3">{[0, 1, 2, 3].map((i) => <SkelLine key={i} className="h-28 rounded-[22px]" />)}</div>
      </div>
    );
  }

  const allOn = JOURNEY_STEPS.every((s) => byStep.get(s.key)?.is_active);

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-5 px-5 pb-16 pt-6 md:px-10 md:pt-10" dir="rtl">
      <PageHeader
        title="מסע האורח"
        subtitle="atlas מכינה כל הודעה בזמן הנכון, ואתם שולחים בלחיצה מלוח היום."
        className="!mb-0"
        actions={!allOn ? <Button className="h-11" onClick={turnAllOn} disabled={busy}>הפעלת כל המסע</Button> : null}
      />

      {!DB_FEATURES.realCore ? (
        <Card className="p-5"><p className="text-[14px] text-ink-600">מנוע האוטומציות רץ בשרת של atlas, ולכן הוא פועל בחשבון מחובר ולא במצב ההדגמה.</p></Card>
      ) : null}

      <Card className="flex items-center gap-3 p-5 md:px-6">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F1F3FA] text-navy-900" aria-hidden><Moon className="h-5 w-5" strokeWidth={1.75} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-navy-900">שקט בשבת ובחג</p>
          <p className="text-[13px] text-ink-400">הודעה שמגיע זמנה בין הדלקת נרות לצאת השבת או החג תחכה ל-20 דקות אחרי ההבדלה (זמני ירושלים, Hebcal).</p>
        </div>
        <Switch checked={respectShabbat} disabled={busy || !journeyRules.length} onCheckedChange={setShabbat} aria-label="שקט בשבת ובחג" />
      </Card>

      <ol className="space-y-3" aria-label="שלבי המסע">
        {JOURNEY_STEPS.map((s) => <StepCard key={s.key} step={s} rule={byStep.get(s.key)} onSave={save} busy={busy} respectShabbat={respectShabbat} />)}
      </ol>

      <Card className="p-5 md:px-6">
        <p className="text-[15px] font-bold text-navy-900">איך זה נשלח היום</p>
        <p className="mt-1 text-[14px] leading-relaxed text-ink-600">
          כל 15 דקות atlas בודקת את ההזמנות ומכינה את ההודעות שהגיע זמנן. הן מחכות ב<Link to="/today" className="font-semibold text-brand-600 underline-offset-2 hover:underline">לוח היום</Link> תחת "לשלוח עכשיו": לחיצה פותחת וואטסאפ עם הטקסט והטלפון של האורח, ואחרי השליחה ההודעה מסומנת כנשלחה.
          שליחה אוטומטית לגמרי, בלי לחיצה, תגיע עם חיבור WhatsApp Business API.
        </p>
      </Card>

      {others.length ? (
        <section aria-label="אוטומציות נוספות" className="space-y-2">
          <h2 className="pt-2 text-[15px] font-bold text-navy-900">אוטומציות נוספות שנשמרו</h2>
          <ul className="space-y-2">
            {others.map((r) => {
              const ok = runnable(r);
              return (
                <Card as="li" key={r.id} className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 truncate text-[15px] font-semibold text-navy-900">
                      {r.name || 'אוטומציה'}
                      {ok ? <StatusPill tone="mint" label="רצה" /> : <StatusPill tone="slate" label="עוד לא נתמכת" />}
                    </p>
                    {!ok ? <p className="text-[13px] text-ink-400">הפעולה הזו עוד לא מבוצעת בשרת, ולכן לא תצא בפועל.</p> : null}
                  </div>
                  <Switch checked={!!r.is_active} onCheckedChange={(v) => toggleOther.mutate({ id: r.id, is_active: v })} aria-label={`הפעלה: ${r.name || 'אוטומציה'}`} />
                  <Button variant="ghost" size="icon" className="h-11 w-11" aria-label={`מחיקה: ${r.name || 'אוטומציה'}`} onClick={() => removeOther.mutate(r.id)}>
                    <Trash2 className="h-4 w-4 text-ink-400" strokeWidth={1.75} />
                  </Button>
                </Card>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
