import { useEffect, useState } from 'react';
import { Modal, Field, money, date } from './ui';
import { METHODS } from './config';
import { useActions, usePlans } from './hooks';
import { monthlyValue } from './metrics';

const Actions = ({ busy, onCancel, label, danger }) => (
  <div className="adm-dialog-actions">
    <button type="submit" className={`adm-btn ${danger ? 'adm-btn--danger adm-btn--solid' : 'adm-btn--primary'}`} disabled={busy}>
      {busy ? 'שומרים…' : label}
    </button>
    <button type="button" className="adm-btn adm-btn--quiet" onClick={onCancel}>ביטול</button>
  </div>
);

export function ExtendTrialDialog({ customer, open, onOpenChange }) {
  const { extendTrial } = useActions();
  const [days, setDays] = useState(7);
  useEffect(() => { if (open) setDays(7); }, [open]);
  const base = Math.max(Date.now(), new Date(customer?.trial_ends_at || Date.now()).getTime());
  const until = new Date(base + days * 864e5).toISOString();
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="הארכת תקופת ניסיון" sub={`${customer?.org_name || ''} · הניסיון יסתיים ב${date(until, { weekday: true })}`}>
      <form onSubmit={(e) => { e.preventDefault(); extendTrial.mutate({ orgId: customer.org_id, days }, { onSuccess: () => onOpenChange(false) }); }}>
        <div className="adm-seg" role="group" aria-label="כמה ימים">
          {[7, 14, 30].map((d) => (
            <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)}>{d} ימים</button>
          ))}
        </div>
        <Field label="או מספר ימים אחר (1-90)">
          <input className="adm-input adm-num" type="number" min={1} max={90} value={days} onChange={(e) => setDays(Math.max(1, Math.min(90, Number(e.target.value) || 1)))} />
        </Field>
        <Actions busy={extendTrial.isPending} onCancel={() => onOpenChange(false)} label={`הארכה ב-${days} ימים`} />
      </form>
    </Modal>
  );
}

export function ChangePlanDialog({ customer, open, onOpenChange }) {
  const { changePlan } = useActions();
  const { plans } = usePlans();
  const [plan, setPlan] = useState('starter');
  const [cycle, setCycle] = useState('monthly');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('');
  useEffect(() => {
    if (open && customer) {
      setPlan(customer.plan_key || 'starter');
      setCycle(customer.billing_cycle || 'monthly');
      setPrice(customer.price_ils != null ? String(customer.price_ils) : '');
      setStatus('');
    }
  }, [open, customer]);
  const list = monthlyValue({ plan_key: plan, billing_cycle: cycle, price_ils: null }, plans);
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="שינוי חבילה" sub={customer?.org_name}>
      <form onSubmit={(e) => {
        e.preventDefault();
        changePlan.mutate({ orgId: customer.org_id, plan, cycle, price: price === '' ? null : Number(price), status: status || null }, { onSuccess: () => onOpenChange(false) });
      }}>
        <Field label="חבילה">
          <select className="adm-select" value={plan} onChange={(e) => setPlan(e.target.value)}>
            {plans.map((p) => <option key={p.key} value={p.key}>{p.name} · {money(p.price_monthly)} לחודש</option>)}
          </select>
        </Field>
        <div className="adm-seg" role="group" aria-label="מחזור חיוב">
          <button type="button" aria-pressed={cycle === 'monthly'} onClick={() => setCycle('monthly')}>חודשי</button>
          <button type="button" aria-pressed={cycle === 'yearly'} onClick={() => setCycle('yearly')}>שנתי</button>
        </div>
        <Field label="מחיר מיוחד בש״ח (ריק = מחירון)" hint={`מחירון: ${money(list)} לחודש${cycle === 'yearly' ? `, ${money(list * 12)} לשנה` : ''}`}>
          <input className="adm-input adm-num" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} placeholder={String(cycle === 'yearly' ? list * 12 : list)} />
        </Field>
        <Field label="מצב מנוי">
          <select className="adm-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">בלי שינוי</option>
            <option value="active">פעיל (משלם)</option>
            <option value="trialing">בניסיון</option>
            <option value="canceled">בוטל</option>
          </select>
        </Field>
        <Actions busy={changePlan.isPending} onCancel={() => onOpenChange(false)} label="שמירה" />
      </form>
    </Modal>
  );
}

export function SuspendDialog({ customer, open, onOpenChange }) {
  const { setSuspended } = useActions();
  const [reason, setReason] = useState('');
  const suspended = Boolean(customer?.suspended_at);
  useEffect(() => { if (open) setReason(''); }, [open]);
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={suspended ? 'הפעלת החשבון מחדש' : 'השהיית החשבון'}
      sub={suspended ? `${customer?.org_name} יחזור לפעילות רגילה.` : `${customer?.org_name}: הסטטוס יסומן כמושהה ונרשם ביומן הפעולות.`}
    >
      <form onSubmit={(e) => {
        e.preventDefault();
        setSuspended.mutate({ orgId: customer.org_id, suspended: !suspended, reason }, { onSuccess: () => onOpenChange(false) });
      }}>
        {!suspended ? (
          <Field label="סיבה (נראית רק לצוות)">
            <input className="adm-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="למשל: חוב פתוח" />
          </Field>
        ) : null}
        <Actions busy={setSuspended.isPending} onCancel={() => onOpenChange(false)} label={suspended ? 'הפעלה מחדש' : 'השהיה'} danger={!suspended} />
      </form>
    </Modal>
  );
}

export function RecordChargeDialog({ customer, customers, open, onOpenChange }) {
  const { recordCharge } = useActions();
  const { plans } = usePlans();
  const [orgId, setOrgId] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('paid');
  const [method, setMethod] = useState('bank_transfer');
  const [desc, setDesc] = useState('');
  const target = customer || customers?.find((c) => c.org_id === orgId);
  useEffect(() => {
    if (!open) return;
    setOrgId(customer?.org_id || '');
    setStatus('paid');
    setMethod('bank_transfer');
    setDesc('');
  }, [open, customer]);
  useEffect(() => {
    if (!open || !target) return;
    const m = monthlyValue(target, plans);
    setAmount(String(target.billing_cycle === 'yearly' ? m * 12 : m));
    const p = plans.find((x) => x.key === target.plan_key);
    setDesc(`${target.billing_cycle === 'yearly' ? 'מנוי שנתי' : 'מנוי חודשי'} · ${p?.name || ''}`);
  }, [open, target, plans]);
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="רישום תשלום ידני" sub="לא מתבצע חיוב בכרטיס. רק רישום של תשלום שהתקבל או חוב פתוח.">
      <form onSubmit={(e) => {
        e.preventDefault();
        if (!target || !(Number(amount) > 0)) return;
        recordCharge.mutate({ orgId: target.org_id, amount: Number(amount), status, method, description: desc || null }, { onSuccess: () => onOpenChange(false) });
      }}>
        {!customer ? (
          <Field label="לקוח">
            <select className="adm-select" value={orgId} onChange={(e) => setOrgId(e.target.value)} required>
              <option value="">בחירת לקוח</option>
              {(customers || []).map((c) => <option key={c.org_id} value={c.org_id}>{c.org_name}</option>)}
            </select>
          </Field>
        ) : null}
        <Field label="סכום בש״ח">
          <input className="adm-input adm-num" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} required />
        </Field>
        <Field label="תיאור">
          <input className="adm-input" value={desc} onChange={(e) => setDesc(e.target.value)} />
        </Field>
        <Field label="מצב">
          <select className="adm-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="paid">שולם</option>
            <option value="pending">ממתין לתשלום</option>
            <option value="failed">נכשל</option>
          </select>
        </Field>
        <Field label="אמצעי תשלום">
          <select className="adm-select" value={method} onChange={(e) => setMethod(e.target.value)}>
            {Object.entries(METHODS).filter(([k]) => k !== 'manual').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Actions busy={recordCharge.isPending} onCancel={() => onOpenChange(false)} label="רישום" />
      </form>
    </Modal>
  );
}

export function MarkPaidDialog({ charge, open, onOpenChange }) {
  const { markPaid } = useActions();
  const [method, setMethod] = useState('bank_transfer');
  useEffect(() => { if (open) setMethod('bank_transfer'); }, [open]);
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="סימון כשולם" sub={charge ? `${charge.org_name} · ${money(charge.amount_ils)} · ${charge.description || ''}` : ''}>
      <form onSubmit={(e) => { e.preventDefault(); markPaid.mutate({ chargeId: charge.id, method }, { onSuccess: () => onOpenChange(false) }); }}>
        <Field label="איך שולם">
          <select className="adm-select" value={method} onChange={(e) => setMethod(e.target.value)}>
            {Object.entries(METHODS).filter(([k]) => k !== 'manual').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Actions busy={markPaid.isPending} onCancel={() => onOpenChange(false)} label="סימון כשולם" />
      </form>
    </Modal>
  );
}

/** One controller for every customer action. kind: trial | plan | suspend | charge | null */
export function CustomerDialogs({ customer, kind, setKind }) {
  const close = (o) => { if (!o) setKind(null); };
  if (!customer) return null;
  return (
    <>
      <ExtendTrialDialog customer={customer} open={kind === 'trial'} onOpenChange={close} />
      <ChangePlanDialog customer={customer} open={kind === 'plan'} onOpenChange={close} />
      <SuspendDialog customer={customer} open={kind === 'suspend'} onOpenChange={close} />
      <RecordChargeDialog customer={customer} open={kind === 'charge'} onOpenChange={close} />
    </>
  );
}
