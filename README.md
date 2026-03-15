# ATLAS Backend Hardening

This repository now contains a hardened backend baseline focused on **commercial SaaS launch readiness**.

## What was hardened

- End-to-end API test suite for auth, tenancy, lead/booking/payment flows, automation trigger, and migration safety.
- Security hardening with strict Zod validation, request-size limits, JWT auth + refresh rotation/revocation, tenant scoping, security headers, API rate limiting, and auth IP abuse protection.
- Multi-tenant safeguards by enforcing `org_id` / `organization_id` scoping in route-level queries.
- Structured logging and error monitoring hook (Sentry DSN aware).
- Monitoring endpoints:
  - `/health`
  - `/health/db`
  - `/health/redis`
  - `/live`
  - `/ready`
  - `/api/metrics`
- Backup operations:
  - `ops/backup.sh`
  - `ops/restore.sh`
  - `ops/verify-backup.sh`
- CI/CD pipeline enforcing typecheck, lint, backend checks, tests, build verification, and dependency vulnerability scan.
- Staging environment config in `.env.staging.example`.
- Compliance endpoints for export/delete/retention:
  - `GET /api/compliance/export`
  - `DELETE /api/compliance/delete-account`
  - `POST /api/compliance/retention/run`
- Technical docs under `docs/` and runbooks under `ops/RUNBOOKS.md`.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

## Quality checks

```bash
npm run check:backend
npm run test:backend
npm run lint:backend
```

## Ops

```bash
npm run ops:backup
BACKUP_FILE=./ops/backups/atlas_YYYYMMDD_HHMMSS.dump npm run ops:restore
BACKUP_FILE=./ops/backups/atlas_YYYYMMDD_HHMMSS.dump bash ops/verify-backup.sh
```

## Notes

- Active runtime is `server/` via `npm run dev`.
- `backend/` Fastify/Prisma scaffold remains available for future migration/expansion.
