import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { LayoutGrid, Users, CreditCard, Tags, ShieldCheck, Activity, ScrollText, ArrowUpRight, Menu, X } from 'lucide-react';
import { ADMIN_NAV, ROLES } from '../config';
import { useAdmin } from '../hooks';
import { DemoBadge } from '../ui';

const ICONS = { overview: LayoutGrid, customers: Users, payments: CreditCard, plans: Tags, team: ShieldCheck, health: Activity, audit: ScrollText };
const GROUPS = [
  { label: 'עסק', keys: ['overview', 'customers', 'payments', 'plans'] },
  { label: 'מערכת', keys: ['team', 'health', 'audit'] },
];

function Nav({ onNavigate }) {
  return (
    <nav aria-label="ניהול ATLAS" className="a-nav">
      {GROUPS.map((g) => (
        <div key={g.label} className="a-nav-group">
          <p className="a-nav-label">{g.label}</p>
          <ul>
            {g.keys.map((k) => {
              const item = ADMIN_NAV.find((n) => n.key === k);
              const Icon = ICONS[k];
              return (
                <li key={k}>
                  <NavLink to={item.to} end={item.end} className="a-nav-item" onClick={onNavigate}>
                    <Icon size={18} strokeWidth={1.75} aria-hidden />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Me() {
  const { me, role } = useAdmin();
  const name = me?.full_name || me?.email?.split('@')[0] || '';
  const initials = name.split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="a-me">
      <span className="a-avatar" aria-hidden>{initials}</span>
      <div className="a-me-text">
        <b>{name}</b>
        <span>{ROLES[role]?.label}</span>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/admin" className="a-brand" aria-label="ATLAS ניהול, סקירה">
      <span className="a-wordmark">ATLAS</span>
      <span className="a-brand-dot" aria-hidden />
      <span className="a-brand-tag">ניהול</span>
    </Link>
  );
}

export default function Shell({ children }) {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => { setOpen(false); }, [loc.pathname]);
  return (
    <div className="adm-root a-root" dir="rtl">
      <a href="#adm-main" className="a-skip">דילוג לתוכן</a>
      <aside className="a-side">
        <Brand />
        <Nav />
        <div className="a-side-foot">
          <Me />
          <Link to="/today" className="a-back">
            <ArrowUpRight size={16} strokeWidth={1.75} aria-hidden />
            <span>לאפליקציה</span>
          </Link>
        </div>
      </aside>
      <header className="a-topbar">
        <Brand />
        <div className="a-topbar-end">
          <DemoBadge />
          <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
            <DialogPrimitive.Trigger asChild>
              <button type="button" className="adm-btn adm-btn--quiet adm-btn--icon" aria-label="תפריט"><Menu size={20} strokeWidth={1.75} /></button>
            </DialogPrimitive.Trigger>
            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay className="adm-overlay" />
              <DialogPrimitive.Content className="adm-dialog a-drawer" dir="rtl">
                <DialogPrimitive.Title className="adm-sr">תפריט ניהול</DialogPrimitive.Title>
                <DialogPrimitive.Description className="adm-sr">ניווט בין אזורי הניהול</DialogPrimitive.Description>
                <div className="a-drawer-head">
                  <Brand />
                  <DialogPrimitive.Close asChild>
                    <button type="button" className="adm-btn adm-btn--quiet adm-btn--icon" aria-label="סגירה"><X size={20} strokeWidth={1.75} /></button>
                  </DialogPrimitive.Close>
                </div>
                <Nav onNavigate={() => setOpen(false)} />
                <div className="a-side-foot">
                  <Me />
                  <Link to="/today" className="a-back"><ArrowUpRight size={16} strokeWidth={1.75} aria-hidden /><span>לאפליקציה</span></Link>
                </div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
        </div>
      </header>
      <main id="adm-main" className="a-main" tabIndex={-1}>{children}</main>
    </div>
  );
}

export function PageHead({ title, sub, actions, back }) {
  return (
    <div className="a-head">
      <div className="a-head-text">
        {back}
        <div className="a-head-title">
          <h1>{title}</h1>
          <span className="a-head-demo"><DemoBadge /></span>
        </div>
        {sub ? <p>{sub}</p> : null}
      </div>
      {actions ? <div className="a-head-actions">{actions}</div> : null}
    </div>
  );
}
