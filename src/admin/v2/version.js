/* Which admin v2 customer screens this build uses. Local QA builds both; each PR pins one. */
import { CustomersA, CustomerRedirectA } from './a/CustomersA';
import { CustomersB, CustomerPageB } from './b/CustomersB';

const V = String(import.meta.env.VITE_ADMIN_V2 || 'a').toLowerCase();
export const CustomersPage = V === 'b' ? CustomersB : CustomersA;
export const CustomerPage = V === 'b' ? CustomerPageB : CustomerRedirectA;
