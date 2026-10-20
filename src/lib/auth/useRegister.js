/**
 * Sign-up logic shared by the register screens: the same validation, rate limit, consent gate,
 * duplicate-email handling, Hebrew errors and routing the original Register.jsx had. The screens only draw it.
 *
 * `organizationName` (optional) is passed through the existing signUp `organization_name` metadata
 * (the DB trigger already names the new org from it) and kept on this device so onboarding starts with it.
 */
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { validateEmail, validatePassword, getPasswordStrength } from '@/lib/validation';
import { checkRateLimit, recordAttempt, clearAttempts } from '@/lib/authRateLimit';
import { mapAuthErrorToHebrew } from '@/lib/authErrors';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { TERMS_VERSION } from '@/config/consent';
import { setPendingCredentials } from '@/lib/auth/pendingCredentials';

export const PENDING_BUSINESS_KEY = 'atlas.signup.business';

export function readPendingBusiness() {
  try { return (localStorage.getItem(PENDING_BUSINESS_KEY) || '').slice(0, 50); } catch { return ''; }
}
export function clearPendingBusiness() {
  try { localStorage.removeItem(PENDING_BUSINESS_KEY); } catch { /* ignore */ }
}

export function useRegister() {
  const navigate = useNavigate();
  const { loginUser, isLoadingAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', business: '' });
  const [touched, setTouched] = useState({ email: false, password: false, confirmPassword: false });
  const [errors, setErrors] = useState({});
  // Upay/Bit requirement: an active, unchecked-by-default consent to the terms + privacy policy.
  const [agreed, setAgreed] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const onConsent = (v) => { setAgreed(v); if (v) setConsentError(false); };

  const set = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    setEmailExists(false);
    if (field === 'business') return;
    if (errors[field]) {
      const v = field === 'email' ? validateEmail(value) : field === 'password' ? validatePassword(value) : { valid: value === form.password };
      setErrors((x) => ({ ...x, [field]: v.valid ? null : (v.error || 'הסיסמאות לא תואמות') }));
    }
  };

  const validate = useCallback((fields = ['email', 'password', 'confirmPassword']) => {
    const e = {};
    if (fields.includes('email')) { const r = validateEmail(form.email); if (!r.valid) e.email = r.error; }
    if (fields.includes('password')) { const r = validatePassword(form.password); if (!r.valid) e.password = r.error; }
    if (fields.includes('confirmPassword') && form.password !== form.confirmPassword) e.confirmPassword = 'הסיסמאות לא תואמות';
    setErrors((x) => {
      const next = { ...x };
      fields.forEach((f) => { next[f] = e[f] || null; });
      return next;
    });
    setTouched((t) => ({ ...t, ...Object.fromEntries(fields.map((f) => [f, true])) }));
    return Object.keys(e).length === 0;
  }, [form.email, form.password, form.confirmPassword]);

  const handleBlur = (field) => () => {
    if (field === 'business') return;
    // Empty fields are flagged on submit only: an error line appearing on blur shifts the page under the
    // finger (e.g. tapping "המשך עם Google" right after a field had focus).
    if (!String(form[field] || '').trim()) return;
    setTouched((t) => ({ ...t, [field]: true }));
    if (field === 'email') {
      const r = validateEmail(form.email);
      setErrors((e) => ({ ...e, email: r.valid ? null : r.error }));
    } else if (field === 'password') {
      const r = validatePassword(form.password);
      setErrors((e) => ({ ...e, password: r.valid ? null : r.error }));
    } else if (field === 'confirmPassword') {
      setErrors((e) => ({ ...e, confirmPassword: form.password === form.confirmPassword ? null : 'הסיסמאות לא תואמות' }));
    }
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!validate()) return false;
    if (!agreed) {
      setConsentError(true);
      document.getElementById('terms-consent')?.focus();
      return false;
    }

    const rl = checkRateLimit(form.email);
    if (!rl.allowed) {
      atlasToastApi.error(`נסו שוב בעוד ${rl.retryAfter} שניות`);
      return false;
    }

    setIsLoading(true);
    setEmailExists(false);
    const business = form.business.trim().slice(0, 50);
    try {
      const data = await base44.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        full_name: '',
        organization_name: business,
        terms_accepted_at: new Date().toISOString(),
        terms_version: TERMS_VERSION,
      });
      clearAttempts(form.email);
      try { if (business) localStorage.setItem(PENDING_BUSINESS_KEY, business); } catch { /* ignore */ }

      if (data?.user && !data?.session) {
        atlasToastApi.success('שלחנו לכם מייל לאישור');
        // Memory only: lets the waiting screen continue by itself when the email is confirmed on another device.
        setPendingCredentials(form.email.trim(), form.password);
        navigate('/verify-email', { state: { email: form.email.trim() }, replace: true });
      } else if (data?.session) {
        await loginUser(null);
        navigate('/onboarding', { replace: true });
      }
      return true;
    } catch (err) {
      const msg = String(err?.message || '').toLowerCase();
      const code = String(err?.code || '').toLowerCase();
      const duplicate = msg.includes('already registered') || msg.includes('already exists') || code === 'user_already_exists';
      recordAttempt(form.email);
      if (duplicate) {
        setEmailExists(true);
      } else {
        const mapped = mapAuthErrorToHebrew(err);
        if (mapped?.kind === 'toast') {
          atlasToastApi.error(mapped.message);
        } else {
          const isNetworkError = msg.includes('failed to fetch') || msg.includes('network') || err?.name === 'TypeError';
          const isApiMissing = err?.status === 404 || msg.includes('http 404');
          if (isApiMissing) atlasToastApi.error('משהו אצלנו לא זמין כרגע. נסו שוב בעוד כמה דקות.');
          else atlasToastApi.error(isNetworkError ? 'אין חיבור. בדקו את האינטרנט ונסו שוב.' : (err?.message || 'לא הצלחנו ליצור את החשבון. נסו שוב בעוד רגע, ואם זה חוזר, כתבו לנו בוואטסאפ.'));
        }
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const emailOk = validateEmail(form.email).valid;
  const passwordOk = validatePassword(form.password).valid;
  const confirmOk = !!form.confirmPassword && form.password === form.confirmPassword;
  const canSubmit = !!(form.email && form.password && form.confirmPassword && !errors.email && !errors.password && form.password === form.confirmPassword);

  return {
    form, set, touched, errors, handleBlur, validate, submit, isLoading, isLoadingAuth, emailExists, setEmailExists,
    agreed, onConsent, consentError, canSubmit, emailOk, passwordOk, confirmOk,
    strength: getPasswordStrength(form.password),
  };
}
