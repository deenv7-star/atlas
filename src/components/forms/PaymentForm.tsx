import * as React from 'react';
import { Check } from 'lucide-react';
import {
  SheetGroup, SheetField, SheetInput, SheetSelect, SheetSegmented, SheetMore,
  SheetFooter, SheetSubmit, SheetBanner, SheetTextButton,
} from '@/components/ui/sheet/fields';
import { DateField } from '@/components/ui/sheet/DateRangeField';
import { useFormMachine } from '@/hooks/useFormMachine';
import type { PaymentFormValues } from '@/components/forms/atlasFormSchemas';
import { paymentFormSchema } from '@/components/forms/atlasFormSchemas';
import { FormRouteLeaveGuard } from '@/components/forms/FormRouteLeaveGuard';
import { formMachineFormClassName } from '@/components/forms/formMachineUi';

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
  /** Quiet text action under the primary button (e.g. delete when editing). */
  secondaryAction?: { label: string; onClick: () => void; danger?: boolean; disabled?: boolean } | null;
};

const shortDate = (d?: string | null) => {
  if (!d) return '';
  const [y, m, dd] = String(d).slice(0, 10).split('-');
  return y && m && dd ? `${Number(dd)}.${Number(m)}` : '';
};

export function PaymentForm({
  storageSuffix,
  defaultValues,
  onSubmit,
  onCancel: _onCancel, // closing is the sheet's X
  submitLabel,
  enableRouteGuard = true,
  setDialogOpen,
  onRegisterDialogInterceptor,
  onAfterSubmitSuccess,
  bookings,
  secondaryAction = null,
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

  const err = (k: keyof PaymentFormValues) => fm.errors[k as string];
  const errId = (k: string) => fid(`${k}-err`);
  const isEdit = storageSuffix !== 'new';
  const [moreOpen, setMoreOpen] = React.useState(isEdit);
  const moreHasError = ['method', 'paid_date', 'due_date', 'description'].some((k) => Boolean(fm.errors[k]));
  React.useEffect(() => { if (moreHasError) setMoreOpen(true); }, [moreHasError]);
  const simpleStatus = ['PAID', 'PENDING'].includes(String(fm.values.status || ''));
  const bookingOptions = bookings
    ? [
      { value: '', label: 'ללא הזמנה' },
      ...(fm.values.booking_id && !bookings.some((b) => b.id === fm.values.booking_id) ? [{ value: String(fm.values.booking_id), label: 'הזמנה קיימת' }] : []),
      ...bookings.map((b) => ({ value: b.id, label: (b.guest_name || 'אורח') + (b.check_in_date ? ` · ${shortDate(b.check_in_date)}` : '') })),
    ]
    : null;
  const methodLabel = PAYMENT_METHODS.find((m) => m.value === fm.values.method)?.label;
  const summary = [methodLabel, fm.values.description && 'תיאור'].filter(Boolean).join(' · ');

  return (
    <>
      <FormRouteLeaveGuard blocker={fm.blocker} />
      <div className={formMachineFormClassName(fm.state) + ' flex flex-1 flex-col'} dir="rtl">
        <SheetBanner>{fm.serverError}</SheetBanner>
        <SheetGroup title="התשלום">
          <SheetField label="סכום" htmlFor={fid('amount')} error={err('amount')} errorId={errId('amount')}>
            <div className="relative">
              <SheetInput
                id={fid('amount')}
                type="text"
                inputMode="decimal"
                {...fm.register('amount')}
                invalid={Boolean(err('amount'))}
                aria-describedby={err('amount') ? errId('amount') : undefined}
                dir="ltr"
                className="pe-10 text-[18px] font-semibold"
                style={{ textAlign: 'right' }}
              />
              <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[16px] text-[#1B2656]/70">₪</span>
            </div>
          </SheetField>
          <SheetField label="מצב" labelId={fid('status-label')} htmlFor={fid('status')}>
            {simpleStatus ? (
              <SheetSegmented
                labelledBy={fid('status-label')}
                value={String(fm.values.status)}
                options={[{ value: 'PAID', label: 'שולם' }, { value: 'PENDING', label: 'ממתין' }]}
                onChange={(val: string) => fm.handleChange('status', val as never)}
              />
            ) : (
              <SheetSelect id={fid('status')} value={String(fm.values.status || '')} options={PAYMENT_STATUSES} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => fm.handleChange('status', e.target.value as never)} />
            )}
          </SheetField>
          <SheetField label="הזמנה" optional htmlFor={fid('booking_id')} error={err('booking_id')} errorId={errId('booking_id')}>
            {bookingOptions ? (
              <SheetSelect
                id={fid('booking_id')}
                value={fm.values.booking_id ? String(fm.values.booking_id) : ''}
                options={bookingOptions}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => fm.handleChange('booking_id', e.target.value as never)}
              />
            ) : (
              <SheetInput id={fid('booking_id')} {...fm.register('booking_id')} dir="ltr" />
            )}
          </SheetField>
        </SheetGroup>
        <SheetMore open={moreOpen} onOpenChange={setMoreOpen} summary={summary || 'אמצעי תשלום, תאריכים ותיאור'}>
          <SheetGroup className="!mb-0">
            <SheetField label="אמצעי תשלום" htmlFor={fid('method')}>
              <SheetSelect id={fid('method')} value={String(fm.values.method || '')} placeholder="בחרו" options={PAYMENT_METHODS} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => fm.handleChange('method', e.target.value as never)} />
            </SheetField>
            <DateField idPrefix={fid('paid')} label="תאריך תשלום" value={String(fm.values.paid_date || '')} onChange={(iso: string) => fm.handleChange('paid_date', iso as never)} error={err('paid_date')} />
            <DateField idPrefix={fid('due')} label="תאריך יעד" optional value={String(fm.values.due_date || '')} onChange={(iso: string) => fm.handleChange('due_date', iso as never)} error={err('due_date')} />
            <SheetField label="תיאור" optional htmlFor={fid('description')} hint="למשל: מקדמה לסוף השבוע">
              <SheetInput id={fid('description')} {...fm.register('description')} />
            </SheetField>
          </SheetGroup>
        </SheetMore>
        <SheetFooter>
          <SheetSubmit onClick={fm.handleSubmit} state={fm.state === 'submitting' ? 'submitting' : fm.state === 'success' ? 'success' : 'idle'}>
            {submitLabel}
          </SheetSubmit>
          {secondaryAction ? (
            <SheetTextButton tone={secondaryAction.danger ? 'danger' : 'neutral'} disabled={secondaryAction.disabled} onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </SheetTextButton>
          ) : null}
        </SheetFooter>
      </div>
    </>
  );
}
