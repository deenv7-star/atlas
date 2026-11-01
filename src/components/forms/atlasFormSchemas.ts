import { z } from 'zod';

export const BOOKING_LIMITS = {
  guestName: 80,
  email: 254,
  phone: 30,
  notes: 2000,
  maxPrice: 1_000_000,
  maxNights: 365,
} as const;

const optionalEmail = z
  .string()
  .trim()
  .max(BOOKING_LIMITS.email, 'כתובת המייל ארוכה מדי')
  .refine((s) => s === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), { message: 'בדקו את כתובת המייל' });

/**
 * Israeli or international phone. Empty is fine (optional). Allowed: digits, spaces, dashes, dots,
 * brackets and one leading "+". Israeli local numbers (0…) have 9-10 digits; anything else 8-15 (E.164).
 */
export function isValidPhone(raw: string): boolean {
  const s = String(raw ?? '').trim();
  if (s === '') return true;
  if (!/^\+?[\d\s\-().]+$/.test(s)) return false;
  const digits = s.replace(/\D/g, '');
  if (s.startsWith('+') || digits.startsWith('00')) {
    const d = digits.startsWith('00') ? digits.slice(2) : digits;
    return d.length >= 8 && d.length <= 15;
  }
  if (digits.startsWith('0')) return digits.length >= 9 && digits.length <= 10;
  if (digits.startsWith('972')) return digits.length >= 11 && digits.length <= 12;
  return digits.length >= 8 && digits.length <= 15;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
function dayNumber(iso: string): number | null {
  if (!ISO_DATE.test(iso)) return null;
  const t = Date.parse(`${iso}T00:00:00Z`);
  return Number.isFinite(t) ? Math.round(t / 86_400_000) : null;
}

/** Nights between two YYYY-MM-DD dates (calendar days, no time zone drift), or null. */
export function nightsBetweenISO(checkIn: string, checkOut: string): number | null {
  const a = dayNumber(checkIn);
  const b = dayNumber(checkOut);
  return a == null || b == null ? null : b - a;
}

/** Price as typed ("1,200" / "1200.5" / "₪ 900" / ""). null = empty (allowed), NaN = not a number. */
export function parsePrice(raw: string): number | null {
  const s = String(raw ?? '').trim().replace(/[\s₪]/g, '').replace(/,(?=\d{3}(\D|$))/g, '').replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

// Plain shapes only, so every rule below runs together and the host sees all problems at once
// (zod skips an object's refinements when one of its fields already failed).
const bookingBaseSchema = z.object({
  guest_name: z.string(),
  guest_email: z.string(),
  guest_phone: z.string(),
  property_id: z.string(),
  check_in_date: z.string(),
  check_out_date: z.string(),
  nights: z.coerce.number().int().min(1).default(1),
  adults: z.coerce.number().int().min(1).default(2),
  children: z.coerce.number().int().min(0).default(0),
  total_price: z.string(),
  status: z.string(),
  notes: z.string(),
  guest_count: z.coerce.number().int().min(1).default(2),
  booking_source: z.string(),
  payment_status: z.string(),
});

/**
 * Booking form rules (audit APP-001…006):
 * check-out after check-in (min 1 night, max 365), price 0…1,000,000, valid phone, unit required whenever
 * the account has units, max lengths. Messages are Hebrew, plural "אתם".
 */
export function makeBookingFormSchema(opts: { requireProperty?: boolean } = {}) {
  const requireProperty = opts.requireProperty ?? true;
  return bookingBaseSchema.superRefine((v, ctx) => {
    const issue = (path: keyof BookingFormValues, message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

    const name = v.guest_name.trim();
    if (!name) issue('guest_name', 'כתבו את שם האורח');
    else if (name.length > BOOKING_LIMITS.guestName) issue('guest_name', `השם ארוך מדי. עד ${BOOKING_LIMITS.guestName} תווים`);

    const email = v.guest_email.trim();
    if (email.length > BOOKING_LIMITS.email) issue('guest_email', 'כתובת המייל ארוכה מדי');
    else if (email && !EMAIL_RE.test(email)) issue('guest_email', 'בדקו את כתובת המייל');

    const phone = v.guest_phone.trim();
    if (phone.length > BOOKING_LIMITS.phone) issue('guest_phone', 'מספר הטלפון ארוך מדי');
    else if (!isValidPhone(phone)) issue('guest_phone', 'מספר הטלפון לא נראה תקין. למשל 050-1234567');

    if (requireProperty && !v.property_id.trim()) issue('property_id', 'בחרו יחידה');

    const ci = dayNumber(v.check_in_date);
    const co = dayNumber(v.check_out_date);
    if (!v.check_in_date) issue('check_in_date', 'בחרו תאריך כניסה');
    else if (ci == null) issue('check_in_date', 'בדקו את תאריך הכניסה');
    if (!v.check_out_date) issue('check_out_date', 'בחרו תאריך יציאה');
    else if (co == null) issue('check_out_date', 'בדקו את תאריך היציאה');
    else if (ci != null) {
      if (co === ci) issue('check_out_date', 'היציאה צריכה להיות לפחות לילה אחד אחרי הכניסה');
      else if (co < ci) issue('check_out_date', 'תאריך היציאה צריך להיות אחרי תאריך הכניסה');
      else if (co - ci > BOOKING_LIMITS.maxNights) issue('check_out_date', `עד ${BOOKING_LIMITS.maxNights} לילות בהזמנה אחת. בדקו את התאריכים`);
    }

    const price = parsePrice(v.total_price);
    if (price !== null) {
      if (Number.isNaN(price)) issue('total_price', 'כתבו מחיר במספרים');
      else if (price < 0) issue('total_price', 'המחיר לא יכול להיות שלילי');
      else if (price > BOOKING_LIMITS.maxPrice) issue('total_price', 'המחיר גבוה מדי. בדקו שאין אפס מיותר');
    }

    if (v.notes.length > BOOKING_LIMITS.notes) issue('notes', `ההערה ארוכה מדי. עד ${BOOKING_LIMITS.notes} תווים`);
  });
}

/** Default schema: unit required (the form relaxes it only when the account has no units at all). */
export const bookingFormSchema = makeBookingFormSchema();

export type BookingFormValues = z.infer<typeof bookingBaseSchema>;

export const emptyBookingFormValues: BookingFormValues = {
  guest_name: '',
  guest_email: '',
  guest_phone: '',
  property_id: '',
  check_in_date: '',
  check_out_date: '',
  nights: 1,
  adults: 2,
  children: 0,
  total_price: '',
  status: 'PENDING',
  notes: '',
  guest_count: 2,
  booking_source: 'direct',
  payment_status: 'pending',
};

export const guestFormSchema = z.object({
  full_name: z.string().min(1, 'כתבו שם'),
  email: optionalEmail,
  phone: z.string(),
  property_id: z.string(),
  check_in_date: z.string(),
  check_out_date: z.string(),
  adults: z.coerce.number().int().min(1).default(2),
  children: z.coerce.number().int().min(0).default(0),
  status: z.string(),
  source: z.string(),
  notes: z.string(),
  budget: z.string(),
});

export type GuestFormValues = z.infer<typeof guestFormSchema>;

export const emptyGuestFormValues: GuestFormValues = {
  full_name: '',
  email: '',
  phone: '',
  property_id: '',
  check_in_date: '',
  check_out_date: '',
  adults: 2,
  children: 0,
  status: 'NEW',
  source: '',
  notes: '',
  budget: '',
};

export const paymentFormSchema = z.object({
  booking_id: z.string(),
  amount: z
    .string()
    .refine((s) => {
      const n = parseFloat(String(s).replace(',', '.'));
      return !Number.isNaN(n) && n > 0;
    }, 'כתבו סכום גדול מ-0'),
  currency: z.string().default('ILS'),
  status: z.string(),
  method: z.string(),
  description: z.string(),
  due_date: z.string(),
  paid_date: z.string(),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export const emptyPaymentFormValues: PaymentFormValues = {
  booking_id: '',
  amount: '',
  currency: 'ILS',
  status: 'PENDING',
  method: 'credit_card',
  description: '',
  due_date: '',
  paid_date: '',
};

export const checklistItemSchema = z.object({
  item: z.string(),
  done: z.boolean(),
});

export const maintenanceRequestFormSchema = z.object({
  scheduled_for: z.string().min(1, 'בחרו תאריך ושעה'),
  assigned_to_name: z.string(),
  notes: z.string(),
  checklist: z.array(checklistItemSchema),
});

export type MaintenanceRequestFormValues = z.infer<typeof maintenanceRequestFormSchema>;

/** Default cleaning checklist rows for new maintenance tasks (staff UI). */
export const maintenanceDefaultChecklist: MaintenanceRequestFormValues['checklist'] = [
  { item: 'החלפת מצעים', done: false },
  { item: 'ניקוי חדר אמבטיה', done: false },
  { item: 'שאיבת אבק', done: false },
  { item: 'ניגוב רצפות', done: false },
  { item: 'ניקוי מטבח', done: false },
  { item: 'מילוי ציוד (סבון, נייר)', done: false },
  { item: 'הוצאת אשפה', done: false },
];

export const emptyMaintenanceRequestFormValues = (): MaintenanceRequestFormValues => ({
  scheduled_for: '',
  assigned_to_name: '',
  notes: '',
  checklist: maintenanceDefaultChecklist.map((c) => ({ ...c })),
});
