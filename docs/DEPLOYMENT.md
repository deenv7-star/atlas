# Deployment Steps

1. Validate env file for target environment.
2. Run CI checks.
3. Run migrations against staging.
4. Execute smoke tests (`/health`, `/ready`, auth/login flow).
5. Deploy production with rolling strategy.
6. Verify metrics and error rate.

Rollback: see `ops/RUNBOOKS.md`.
