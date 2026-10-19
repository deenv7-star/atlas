/**
 * Test-account detection. Same rule as public.admin_is_test_pattern() in migration 023: keep them in sync.
 * A manual flag (023, platform_org_flags) always wins over the pattern.
 */
const EMAIL_RE = /(^qa[+._-]|^test[+._-]|\+test|\+qa|\+scout|^roast\+|@gonogo\.team$|@example\.(com|org|net)$|@mailinator\.|\.invalid$|\.test$)/i;
const NAME_RE = /(^qa |^qa$| qa org$|^test |בדיקה)/i;

export function testPattern(email, name) {
  return EMAIL_RE.test(String(email || '').trim()) || NAME_RE.test(String(name || '').trim());
}

/** { is_test, source: 'manual' | 'auto' | null }. Uses the DB answer when 023 sent one. */
export function testInfo(c) {
  if (c && typeof c.is_test === 'boolean') return { is_test: c.is_test, source: c.is_test_source || (c.is_test ? 'auto' : null) };
  const auto = testPattern(c?.owner_email, c?.org_name);
  return { is_test: auto, source: auto ? 'auto' : null };
}
export const isTest = (c) => testInfo(c).is_test;
