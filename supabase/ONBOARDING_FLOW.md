# Onboarding Flow & Supabase Configuration

## Required: Supabase Redirect URL

For the email verification flow to work correctly, set the redirect URL in Supabase:

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   - `http://localhost:5173/onboarding` (development)
   - `https://yourdomain.com/onboarding` (production)

When users click the verification link in their email, they will be redirected to `/onboarding` to complete the setup wizard.

## Flow Summary

1. **Register** (`/register`) → User signs up with email + password
2. **Verify Email** (`/verify-email`) → User sees waiting screen, Supabase sends verification email
3. **Click link** → Supabase redirects to `/onboarding`
4. **Onboarding** (`/onboarding`) → 7-step wizard, sets `onboarding_completed = true` at end
5. **Dashboard** (`/Dashboard`) → User lands here after completing onboarding

## Database

The `profiles` table must have:
- `onboarding_completed` (boolean, default false)
- `trial_ends_at` (timestamptz, optional)

See `migrations/002_trial_system.sql`.
