// Demo data written into the app's own localStorage store (atlas_entity_<Name>) at runtime.
// This is the same store the app uses in local demo mode (src/api/client.js, LocalEntityCollection).
// Nothing in the source is changed. Dates are built around a frozen clock in November 2026.

export const ORG = 'org_demo';

export const USER = {
  id: 'user_demo',
  email: 'owner@example.com',
  full_name: 'יעל כהן',
  organization_id: ORG,
  organization_name: 'צימרי נוף הגליל',
  subscription_plan: 'pro',
  selected_plan: 'pro',
  subscription_status: 'active',
  trial_ends_at: '2027-12-31T00:00:00.000Z',
  onboarding_completed: true,
  is_platform_admin: false,
  created_date: '2026-03-01T09:00:00.000Z',
};

const unit = (id, name, max, price, photo) => ({
  id, org_id: ORG, name, max_guests: max, base_price: price, is_active: true, created_date: '2026-03-01T09:00:00.000Z',
  check_in_time: '15:00', check_out_time: '11:00',
  guest_info: { check_in_time: '15:00', check_out_time: '11:00', wifi_name: 'NofHagalil', wifi_password: 'galil2026' },
  address: 'מושב עמירים, הגליל העליון', photo_url: photo,
});

export const PROPERTIES = [
  unit('p_alon', 'בקתת האלון', 4, 950, '/demo/units/unit-1.webp'),
  unit('p_gefen', 'סוויטת הגפן', 2, 850, '/demo/units/unit-3.webp'),
  unit('p_zait', 'צימר הזית', 6, 1200, '/demo/units/unit-5.webp'),
];

const bk = (id, o) => ({
  id, org_id: ORG, status: 'CONFIRMED', adults: 2, children: 0, created_date: '2026-10-01T09:00:00.000Z', created_at: '2026-10-01T09:00:00.000Z', ...o,
  nights: o.nights ?? Math.round((Date.parse(o.check_out_date) - Date.parse(o.check_in_date)) / 86400000),
});

/** Direct bookings already in the calendar before the weekend (owner-entered, with names). */
export const DIRECT = [
  bk('b_levi', { property_id: 'p_alon', guest_name: 'משפחת לוי', guest_phone: '050-1234567', check_in_date: '2026-11-02', check_out_date: '2026-11-06', total_price: 3800, source: 'direct' }),
  bk('b_noa', { property_id: 'p_alon', guest_name: 'נועה ואלון ברק', guest_phone: '052-7654321', check_in_date: '2026-11-06', check_out_date: '2026-11-07', total_price: 1100, source: 'direct' }),
  bk('b_dana', { property_id: 'p_alon', guest_name: 'דנה שמש', guest_phone: '054-2223344', check_in_date: '2026-11-08', check_out_date: '2026-11-10', total_price: 1900, source: 'direct' }),
  bk('b_gil', { property_id: 'p_gefen', guest_name: 'גיל ומיכל', guest_phone: '050-9988776', check_in_date: '2026-11-01', check_out_date: '2026-11-04', total_price: 2550, source: 'direct' }),
  bk('b_omer', { property_id: 'p_zait', guest_name: 'קבוצת חברים - עומר', guest_phone: '053-4445566', check_in_date: '2026-11-02', check_out_date: '2026-11-05', total_price: 3600, source: 'direct' }),
  bk('b_tamar', { property_id: 'p_alon', guest_name: 'תמר ויונתן', guest_phone: '058-1112233', check_in_date: '2026-11-10', check_out_date: '2026-11-12', total_price: 1900, source: 'direct' }),
  bk('b_shira', { property_id: 'p_zait', guest_name: 'משפחת אדלר', guest_phone: '052-3332211', check_in_date: '2026-11-19', check_out_date: '2026-11-22', total_price: 3600, source: 'direct' }),
  bk('b_ron', { property_id: 'p_gefen', guest_name: 'רון ושני', guest_phone: '050-6667788', check_in_date: '2026-11-20', check_out_date: '2026-11-22', total_price: 1700, source: 'direct' }),
];

/**
 * Channel bookings exactly as the server iCal import writes them (supabase/functions/ical-sync/index.ts):
 * is_block true + source + CONFIRMED, no guest name and no price (iCal carries only dates).
 */
export const BOOKING_COM = bk('b_bcom', { property_id: 'p_gefen', check_in_date: '2026-11-05', check_out_date: '2026-11-08', status: 'CONFIRMED', source: 'booking', is_block: true, external_uid: 'bcom-1@booking.com' });
export const AIRBNB = bk('b_abnb', { property_id: 'p_zait', check_in_date: '2026-11-06', check_out_date: '2026-11-09', status: 'CONFIRMED', source: 'airbnb', is_block: true, external_uid: 'abnb-1@airbnb.com' });

/** Month-end variant: the owner later completed name + price on the channel stays (editable on the booking). */
export const BOOKING_COM_PRICED = { ...BOOKING_COM, guest_name: 'Sarah Klein', total_price: 2700 };
export const AIRBNB_PRICED = { ...AIRBNB, guest_name: 'David Rosen', total_price: 3900 };
export const LATE_MONTH_CHANNEL = [
  bk('b_bcom2', { property_id: 'p_alon', guest_name: 'Anna Weber', check_in_date: '2026-11-26', check_out_date: '2026-11-29', total_price: 2850, source: 'booking', is_block: true }),
  bk('b_abnb2', { property_id: 'p_zait', guest_name: 'Tom Levin', check_in_date: '2026-11-27', check_out_date: '2026-11-29', total_price: 2400, source: 'airbnb', is_block: true }),
];

/** Earlier months, so the 6-month income chart has history (owner-entered, all paid). */
export function history() {
  const out = [];
  const months = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
  const per = [4, 6, 7, 5, 6];
  const units = ['p_alon', 'p_gefen', 'p_zait'];
  const price = { p_alon: 950, p_gefen: 850, p_zait: 1200 };
  const names = ['משפחת כץ', 'אורי ומאיה', 'הדס ואביב', 'משפחת פרץ', 'ליאת ורועי', 'עדי ונדב', 'משפחת מזרחי'];
  months.forEach((m, mi) => {
    for (let i = 0; i < per[mi]; i += 1) {
      const u = units[i % 3];
      const day = 2 + i * 4;
      const n = 2 + (i % 2);
      const ci = `${m}-${String(day).padStart(2, '0')}`;
      const co = `${m}-${String(day + n).padStart(2, '0')}`;
      out.push(bk(`h_${m}_${i}`, { property_id: u, guest_name: names[(i + mi) % names.length], check_in_date: ci, check_out_date: co, total_price: price[u] * n, source: i % 3 === 1 ? 'booking' : i % 3 === 2 ? 'airbnb' : 'direct', status: 'CHECKED_OUT' }));
    }
  });
  return out;
}

export function paymentsFor(bookings, { upTo = '2026-11-30' } = {}) {
  return bookings.filter((b) => b.total_price && b.check_in_date <= upTo).map((b) => ({
    id: `pay_${b.id}`, org_id: ORG, booking_id: b.id, amount: b.total_price, status: 'PAID', type: 'full',
    method: 'bank_transfer', paid_date: b.check_in_date, paid_at: `${b.check_in_date}T12:00:00.000Z`, created_at: `${b.check_in_date}T12:00:00.000Z`,
  }));
}

export const EXPENSES = [
  { id: 'x1', org_id: ORG, property_id: 'p_alon', category: 'ניקיון', amount: 1400, description: 'ניקיון אחרי אורחים, נובמבר', expense_date: '2026-11-28' },
  { id: 'x2', org_id: ORG, property_id: 'p_zait', category: 'חשמל', amount: 860, description: 'חשבון חשמל דו-חודשי', expense_date: '2026-11-15' },
  { id: 'x3', org_id: ORG, property_id: 'p_gefen', category: 'תחזוקה', amount: 520, description: 'תיקון ג׳קוזי', expense_date: '2026-11-11' },
  { id: 'x4', org_id: ORG, property_id: 'p_zait', category: 'מים', amount: 310, description: 'חשבון מים', expense_date: '2026-11-20' },
  { id: 'x5', org_id: ORG, property_id: 'p_alon', category: 'ציוד', amount: 640, description: 'מצעים ומגבות חדשים', expense_date: '2026-11-09' },
  { id: 'x6', org_id: ORG, property_id: 'p_gefen', category: 'שיווק', amount: 450, description: 'צילום מקצועי למודעה', expense_date: '2026-11-04' },
].map((x) => ({ ...x, created_at: `${x.expense_date}T10:00:00.000Z` }));

export const RECEIPTS = [
  { id: 'inv_1', invoice_number: 'R-1041', type: 'RECEIPT', guest_name: 'משפחת אדלר', customer_name: 'משפחת אדלר', guest_email: 'adler@example.com', customer_email: 'adler@example.com', issue_date: '2026-11-22', total_amount: 3600, subtotal: 3600, amount: 3600, tax_rate: 0, tax_amount: 0, status: 'SENT', items: [{ description: 'אירוח בצימר הזית, 3 לילות', quantity: 1, unit_price: 3600, total: 3600 }], booking_id: 'b_shira', created_at: '2026-11-22T12:00:00.000Z' },
  { id: 'inv_2', invoice_number: 'R-1042', type: 'RECEIPT', guest_name: 'רון ושני', customer_name: 'רון ושני', guest_email: 'ron.shani@example.com', customer_email: 'ron.shani@example.com', issue_date: '2026-11-22', total_amount: 1700, subtotal: 1700, amount: 1700, tax_rate: 0, tax_amount: 0, status: 'SENT', items: [{ description: 'אירוח בסוויטת הגפן, 2 לילות', quantity: 1, unit_price: 1700, total: 1700 }], booking_id: 'b_ron', created_at: '2026-11-22T12:05:00.000Z' },
  { id: 'inv_3', invoice_number: 'R-1043', type: 'RECEIPT', guest_name: 'Anna Weber', customer_name: 'Anna Weber', guest_email: 'anna.weber@example.com', customer_email: 'anna.weber@example.com', issue_date: '2026-11-29', total_amount: 2850, subtotal: 2850, amount: 2850, tax_rate: 0, tax_amount: 0, status: 'DRAFT', items: [{ description: 'אירוח בבקתת האלון, 3 לילות', quantity: 1, unit_price: 2850, total: 2850 }], booking_id: 'b_bcom2', created_at: '2026-11-29T12:00:00.000Z' },
].map((r) => ({ ...r, org_id: ORG, currency: 'ILS', due_date: r.issue_date, notes: '' }));

export const LEADS = [
  { id: 'l_1', full_name: 'אורית מזרחי', phone: '050-3344556', check_in_date: '2026-11-20', check_out_date: '2026-11-22', nights: 2, status: 'CONTACTED', source: 'whatsapp', created_at: '2026-11-02T18:00:00.000Z' },
  { id: 'l_2', full_name: 'אסף גולן', phone: '052-8877665', check_in_date: '2026-12-11', check_out_date: '2026-12-13', nights: 2, status: 'OFFER_SENT', source: 'phone', created_at: '2026-11-03T11:00:00.000Z' },
].map((l) => ({ ...l, org_id: ORG, adults: 2, children: 0, created_date: l.created_at }));

/** Guest-journey rules as the Automations screen itself saves them (src/lib/real/journey.js ruleForStep). */
export const AUTOMATIONS = [
  ['confirmation', 'אישור הזמנה + קישור צ׳ק-אין', 'BOOKING_CONFIRMED', 0, '10:00'],
  ['arrival_eve', 'יום לפני ההגעה', 'CHECKIN_DAY', -24, '10:00'],
  ['welcome', 'ביום ההגעה', 'CHECKIN_DAY', 0, '16:00'],
  ['thanks_review', 'אחרי היציאה: תודה ובקשת ביקורת', 'CHECKOUT_DAY', 0, '13:00'],
].map(([key, name, trigger, off, time]) => ({
  id: `ar_${key}`, org_id: ORG, name, trigger, timing_offset_hours: off, is_active: true, execution_count: 0,
  actions: [{ type: 'SEND_WHATSAPP', config: { template: key } }],
  conditions: { journey_step: key, send_time: time, respect_shabbat: true }, created_at: '2026-10-01T09:00:00.000Z',
}));

/** Build a full localStorage snapshot. */
export function store({ bookings = [], payments = [], expenses = [], invoices = [], leads = [], automations = [], messageLogs = [], cleaning = [] } = {}) {
  return {
    atlas_current_user: USER,
    atlas_cookie_consent: 'essential',
    'atlas.tour.v1.user_demo': { v: 1, status: 'done', step: 0, at: 1 },
    'pwa-install-dismissed': String(Date.now()),
    atlas_entity_Property: PROPERTIES,
    atlas_entity_Booking: bookings,
    atlas_entity_Payment: payments,
    atlas_entity_Expense: expenses,
    atlas_entity_Invoice: invoices,
    atlas_entity_Lead: leads,
    atlas_entity_AutomationRule: automations,
    atlas_entity_MessageLog: messageLogs,
    atlas_entity_CleaningTask: cleaning,
  };
}
