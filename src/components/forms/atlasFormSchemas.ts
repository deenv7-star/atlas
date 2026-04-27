import { z } from 'zod';

const optionalEmail = z
  .string()
  .trim()
  .refine((s) => s === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), { message: 'אימייל לא תקין' });

export const bookingFormSchema = z.object({
  guest_name: z.string().min(1, 'נא למלא שם אורח'),
  guest_email: optionalEmail,
  guest_phone: z.string(),
  property_id: z.string(),
  check_in_date: z.string().min(1, 'נא לבחור תאריך כניסה'),
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

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

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
  full_name: z.string().min(1, 'נא למלא שם'),
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
    }, 'נא להזין סכום חיובי'),
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
  scheduled_for: z.string().min(1, 'נא לבחור תאריך ושעה'),
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
