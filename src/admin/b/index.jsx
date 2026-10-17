/* Admin version B — "Bento": floating sidebar card, white 24px tiles, one indigo hero per screen (like app C). */
import { Routes, Route, Navigate } from 'react-router-dom';
import './b.css';
import Shell from './Shell';
import { Overview, Customers, CustomerDetail } from './pagesCustomers';
import { Payments, Plans, Team, Health, Audit } from './pagesSystem';

export default function AdminAppB() {
  return (
    <Shell>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="payments" element={<Payments />} />
        <Route path="plans" element={<Plans />} />
        <Route path="team" element={<Team />} />
        <Route path="health" element={<Health />} />
        <Route path="audit" element={<Audit />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Shell>
  );
}
