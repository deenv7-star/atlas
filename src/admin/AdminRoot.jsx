import { lazy, Suspense } from 'react';
import AdminGate from './AdminGate';

// Version A, "Ledger": Linear/Stripe-style sidebar + calm dense tables.
const App = lazy(() => import('./a'));

export default function AdminRoot() {
  return (
    <AdminGate>
      <Suspense fallback={<div className="adm-gate" role="status" aria-label="טוען"><span className="adm-spin" /></div>}>
        <App />
      </Suspense>
    </AdminGate>
  );
}
