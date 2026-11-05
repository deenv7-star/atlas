/** The quick booking sheet itself (lazy, see ./QuickBooking.jsx): form + create mutation, as before. */
import React, { useMemo, useRef } from 'react';
import { AtlasSheet } from '@/components/ui/sheet/AtlasSheet';
import { isPlaceholderUnitName } from '@/lib/unitName';
import { BookingForm } from '@/components/forms/BookingForm';
import { emptyBookingFormValues } from '@/components/forms/atlasFormSchemas';
import { useCreateBooking, useProperties } from '@/data/entities';
import { useToast } from '@/components/ui/AtlasToast';
import { bookingFormToPayload } from '@/lib/entityPayloads';
import { bookingSaveErrorHe } from './QuickBooking';

export default function QuickBookingSheet({ state, close, setOpen }) {
  const interceptRef = useRef(null);
  const { data: properties = [] } = useProperties();
  const createMutation = useCreateBooking();
  const { success } = useToast();
  const preset = state.preset || {};
  const opts = state.opts || {};
  const { property_name: presetPropertyName, ...presetValues } = preset;
  // Name a unit in the subtitle only when it is a real name and there is more than one to choose from.
  const unitLine = presetPropertyName && properties.length > 1 && !isPlaceholderUnitName(presetPropertyName) ? presetPropertyName : '';
  const defaults = useMemo(() => ({ ...emptyBookingFormValues, ...presetValues }), [state.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AtlasSheet
      open={state.open}
      onOpenChange={(o) => {
        const h = interceptRef.current;
        if (h) { h(o); return; }
        setOpen(o);
      }}
      title={opts.title || 'הזמנה חדשה'}
      subtitle={opts.leadId
        ? 'מילאנו את מה שהיה בפנייה. בדקו תאריכים ושמרו.'
        : unitLine
          ? `${unitLine} · את השאר אפשר להשלים אחר כך.`
          : 'את השאר אפשר להשלים אחר כך.'}
    >
      <BookingForm
        key={`quick-${state.nonce}`}
        storageSuffix={opts.leadId ? `lead-${opts.leadId}` : preset.check_in_date || preset.property_id ? `quick-${preset.property_id || ''}-${preset.check_in_date || ''}` : 'quick'}
        defaultValues={defaults}
        properties={properties.map((p) => ({ id: p.id, name: p.name }))}
        enableRouteGuard={false}
        onSubmit={async (data) => {
          const payload = bookingFormToPayload(data);
          if (opts.leadId) payload.lead_id = opts.leadId;
          let created;
          try {
            created = await createMutation.mutateAsync(payload);
          } catch (err) {
            // Audit 04.11 #4: the form shows this in its banner; no second copy as a toast.
            throw new Error(bookingSaveErrorHe(err));
          }
          success('ההזמנה נשמרה');
          if (opts.onCreated) await opts.onCreated(created);
        }}
        onCancel={close}
        setDialogOpen={setOpen}
        onRegisterDialogInterceptor={(fn) => { interceptRef.current = fn; }}
        onAfterSubmitSuccess={() => window.setTimeout(close, 700)}
        submitLabel="שמירת הזמנה"
      />
    </AtlasSheet>
  );
}
