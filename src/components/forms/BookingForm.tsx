import * as React from 'react';
import { Controller } from 'react-hook-form';
import {
  SheetGroup, SheetField, SheetInput, SheetSelect, SheetSegmented, SheetMore,
  SheetFooter, SheetSubmit, SheetBanner,
} from '@/components/ui/sheet/fields';
import { DateRangeField } from '@/components/ui/sheet/DateRangeField';
import { displayUnits } from '@/lib/unitName';
import { heNights } from '@/lib/heDate';
import { useFormMachine } from '@/hooks/useFormMachine';
import type { BookingFormValues } from '@/components/forms/atlasFormSchemas';
import { makeBookingFormSchema, BOOKING_LIMITS, nightsBetweenISO } from '@/components/forms/atlasFormSchemas';
import { FormRouteLeaveGuard } from '@/components/forms/FormRouteLeaveGuard';
import { formMachineFormClassName } from '@/components/forms/formMachineUi';
import { BookingOverlapGuard } from '@/components/stay/BookingOverlapGuard';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'ממתינה' },
  { value: 'APPROVED', label: 'מאושרת' },
  { value: 'CONFIRMED', label: 'מאושרת סופית' },
  { value: 'CHECKED_IN', label: 'בשהייה' },
  { value: 'CHECKED_OUT', label: 'הסתיימה' },
  { value: 'CANCELLED', label: 'בוטלה' },
  { value: 'WAITLIST', label: 'המתנה' },
];
/** New booking: the two states an owner actually picks. */
const NEW_STATUS_OPTIONS = [
  { value: 'CONFIRMED', label: 'מאושרת' },
  { value: 'PENDING', label: 'ממתינה' },
];
const SOURCE_OPTIONS = [
  { value: 'direct', label: 'ישיר' },
  { value: 'booking', label: 'Booking' },
  { value: 'airbnb', label: 'Airbnb' },
];

export type BookingFormProps = {
  storageSuffix: string;
  defaultValues: BookingFormValues;
  properties: Array<{ id: string; name: string }>;
  onSubmit: (data: BookingFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  enableRouteGuard?: boolean;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onRegisterDialogInterceptor?: (fn: ((open: boolean) => void) | null) => void;
  onAfterSubmitSuccess?: () => void;
};

export function BookingForm({
  storageSuffix,
  defaultValues,
  properties,
  onSubmit,
  onCancel: _onCancel, // closing is the sheet's X (one primary button rule)
  submitLabel,
  enableRouteGuard = true,
  setDialogOpen,
  onRegisterDialogInterceptor,
  onAfterSubmitSuccess,
}: BookingFormProps) {
  const storageKey = `atlas-form-booking-${storageSuffix}`;
  const hasUnits = properties.length > 0;
  // Audit 04.11 #7: a booking always needs a unit (property_id null used to save for a new account).
  // No units yet: the form says so and links to adding the first one.
  const schema = React.useMemo(() => makeBookingFormSchema({ requireProperty: true }), []);
  // One unit: pick it for them. Old bookings with nights but no check-out: fill the check-out date.
  const normalizedDefaults = React.useMemo<BookingFormValues>(() => {
    const d = { ...defaultValues };
    if (!d.property_id && properties.length === 1) d.property_id = properties[0].id;
    if (d.check_in_date && !d.check_out_date && Number(d.nights) > 0) {
      const t = Date.parse(`${d.check_in_date}T00:00:00Z`);
      if (Number.isFinite(t)) d.check_out_date = new Date(t + Number(d.nights) * 86_400_000).toISOString().slice(0, 10);
    }
    return d;
  }, [defaultValues, properties]);

  const fm = useFormMachine<BookingFormValues>({
    schema,
    defaultValues: normalizedDefaults,
    onSubmit,
    storageKey,
    enableRouteGuard,
    onAfterSubmitSuccess,
  });

  React.useEffect(() => {
    const fn = (open: boolean) => {
      fm.interceptDialogClose(open, setDialogOpen);
    };
    onRegisterDialogInterceptor?.(fn);
    return () => onRegisterDialogInterceptor?.(null);
  }, [fm.interceptDialogClose, setDialogOpen, onRegisterDialogInterceptor]);

  const [overlapBlocked, setOverlapBlocked] = React.useState(false);

  // Units load after the sheet opens: with exactly one unit, select it as soon as it is known.
  const onlyUnitId = properties.length === 1 ? properties[0].id : '';
  React.useEffect(() => {
    if (onlyUnitId && !fm.values.property_id) fm.setValue('property_id', onlyUnitId, { shouldDirty: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyUnitId]);

  const nights = React.useMemo(
    () => nightsBetweenISO(fm.values.check_in_date || '', fm.values.check_out_date || '') ?? 0,
    [fm.values.check_in_date, fm.values.check_out_date],
  );
  const units = React.useMemo(() => displayUnits(properties), [properties]);
  const isEdit = storageSuffix !== 'new' && !storageSuffix.startsWith('quick') && !storageSuffix.startsWith('lead-');
  const errId = (k: string) => `bf-${k}-err`;
  const err = (k: keyof BookingFormValues) => fm.errors[k as string];
  const a11y = (k: keyof BookingFormValues) =>
    err(k) ? { 'aria-invalid': true as const, 'aria-describedby': errId(k as string) } : {};

  // Progressive: name, dates, source up front. The rest waits under "פרטים נוספים".
  const MORE: Array<keyof BookingFormValues> = ['guest_phone', 'guest_email', 'total_price', 'status', 'notes'];
  const filledMore = [
    defaultValues.guest_phone && 'טלפון',
    defaultValues.guest_email && 'אימייל',
    defaultValues.total_price && 'מחיר',
    defaultValues.notes && 'הערות',
  ].filter(Boolean) as string[];
  const [moreOpen, setMoreOpen] = React.useState(isEdit && filledMore.length > 0);
  const moreHasError = MORE.some((k) => Boolean(err(k)));
  React.useEffect(() => { if (moreHasError) setMoreOpen(true); }, [moreHasError]);
  const liveSummary = [
    fm.values.guest_phone && 'טלפון',
    fm.values.guest_email && 'אימייל',
    fm.values.total_price && `₪${Number(fm.values.total_price).toLocaleString('he-IL')}`,
    fm.values.notes && 'הערה',
  ].filter(Boolean).join(' · ');

  const setDates = ({ start, end }: { start: string; end: string }) => {
    fm.handleChange('check_in_date', start as never);
    fm.handleChange('check_out_date', end as never);
    if (fm.form.formState.submitCount > 0) void fm.form.trigger(['check_in_date', 'check_out_date']);
  };
  const datesError = err('check_in_date') || err('check_out_date');
  const statusOptions = isEdit || !NEW_STATUS_OPTIONS.some((o) => o.value === fm.values.status) ? null : NEW_STATUS_OPTIONS;

  return (
    <>
      <FormRouteLeaveGuard blocker={fm.blocker} />
      <div className={formMachineFormClassName(fm.state) + ' flex flex-1 flex-col'} dir="rtl">
        <SheetBanner>{fm.serverError}</SheetBanner>
        <SheetGroup title="האורח">
          <SheetField label="שם האורח" htmlFor="bf-guest-name" error={err('guest_name')} errorId={errId('guest_name')}>
            <SheetInput
              id="bf-guest-name"
              {...fm.register('guest_name')}
              {...a11y('guest_name')}
              invalid={Boolean(err('guest_name'))}
              maxLength={BOOKING_LIMITS.guestName}
              autoComplete="off"
              enterKeyHint="next"
            />
          </SheetField>
          {units.length > 1 ? (
            <SheetField label="יחידה" htmlFor="bf-unit" error={err('property_id')} errorId={errId('property_id')}>
              <Controller
                control={fm.control}
                name="property_id"
                render={({ field }) => (
                  <SheetSelect
                    id="bf-unit"
                    value={field.value}
                    placeholder="בחרו יחידה"
                    options={units.map((u) => ({ value: u.id, label: u.name }))}
                    invalid={Boolean(err('property_id'))}
                    {...a11y('property_id')}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      fm.handleChange('property_id', e.target.value as never);
                      field.onChange(e.target.value);
                    }}
                  />
                )}
              />
            </SheetField>
          ) : null}
          {!hasUnits ? (
            <div className="rounded-[14px] bg-[#F7F8FB] px-4 py-3" role="status">
              <p className="text-[15px] font-semibold text-[#1B2656]">כדי לשמור הזמנה צריך יחידה</p>
              <p className="mt-0.5 text-[14px] text-[#1B2656]/70">
                עוד אין יחידות בחשבון.{' '}
                <a href="/setup" className="inline-flex min-h-[44px] items-center font-semibold text-[#3E2BF1] underline underline-offset-2">הוספת יחידה</a>
              </p>
            </div>
          ) : null}
        </SheetGroup>

        <SheetGroup title="מתי ומאיפה">
          <DateRangeField
            idPrefix="bf-dates"
            label="תאריכים"
            start={fm.values.check_in_date || ''}
            end={fm.values.check_out_date || ''}
            onChange={setDates}
            error={datesError}
            errorId={errId('check_in_date')}
          />
          <SheetField label="ערוץ" labelId="bf-source-label">
            <Controller
              control={fm.control}
              name="booking_source"
              render={({ field }) => (
                <SheetSegmented
                  labelledBy="bf-source-label"
                  value={field.value || 'direct'}
                  options={SOURCE_OPTIONS}
                  onChange={(val: string) => { fm.handleChange('booking_source', val as never); field.onChange(val); }}
                />
              )}
            />
          </SheetField>
        </SheetGroup>

        <div className="mb-5 empty:hidden"><BookingOverlapGuard
          propertyId={fm.values.property_id}
          checkIn={fm.values.check_in_date}
          checkOut={fm.values.check_out_date}
          excludeId={isEdit ? storageSuffix : undefined}
          onBlockingChange={setOverlapBlocked}
        /></div>

        <SheetMore open={moreOpen} onOpenChange={setMoreOpen} summary={liveSummary || (filledMore.length ? filledMore.join(', ') : '')}>
          <SheetGroup className="!mb-0">
            <div className="grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 min-[420px]:gap-3">
              <SheetField label="טלפון" htmlFor="bf-guest-phone" error={err('guest_phone')} errorId={errId('guest_phone')}>
                <SheetInput
                  id="bf-guest-phone"
                  {...fm.register('guest_phone')}
                  {...a11y('guest_phone')}
                  invalid={Boolean(err('guest_phone'))}
                  maxLength={BOOKING_LIMITS.phone}
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  className="text-right"
                  autoComplete="off"
                />
              </SheetField>
              <SheetField label="אימייל" htmlFor="bf-guest-email" error={err('guest_email')} errorId={errId('guest_email')}>
                <SheetInput
                  id="bf-guest-email"
                  {...fm.register('guest_email')}
                  {...a11y('guest_email')}
                  invalid={Boolean(err('guest_email'))}
                  maxLength={BOOKING_LIMITS.email}
                  type="email"
                  inputMode="email"
                  dir="ltr"
                  className="text-right"
                  autoComplete="off"
                  autoCapitalize="off"
                />
              </SheetField>
            </div>
            <SheetField label="מחיר כולל" htmlFor="bf-price" error={err('total_price')} errorId={errId('total_price')} hint={nights > 0 ? `על ${heNights(nights)}` : null}>
              <div className="relative">
                <SheetInput
                  id="bf-price"
                  type="text"
                  inputMode="decimal"
                  {...fm.register('total_price')}
                  {...a11y('total_price')}
                  invalid={Boolean(err('total_price'))}
                  className="pe-10"
                  dir="ltr"
                  style={{ textAlign: 'right' }}
                />
                <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[16px] text-[#1B2656]/70">₪</span>
              </div>
            </SheetField>
            <SheetField label="מצב ההזמנה" htmlFor="bf-status" labelId="bf-status-label">
              <Controller
                control={fm.control}
                name="status"
                render={({ field }) => (statusOptions ? (
                  <SheetSegmented
                    labelledBy="bf-status-label"
                    value={field.value}
                    options={statusOptions}
                    onChange={(val: string) => { fm.handleChange('status', val as never); field.onChange(val); }}
                  />
                ) : (
                  <SheetSelect
                    id="bf-status"
                    value={field.value}
                    options={STATUS_OPTIONS}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { fm.handleChange('status', e.target.value as never); field.onChange(e.target.value); }}
                  />
                ))}
              />
            </SheetField>
            <SheetField label="הערות" htmlFor="bf-notes" optional hint="רק אתם רואים את זה" error={err('notes')} errorId={errId('notes')}>
              <SheetInput id="bf-notes" {...fm.register('notes')} {...a11y('notes')} maxLength={BOOKING_LIMITS.notes} />
            </SheetField>
          </SheetGroup>
        </SheetMore>

        <SheetFooter>
          <SheetSubmit
            onClick={fm.handleSubmit}
            state={fm.state === 'submitting' ? 'submitting' : fm.state === 'success' ? 'success' : 'idle'}
            disabled={overlapBlocked}
            meta={nights > 0 ? heNights(nights) : null}
          >
            {submitLabel}
          </SheetSubmit>
        </SheetFooter>
      </div>
    </>
  );
}
