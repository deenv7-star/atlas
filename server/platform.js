/**
 * Platform (vendor) operators — env allowlist and optional DB flag.
 */
export function isPlatformAdminEmail(email) {
  const raw = process.env.PLATFORM_ADMIN_EMAILS || '';
  const allow = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return allow.includes(String(email || '').toLowerCase());
}
