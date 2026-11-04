// The complex as the brain knows it ("ייבוא מתחם", import v1). Stored by the app in organizations.settings.property_profile
// (migration 010, live) after the owner confirms an import or answers the missing questions. One read tool for the text
// assistant and the voice agent: location / arrival / parking, times, key instructions, rules, policies, amenities, units,
// nearby tips and the guest FAQ, so "מה לענות לאורח ששואל על חניה?" is answered from the owner's own facts.
// Kept in its own file so the brain prompt stays untouched; tools.js only spreads PROFILE_TOOL_DEFS / PROFILE_EXEC in.

const clip = (s, n) => (s == null ? null : String(s).slice(0, n));
const list = (a, n, m = 160) => (Array.isArray(a) ? a.filter(Boolean).slice(0, n).map((x) => clip(typeof x === 'string' ? x : JSON.stringify(x), m)) : []);

/** The compact view a model gets (small: voice pays per token). Never phone numbers of guests; the owner's own contact is fine. */
export function profileView(p, s = {}) {
  if (!p || typeof p !== 'object' || !Object.keys(p).length) return null;
  const loc = p.location || {};
  return {
    name: clip(p.business_name, 80),
    type: p.property_type || null,
    units: (Array.isArray(p.units) ? p.units : []).slice(0, 20).map((u) => ({ name: clip(u.name, 60), type: clip(u.type, 30), max_guests: u.max_guests ?? null, bedrooms: u.bedrooms ?? null, highlights: list(u.amenities, 6, 40) })),
    unit_count: p.unit_count ?? null,
    where: { address: clip(loc.address, 140), locality: clip(loc.locality, 40), region: clip(loc.region, 40) },
    directions: clip(p.directions, 500),
    parking: clip(p.parking, 200),
    check_in: s.check_in_time || p.check_in_time || null,
    check_out: s.check_out_time || p.check_out_time || null,
    saturday_checkout: clip(p.saturday_checkout, 120),
    arrival_instructions: clip(p.arrival_instructions, 500),
    house_rules: list(p.house_rules, 12),
    pets: clip(p.pets, 160), kids: clip(p.kids, 160), accessibility: clip(p.accessibility, 160),
    cancellation_policy: clip(p.cancellation_policy, 400), deposit_policy: clip(p.deposit_policy, 200),
    payment_methods: list(p.payment_methods, 6, 40),
    amenities: list(p.amenities, 20, 40),
    about: clip(p.description?.short || p.description?.long, 300),
    nearby: (Array.isArray(p.nearby) ? p.nearby : []).slice(0, 10).map((x) => ({ name: clip(x.name, 60), kind: clip(x.kind, 30), distance: clip(x.distance, 30) })),
    guest_faq: (Array.isArray(p.guest_faq) ? p.guest_faq : []).slice(0, 10).map((x) => ({ q: clip(x.q, 140), a: clip(x.a, 300) })),
    reviews: p.reviews?.score != null ? { score: p.reviews.score, scale: p.reviews.scale, count: p.reviews.count, loves: list(p.reviews.loves, 4, 80), complaints: list(p.reviews.complaints, 3, 80) } : null,
    host_whatsapp: s.host_phone || p.contact?.whatsapp || p.contact?.phone || null,
    updated_at: p.updated_at || null,
    missing: list(p.missing, 12, 40),
  };
}

export const PROFILE_TOOL_DEFS = [
  {
    name: 'get_property_info',
    description: 'מה ידוע על המתחם של הבעלים: יחידות ותפוסה, כתובת והוראות הגעה, חניה, שעות כניסה ויציאה, הוראות כניסה ומפתח, כללי הבית, חיות מחמד וילדים, ביטולים ומקדמה, מתקנים, המלצות באזור ושאלות נפוצות של אורחים. השתמשו בזה לפני שמנסחים תשובה לאורח או עונים על שאלה על המתחם.',
    parameters: { type: 'object', additionalProperties: false, properties: {} },
  },
];

export const PROFILE_EXEC = {
  async get_property_info(db, _a, ctx) {
    // same path as get_business_settings: the caller's profile → their organization (RLS: their own only)
    const { data, error } = await db.from('profiles').select('organizations(settings)').eq('id', ctx.userId).limit(1);
    if (error) throw new Error(`profiles: ${error.message}`);
    const org = data?.[0]?.organizations || {};
    const s = org.settings && typeof org.settings === 'object' ? org.settings : {};
    const view = profileView(s.property_profile, s);
    if (!view) return { empty: true, say: 'עוד לא הגדרתם את פרטי המתחם. הציעו לייבא אותם מהמודעה ב-Booking או Airbnb או מהאתר: [ייבוא המתחם](/import).' };
    return view;
  },
};
