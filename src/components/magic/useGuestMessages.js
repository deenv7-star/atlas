/**
 * One hook for the guest-message screen (both designs): the four journey rules the automation-runner
 * really executes, the Shabbat switch, and a real preview context (the owner's own zimmer and next guest).
 * Same rows and payloads as before (automation_rules, ruleForStep): no schema change.
 */
import { useMemo, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { JOURNEY_STEPS, stepOfRule, ruleForStep } from '@/lib/real/journey';
import { renderTemplate } from '@/lib/stay/whatsapp';
import { todayISO, addDays } from '@/lib/stay/format';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';

const SAMPLE_BOOKING = { guest_name: 'נועה לוי', check_in_date: addDays(todayISO(), 7), check_out_date: addDays(todayISO(), 9), guest_token: 'example' };
const SAMPLE_PROPERTY = { name: 'הצימר שלכם', guest_info: { check_in_time: '15:00', check_out_time: '11:00', wifi_name: 'atlas-guest' } };

export function useGuestMessages(orgId) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['automations', orgId],
    queryFn: () => (orgId ? base44.entities.AutomationRule.filter({ org_id: orgId }, 'created_at', 200) : Promise.resolve([])),
    enabled: !!orgId,
  });
  const props = useQuery({
    queryKey: ['magic-preview-property', orgId],
    queryFn: () => base44.entities.Property.list().catch(() => []),
    enabled: !!orgId, staleTime: 5 * 60 * 1000,
  });
  const next = useQuery({
    queryKey: ['magic-preview-booking', orgId],
    queryFn: () => base44.entities.Booking.filter({ org_id: orgId }, 'check_in_date', 200).catch(() => []),
    enabled: !!orgId, staleTime: 5 * 60 * 1000,
  });

  const rules = useMemo(() => q.data || [], [q.data]);
  const byStep = useMemo(() => {
    const m = new Map();
    for (const r of rules) { const s = stepOfRule(r); if (s && !m.has(s.key)) m.set(s.key, r); }
    return m;
  }, [rules]);
  const others = rules.filter((r) => !stepOfRule(r));
  const journeyRules = [...byStep.values()];
  const respectShabbat = journeyRules.length ? journeyRules.every((r) => (r.conditions || {}).respect_shabbat !== false) : true;
  const [busy, setBusy] = useState(false);

  const ctx = useMemo(() => {
    const p = (props.data || [])[0];
    const t = todayISO();
    const b = (next.data || []).find((x) => x?.check_in_date >= t && !/^חסום/.test(String(x?.guest_name || '')) && !['CANCELLED', 'CANCELED'].includes(String(x?.status || '').toUpperCase()));
    return { booking: b || SAMPLE_BOOKING, property: p || SAMPLE_PROPERTY, orgName: '', sample: !b };
  }, [props.data, next.data]);

  const textFor = useCallback((step) => renderTemplate(step.template, ctx), [ctx]);
  const isOn = (step) => !!byStep.get(step.key)?.is_active;
  const timeOf = (step) => {
    const r = byStep.get(step.key);
    const c = r && !Array.isArray(r.conditions) ? r.conditions || {} : {};
    return c.send_time || step.defaultTime || null;
  };

  const refresh = () => { qc.invalidateQueries({ queryKey: ['automations'] }); qc.invalidateQueries({ queryKey: ['message_queue'] }); };

  /** Saves one step. Returns true on success. quiet: no toast (the caller shows its own moment). */
  const save = async (step, { on, sendTime, quiet = false }) => {
    setBusy(true);
    try {
      const existing = byStep.get(step.key);
      const payload = { ...ruleForStep(step, { sendTime: sendTime || timeOf(step), respectShabbat }), is_active: on };
      if (existing) await base44.entities.AutomationRule.update(existing.id, payload);
      else await base44.entities.AutomationRule.create({ ...payload, org_id: orgId, execution_count: 0 });
      if (!quiet) atlasToastApi.success(on ? `${step.short}: פועל` : `${step.short}: כבוי`);
      return true;
    } catch {
      atlasToastApi.error('לא הצלחנו לשמור. נסו שוב.');
      return false;
    } finally { setBusy(false); refresh(); }
  };

  const turnAllOn = async () => {
    let ok = true;
    for (const s of JOURNEY_STEPS) if (!isOn(s)) ok = (await save(s, { on: true, sendTime: timeOf(s), quiet: true })) && ok;
    return ok;
  };

  const setShabbat = async (v) => {
    setBusy(true);
    try {
      await Promise.all(journeyRules.map((r) => base44.entities.AutomationRule.update(r.id, { conditions: { ...(r.conditions || {}), respect_shabbat: v } })));
      atlasToastApi.success(v ? 'לא נשלח הודעות בשבת ובחג' : 'הודעות יישלחו גם בשבת ובחג');
    } catch { atlasToastApi.error('לא הצלחנו לשמור. נסו שוב.'); }
    finally { setBusy(false); refresh(); }
  };

  const toggleOther = async (id, is_active) => { await base44.entities.AutomationRule.update(id, { is_active }); refresh(); };
  const removeOther = async (id) => { await base44.entities.AutomationRule.delete(id); refresh(); atlasToastApi.success('נמחק'); };

  const onCount = JOURNEY_STEPS.filter(isOn).length;
  return {
    loading: q.isLoading, steps: JOURNEY_STEPS, byStep, others, isOn, timeOf, textFor, ctx,
    respectShabbat, hasRules: journeyRules.length > 0, busy, save, turnAllOn, setShabbat, toggleOther, removeOther,
    onCount, allOn: onCount === JOURNEY_STEPS.length,
  };
}

/** "10:00" → "10:00"; null → "" */
export const hhmm = (t) => (t ? String(t).slice(0, 5) : '');
