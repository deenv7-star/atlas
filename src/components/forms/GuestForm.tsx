import * as React from 'react';
import { Controller } from 'react-hook-form';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFormMachine } from '@/hooks/useFormMachine';
import type { GuestFormValues } from '@/components/forms/atlasFormSchemas';
import { guestFormSchema } from '@/components/forms/atlasFormSchemas';
import { FormRouteLeaveGuard } from '@/components/forms/FormRouteLeaveGuard';
import {
  FormMachineErrorBanner,
  FormMachineFieldHint,
  formMachineFormClassName,
} from '@/components/forms/formMachineUi';

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'חדש' },
  { value: 'CONTACTED', label: 'נוצר קשר' },
  { value: 'OFFER_SENT', label: 'הצעה נשלחה' },
  { value: 'CONFIRMED', label: 'מאושר' },
  { value: 'REJECTED', label: 'נדחה' },
  { value: 'LOST', label: 'לא רלוונטי' },
];

export type GuestFormProps = {
  storageSuffix: string;
  defaultValues: GuestFormValues;
  properties: Array<{ id: string; name: string }>;
  onSubmit: (data: GuestFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  enableRouteGuard?: boolean;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onRegisterDialogInterceptor?: (fn: ((open: boolean) => void) | null) => void;
  onAfterSubmitSuccess?: () => void;
};

export function GuestForm({
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
}: GuestFormProps) {
  const storageKey = `atlas-form-guest-${storageSuffix}`;

  const fm = useFormMachine<GuestFormValues>({
    schema: guestFormSchema,
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
            <Label className="text-xs font-semibold">שם מלא *</Label>
            <Input {...fm.register('full_name')} placeholder="שם מלא" className="h-9 text-sm rounded-xl" autoComplete="name" />
            <FormMachineFieldHint error={fm.errors.full_name} validating={fm.isFieldValidating('full_name')} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">טלפון</Label>
            <Input {...fm.register('phone')} placeholder="050-0000000" className="h-9 text-sm rounded-xl" autoComplete="tel" />
            <FormMachineFieldHint error={fm.errors.phone} validating={fm.isFieldValidating('phone')} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">אימייל</Label>
            <Input {...fm.register('email')} placeholder="email@example.com" className="h-9 text-sm rounded-xl" autoComplete="email" />
            <FormMachineFieldHint error={fm.errors.email} validating={fm.isFieldValidating('email')} />
          </div>
          {properties.length > 0 && (
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold">נכס</Label>
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
                    <SelectTrigger className="h-9 text-sm rounded-xl">
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
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">תאריך כניסה</Label>
            <Input type="date" {...fm.register('check_in_date')} className="h-9 text-sm rounded-xl" />
            <FormMachineFieldHint error={fm.errors.check_in_date} validating={fm.isFieldValidating('check_in_date')} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">תאריך יציאה</Label>
            <Input type="date" {...fm.register('check_out_date')} className="h-9 text-sm rounded-xl" />
            <FormMachineFieldHint error={fm.errors.check_out_date} validating={fm.isFieldValidating('check_out_date')} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">מבוגרים</Label>
            <Input type="number" min={1} {...fm.register('adults')} className="h-9 text-sm rounded-xl" />
            <FormMachineFieldHint error={fm.errors.adults} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">ילדים</Label>
            <Input type="number" min={0} {...fm.register('children')} className="h-9 text-sm rounded-xl" />
            <FormMachineFieldHint error={fm.errors.children} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">תקציב (₪)</Label>
            <Input type="number" {...fm.register('budget')} placeholder="0" className="h-9 text-sm rounded-xl" />
            <FormMachineFieldHint error={fm.errors.budget} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">סטטוס</Label>
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
            <Label className="text-xs font-semibold">מקור</Label>
            <Input {...fm.register('source')} placeholder="מקור הפניה" className="h-9 text-sm rounded-xl" />
            <FormMachineFieldHint error={fm.errors.source} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs font-semibold">הערות</Label>
            <Textarea {...fm.register('notes')} placeholder="הערות נוספות..." rows={2} className="text-sm resize-none rounded-xl" />
            <FormMachineFieldHint error={fm.errors.notes} />
          </div>
        </div>
        <div className="flex gap-2 flex-col sm:flex-row pt-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              fm.reset();
              onCancel();
            }}
            className="h-9 rounded-xl w-full sm:w-auto"
          >
            ביטול
          </Button>
          <Button
            type="button"
            onClick={fm.handleSubmit}
            disabled={fm.state === 'submitting'}
            className={[
              'relative h-9 gap-1.5 rounded-xl w-full sm:w-auto font-semibold',
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
