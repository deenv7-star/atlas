import * as React from 'react';
import { Controller } from 'react-hook-form';
import { Check, ChevronDown } from 'lucide-react';
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
  { value: 'NEW', label: 'חדשה' },
  { value: 'CONTACTED', label: 'בטיפול' },
  { value: 'OFFER_SENT', label: 'הצעה נשלחה' },
  { value: 'CONFIRMED', label: 'נסגרה' },
  { value: 'REJECTED', label: 'לא מתאימה לנו' },
  { value: 'LOST', label: 'הזמין במקום אחר' },
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

  // Audit 04.11 M4: name, phone, dates and what they asked for up front; the rest under "עוד פרטים".
  const uid = React.useId();
  const fid = (name: string) => `${uid}-${name}`;
  const MORE_FIELDS = ['email', 'property_id', 'adults', 'children', 'budget', 'status', 'source'] as const;
  const hasMoreValues = Boolean(
    defaultValues.email || defaultValues.property_id || defaultValues.budget || defaultValues.source ||
    (defaultValues.status && defaultValues.status !== 'NEW') ||
    Number(defaultValues.children || 0) > 0 || (defaultValues.adults && Number(defaultValues.adults) !== 2),
  );
  const [moreOpen, setMoreOpen] = React.useState(hasMoreValues);
  const moreHasError = MORE_FIELDS.some((k) => Boolean((fm.errors as Record<string, unknown>)[k]));
  React.useEffect(() => {
    if (moreHasError) setMoreOpen(true);
  }, [moreHasError]);

  React.useEffect(() => {
    const fn = (open: boolean) => {
      fm.interceptDialogClose(open, setDialogOpen);
    };
    onRegisterDialogInterceptor?.(fn);
    return () => onRegisterDialogInterceptor?.(null);
  }, [fm.interceptDialogClose, setDialogOpen, onRegisterDialogInterceptor]);

  const lbl = 'text-[13px] font-semibold text-navy-800';
  return (
    <>
      <FormRouteLeaveGuard blocker={fm.blocker} />
      {fm.serverError ? <FormMachineErrorBanner message={fm.serverError} /> : null}
      <div className={formMachineFormClassName(fm.state)} dir="rtl">
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor={fid('full_name')} className={lbl}>שם *</Label>
            <Input id={fid('full_name')} {...fm.register('full_name')} placeholder="שם האורח" className="h-11 text-base rounded-xl" autoComplete="name" aria-invalid={fm.errors.full_name ? true : undefined} />
            <FormMachineFieldHint error={fm.errors.full_name} validating={fm.isFieldValidating('full_name')} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor={fid('phone')} className={lbl}>טלפון</Label>
            <Input id={fid('phone')} type="tel" inputMode="tel" dir="ltr" {...fm.register('phone')} placeholder="050-0000000" className="h-11 text-base rounded-xl text-right" autoComplete="tel" aria-invalid={fm.errors.phone ? true : undefined} />
            <FormMachineFieldHint error={fm.errors.phone} validating={fm.isFieldValidating('phone')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={fid('check_in_date')} className={lbl}>כניסה</Label>
            <Input id={fid('check_in_date')} type="date" {...fm.register('check_in_date')} className="h-11 text-base rounded-xl" />
            <FormMachineFieldHint error={fm.errors.check_in_date} validating={fm.isFieldValidating('check_in_date')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={fid('check_out_date')} className={lbl}>יציאה</Label>
            <Input id={fid('check_out_date')} type="date" {...fm.register('check_out_date')} className="h-11 text-base rounded-xl" />
            <FormMachineFieldHint error={fm.errors.check_out_date} validating={fm.isFieldValidating('check_out_date')} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor={fid('notes')} className={lbl}>מה ביקשו</Label>
            <Textarea id={fid('notes')} {...fm.register('notes')} placeholder="למשל: זוג, סופ״ש, ג׳קוזי" rows={2} className="min-h-[72px] text-base resize-none rounded-xl" />
            <FormMachineFieldHint error={fm.errors.notes} />
          </div>
          <div className="col-span-2">
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-controls={fid('more')}
              onClick={() => setMoreOpen((v) => !v)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-1 text-[15px] font-semibold text-brand-700 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
            >
              <ChevronDown className={['h-4 w-4 transition-transform duration-200 motion-reduce:transition-none', moreOpen ? 'rotate-180' : ''].join(' ')} aria-hidden />
              עוד פרטים
            </button>
          </div>
          <div id={fid('more')} hidden={!moreOpen} className="col-span-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor={fid('email')} className={lbl}>אימייל</Label>
                <Input id={fid('email')} type="email" dir="ltr" {...fm.register('email')} placeholder="name@mail.com" className="h-11 text-base rounded-xl text-right" autoComplete="email" />
                <FormMachineFieldHint error={fm.errors.email} validating={fm.isFieldValidating('email')} />
              </div>
              {properties.length > 0 && (
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor={fid('property_id')} className={lbl}>יחידה</Label>
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
                        <SelectTrigger id={fid('property_id')} className="h-11 text-base rounded-xl">
                          <SelectValue placeholder="בחרו יחידה" />
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
                <Label htmlFor={fid('adults')} className={lbl}>מבוגרים</Label>
                <Input id={fid('adults')} type="number" inputMode="numeric" min={1} {...fm.register('adults')} className="h-11 text-base rounded-xl" />
                <FormMachineFieldHint error={fm.errors.adults} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={fid('children')} className={lbl}>ילדים</Label>
                <Input id={fid('children')} type="number" inputMode="numeric" min={0} {...fm.register('children')} className="h-11 text-base rounded-xl" />
                <FormMachineFieldHint error={fm.errors.children} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={fid('budget')} className={lbl}>תקציב (₪)</Label>
                <Input id={fid('budget')} type="number" inputMode="numeric" {...fm.register('budget')} placeholder="0" className="h-11 text-base rounded-xl" />
                <FormMachineFieldHint error={fm.errors.budget} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={fid('status')} className={lbl}>סטטוס</Label>
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
                <Label htmlFor={fid('source')} className={lbl}>מאיפה הגיעו</Label>
                <Input id={fid('source')} {...fm.register('source')} placeholder="למשל: פייסבוק, חברים, גוגל" className="h-11 text-base rounded-xl" />
                <FormMachineFieldHint error={fm.errors.source} />
              </div>
            </div>
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
