/**
 * Onboarding v3 copy (19.10.2026). Every string the v3 wizard shows lives here, so the copy table in
 * qa/onboarding-v3/audit.md maps 1:1 to this file. Rules (atlas-hebrew-copy-master + brand/voice-v1):
 * the owner's words, "אתם" plural, headline ≤ 6 words, helper ≤ 12 words, verb + object buttons,
 * no slashes (/ה), no calques, "atlas" lowercase and never with a glued Hebrew prefix.
 * Pure data (no React, no '@/…' imports) so tests/unit can read it in plain node.
 */

/** "איך קוראים ל…?" with the right prefix spelling (לווילה, not לוילה). */
const NAME_Q = {
  zimmer: 'איך קוראים לצימר?',
  villa: 'איך קוראים לווילה?',
  complex: 'איך קוראים למתחם?',
  zimmer_complex: 'איך קוראים למתחם?',
  guesthouse: 'איך קוראים לבית ההארחה?',
  boutique: 'איך קוראים למלון?',
  apartments: 'איך קוראים למקום?',
};

const NAME_PH = {
  zimmer: 'למשל: צימר הזית',
  villa: 'למשל: וילה בכרם',
  complex: 'למשל: מתחם הגליל',
  zimmer_complex: 'למשל: צימרי הגליל',
};

export const COPY = {
  common: {
    next: 'המשך',
    back: 'חזרה',
    skip: 'דלגו',
    later: 'אחר כך',
    saved: 'נשמר',
    autosave: 'נשמר אוטומטית. תמיד אפשר לשנות.',
    progress: (i, n) => `${i} מתוך ${n}`,
    help: 'עזרה',
    example: 'דוגמה',
  },
  kind: {
    title: 'מה סוג המתחם שלכם?',
    sub: 'נתאים את atlas למתחם שלכם.',
    time: 'לוקח כ-2 דקות',
    group: 'סוג המתחם',
    more: 'סוג אחר',
    moreGroup: 'סוגים נוספים',
    hint: 'בחרו סוג מתחם כדי להמשיך',
  },
  name: {
    title: (kind) => NAME_Q[kind] || 'איך קוראים למתחם?',
    sub: 'השם שהאורחים מכירים.',
    label: 'שם המתחם',
    placeholder: (kind) => NAME_PH[kind] || 'למשל: מתחם הגליל',
    empty: 'אפשר גם בלי שם, ולהוסיף אחר כך.',
  },
  units: {
    title: (k) => `כמה ${k.units} יש לכם?`,
    sub: 'כל יחידה מקבלת שורה משלה ביומן.',
    quick: 'בחירה מהירה',
    count: (k) => `מספר ${k.units}`,
    guestsTitle: (k, n) => (n === 1 ? `כמה אורחים ב${k.unit}?` : 'כמה אורחים בכל יחידה?'),
    guestsLine: 'מינימום ומקסימום. גם קבוצות של 10 ומעלה.',
    min: 'לפחות',
    max: 'עד',
    ranges: 'טווחים נפוצים',
    vary: (n) => (n > 1 ? 'משתנה בין היחידות' : 'משתנה מהזמנה להזמנה'),
    varyLine: 'נגדיר לכל יחידה בהמשך',
  },
  times: {
    title: 'מתי נכנסים ויוצאים?',
    sub: 'השעות האלה נכנסות להודעות לאורחים.',
    in: 'כניסה מ-',
    out: 'יציאה עד',
    inGroup: 'שעת כניסה',
    outGroup: 'שעת יציאה',
    vary: 'משתנה לפי יום או עונה',
    varyLine: 'אלה השעות הרגילות. בכל הזמנה אפשר לשנות.',
  },
  channels: {
    title: 'מאיפה מגיעות ההזמנות?',
    sub: 'אפשר לבחור כמה. נחבר את כולן ליומן אחד.',
    group: 'מקורות הזמנות',
    none: 'בחרו לפחות מקור אחד, או דלגו',
  },
  price: {
    title: 'מה המחיר ללילה?',
    group: 'מחיר ללילה',
    fixed: 'כמה ללילה?',
    from: 'החל מ- (לא חובה)',
  },
  start: {
    title: 'מוכנים להתחיל?',
    sub: '14 יום חינם, בלי כרטיס אשראי.',
    summary: 'מה הכנו לכם',
    edit: 'שינוי',
    cta: 'בנו את היומן',
  },
  review: {
    kind: 'סוג',
    name: 'שם',
    units: 'יחידות',
    times: 'שעות',
    channels: 'הזמנות',
    noName: 'יתווסף אחר כך',
    noChannels: 'נחבר בהמשך',
    timesValue: (a) => `כניסה ${a.checkIn} · יציאה ${a.checkOut}${a.timesVary ? ' (משתנה)' : ''}`,
  },
  /** Version B: 3 screens (the place, where bookings come from + calendar links, "זה נראה נכון?"). */
  b: {
    place: {
      title: 'מה סוג המתחם שלכם?',
      sub: 'ואיך קוראים לו. 2 דקות, נשמר אוטומטית.',
      nameHint: 'בחרו סוג מתחם כדי להמשיך',
    },
    channels: {
      title: 'מאיפה מגיעות ההזמנות?',
      sub: 'סמנו הכל. את Booking או Airbnb אפשר לחבר כבר עכשיו.',
      linkLabel: (name) => `קישור היומן מ-${name}`,
      optional: 'לא חובה',
      linkLine: 'מדביקים כאן, וההזמנות נכנסות ליומן לבד.',
      firstUnit: (unit) => `זה הקישור של ${unit} 1. את השאר מחברים בהגדרה.`,
      where: 'איפה מוצאים את הקישור?',
      openSite: (label) => label,
      badLink: (name) => `הקישור של ${name} לא תקין. תקנו או מחקו אותו.`,
      guideNote: 'נפתח בחלון חדש. חוזרים לכאן ומדביקים.',
    },
    review: {
      title: 'זה נראה נכון?',
      sub: 'בדקו רגע. כל דבר אפשר לשנות גם אחר כך.',
      place: 'המתחם',
      units: 'יחידות',
      guests: 'אורחים',
      times: 'שעות',
      channels: 'הזמנות',
      linked: (names) => (names.length > 1 ? 'Booking ו-Airbnb מחוברים ליומן' : `${names[0]} מחובר ליומן`),
      edit: 'שינוי',
      done: 'סיום',
    },
  },
  preview: {
    label: 'כך ייראה היומן שלכם',
    placeholderName: 'המתחם שלכם',
    calendar: 'יומן ההזמנות',
    sampleNote: 'ההזמנות האמיתיות ייכנסו לכאן אחרי החיבור.',
    more: (n) => `ועוד ${n}`,
    phone: 'טלפון',
  },
};
