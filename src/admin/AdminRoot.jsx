import { lazy, Suspense } from 'react';
import AdminGate from './AdminGate';

// Version B, "Bento": floating sidebar card + white tiles with one indigo hero (like app C).
const App = lazy(() => import('./b'));

export default function AdminRoot() {
  return (
    <AdminGate>
      <Suspense fallback={<div className="adm-gate" role="status" aria-label="טוען"><span className="adm-spin" /></div>}>
        <App />
      </Suspense>
    </AdminGate>
  );
}
