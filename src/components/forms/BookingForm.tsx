import * as React from 'react';
import { Controller } from 'react-hook-form';
import { parseISO, differenceInDays } from 'date-fns';
import { Check, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFormMachine } from '@/hooks/useFormMachine';
import type { BookingFormValues } from '@/components/forms/atlasFormSchemas';
import { bookingFormSchema } from '@/components/forms/atlasFormSchemas';
import { FormRouteLeaveGuard } from '@/components/forms/FormRouteLeaveGuard';
import {
  FormMachineErrorBanner,
  FormMachineFieldHint,
  formMachineFormClassName,
} from '@/components/forms/formMachineUi';
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
  onCancel,
  submitLabel,
  enableRouteGuard = true,
  setDialogOpen,
  onRegisterDialogInterceptor,
  onAfterSubmitSuccess,
}: BookingFormProps) {
  const storageKey = `atlas-form-booking-${storageSuffix}`;

  const fm = useFormMachine<BookingFormValues>({
    schema: bookingFormSchema,
    defaultValues,
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

  const nights = React.useMemo(() => {
    try {
      const { check_in_date: ci, check_out_date: co } = fm.values;
      if (ci && co) {
        return differenceInDays(parseISO(co), parseISO(ci));
      }
    } catch {
      /* ignore */
    }
    return 0;
  }, [fm.values.check_in_date, fm.values.check_out_date]);

  return (
    <>
      <FormRouteLeaveGuard blocker={fm.blocker} />
      {fm.serverError ? <FormMachineErrorBanner message={fm.serverError} /> : null}
      <div className={formMachineFormClassName(fm.state)} dir="rtl">
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-[14px] font-medium text-ink-600">שם אורח *</Label>
            <Input
              {...fm.register('guest_name')}
              placeholder="שם מלא"
              className="h-12 md:h-11 rounded-[10px]"
              autoComplete="name"
            />
            <FormMachineFieldHint
              error={fm.errors.guest_name}
              validating={fm.isFieldValidating('guest_name')}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[14px] font-medium text-ink-600">אימייל</Label>
            <Input
              {...fm.register('guest_email')}
              type="email"
              inputMode="email"
              dir="ltr"
              placeholder="email@example.com"
              className="h-12 md:h-11 rounded-[10px]"
              autoComplete="email"
            />
            <FormMachineFieldHint
              error={fm.errors.guest_email}
              validating={fm.isFieldValidating('guest_email')}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[14px] font-medium text-ink-600">טלפון</Label>
            <Input
              {...fm.register('guest_phone')}
              type="tel"
              inputMode="tel"
              dir="ltr"
              placeholder="050-0000000"
              className="h-12 md:h-11 rounded-[10px]"
              autoComplete="tel"
            />
            <FormMachineFieldHint
              error={fm.errors.guest_phone}
              validating={fm.isFieldValidating('guest_phone')}
            />
          </div>
          {properties.length > 0 && (
            <div className="col-span-2 space-y-1.5">
              <Label className="text-[14px] font-medium text-ink-600">נכס</Label>
              <Controller
                control={fm.control}
                name="property_id"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      fm.handleChange('property_id', v);
                      field.onChange(v);
                    }}
                  >
                    <SelectTrigger aria-label="נכס" className="h-12 md:h-11 rounded-[10px]">
                      <SelectValue placeholder="בחר נכס" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((prop) => (
                        <SelectItem key={prop.id} value={prop.id}>
                          {prop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormMachineFieldHint error={fm.errors.property_id} />
            </div>
          )}
          <div className="col-span-2 space-y-1.5">
            <Label className="text-[14px] font-medium text-ink-600">ערוץ</Label>
            <Controller
              control={fm.control}
              name="booking_source"
              render={({ field }) => (
                <div role="radiogroup" aria-label="ערוץ" className="grid grid-cols-3 gap-1 rounded-[12px] bg-neutral-100 p-1">
                  {[
                    { v: 'direct', l: 'ישיר', c: '#3E2BF1' },
                    { v: 'booking', l: 'Booking.com', c: '#1B2656' },
                    { v: 'airbnb', l: 'Airbnb', c: '#EF5B5B' },
                  ].map((o) => {
                    const on = (field.value || 'direct') === o.v;
                    return (
                      <button
                        key={o.v}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => {
                          fm.handleChange('booking_source', o.v);
                          field.onChange(o.v);
                        }}
                        className={
                          'press inline-flex h-11 items-center justify-center gap-1.5 rounded-[9px] text-[14px] font-medium ' +
                          (on ? 'bg-white text-navy-900 shadow-[0_1px_2px_rgba(27,38,86,0.1)]' : 'text-ink-600')
                        }
                      >
                        <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: o.c }} />
                        {o.l}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bf-check-in" className="text-[14px] font-medium text-ink-600">תאריך כניסה *</Label>
            <Input id="bf-check-in" type="date" {...fm.register('check_in_date')} className="h-12 md:h-11 rounded-[10px]" />
            <FormMachineFieldHint
              error={fm.errors.check_in_date}
              validating={fm.isFieldValidating('check_in_date')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bf-check-out" className="text-[14px] font-medium text-ink-600">תאריך יציאה</Label>
            <Input id="bf-check-out" type="date" {...fm.register('check_out_date')} className="h-12 md:h-11 rounded-[10px]" />
            <FormMachineFieldHint
              error={fm.errors.check_out_date}
              validating={fm.isFieldValidating('check_out_date')}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[14px] font-medium text-ink-600">מחיר כולל (₪)</Label>
            <Input type="number" {...fm.register('total_price')} placeholder="0" className="h-12 md:h-11 rounded-[10px]" />
            <FormMachineFieldHint error={fm.errors.total_price} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[14px] font-medium text-ink-600">סטטוס</Label>
            <Controller
              control={fm.control}
              name="status"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    fm.handleChange('status', v);
                    field.onChange(v);
                  }}
                >
                  <SelectTrigger aria-label="סטטוס" className="h-12 md:h-11 rounded-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FormMachineFieldHint error={fm.errors.status} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-[14px] font-medium text-ink-600">הערות</Label>
            <Input {...fm.register('notes')} placeholder="הערות פנימיות" className="h-12 md:h-11 rounded-[10px]" />
            <FormMachineFieldHint error={fm.errors.notes} />
          </div>
          <BookingOverlapGuard
            propertyId={fm.values.property_id}
            checkIn={fm.values.check_in_date}
            checkOut={fm.values.check_out_date}
            excludeId={storageSuffix !== 'new' ? storageSuffix : undefined}
            onBlockingChange={setOverlapBlocked}
          />
          {nights > 0 && (
            <div className="col-span-2">
              <div className="flex items-center gap-2 text-[14px] font-medium text-brand-700 bg-brand-50 px-3 py-2.5 rounded-[10px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> {nights} לילות
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-col-reverse sm:flex-row sm:justify-start pt-3">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              fm.reset();
              onCancel();
            }}
            className="min-h-[44px] h-11 rounded-xl w-full sm:w-auto"
          >
            ביטול
          </Button>
          <Button
            type="button"
            onClick={fm.handleSubmit}
            disabled={fm.state === 'submitting' || overlapBlocked}
            className={[
              'relative min-h-[44px] h-11 gap-1.5 rounded-xl w-full sm:w-auto font-semibold',
              fm.state === 'success'
                ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                : 'bg-brand-600 hover:bg-brand-500 text-white',
            ].join(' ')}
          >
            {(fm.state === 'dirty' || fm.state === 'error') && (
              <span
                className="absolute top-1.5 left-2 h-2 w-2 rounded-full bg-amber-400 shadow-sm"
                aria-hidden
                title="שינויים לא נשמרו"
              />
            )}
            {fm.state === 'submitting' ? (
              <>
                <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                שומר…
              </>
            ) : fm.state === 'success' ? (
              <>
                <Check className="w-4 h-4" />
                נשמר
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {submitLabel}
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
