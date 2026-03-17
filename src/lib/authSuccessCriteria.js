/**
 * SECTION 1 — AUTHENTICATION SUCCESS CRITERIA
 *
 * DONE when ALL of the following pass:
 *
 * 1. REGISTER FLOW
 *    - User can register with email + password
 *    - If email confirmation required: redirect to /verify-email
 *    - If session returned: user is logged in, redirect to /onboarding
 *    - Duplicate email shows "already registered" with link to login
 *
 * 2. LOGOUT FLOW
 *    - Logout clears session and redirects to /login
 *    - After logout, protected routes redirect to /login
 *
 * 3. LOGIN FLOW
 *    - User can login with email + password
 *    - If onboarding_completed: redirect to /dashboard (or return URL)
 *    - If !onboarding_completed: redirect to /onboarding
 *    - Invalid credentials show clear error
 *
 * 4. DASHBOARD ACCESS
 *    - Authenticated user with onboarding_completed reaches /dashboard
 *    - Dashboard loads without errors
 *
 * 5. REFRESH PERSISTENCE
 *    - After login, refresh page keeps user logged in
 *    - Session restored from storage
 *
 * 6. EDGE CASES
 *    - return URL preserved when redirecting to login
 *    - Rate limiting shows retry message
 *    - Email not confirmed shows appropriate message
 *
 * MANUAL TEST (localStorage mode — no .env Supabase):
 *   1. npm run preview → http://localhost:4173
 *   2. Register → Onboarding (4 steps) → Dashboard
 *   3. Logout → Login → Dashboard
 *   4. Refresh page → still on Dashboard
 *   5. Try register with same email → "already registered" + link to login
 */

export const AUTH_SUCCESS_CRITERIA = {
  register: ['creates_user', 'redirects_correctly', 'handles_duplicate'],
  logout: ['clears_session', 'redirects_to_login'],
  login: ['accepts_credentials', 'redirects_by_onboarding', 'shows_errors'],
  dashboard: ['loads_when_authenticated', 'requires_auth'],
  refresh: ['persists_session'],
};
