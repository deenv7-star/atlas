# ATLAS platform admin (`/admin`)

Console for the ATLAS team (owners, admins, support). Separate from the customers' app: its own
route, shell and data layer (`src/admin/`). `/platform-admin` now redirects here.

## Screens
Overview (customers by status, MRR / ARR in ₪, trial→paid conversion, signups and collected revenue
per month) · Customers (search, status + plan filters, CSV) · Customer detail (profile, units, usage,
plan & billing history, notes, team activity, actions: extend trial, change plan, record payment,
suspend / reactivate, WhatsApp / email the owner, read-only "view as") · Subscriptions & payments
(charges, failed / pending, mark paid, record a manual payment, CSV) · Plans & pricing · Team & roles
· System health · Audit log.

## Access (enforced in the database, not by a hidden route)
- `public.platform_admins` (user_id, role owner | admin | support) is the only allow-list.
- The UI asks `admin_whoami()`; everything else goes through `admin_*` SECURITY DEFINER functions,
  each of which calls `admin_require(<role>)` and raises `42501` otherwise.
- The new tables have RLS on, **no policies** and no grants to `anon` / `authenticated`, so they
  cannot be read or written through PostgREST directly.
- No policy was added to any customer table, so a platform admin's own customer app still sees only
  their own organization.
- `public.users.is_platform_admin` (migration 003) is **not** trusted: its RLS lets any org member edit it.

| role | can |
|---|---|
| support | read everything, add notes |
| admin | + extend trial, change plan, suspend / reactivate, record charges, mark paid |
| owner | + edit plan prices, manage the team |

## Migration `supabase/migrations/011_platform_admin.sql` (NOT applied)
Additive only. Creates `platform_admins`, `platform_plans` (seeded with the landing prices
399/319, 699/559, 999/799), `platform_subscriptions`, `platform_charges`, `platform_customer_notes`,
`admin_audit_log` (append-only, trigger blocks UPDATE/DELETE), the `admin_*` functions,
`my_account_status()` for the customer app, and bootstraps deenv7@gmail.com as owner and
qa+hark@atlas-il.com as admin (only if those logins exist).

Write actions also update the columns the customer app reads today
(`profiles.trial_ends_at / selected_plan / subscription_status`, `organizations.subscription_plan`).

To enable after approval:
1. Run `011_platform_admin.sql` in the Supabase SQL editor (it is re-runnable).
2. Set `VITE_DB_SCHEMA_LEVEL=11` on Vercel and redeploy. Below level 11 `/admin` shows
   "not enabled yet" and sends no requests.

Verification: `npm i --no-save @electric-sql/pglite && node supabase/tests/admin_rls.test.mjs`
(applies 001-007 + 011 to real Postgres in WASM, 110 checks: anon / customer / support / admin / owner).

## Demo mode
Without Supabase env (local demo) the console uses fictional sample data (`src/admin/demoData.js`),
kept in this browser's localStorage, for `deenv7@gmail.com` and `qa+hark@atlas-il.com` only.

## Known follow-ups
- Suspension is recorded but the customer app does not read it yet: call `my_account_status()` after login.
- Customers can still edit their own trial / plan columns (RLS "own row FOR ALL" on profiles and
  organizations). Next step: move the app to read `platform_subscriptions` and guard those columns.
- The landing still reads prices from `src/config/pricing.js`; a public `plans` RPC would let it read
  `platform_plans`.
- No payment provider is connected: charges are recorded by hand ("ידני").
- App error tracking (Sentry or similar) is not connected, so Health shows "not connected".
