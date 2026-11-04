import * as React from 'react';
import {
  SheetGroup, SheetField, SheetInput, SheetTextarea, SheetSelect, SheetMore,
  SheetFooter, SheetSubmit, SheetBanner,
} from '@/components/ui/sheet/fields';
import { DateRangeField } from '@/components/ui/sheet/DateRangeField';
import { displayUnits } from '@/lib/unitName';
import { useFormMachine } from '@/hooks/useFormMachine';
import type { GuestFormValues } from '@/components/forms/atlasFormSchemas';
import { guestFormSchema } from '@/components/forms/atlasFormSchemas';
import { FormRouteLeaveGuard } from '@/components/forms/FormRouteLeaveGuard';
import { formMachineFormClassName } from '@/components/forms/formMachineUi';

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
  onCancel: _onCancel, // closing is the sheet's X
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

  const units = React.useMemo(() => displayUnits(properties), [properties]);
  const err = (k: keyof GuestFormValues) => (fm.errors as Record<string, string>)[k as string];
  const errId = (k: string) => fid(`${k}-err`);
  const summary = [
    fm.values.email && 'אימייל',
    Number(fm.values.adults || 2) !== 2 ? `${fm.values.adults} מבוגרים` : '',
    Number(fm.values.children || 0) ? `${fm.values.children} ילדים` : '',
    fm.values.budget && 'תקציב',
  ].filter(Boolean).join(' · ');

  return (
    <>
      <FormRouteLeaveGuard blocker={fm.blocker} />
      <div className={formMachineFormClassName(fm.state) + ' flex flex-1 flex-col'} dir="rtl">
        <SheetBanner>{fm.serverError}</SheetBanner>
        <SheetGroup title="מי פנה">
          <SheetField label="שם" htmlFor={fid('full_name')} error={err('full_name')} errorId={errId('full_name')}>
            <SheetInput id={fid('full_name')} {...fm.register('full_name')} invalid={Boolean(err('full_name'))} aria-describedby={err('full_name') ? errId('full_name') : undefined} autoComplete="off" />
          </SheetField>
          <SheetField label="טלפון" htmlFor={fid('phone')} error={err('phone')} errorId={errId('phone')}>
            <SheetInput id={fid('phone')} type="tel" inputMode="tel" dir="ltr" className="text-right" {...fm.register('phone')} invalid={Boolean(err('phone'))} autoComplete="off" />
          </SheetField>
        </SheetGroup>
        <SheetGroup title="מה ביקשו">
          <DateRangeField
            idPrefix={fid('dates')}
            label="תאריכים"
            start={String(fm.values.check_in_date || '')}
            end={String(fm.values.check_out_date || '')}
            onChange={({ start, end }: { start: string; end: string }) => { fm.handleChange('check_in_date', start as never); fm.handleChange('check_out_date', end as never); }}
            error={err('check_in_date') || err('check_out_date')}
          />
          <SheetField label="מה ביקשו" optional htmlFor={fid('notes')} hint="למשל: זוג, סוף שבוע, ג׳קוזי" error={err('notes')}>
            <SheetTextarea id={fid('notes')} {...fm.register('notes')} />
          </SheetField>
        </SheetGroup>
        <SheetMore open={moreOpen} onOpenChange={setMoreOpen} summary={summary || 'אימייל, כמה אורחים, תקציב ומצב'}>
          <SheetGroup className="!mb-0">
            <SheetField label="אימייל" htmlFor={fid('email')} error={err('email')} errorId={errId('email')}>
              <SheetInput id={fid('email')} type="email" inputMode="email" dir="ltr" className="text-right" autoCapitalize="off" {...fm.register('email')} invalid={Boolean(err('email'))} autoComplete="off" />
            </SheetField>
            {units.length > 1 ? (
              <SheetField label="יחידה" htmlFor={fid('property_id')}>
                <SheetSelect id={fid('property_id')} value={String(fm.values.property_id || '')} placeholder="בחרו יחידה" options={units.map((u) => ({ value: u.id, label: u.name }))} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => fm.handleChange('property_id', e.target.value as never)} />
              </SheetField>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <SheetField label="מבוגרים" htmlFor={fid('adults')} error={err('adults')}>
                <SheetInput id={fid('adults')} type="number" inputMode="numeric" min={1} {...fm.register('adults')} />
              </SheetField>
              <SheetField label="ילדים" htmlFor={fid('children')} error={err('children')}>
                <SheetInput id={fid('children')} type="number" inputMode="numeric" min={0} {...fm.register('children')} />
              </SheetField>
            </div>
            <SheetField label="תקציב" optional htmlFor={fid('budget')} error={err('budget')}>
              <div className="relative">
                <SheetInput id={fid('budget')} type="text" inputMode="numeric" dir="ltr" className="pe-10" style={{ textAlign: 'right' }} {...fm.register('budget')} />
                <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[16px] text-[#1B2656]/45">₪</span>
              </div>
            </SheetField>
            <SheetField label="מצב הפנייה" htmlFor={fid('status')}>
              <SheetSelect id={fid('status')} value={String(fm.values.status || 'NEW')} options={STATUS_OPTIONS} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => fm.handleChange('status', e.target.value as never)} />
            </SheetField>
            <SheetField label="מאיפה הגיעו" optional htmlFor={fid('source')} hint="למשל: פייסבוק, חברים, גוגל">
              <SheetInput id={fid('source')} {...fm.register('source')} />
            </SheetField>
          </SheetGroup>
        </SheetMore>
        <SheetFooter>
          <SheetSubmit onClick={fm.handleSubmit} state={fm.state === 'submitting' ? 'submitting' : fm.state === 'success' ? 'success' : 'idle'}>
            {submitLabel}
          </SheetSubmit>
        </SheetFooter>
      </div>
    </>
  );
}
