/**
 * UI hint for platform (vendor) console — server still enforces PLATFORM_ADMIN_EMAILS / DB flag.
 */
export function isPlatformAdminViewer(user) {
  if (!user?.email) return false;
  if (user.is_platform_admin) return true;
  const raw = import.meta.env.VITE_PLATFORM_ADMIN_EMAILS || '';
  const allow = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return allow.includes(String(user.email).toLowerCase());
}
