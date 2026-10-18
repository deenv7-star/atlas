import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { STATUS, CHARGE_STATUS, ADMIN_DEMO } from './config';

export const money = (n) => `\u200F₪${(Math.round(Number(n) || 0)).toLocaleString('he-IL')}`;
export const moneyK = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 100000) return `\u200F₪${(v / 1000).toLocaleString('he-IL', { maximumFractionDigits: 0 })}K`;
  return money(v);
};
const MONTHS = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];
const DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
export function date(iso, { year = false, weekday = false } = {}) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const core = `${d.getDate()} ב${MONTHS[d.getMonth()]}${year || d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : ''}`;
  return weekday ? `יום ${DAYS[d.getDay()]}, ${core}` : core;
}
/** Only Hebrew text reaches the screen: a raw English error (network, library) becomes the fallback. */
export const heMessage = (e, fallback = 'הפעולה לא הצליחה. נסו שוב בעוד רגע.') => {
  const m = String(e?.message || '');
  return /[\u0590-\u05FF]/.test(m) ? m : fallback;
};
export const pct = (x) => (x == null ? '—' : `${Math.round(x * 100)}%`);

export function Pill({ tone = 'gray', children, className = '' }) {
  return <span className={`adm-pill ${className}`} data-tone={tone}>{children}</span>;
}
export function StatusPill({ status }) {
  const s = STATUS[status] || { label: status || '—', tone: 'gray' };
  return <Pill tone={s.tone}>{s.label}</Pill>;
}
export function ChargePill({ status }) {
  const s = CHARGE_STATUS[status] || { label: status, tone: 'gray' };
  return <Pill tone={s.tone}>{s.label}</Pill>;
}
export function DemoBadge() {
  if (!ADMIN_DEMO) return null;
  return <span className="adm-demo" title="נתונים לדוגמה, נשמרים רק בדפדפן הזה">מצב הדגמה</span>;
}
export function Skel({ w = '100%', h = 16, r = 8, style }) {
  return <span aria-hidden className="adm-skel" style={{ display: 'block', width: w, height: h, borderRadius: r, ...style }} />;
}

export function Modal({ open, onOpenChange, title, sub, children }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="adm-overlay" />
        <DialogPrimitive.Content className="adm-dialog" dir="rtl" aria-describedby={sub ? undefined : undefined}>
          <DialogPrimitive.Title asChild><h2>{title}</h2></DialogPrimitive.Title>
          {sub ? <DialogPrimitive.Description className="adm-dialog-sub">{sub}</DialogPrimitive.Description> : <DialogPrimitive.Description className="adm-sr">{title}</DialogPrimitive.Description>}
          {children}
          <DialogPrimitive.Close asChild>
            <button type="button" className="adm-btn adm-btn--quiet adm-btn--icon adm-dialog-close" aria-label="סגירה"><X size={18} strokeWidth={1.75} /></button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="adm-field">
      <span>{label}</span>
      {children}
      {hint ? <small style={{ color: 'var(--a-ink-3)', fontSize: 13 }}>{hint}</small> : null}
    </label>
  );
}

/** wa.me + mailto links for the owner. */
export function contactLinks(c) {
  const d = String(c?.owner_phone || '').replace(/\D/g, '');
  const wa = d ? `https://wa.me/${d.startsWith('972') ? d : d.startsWith('0') ? `972${d.slice(1)}` : d}` : null;
  const mail = c?.owner_email ? `mailto:${c.owner_email}?subject=${encodeURIComponent(`ATLAS · ${c.org_name || ''}`)}` : null;
  return { wa, mail };
}
