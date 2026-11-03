/**
 * Plain Hebrew → what the owner wants done with guest messages. Runs in the browser, no AI call, so it is
 * instant, works offline and in demo, and can only ever produce the actions the automation-runner really
 * executes. Anything else gets an honest answer instead of a guess.
 *
 * parseIntent(text) → { kind: 'step', stepKey, on, time? } | { kind: 'shabbat', on } | { kind: 'balance' } | { kind: 'unknown' }
 */
const clean = (s) => String(s || '').replace(/[׳`’]/g, "'").replace(/\s+/g, ' ').trim();

const STEP_PATTERNS = [
  ['arrival_eve', /הוראות הגעה|ניווט|וויז|waze|יום לפני|ערב לפני|לפני ההגעה|לפני שמגיעים|לפני שהם מגיעים|איך מגיעים|הגעה מחר/i],
  ['thanks_review', /ביקורת|המלצה|דירוג|ביקורות|אחרי היציאה|כשיוצאים|כשעוזבים|ביום היציאה|תודה שהתארחו/],
  ['welcome', /ברוכים הבאים|ביום ההגעה|כשמגיעים|כשהם מגיעים|קבלת פנים|כשנכנסים|וויי-?פיי|wifi/i],
  ['confirmation', /אישור|מאושר|אושרה|צ'?ק-?אין|כשמזמינים|אחרי שמזמינים|הזמנה חדשה/],
];
const OFF = /(^|\s)(אל ת|לא לשלוח|לא צריך|תפסיק|תפסיקו|להפסיק|בטל|תבטלו|לבטל|לכבות|תכבו|כבו |בלי )/;

function timeOf(t) {
  const m = t.match(/(?:בשעה|ב-?|ב)\s?(\d{1,2})(?::(\d{2}))?(?!\d)/) || t.match(/(?:^|\s)(\d{1,2}):(\d{2})/);
  if (m) {
    let h = Number(m[1]); const min = m[2] ? Number(m[2]) : 0;
    if (h >= 1 && h <= 6 && /אחה"?צ|אחר הצהריים|בערב/.test(t)) h += 12;
    if (h <= 23 && min < 60) return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }
  if (/בבוקר/.test(t)) return '09:00';
  if (/בצהריים/.test(t)) return '12:00';
  if (/אחה"?צ|אחר הצהריים/.test(t)) return '16:00';
  if (/בערב/.test(t)) return '18:00';
  return null;
}

export function parseIntent(raw) {
  const t = clean(raw);
  if (!t) return { kind: 'unknown' };
  const off = OFF.test(` ${t}`);
  if (/שבת|חג/.test(t) && !STEP_PATTERNS.some(([, re]) => re.test(t))) {
    return { kind: 'shabbat', on: !(/גם בשבת|כן בשבת/.test(t) || (/לשלוח בשבת/.test(t) && !off)) };
  }
  if (/מקדמה|יתרה|לגבות|גבייה|חוב|שילמו|תשלום/.test(t) && !STEP_PATTERNS.some(([, re]) => re.test(t))) return { kind: 'balance' };
  const hit = STEP_PATTERNS.find(([, re]) => re.test(t));
  if (!hit) return { kind: 'unknown' };
  return { kind: 'step', stepKey: hit[0], on: !off, time: timeOf(t) };
}

/** Examples shown under the box: real sentences the parser understands. */
export const EXAMPLES = ['הוראות הגעה יום לפני, ב-9 בבוקר', 'תבקשו ביקורת אחרי היציאה', 'לא לשלוח בשבת'];
