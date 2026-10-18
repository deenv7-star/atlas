/**
 * The guest journey the automation-runner edge function really executes (014).
 * Each step is one automation_rules row: trigger + timing_offset_hours + actions[0].config.template + conditions.
 */
export const JOURNEY_STEPS = [
  {
    key: 'confirmation',
    title: 'אישור הזמנה + קישור צ׳ק-אין',
    when: 'מיד כשהזמנה מאושרת',
    trigger: 'BOOKING_CONFIRMED',
    offsetHours: 0,
    defaultTime: null,
    template: 'confirmation',
    why: 'האורח מקבל את הפרטים וקישור לצ׳ק-אין אונליין. כך מגיע אליכם גם הטלפון של אורחי Booking ו-Airbnb.',
  },
  {
    key: 'arrival_eve',
    title: 'יום לפני ההגעה',
    when: 'יום לפני הכניסה',
    trigger: 'CHECKIN_DAY',
    offsetHours: -24,
    defaultTime: '10:00',
    template: 'arrival_eve',
    why: 'הוראות הגעה, ניווט, וויי-פיי ותזכורת יתרה אם יש.',
  },
  {
    key: 'welcome',
    title: 'ביום ההגעה',
    when: 'ביום הכניסה',
    trigger: 'CHECKIN_DAY',
    offsetHours: 0,
    defaultTime: '16:00',
    template: 'welcome',
    why: 'ברוכים הבאים, וויי-פיי ושעת היציאה.',
  },
  {
    key: 'thanks_review',
    title: 'אחרי היציאה: תודה ובקשת ביקורת',
    when: 'ביום היציאה',
    trigger: 'CHECKOUT_DAY',
    offsetHours: 0,
    defaultTime: '13:00',
    template: 'thanks_review',
    why: 'תודה קצרה וקישור לכתיבת ביקורת.',
  },
];

export function stepOfRule(rule) {
  const c = rule && !Array.isArray(rule.conditions) && rule.conditions ? rule.conditions : {};
  return JOURNEY_STEPS.find((s) => s.key === c.journey_step) || null;
}

export function ruleForStep(step, { sendTime, respectShabbat }) {
  return {
    name: step.title,
    description: step.why,
    trigger: step.trigger,
    timing_offset_hours: step.offsetHours,
    actions: [{ type: 'SEND_WHATSAPP', config: { template: step.template } }],
    conditions: { journey_step: step.key, send_time: sendTime || step.defaultTime || '10:00', respect_shabbat: respectShabbat !== false },
  };
}

/** Rules the runner understands (anything else is stored but not executed). */
export function isRunnableRule(rule) {
  if (!['BOOKING_CONFIRMED', 'BOOKING_CREATED', 'CHECKIN_DAY', 'CHECKOUT_DAY'].includes(rule?.trigger)) return false;
  const acts = Array.isArray(rule?.actions) ? rule.actions : [];
  return acts.some((a) => a?.type === 'SEND_WHATSAPP' || a?.type === 'REQUEST_REVIEW');
}
