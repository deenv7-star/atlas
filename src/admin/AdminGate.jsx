import { useEffect } from 'react';
import './admin-base.css';
import { Navigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShieldOff, Clock } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { adminApi } from './api';
import { ADMIN_DB_READY } from './config';
import { AdminCtx } from './hooks';
import { isMissingSchemaError } from '@/config/dbFeatures';

function Center({ icon: Icon, title, body, action }) {
  return (
    <main className="adm-gate" dir="rtl">
      <div className="adm-gate-card">
        <span className="adm-gate-icon" aria-hidden><Icon size={22} strokeWidth={1.75} /></span>
        <h1>{title}</h1>
        <p>{body}</p>
        {action}
      </div>
    </main>
  );
}
function Spinner() {
  return (
    <div className="adm-gate" role="status" aria-label="טוען">
      <span className="adm-spin" />
    </div>
  );
}

/** Keeps search engines out and gives the console its own title. */
function useAdminDocument() {
  useEffect(() => {
    let m = document.querySelector('meta[name="robots"]');
    const prev = m?.getAttribute('content');
    if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'robots'); document.head.appendChild(m); }
    m.setAttribute('content', 'noindex, nofollow');
    return () => { if (prev) m.setAttribute('content', prev); else m.remove(); };
  }, []);
}

/**
 * Renders children only for a platform admin. Supabase mode asks the database (admin_whoami, a
 * SECURITY DEFINER function over platform_admins); every data call is checked again server-side.
 */
export default function AdminGate({ children }) {
  useAdminDocument();
  const { isLoadingAuth, isAuthenticated, user } = useAuth();
  const enabled = Boolean(isAuthenticated && ADMIN_DB_READY);
  const who = useQuery({
    queryKey: ['admin', 'whoami', user?.id || user?.email],
    queryFn: () => adminApi.whoami(user),
    enabled,
    retry: false,
    staleTime: 60_000,
  });

  if (isLoadingAuth) return <Spinner />;
  if (!isAuthenticated) {
    const ret = encodeURIComponent(window.location.pathname + window.location.search);
    return <Navigate to={`/login?return=${ret}`} replace />;
  }
  // Migration 011 not on this database (admin_whoami does not exist): same calm card, no access.
  if (!ADMIN_DB_READY || (who.isError && isMissingSchemaError(who.error))) {
    return (
      <Center
        icon={Clock}
        title="אזור הניהול עוד לא הופעל"
        body="הוא יופעל אחרי עדכון מסד הנתונים."
        action={<Link className="adm-gate-link" to="/today">חזרה ל-ATLAS</Link>}
      />
    );
  }
  if (who.isLoading) return <Spinner />;
  // Any other failure (network, 42501…) fails closed: the no-access card below.
  if (!who.data) {
    return (
      <Center
        icon={ShieldOff}
        title="אין לכם גישה לאזור הזה"
        body="האזור מיועד לצוות ATLAS בלבד."
        action={<Link className="adm-gate-link" to="/today">חזרה ל-ATLAS</Link>}
      />
    );
  }
  return <AdminCtx.Provider value={{ me: who.data, role: who.data.role }}>{children}</AdminCtx.Provider>;
}
