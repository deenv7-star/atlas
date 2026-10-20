/* Admin version B — "Bento": floating sidebar card, white 24px tiles, one indigo hero per screen (like app C). */
import { Routes, Route, Navigate } from 'react-router-dom';
import './b.css';
import Shell from './Shell';
import { Overview } from './pagesCustomers';
import { CustomersPage, CustomerPage } from '../v2/version';
import { Payments, Plans, Team, Health, Audit } from './pagesSystem';
import { Support } from './pagesSupport';
import { Inbox } from './pagesInbox';

export default function AdminAppB() {
  return (
    <Shell>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerPage />} />
        <Route path="support" element={<Support />} />
        <Route path="inbox" element={<Inbox />} />
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
