/**
 * SECTION 2 — ROUTING CONFIGURATION
 *
 * Success criteria (DONE when all pass):
 * 1. Protected routes redirect to /login?return= when not authenticated
 * 2. Public routes accessible without auth
 * 3. Auth pages redirect when already authenticated
 * 4. Legacy routes redirect to canonical lowercase paths
 * 5. Return URL preserved and used after login (validated to prevent open redirect)
 * 6. GuestService public for unauthenticated guests
 * 7. 404 for unknown routes
 */

/** Routes that do NOT require authentication */
export const PUBLIC_PAGE_KEYS = [
  'Landing',
  'Login',
  'Register',
  'VerifyEmail',
  'ResetPassword',
  'UpdatePassword',
  'About',
  'Privacy',
  'Terms',
  'Contact',
  'Changelog',
  'Status',
  'GuestService',
  'DataSecurity',
  'Accessibility',
  'SLA',
  'ApiDocs',
];

/** Legacy path → canonical path redirects */
export const LEGACY_REDIRECTS = [
  { from: '/Onboarding', to: '/onboarding' },
  { from: '/Dashboard', to: '/dashboard' },
  { from: '/Login', to: '/login' },
  { from: '/Register', to: '/register' },
  { from: '/GuestService', to: '/guest-service' },
  { from: '/security', to: '/data-security' },
  { from: '/Security', to: '/data-security' },
  { from: '/legal', to: '/terms' },
  { from: '/Legal', to: '/terms' },
];

/**
 * Validates return URL to prevent open redirect.
 * Only allows relative paths (starting with /) on same origin.
 */
export function getSafeReturnUrl(returnUrl) {
  if (!returnUrl || typeof returnUrl !== 'string') return null;
  const decoded = decodeURIComponent(returnUrl.trim());
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return null;
  return decoded;
}
