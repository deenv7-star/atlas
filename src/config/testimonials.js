/**
 * Real customer quotes for the landing page (trust section).
 *
 * EMPTY ON PURPOSE. ATLAS has no paying customers yet (beta, 18.10.2026), and a made-up quote,
 * rating, customer count or logo is misleading advertising under Israeli consumer law
 * (חוק הגנת הצרכן, סעיף 2 ו-7). The landing renders a quote ONLY when every field below is
 * filled with the real thing AND `consent` is true. Until then nothing is shown, not even a frame.
 *
 * How to add one (copy the shape, fill it with the customer's own words):
 *   {
 *     quote: 'הציטוט המדויק, במילים של הלקוח, בלי עריכה שמשנה משמעות.',
 *     name: 'שם פרטי ואות משפחה, כפי שהלקוח אישר',   // e.g. 'רונית ל.'
 *     role: 'בעלת מתחם',                              // what they are
 *     place: 'גליל עליון',                            // optional, only if they agreed
 *     consent: true,                                  // written OK to publish (WhatsApp / email kept)
 *     date: '2026-11',                                // when they said it
 *   }
 */
export const BETA_TESTIMONIALS = [];

const filled = (s) => typeof s === 'string' && s.trim().length > 0;

/** Only complete, consented quotes. Anything partial is dropped, never padded. */
export function visibleTestimonials(list = BETA_TESTIMONIALS) {
  if (!Array.isArray(list)) return [];
  return list.filter((t) => t && t.consent === true && filled(t.quote) && t.quote.trim().length >= 12 && filled(t.name) && filled(t.role));
}
