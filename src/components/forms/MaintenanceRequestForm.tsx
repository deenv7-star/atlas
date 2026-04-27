import * as React from 'react';
import { Controller, useFieldArray, type Path } from 'react-hook-form';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useFormMachine } from '@/hooks/useFormMachine';
import type { MaintenanceRequestFormValues } from '@/components/forms/atlasFormSchemas';
import { maintenanceRequestFormSchema } from '@/components/forms/atlasFormSchemas';
import { FormRouteLeaveGuard } from '@/components/forms/FormRouteLeaveGuard';
import {
  FormMachineErrorBanner,
  FormMachineFieldHint,
  formMachineFormClassName,
} from '@/components/forms/formMachineUi';

export type MaintenanceRequestFormProps = {
  storageSuffix: string;
  defaultValues: MaintenanceRequestFormValues;
  onSubmit: (data: MaintenanceRequestFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  enableRouteGuard?: boolean;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onRegisterDialogInterceptor?: (fn: ((open: boolean) => void) | null) => void;
  onAfterSubmitSuccess?: () => void;
};

export function MaintenanceRequestForm({
  storageSuffix,
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
  enableRouteGuard = true,
  setDialogOpen,
  onRegisterDialogInterceptor,
  onAfterSubmitSuccess,
}: MaintenanceRequestFormProps) {
  const storageKey = `atlas-form-maintenance-${storageSuffix}`;

  const fm = useFormMachine<MaintenanceRequestFormValues>({
    schema: maintenanceRequestFormSchema,
    defaultValues,
    onSubmit,
    storageKey,
    enableRouteGuard,
    onAfterSubmitSuccess,
  });

  const { fields } = useFieldArray({
    control: fm.control,
    name: 'checklist',
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
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>תאריך ושעה *</Label>
            <Input type="datetime-local" {...fm.register('scheduled_for')} className="mt-1 rounded-xl" />
            <FormMachineFieldHint
              error={fm.errors.scheduled_for}
              validating={fm.isFieldValidating('scheduled_for')}
            />
          </div>
          <div className="space-y-1.5">
            <Label>הקצה ל</Label>
            <Input {...fm.register('assigned_to_name')} className="mt-1 rounded-xl" placeholder="שם העובד" />
            <FormMachineFieldHint error={fm.errors.assigned_to_name} />
          </div>
          <div className="space-y-1.5">
            <Label>הערות</Label>
            <Textarea {...fm.register('notes')} className="mt-1 rounded-xl" rows={3} placeholder="הערות נוספות..." />
            <FormMachineFieldHint error={fm.errors.notes} />
          </div>
          <div className="space-y-2">
            <Label>רשימת בדיקה</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {fields.map((fieldRow, index) => (
                <div key={fieldRow.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Controller
                    control={fm.control}
                    name={`checklist.${index}.done`}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          if (fm.state === 'error') {
                            fm.handleChange(`checklist.${index}.done`, checked === true);
                          }
                          field.onChange(checked === true);
                        }}
                      />
                    )}
                  />
                  <span className="text-sm">{fieldRow.item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              fm.reset();
              onCancel();
            }}
            className="rounded-xl"
          >
            ביטול
          </Button>
          <Button
            type="button"
            onClick={fm.handleSubmit}
            disabled={fm.state === 'submitting'}
            className={[
              'relative rounded-xl gap-1.5 font-semibold',
              fm.state === 'success'
                ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                : 'bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220]',
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
              <>שומר…</>
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
