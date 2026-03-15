# API Documentation

## Auth
- POST `/api/auth/signup`
- POST `/api/auth/signin`
- POST `/api/auth/refresh`
- POST `/api/auth/signout`
- GET `/api/auth/me`
- PUT `/api/auth/me`

## Domain
- POST `/api/leads`
- PATCH `/api/leads/:id/status`
- POST `/api/leads/:id/convert`
- POST `/api/bookings`
- PATCH `/api/bookings/:id/status`
- POST `/api/payments`
- POST `/api/automations/booking-confirmed`

## Compliance
- GET `/api/compliance/export`
- DELETE `/api/compliance/delete-account`
- POST `/api/compliance/retention/run`

## Monitoring
- GET `/health`
- GET `/health/db`
- GET `/health/redis`
- GET `/live`
- GET `/ready`
- GET `/api/metrics`
