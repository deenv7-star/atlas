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
  { value: 'PARTIAL', label: 'חלקי' },
  { value: 'FAILED', label: 'נכשל' },
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
            <Label className="text-xs text-gray-500">מזהה הזמנה (אופציונלי)</Label>
            <Input {...fm.register('booking_id')} placeholder="מזהה הזמנה" className="h-9 text-sm rounded-xl" dir="ltr" />
            <FormMachineFieldHint error={fm.errors.booking_id} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs text-gray-500">תיאור</Label>
            <Input {...fm.register('description')} placeholder="תיאור התשלום" className="h-9 text-sm rounded-xl" />
            <FormMachineFieldHint error={fm.errors.description} validating={fm.isFieldValidating('description')} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">סכום (₪) *</Label>
            <Input type="text" inputMode="decimal" {...fm.register('amount')} placeholder="0" className="h-9 text-sm rounded-xl" />
            <FormMachineFieldHint error={fm.errors.amount} validating={fm.isFieldValidating('amount')} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">אמצעי תשלום</Label>
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
                  <SelectTrigger className="h-9 text-sm rounded-xl">
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
            <Label className="text-xs text-gray-500">סטטוס</Label>
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
                  <SelectTrigger className="h-9 text-sm rounded-xl">
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
            <Label className="text-xs text-gray-500">תאריך תשלום</Label>
            <Input type="date" {...fm.register('paid_date')} className="h-9 text-sm rounded-xl" />
            <FormMachineFieldHint error={fm.errors.paid_date} validating={fm.isFieldValidating('paid_date')} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">תאריך יעד</Label>
            <Input type="date" {...fm.register('due_date')} className="h-9 text-sm rounded-xl" />
            <FormMachineFieldHint error={fm.errors.due_date} validating={fm.isFieldValidating('due_date')} />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            type="button"
            size="sm"
            onClick={() => {
              fm.reset();
              onCancel();
            }}
            className="h-9 rounded-xl"
          >
            ביטול
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={fm.handleSubmit}
            disabled={fm.state === 'submitting'}
            className={[
              'relative h-9 gap-1.5 rounded-xl font-semibold',
              fm.state === 'success'
                ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                : 'bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220]',
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
                <span className="inline-block h-4 w-4 border-2 border-[#0B1220] border-t-transparent rounded-full animate-spin" />
                שומר…
              </>
            ) : fm.state === 'success' ? (
              <>נשמר</>
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
