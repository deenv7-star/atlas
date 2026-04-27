# `atlas-toggle-automation`

**Purpose:** Toggle `public.automation_rules.is_active` for one row in the caller’s organization.

## Auth & roles

1. **401** — Valid `Authorization: Bearer <user_jwt>` required (`supabase.auth.getUser()`).
2. **403** — Caller must resolve to **ADMIN** or **MANAGER**:
   - **ADMIN** if `organizations.owner_id === auth.uid()`.
   - Else `public.users` row matching `email` + `org_id` with `role` → `ADMIN` / `MANAGER` / `STAFF` mapping.
3. **STAFF** (and unknown) → 403 for this function.

## Request

`POST` JSON:

```json
{ "rule_id": "<uuid>", "is_active": true }
```

## Response

`{ "success": true, "data": { "id", "name", "is_active" } }` or `{ "success": false, "error": "..." }`.

## Database

Requires migration `005_audit_log.sql` for `public.audit_log`.

## Local run

```bash
cd supabase
supabase start
supabase functions serve atlas-toggle-automation --no-verify-jwt
```

Invoke:

```bash
curl -i "$SUPABASE_URL/functions/v1/atlas-toggle-automation" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"rule_id":"...","is_active":false}'
```

## Secrets

`SUPABASE_SERVICE_ROLE_KEY` is injected by the platform — **never** ship it to the browser.
