/** Template picker + editable preview + one tap to open WhatsApp with the text filled in. */
import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { StaySheet } from './StaySheet';
import HelpHint from '@/components/help/HelpHint';
import { Btn } from './StayUI';
import { TEMPLATES, renderTemplate, normalizePhone, templateByKey } from '@/lib/stay/whatsapp';
import { formatRangeHe } from '@/lib/stay/format';
import { useWhatsAppSend } from '@/hooks/useWhatsAppSend';
import { useEnsureGuestToken } from '@/hooks/useGuestToken';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';

export function WhatsAppComposer({ open, onOpenChange, booking: bookingProp, property, balance, initialTemplate = 'confirmation', orgId, orgName, onSent }) {
  const [templateKey, setTemplateKey] = useState(initialTemplate);
  const [booking, setBooking] = useState(bookingProp);
  const ensureToken = useEnsureGuestToken();

  useEffect(() => {
    let alive = true;
    setBooking(bookingProp);
    if (open && bookingProp && !bookingProp.guest_token) {
      ensureToken(bookingProp).then((b) => { if (alive) setBooking(b); });
    }
    return () => { alive = false; };
  }, [open, bookingProp, ensureToken]);
  const [text, setText] = useState('');
  const [dirty, setDirty] = useState(false);
  const send = useWhatsAppSend({ orgId });

  const rendered = useMemo(
    () => (booking ? renderTemplate(templateKey, { booking, property, balance, orgName }) : ''),
    [templateKey, booking, property, balance, orgName],
  );

  useEffect(() => {
    if (open) { setTemplateKey(initialTemplate); setDirty(false); }
  }, [open, initialTemplate, booking?.id]);

  useEffect(() => {
    if (!dirty) setText(rendered);
  }, [rendered, dirty]);

  const phoneOk = !!normalizePhone(booking?.guest_phone);

  const handleSend = async () => {
    try {
      await send({ booking, property, templateKey, text });
      atlasToastApi.success(`נפתח וואטסאפ ל${booking?.guest_name || 'אורח'}. ההודעה נשמרה בהודעות.`);
      onSent?.(templateKey);
      onOpenChange(false);
    } catch {
      atlasToastApi.error('וואטסאפ נפתח, אבל לא הצלחנו לשמור את ההודעה ביומן.');
      onOpenChange(false);
    }
  };

  if (!booking) return null;

  return (
    <StaySheet
      open={open}
      onOpenChange={onOpenChange}
      title={<span className="inline-flex items-center gap-0.5">{`הודעה ל${booking.guest_name || 'אורח'}`}<HelpHint id="messages.whatsapp" /></span>}
      description={`${property?.name || booking.property_name || ''}${booking.check_in_date ? ` · ${formatRangeHe(booking.check_in_date, booking.check_out_date)}` : ''}`}
      footer={(
        <>
          <Btn variant="primary" size="lg" icon={MessageCircle} onClick={handleSend} disabled={!text.trim()} className="w-full sm:w-auto">
            שליחה בוואטסאפ
          </Btn>
          <Btn variant="secondary" size="lg" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">ביטול</Btn>
        </>
      )}
    >
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="radiogroup" aria-label="תבנית">
        {TEMPLATES.map((t) => {
          const active = t.key === templateKey;
          return (
            <button
              key={t.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => { setTemplateKey(t.key); setDirty(false); }}
              className="ab-btn ab-btn-sm shrink-0"
              style={active
                ? { background: 'var(--brand-600)', color: '#fff' }
                : { background: 'var(--surface)', color: 'var(--ink-900)', borderColor: 'var(--line)' }}
            >
              {t.short}
            </button>
          );
        })}
      </div>

      <label className="ab-label mt-4" htmlFor="wa-text">{templateByKey(templateKey).label}</label>
      <textarea
        id="wa-text"
        className="ab-input"
        rows={9}
        value={text}
        onChange={(e) => { setText(e.target.value); setDirty(true); }}
      />
      <div className="flex items-center gap-2 mt-2.5 ab-meta">
        <Phone size={16} strokeWidth={1.75} aria-hidden />
        {phoneOk
          ? <span dir="ltr" className="ab-num">{booking.guest_phone}</span>
          : <span style={{ color: 'var(--status-warning)' }}>אין מספר טלפון בהזמנה. וואטסאפ ייפתח ותבחרו איש קשר.</span>}
      </div>
    </StaySheet>
  );
}
