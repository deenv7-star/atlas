/**
 * Onboarding round Y copy (03.11.2026). Every string both Y versions show lives here.
 * Rules (atlas-hebrew-copy-master): the owner's words, plural "אתם", headline ≤ 6 words, helper ≤ 12 words,
 * verb + object buttons, no slashes, no calques, "atlas" lowercase, never glued to a Hebrew letter.
 */
const NAME_Q = {
  zimmer: 'איך קוראים לצימר?',
  villa: 'איך קוראים לווילה?',
  complex: 'איך קוראים למתחם?',
  zimmer_complex: 'איך קוראים למתחם?',
  guesthouse: 'איך קוראים לבית ההארחה?',
  boutique: 'איך קוראים למלון?',
  apartments: 'איך קוראים לדירות?',
};
const NAME_PH = {
  zimmer: 'למשל: צימר הזית',
  villa: 'למשל: וילה בכרם',
  complex: 'למשל: בקתות הגליל',
  zimmer_complex: 'למשל: צימרי הגליל',
};

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'בוקר טוב';
  if (h >= 12 && h < 17) return 'צהריים טובים';
  if (h >= 17 && h < 22) return 'ערב טוב';
  return 'לילה טוב';
}

export const YC = {
  common: {
    next: 'המשך',
    back: 'חזרה',
    skip: 'אחר כך',
    of: (i, n) => `${i} מתוך ${n}`,
    example: 'דוגמה',
    saved: 'נשמר',
    help: 'עזרה',
  },
  hello: {
    eyebrow: (first) => (first ? `שלום ${first}` : 'שלום'),
    title: '2 דקות, והכל מוכן.',
    sub: 'עונים על 6 שאלות קצרות, ורואים את atlas שלכם נבנה תוך כדי.',
    cta: 'מתחילים',
    points: ['יומן אחד לכל ההזמנות', 'הודעות מוכנות לאורחים', '14 יום חינם, בלי כרטיס אשראי'],
  },
  kind: {
    title: 'מה סוג המתחם שלכם?',
    sub: 'כך נסדר את היומן בדיוק לפי המתחם.',
    group: 'סוג המתחם',
    more: 'סוג אחר',
    moreGroup: 'סוגים נוספים',
    hint: 'בחרו סוג מתחם כדי להמשיך',
  },
  name: {
    title: (kind) => NAME_Q[kind] || 'איך קוראים למתחם?',
    sub: 'השם שהאורחים מכירים. הוא יופיע בכל הודעה.',
    label: 'שם המתחם',
    placeholder: (kind) => NAME_PH[kind] || 'למשל: בקתות הגליל',
    empty: 'אפשר גם בלי שם, ולהוסיף אחר כך.',
  },
  units: {
    title: (k) => `כמה ${k.units} יש לכם?`,
    sub: 'כל יחידה מקבלת שורה משלה ביומן.',
    count: (k) => `מספר ${k.units}`,
    guests: (n) => (n > 1 ? 'עד כמה אורחים ביחידה?' : 'עד כמה אורחים?'),
    guestsLine: 'הכי הרבה שאתם מקבלים. אפשר לשנות לכל יחידה.',
    guestsLabel: 'אורחים לכל היותר',
  },
  channels: {
    title: 'מאיפה מגיעות ההזמנות?',
    sub: 'סמנו הכל. נאחד את כולן ליומן אחד.',
    group: 'מקורות הזמנות',
    linkTitle: (name) => `קישור היומן מ-${name}`,
    optional: 'לא חובה',
    linkLine: 'מדביקים, וההזמנות נכנסות ליומן לבד.',
    firstUnit: (unit) => `נחבר ל${unit} 1. את השאר מחברים בהגדרה.`,
    where: 'איפה מוצאים את הקישור?',
    open: (name) => `פתיחת ${name}`,
    paste: 'הדבקה',
    clear: 'ניקוי',
    badLink: (name) => `הקישור של ${name} לא תקין. תקנו או מחקו אותו.`,
  },
  times: {
    title: 'מתי נכנסים ויוצאים?',
    sub: 'השעות נכנסות לכל הודעה שהאורחים מקבלים.',
    in: 'כניסה מ-',
    out: 'יציאה עד',
    inGroup: 'שעת כניסה',
    outGroup: 'שעת יציאה',
    vary: 'משתנה לפי יום או עונה',
  },
  whatsapp: {
    title: 'לאיזה מספר יכתבו לכם האורחים?',
    sub: 'הוא יופיע בכל הודעה. רק אתם שולחים, בלחיצה.',
    label: 'מספר וואטסאפ',
    placeholder: '050-123-4567',
    bad: 'המספר קצר מדי. בדקו ונסו שוב.',
    cta: 'בנו את היומן שלי',
  },
  build: {
    eyebrow: 'עוד רגע',
    title: 'מסדרים לכם את הכל',
    error: 'לא הצלחנו לשמור את השלב הזה. בדקו שיש אינטרנט ונסו שוב. מה שנשמר לא ילך לאיבוד.',
    retry: 'נסו שוב',
    states: { done: 'בוצע', run: 'בתהליך', error: 'נכשל', wait: 'ממתין' },
  },
  done: {
    title: (first) => (first ? `הכל מוכן, ${first}.` : 'הכל מוכן.'),
    sub: '14 יום חינם, בלי כרטיס אשראי. נשאר לחבר את ההזמנות, ונראה לכם בדיוק איפה ללחוץ.',
    subLinked: '14 יום חינם, בלי כרטיס אשראי. היומן כבר מחובר, ההזמנות בדרך.',
    cta: 'פתחו את atlas',
    setup: 'המשיכו בהגדרה',
  },
  preview: {
    label: 'atlas שלכם, בזמן אמת',
    place: 'המתחם שלכם',
    units: 'יחידות',
    guests: 'אורחים',
    checkIn: 'כניסה',
    sources: 'הזמנות מ-',
    noSources: 'עוד לא נבחר',
    calendar: 'היומן',
    message: 'הודעה לאורח',
    msg: (name, time, vary) => `שלום! מחכים לכם ב${name}. ${vary ? 'נשלח שעת כניסה מדויקת לפני ההגעה.' : `הכניסה מ-${time}.`}`,
    replyTo: 'תשובות לוואטסאפ',
    waiting: 'ממתין לתשובה',
    empty: 'ההזמנות ייכנסו לכאן אחרי החיבור',
    direct: 'הזמנות ישירות',
    linked: (names) => `${names.join(' ו-')} ${names.length > 1 ? 'מחוברים' : 'מחובר'}`,
    later: (n) => (n > 1 ? 'יחוברו בהגדרה' : 'יחובר בהגדרה'),
    more: (n) => `ועוד ${n}`,
  },
};
