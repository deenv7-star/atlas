# ATLAS Operations Runbooks

## 1) Incident Response
1. Triage severity (SEV-1/2/3).
2. Assign incident commander and communications owner.
3. Freeze deploys.
4. Collect logs (`requestId`, auth events, DB errors, metrics).
5. Mitigate (rollback / scale / rate-limit hardening).
6. Postmortem within 48h.

## 2) Database Restore
1. Select target backup from `ops/backups`.
2. Validate backup integrity:
   ```bash
   BACKUP_FILE=./ops/backups/<file>.dump bash ops/verify-backup.sh
   ```
3. Restore:
   ```bash
   DATABASE_URL=<url> BACKUP_FILE=./ops/backups/<file>.dump bash ops/restore.sh
   ```
4. Run smoke checks: `/health`, `/health/db`, `/ready`.

## 3) Deployment Rollback
1. Identify last known good release tag.
2. Roll back app deployment and DB migrations (if reversible).
3. Verify readiness, auth and booking write path.
4. Re-enable traffic gradually.

## 4) API Outage Handling
1. Check `/live` and `/ready`.
2. Check DB/Redis status via `/health/db` and `/health/redis`.
3. Inspect metrics endpoint for 5xx spikes.
4. Apply temporary controls: stricter rate limits, disable heavy endpoints, feature flags.
