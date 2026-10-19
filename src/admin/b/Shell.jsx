import BrandWordmark from '@/components/common/BrandWordmark';
import { useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Users, CreditCard, Tags, ShieldCheck, Activity, ScrollText, ArrowUpRight, LifeBuoy, Inbox } from 'lucide-react';
import { ADMIN_NAV, ROLES, ADMIN_DEMO } from '../config';
import { useAdmin } from '../hooks';
import { DemoBadge } from '../ui';
import { useSupportUnread } from '../supportApi';
import { useContactUnread } from '../contactApi';

const ICONS = { support: LifeBuoy, inbox: Inbox, overview: LayoutGrid, customers: Users, payments: CreditCard, plans: Tags, team: ShieldCheck, health: Activity, audit: ScrollText };
const SHORT = { support: 'תמיכה', inbox: 'פניות', overview: 'סקירה', customers: 'לקוחות', payments: 'תשלומים', plans: 'חבילות', team: 'צוות', health: 'תקינות', audit: 'יומן' };

function initialsOf(s) {
  return String(s || '').split(/\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase();
}

export default function Shell({ children }) {
  const { me, role } = useAdmin();
  const name = me?.full_name || me?.email?.split('@')[0] || '';
  const unread = useSupportUnread().data?.conversations || 0;
  const fresh = useContactUnread();
  const { pathname } = useLocation();
  const mnav = useRef(null);
  // mobile: keep the current section's pill in view inside the horizontal nav
  useEffect(() => { mnav.current?.querySelector('.active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [pathname]);
  const badge = (key) => (key === 'support' && unread ? <span className="b-nav-badge" aria-label={`${unread} שיחות ממתינות`}>{unread}</span>
    : key === 'inbox' && fresh ? <span className="b-nav-badge" aria-label={`${fresh} ${fresh === 1 ? 'פנייה חדשה' : 'פניות חדשות'}`}>{fresh}</span> : null);
  return (
    <div className="adm-root b-root" dir="rtl">
      <a href="#adm-main" className="b-skip">דילוג לתוכן</a>
      <aside className="b-side" aria-label="ניווט ניהול">
        <Link to="/admin" className="b-brand" aria-label="atlas ניהול, סקירה"><BrandWordmark size={22} /></Link>
        <div className="b-who">
          <span className="b-who-av" aria-hidden>{initialsOf(name)}</span>
          <div><b>{name}</b><span>{ROLES[role]?.label} · ניהול atlas</span></div>
        </div>
        <nav aria-label="ניהול atlas">
          <ul className="b-nav">
            {ADMIN_NAV.map((n) => {
              const Icon = ICONS[n.key];
              return (
                <li key={n.key}>
                  <NavLink to={n.to} end={n.end} className="b-nav-item">
                    <Icon size={20} strokeWidth={1.75} aria-hidden />
                    <span>{n.label}</span>
                    {badge(n.key)}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="b-side-card">
          <p className="b-side-card-t">{ADMIN_DEMO ? 'מצב הדגמה' : 'אזור הצוות'}</p>
          <p className="b-side-card-s">{ADMIN_DEMO ? 'נתונים לדוגמה, נשמרים רק בדפדפן הזה.' : 'כל פעולה כאן נרשמת ביומן.'}</p>
          <Link to="/today" className="b-side-card-btn"><ArrowUpRight size={16} strokeWidth={2} aria-hidden />לאפליקציה</Link>
        </div>
      </aside>
      <header className="b-mtop">
        <div className="b-mtop-row">
          <Link to="/admin" className="b-brand" aria-label="atlas ניהול, סקירה"><BrandWordmark size={22} /></Link>
          <DemoBadge />
        </div>
        <nav aria-label="ניהול atlas, נייד" className="b-mnav" ref={mnav}>
          {ADMIN_NAV.map((n) => (
            <NavLink key={n.key} to={n.to} end={n.end} className="b-mnav-item">{SHORT[n.key]}{badge(n.key)}</NavLink>
          ))}
        </nav>
      </header>
      <main id="adm-main" className="b-main" tabIndex={-1}>{children}</main>
    </div>
  );
}

const GREET = () => {
  const h = new Date().getHours();
  return h < 5 ? 'לילה טוב' : h < 12 ? 'בוקר טוב' : h < 17 ? 'צהריים טובים' : h < 21 ? 'ערב טוב' : 'לילה טוב';
};
const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const MONTHS = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];

export function Head({ title, sub, actions, greet, back }) {
  const { me } = useAdmin();
  const d = new Date();
  const first = (me?.full_name || '').split(' ')[0];
  return (
    <div className="b-head">
      <div className="b-head-text">
        {back}
        {greet || (title && title.trim()) ? <h1>{greet ? `${GREET()}${first ? `, ${first}` : ''}` : title}</h1> : null}
        {greet || sub ? <p>{greet ? `יום ${DAYS[d.getDay()]}, ${d.getDate()} ב${MONTHS[d.getMonth()]} · ${sub || ''}` : sub}</p> : null}
      </div>
      <div className="b-head-actions">
        <span className="b-head-demo"><DemoBadge /></span>
        {actions}
      </div>
    </div>
  );
}
