/**
 * Local demo of an import (QA builds without a backend). A SAMPLE complex, labelled "דוגמה", shaped exactly like a real
 * property-import answer (see qa/import-v1/samples for real extractions). Photos are atlas's own demo photos.
 */
const PHOTOS = ['/demo/units/unit-1.webp', '/demo/units/unit-2.webp', '/demo/units/unit-3.webp', '/demo/units/unit-4.webp', '/demo/units/unit-5.webp', '/demo/units/unit-6.webp', '/demo/complex-pool.webp'];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function demoImport({ urls = [], text = '', images = [] }) {
  await wait(typeof window !== 'undefined' && window.__IMPORT_FAST ? 50 : 2600);
  const first = String(urls[0] || '');
  if (/fail|blocked/.test(first)) {
    const { ImportError } = await import('./api');
    throw new ImportError('all_sources_failed', [{ input: first, kind: 'booking', ok: false, error: 'blocked' }]);
  }
  const fromPaste = !urls.length;
  const r = {
    business_name: 'צימרי הגפן (דוגמה)',
    property_type: 'zimmer_complex',
    unit_count: 4,
    units: [
      { name: 'סוויטת הגפן', type: 'סוויטה', max_guests: 2, bedrooms: 1, beds: 1, bathrooms: 1, size_sqm: null, description: 'סוויטה זוגית עם ג׳קוזי ונוף לעמק', amenities: ['ג׳קוזי', 'מטבחון'], price_from: null },
      { name: 'צימר הזית', type: 'צימר', max_guests: 4, bedrooms: 1, beds: 2, bathrooms: 1, size_sqm: null, description: 'צימר משפחתי עם מרפסת', amenities: ['מרפסת'], price_from: null },
      { name: 'צימר התאנה', type: 'צימר', max_guests: 4, bedrooms: 1, beds: 2, bathrooms: 1, size_sqm: null, description: 'צימר משפחתי ליד הבריכה', amenities: ['מטבחון'], price_from: null },
      { name: 'בקתת הרימון', type: 'בקתה', max_guests: 2, bedrooms: 1, beds: 1, bathrooms: 1, size_sqm: null, description: 'בקתת עץ זוגית', amenities: ['ג׳קוזי'], price_from: null },
    ],
    location: { address: 'דוגמה 1, ראש פינה', locality: 'ראש פינה', region: 'גליל עליון', lat: null, lng: null },
    directions: null,
    parking: fromPaste ? null : 'חניה פרטית בחינם במתחם',
    check_in_time: '15:00',
    check_out_time: '11:00',
    saturday_checkout: 'שעה אחרי צאת השבת',
    arrival_instructions: null,
    house_rules: ['בלי עישון בפנים', 'שקט אחרי 23:00', 'בלי חיות מחמד'],
    pets: 'בלי חיות מחמד', kids: 'ילדים מגיל 2 מתקבלים בברכה', accessibility: null,
    cancellation_policy: null, deposit_policy: null, payment_methods: ['כרטיס אשראי', 'העברה בנקאית'],
    prices: { from: null, weekday_from: null, weekend_from: null, notes: null },
    contact: { host_name: null, phone: null, whatsapp: null, email: null, website: null },
    amenities: ['בריכה', 'ג׳קוזי', 'Wi-Fi', 'מיזוג', 'מנגל', 'חניה פרטית'],
    description: { short: 'ארבע יחידות אירוח בין עצי פרי, עם בריכה ונוף לעמק החולה.', long: null },
    nearby: [{ name: 'מדרחוב ראש פינה', kind: 'אטרקציה', distance: '5 דקות' }, { name: 'שמורת החולה', kind: 'מסלול', distance: '15 דקות' }],
    guest_faq: [{ q: 'יש חניה?', a: 'כן, חניה פרטית בחינם במתחם.' }, { q: 'מתי נכנסים?', a: 'מ-15:00.' }, { q: 'אפשר עם כלב?', a: 'לא, בלי חיות מחמד.' }],
    reviews: { score: 9.4, scale: 10, count: 120, loves: ['נוף', 'ניקיון'], complaints: [] },
    confidence: {
      business_name: 'high', property_type: 'high', unit_count: 'medium', units: 'medium', location: 'high', directions: 'none', parking: fromPaste ? 'none' : 'high',
      check_in_time: 'high', check_out_time: 'high', saturday_checkout: 'medium', arrival_instructions: 'none', house_rules: 'high', pets: 'high', kids: 'high',
      accessibility: 'none', cancellation_policy: 'none', deposit_policy: 'none', payment_methods: 'medium', prices: 'none', contact: 'none', amenities: 'high',
      description: 'high', nearby: 'medium', guest_faq: 'high', reviews: 'high',
    },
    photos: fromPaste ? [] : PHOTOS,
    thumbs: fromPaste ? [] : PHOTOS,
    sources: urls.map((u) => ({ input: u, url: u, kind: /booking/.test(u) ? 'booking' : /airbnb/.test(u) ? 'airbnb' : 'site', ok: true, error: null, photos: PHOTOS.length, pages: 1 })),
  };
  const missing = ['arrival_instructions', 'contact', 'cancellation_policy', ...(fromPaste ? ['parking'] : [])];
  return { result: r, missing, model_error: null, used_paste: !!text, used_images: images.length };
}
