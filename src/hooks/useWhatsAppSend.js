/**
 * Opens a wa.me deep link and records the send in message_logs.
 * The window is opened synchronously inside the tap handler so mobile browsers
 * do not treat it as a popup; the log write happens after.
 */
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { waLink, logSubjectFor, normalizePhone } from '@/lib/stay/whatsapp';
import { STAY_KEYS } from '@/hooks/useStayData';

export function useWhatsAppSend({ orgId } = {}) {
  const qc = useQueryClient();

  return useCallback(async ({ booking, property, templateKey, text }) => {
    const url = waLink(booking?.guest_phone, text);
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win && typeof window !== 'undefined' && window.navigator?.userAgent?.includes('Capacitor')) {
      window.location.href = url;
    }
    const entry = {
      booking_id: booking?.id || null,
      direction: 'outbound',
      channel: 'whatsapp',
      recipient: normalizePhone(booking?.guest_phone) || booking?.guest_phone || '',
      subject: logSubjectFor(templateKey),
      body: text,
      status: 'sent',
      guest_name: booking?.guest_name || '',
      property_id: property?.id || booking?.property_id || null,
      property_name: property?.name || booking?.property_name || '',
      created_at: new Date().toISOString(),
    };
    if (orgId) entry.org_id = orgId;
    try {
      await base44.entities.MessageLog.create(entry);
    } finally {
      qc.invalidateQueries({ queryKey: STAY_KEYS.messageLogs });
      qc.invalidateQueries({ queryKey: ['message_logs'] });
    }
    return url;
  }, [orgId, qc]);
}
