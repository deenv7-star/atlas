import * as React from 'react';
import { Controller } from 'react-hook-form';
import { Check } from 'lucide-react';
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
import type { PaymentFormValues } from '@/components/forms/atlasFormSchemas';
import { paymentFormSchema } from '@/components/forms/atlasFormSchemas';
import { FormRouteLeaveGuard } from '@/components/forms/FormRouteLeaveGuard';
import {
  FormMachineErrorBanner,
  FormMachineFieldHint,
  formMachineFormClassName,
} from '@/components/forms/formMachineUi';

const PAYMENT_STATUSES = [
  { value: 'PENDING', label: 'ממתין' },
  { value: 'PAID', label: 'שולם' },
  { value: 'PARTIAL', label: 'שולם חלקית' },
  // COPY-045: no card processing, so "לא עבר" is not offered for manual records (legacy rows still display it)
  { value: 'REFUNDED', label: 'הוחזר' },
  { value: 'OVERDUE', label: 'באיחור' },
];

const PAYMENT_METHODS = [
  { value: 'credit_card', label: 'כרטיס אשראי' },
  { value: 'bank_transfer', label: 'העברה בנקאית' },
  { value: 'cash', label: 'מזומן' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'bit', label: 'Bit' },
  { value: 'other', label: 'אחר' },
];

export type PaymentFormProps = {
  storageSuffix: string;
  defaultValues: PaymentFormValues;
  onSubmit: (data: PaymentFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  enableRouteGuard?: boolean;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onRegisterDialogInterceptor?: (fn: ((open: boolean) => void) | null) => void;
  onAfterSubmitSuccess?: () => void;
  bookings?: Array<{ id: string; guest_name?: string | null; check_in_date?: string | null }>;
};

const NO_BOOKING = '__none__';
const shortDate = (d?: string | null) => {
  if (!d) return '';
  const [y, m, dd] = String(d).slice(0, 10).split('-');
  return y && m && dd ? `${Number(dd)}.${Number(m)}` : '';
};

export function PaymentForm({
  storageSuffix,
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
  enableRouteGuard = true,
  setDialogOpen,
  onRegisterDialogInterceptor,
  onAfterSubmitSuccess,
  bookings,
}: PaymentFormProps) {
  const storageKey = `atlas-form-payment-${storageSuffix}`;

  const fm = useFormMachine<PaymentFormValues>({
    schema: paymentFormSchema,
    defaultValues,
    onSubmit,
    storageKey,
    enableRouteGuard,
    onAfterSubmitSuccess,
  });

  // Audit 04.11 M4: every label points at its control (VoiceOver reads the name), 44px controls and buttons.
  const uid = React.useId();
  const fid = (name: string) => `${uid}-${name}`;

  React.useEffect(() => {
    const fn = (open: boolean) => {
      fm.interceptDialogClose(open, setDialogOpen);
    };
    onRegisterDialogInterceptor?.(fn);
    return () => onRegisterDialogInterceptor?.(null);
  }, [fm.interceptDialogClose, setDialogOpen, onRegisterDialogInterceptor]);

  return (
    <>
      <FormRouteLeaveGuard blocker={fm.blocker} />
      {fm.serverError ? <FormMachineErrorBanner message={fm.serverError} /> : null}
      <div className={formMachineFormClassName(fm.state)} dir="rtl">
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor={fid('booking_id')} className="text-[13px] font-semibold text-navy-800">הזמנה <span className="font-normal text-gray-600">(לא חובה)</span></Label>
            {bookings ? (
              <Controller
                control={fm.control}
                name="booking_id"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : NO_BOOKING}
                    onValueChange={(v) => {
                      const val = v === NO_BOOKING ? '' : v;
                      fm.handleChange('booking_id', val);
                      field.onChange(val);
                    }}
                  >
                    <SelectTrigger id={fid('booking_id')} className="h-11 text-base rounded-xl">
                      <SelectValue placeholder="בחירת הזמנה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_BOOKING}>ללא הזמנה</SelectItem>
                      {field.value && !bookings.some((b) => b.id === field.value) ? (
                        <SelectItem value={String(field.value)}>הזמנה קיימת</SelectItem>
                      ) : null}
                      {bookings.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {(b.guest_name || 'אורח') + (b.check_in_date ? ` · ${shortDate(b.check_in_date)}` : '')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            ) : (
              <Input id={fid('booking_id')} {...fm.register('booking_id')} placeholder="מזהה הזמנה" className="h-11 text-base rounded-xl" dir="ltr" />
            )}
            <FormMachineFieldHint error={fm.errors.booking_id} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor={fid('description')} className="text-[13px] font-semibold text-navy-800">תיאור</Label>
            <Input id={fid('description')} {...fm.register('description')} placeholder="למשל: מקדמה לסופ״ש" className="h-11 text-base rounded-xl" />
            <FormMachineFieldHint error={fm.errors.description} validating={fm.isFieldValidating('description')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={fid('amount')} className="text-[13px] font-semibold text-navy-800">סכום (₪) *</Label>
            <Input id={fid('amount')} type="text" inputMode="decimal" {...fm.register('amount')} placeholder="0" className="h-11 text-base rounded-xl" />
            <FormMachineFieldHint error={fm.errors.amount} validating={fm.isFieldValidating('amount')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={fid('method')} className="text-[13px] font-semibold text-navy-800">אמצעי תשלום</Label>
            <Controller
              control={fm.control}
              name="method"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    fm.handleChange('method', v);
                    field.onChange(v);
                  }}
                >
                  <SelectTrigger id={fid('method')} className="h-11 text-base rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FormMachineFieldHint error={fm.errors.method} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={fid('status')} className="text-[13px] font-semibold text-navy-800">סטטוס</Label>
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
                  <SelectTrigger id={fid('status')} className="h-11 text-base rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((s) => (
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
          <div className="space-y-1.5">
            <Label htmlFor={fid('paid_date')} className="text-[13px] font-semibold text-navy-800">תאריך תשלום</Label>
            <Input id={fid('paid_date')} type="date" {...fm.register('paid_date')} className="h-11 text-base rounded-xl" />
            <FormMachineFieldHint error={fm.errors.paid_date} validating={fm.isFieldValidating('paid_date')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={fid('due_date')} className="text-[13px] font-semibold text-navy-800">תאריך יעד</Label>
            <Input id={fid('due_date')} type="date" {...fm.register('due_date')} className="h-11 text-base rounded-xl" />
            <FormMachineFieldHint error={fm.errors.due_date} validating={fm.isFieldValidating('due_date')} />
          </div>
        </div>
        <div className="flex gap-2 flex-col sm:flex-row pt-2">
          <Button
            type="button"
            onClick={fm.handleSubmit}
            disabled={fm.state === 'submitting'}
            className={[
              'h-11 gap-1.5 rounded-xl w-full sm:w-auto sm:min-w-[140px] font-semibold text-[15px]',
              fm.state === 'success'
                ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                : 'bg-brand-600 hover:bg-brand-500 text-white',
            ].join(' ')}
          >
            {fm.state === 'submitting' ? (
              <>
                <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin motion-reduce:animate-none" aria-hidden />
                שומרים…
              </>
            ) : fm.state === 'success' ? (
              <>נשמר</>
            ) : (
              <>
                <Check className="w-4 h-4" aria-hidden />
                {submitLabel}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              fm.reset();
              onCancel();
            }}
            className="h-11 rounded-xl w-full sm:w-auto text-[15px]"
          >
            ביטול
          </Button>
        </div>
      </div>
    </>
  );
}
