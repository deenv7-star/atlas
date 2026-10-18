// Handoff keywords, rate limits, model pricing. Pure functions (unit-tested in dev/qa.ts).

/** Phrases that mean "I want a person" or "this is beyond the bot" → offer a human right away. */
const HUMAN_PATTERNS: RegExp[] = [
  /נציג/, /בן\s*אדם/, /בנאדם/, /אדם\s*(אמיתי|אנושי)/, /מישהו\s*(אמיתי|מהצוות|שיעזור)/, /לדבר\s*עם\s*(מישהו|דין|צוות|תמיכה|אדם)/,
  /תמיכה\s*אנושית/, /שירות\s*לקוחות/, /תתקשרו/, /שיחזרו\s*אלי/, /טלפון\s*של\s*(התמיכה|השירות)/,
  /ביטול\s*(ה)?מנוי/, /לבטל\s*(את\s*)?(ה)?מנוי/, /החזר\s*כספי/, /להחזיר\s*(לי\s*)?(את\s*ה)?כסף/, /חויבתי/, /חיוב\s*כפול/,
  /למחוק\s*(את\s*)?(ה)?חשבון/, /מחיקת\s*(ה)?חשבון/, /עורך\s*דין/, /תביעה/,
  /לא\s*עובד\s*כלום/, /נמאס/, /מתסכל/, /זה\s*לא\s*עוזר/, /לא\s*עזרת/, /לא\s*הבנת/, /תשובה\s*לא\s*נכונה/,
  /\b(human|agent|representative|real person)\b/i,
];
export function wantsHuman(text: string): boolean {
  return HUMAN_PATTERNS.some((re) => re.test(text));
}

/** Customer messages allowed per window (per user, counted in support_messages). */
export const RATE = {
  burst: { max: Number(Deno.env.get('SUPPORT_RATE_BURST') || 8), minutes: 2 },
  hour: { max: Number(Deno.env.get('SUPPORT_RATE_HOUR') || 40), minutes: 60 },
  day: { max: Number(Deno.env.get('SUPPORT_RATE_DAY') || 120), minutes: 24 * 60 },
};

/** USD per 1M tokens: [input, cached input, output]. platform.openai.com/docs/pricing, 18.10.2026. */
export const PRICES: Record<string, [number, number, number]> = {
  'gpt-6-luna': [0.10, 0.01, 0.50],
  'gpt-6.1-sol': [2.00, 0.10, 10.00],
  'gpt-6-astra': [10.00, 1.00, 50.00],
};
export function costUsd(model: string, input: number, cached: number, output: number): number {
  const p = PRICES[model];
  if (!p) return 0;
  return ((input - cached) * p[0] + cached * p[1] + output * p[2]) / 1e6;
}

/** Offer a human after this many weak answers in a row (low confidence / suggest_human / thumbs down). */
export const UNHELPFUL_LIMIT = 2;
