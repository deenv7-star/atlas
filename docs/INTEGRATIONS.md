# Integration Instructions

## Redis
- Optional for health probing (`REDIS_URL`).
- Worker scaffold in `backend/` can use Redis/BullMQ.

## Sentry
- Set `SENTRY_DSN` to enable external error monitoring hooks.

## CI/CD
- Workflow: `.github/workflows/backend-ci.yml`.
