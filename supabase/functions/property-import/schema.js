// The typed shape of an imported complex ("ייבוא מתחם"). ONE schema for the LLM (strict JSON schema),
// the app (preview card + missing questions) and the brain (property profile digest).
// Plain JS on purpose (Deno + node --test).

const str = (description) => ({ type: ['string', 'null'], description });
const num = (description) => ({ type: ['number', 'null'], description });
const int = (description) => ({ type: ['integer', 'null'], description });
const bool = (description) => ({ type: ['boolean', 'null'], description });
const strList = (description) => ({ type: 'array', items: { type: 'string' }, description });
const obj = (properties) => ({ type: 'object', additionalProperties: false, required: Object.keys(properties), properties });

/** Fields the confidence map covers (top level). The app asks about every one that is missing or low. */
export const FIELDS = [
  'business_name', 'property_type', 'unit_count', 'units', 'location', 'directions', 'parking',
  'check_in_time', 'check_out_time', 'saturday_checkout', 'arrival_instructions', 'house_rules',
  'pets', 'kids', 'accessibility', 'cancellation_policy', 'deposit_policy', 'payment_methods',
  'prices', 'contact', 'amenities', 'description', 'nearby', 'guest_faq', 'reviews',
];

export const PROPERTY_TYPES = ['zimmer', 'zimmer_complex', 'villa', 'complex', 'guesthouse', 'boutique', 'apartments', 'other'];

const unit = obj({
  name: str('שם היחידה כפי שמופיע (למשל "סוויטת הגפן"). אם אין שם: null'),
  type: str('סוג היחידה בעברית: צימר, סוויטה, בקתה, וילה, חדר, דירה'),
  max_guests: int('מקסימום אורחים ביחידה'),
  bedrooms: int('חדרי שינה'),
  beds: int('מיטות'),
  bathrooms: num('חדרי רחצה'),
  size_sqm: int('שטח במ"ר'),
  description: str('תיאור קצר של היחידה בעברית, עד 300 תווים'),
  amenities: strList('מתקנים ייחודיים ליחידה, בעברית (ג׳קוזי, בריכה פרטית, מטבחון)'),
  price_from: num('מחיר התחלתי ללילה בש"ח אם מופיע בפירוש. אחרת null'),
});

export const IMPORT_SCHEMA = obj({
  business_name: str('שם המתחם כפי שהאורחים מכירים אותו, בלי "צימר ב..." מיותר'),
  property_type: { type: ['string', 'null'], enum: [...PROPERTY_TYPES, null], description: 'zimmer=צימר בודד, zimmer_complex=כמה צימרים, villa=וילה, complex=מתחם אירוח גדול/אירועים, guesthouse=בית הארחה, boutique=מלון בוטיק, apartments=דירות נופש' },
  unit_count: int('מספר יחידות האירוח במתחם (לא חדרי שינה). רק אם כתוב או ברור מהרשימה'),
  units: { type: 'array', items: unit, description: 'יחידות האירוח שמופיעות במקור. ריק אם לא ידוע' },
  location: obj({
    address: str('כתובת מלאה כפי שמופיעה'),
    locality: str('יישוב בעברית (ראש פינה, אמירים)'),
    region: str('אזור בעברית (גליל עליון, רמת הגולן, גליל מערבי)'),
    lat: num('קו רוחב'),
    lng: num('קו אורך'),
  }),
  directions: str('הוראות הגעה אם מופיעות'),
  parking: str('חניה: איפה ואם בתשלום, בעברית'),
  check_in_time: str('שעת כניסה HH:MM (24h). אם טווח: תחילת הטווח'),
  check_out_time: str('שעת יציאה HH:MM (24h). אם "עד 11:30": 11:30'),
  saturday_checkout: str('יציאה בשבת אם שונה (למשל "שעה אחרי צאת השבת")'),
  arrival_instructions: str('איך נכנסים: מפתח, קוד, תיבה, צ׳ק-אין עצמי, קבלה. רק אם כתוב'),
  house_rules: strList('כללי הבית בעברית, משפט קצר לכל כלל (אין עישון בפנים, שקט אחרי 23:00)'),
  pets: str('מדיניות חיות מחמד בעברית'),
  kids: str('מדיניות ילדים ותינוקות בעברית'),
  accessibility: str('נגישות'),
  cancellation_policy: str('מדיניות ביטול בעברית, אם מופיעה בפירוש. "משתנה לפי תאריכים" זה לא מדיניות: null'),
  deposit_policy: str('מקדמה / פיקדון'),
  payment_methods: strList('אמצעי תשלום בעברית'),
  prices: obj({
    from: num('מחיר התחלתי ללילה בש"ח, רק אם מופיע בפירוש'),
    weekday_from: num('אמצע שבוע החל מ, בש"ח'),
    weekend_from: num('סוף שבוע החל מ, בש"ח'),
    notes: str('הערות מחיר (כולל ארוחת בוקר, מינימום 2 לילות)'),
  }),
  contact: obj({
    host_name: str('שם המארחים'),
    phone: str('טלפון'),
    whatsapp: str('מספר וואטסאפ'),
    email: str('מייל'),
    website: str('אתר'),
  }),
  amenities: strList('מתקנים במתחם בעברית, קצר (בריכה, ג׳קוזי, Wi-Fi, מיזוג, מנגל, חניה פרטית)'),
  description: obj({
    short: str('משפט אחד שמתאר את המתחם, בעברית, בלשון רבים, עד 140 תווים'),
    long: str('תיאור מלא בעברית, עד 900 תווים, מבוסס רק על המקור'),
  }),
  nearby: { type: 'array', items: obj({ name: str('שם המקום'), kind: str('סוג: מסעדה, מסלול, אטרקציה, סופר, חוף'), distance: str('מרחק אם כתוב') }), description: 'מקומות קרובים שמוזכרים במקור' },
  guest_faq: { type: 'array', items: obj({ q: str('שאלה שאורחים שואלים'), a: str('תשובה מבוססת רק על המקור') }), description: '5–8 שאלות נפוצות של אורחים עם תשובה מהמידע שנמצא. בלי שאלות שאין להן תשובה במקור' },
  reviews: obj({
    score: num('ציון'),
    scale: num('מתוך (5 או 10)'),
    count: int('מספר חוות דעת'),
    loves: strList('מה אורחים אוהבים, 2–4 נקודות קצרות'),
    complaints: strList('מה אורחים מעירים, 0–3 נקודות קצרות'),
  }),
  confidence: obj(Object.fromEntries(FIELDS.map((f) => [f, { type: 'string', enum: ['high', 'medium', 'low', 'none'] }]))),
});

/** An empty result in the same shape (fallback when the model is not available). */
export function emptyResult() {
  return {
    business_name: null, property_type: null, unit_count: null, units: [],
    location: { address: null, locality: null, region: null, lat: null, lng: null },
    directions: null, parking: null, check_in_time: null, check_out_time: null, saturday_checkout: null,
    arrival_instructions: null, house_rules: [], pets: null, kids: null, accessibility: null,
    cancellation_policy: null, deposit_policy: null, payment_methods: [],
    prices: { from: null, weekday_from: null, weekend_from: null, notes: null },
    contact: { host_name: null, phone: null, whatsapp: null, email: null, website: null },
    amenities: [], description: { short: null, long: null }, nearby: [], guest_faq: [],
    reviews: { score: null, scale: null, count: null, loves: [], complaints: [] },
    confidence: Object.fromEntries(FIELDS.map((f) => [f, 'none'])),
  };
}
