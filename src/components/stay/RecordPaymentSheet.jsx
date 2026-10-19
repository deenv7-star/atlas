/** Records a received payment (balance or deposit) against a booking. */
import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { StaySheet } from './StaySheet';
import { Btn } from './StayUI';
import { formatMoney, todayISO } from '@/lib/stay/format';
import { useStayMutations } from '@/hooks/useStayData';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';

const METHODS = [
  { value: 'bit', label: 'ביט' },
  { value: 'bank_transfer', label: 'העברה בנקאית' },
  { value: 'cash', label: 'מזומן' },
  { value: 'credit_card', label: 'אשראי' },
];

export function RecordPaymentSheet({ open, onOpenChange, booking, balance, orgId }) {
  const { createPayment } = useStayMutations();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bit');
  const [kind, setKind] = useState('BALANCE');

  useEffect(() => {
    if (open && balance) {
      setAmount(String(Math.round(balance.balance || 0)));
      setKind(balance.paid > 0 ? 'BALANCE' : 'DEPOSIT');
      setMethod('bit');
    }
  }, [open, balance]);

  if (!booking) return null;
  const n = Number(amount) || 0;

  const save = async () => {
    const today = todayISO();
    try {
      await createPayment.mutateAsync({
        ...(orgId ? { org_id: orgId } : {}),
        booking_id: booking.id,
        amount: n,
        currency: 'ILS',
        status: 'PAID',
        method,
        type: kind,
        description: `${kind === 'DEPOSIT' ? 'מקדמה' : 'יתרה'} · ${booking.guest_name || ''}`.trim(),
        paid_date: today,
        paid_at: new Date().toISOString(),
        due_date: today,
        created_at: new Date().toISOString(),
      });
      atlasToastApi.success(`נרשם תשלום של ${formatMoney(n)}`);
      onOpenChange(false);
    } catch (e) {
      atlasToastApi.error(e?.message ? `התשלום לא נשמר: ${e.message}` : 'התשלום לא נשמר. נסו שוב.');
    }
  };

  return (
    <StaySheet
      open={open}
      onOpenChange={onOpenChange}
      title="רישום תשלום"
      description={`${booking.guest_name || ''} · יתרה ${formatMoney(balance?.balance || 0)} מתוך ${formatMoney(balance?.total || 0)}`}
      footer={(
        <>
          <Btn variant="primary" size="lg" icon={Check} onClick={save} disabled={n <= 0 || createPayment.isPending} className="w-full sm:w-auto">
            {createPayment.isPending ? 'שומרים…' : 'שמירה'}
          </Btn>
          <Btn variant="secondary" size="lg" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">ביטול</Btn>
        </>
      )}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="ab-label" htmlFor="pay-amount">סכום (₪)</label>
          <input id="pay-amount" className="ab-input ab-num" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="ab-label">סוג</span>
          <div className="flex gap-2">
            {[['DEPOSIT', 'מקדמה'], ['BALANCE', 'יתרה']].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setKind(v)} className="ab-btn flex-1"
                style={kind === v ? { background: 'var(--brand-50)', color: 'var(--brand-700)', borderColor: 'var(--brand-100)' } : { background: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink-600)' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-2">
          <span className="ab-label">אמצעי תשלום</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {METHODS.map((m) => (
              <button key={m.value} type="button" onClick={() => setMethod(m.value)} className="ab-btn"
                style={method === m.value ? { background: 'var(--brand-50)', color: 'var(--brand-700)', borderColor: 'var(--brand-100)' } : { background: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink-600)' }}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </StaySheet>
  );
}
