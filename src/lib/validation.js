/**
 * Production-grade validation utilities for auth and onboarding.
 * All error messages in Hebrew.
 */

// ─── Name validation (Hebrew or English, no numbers/symbols) ───
const NAME_REGEX = /^[\u0590-\u05FFa-zA-Z\s'-]+$/;

export function validateFirstName(value) {
  const v = (value || '').trim();
  if (!v) return { valid: false, error: 'שדה חובה' };
  if (v.length < 2) return { valid: false, error: 'לפחות 2 תווים' };
  if (!NAME_REGEX.test(v)) return { valid: false, error: 'אותיות בעברית או אנגלית בלבד' };
  return { valid: true };
}

export function validateLastName(value) {
  return validateFirstName(value);
}

// ─── Israeli phone ───
const PHONE_REGEX = /^(\+972|0)(5[0-9]|7[2-9])[0-9]{7}$/;

export function validatePhone(value) {
  const v = (value || '').replace(/\s|-/g, '');
  if (!v) return { valid: false, error: 'שדה חובה' };
  if (!PHONE_REGEX.test(v)) return { valid: false, error: 'מספר טלפון לא תקין — לדוגמה: 050-1234567' };
  return { valid: true };
}

export function formatPhone(value) {
  let digits = (value || '').replace(/\D/g, '');
  if (digits.startsWith('972')) digits = '0' + digits.slice(3);
  if (digits.length > 0 && digits[0] !== '0' && (digits[0] === '5' || digits[0] === '7'))
    digits = '0' + digits;
  digits = digits.slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return digits;
  return digits.slice(0, 3) + '-' + digits.slice(3);
}

// ─── Organization ───
export function validateOrgName(value) {
  const v = (value || '').trim();
  if (!v) return { valid: false, error: 'שדה חובה' };
  if (v.length < 2) return { valid: false, error: 'לפחות 2 תווים' };
  if (v.length > 50) return { valid: false, error: 'עד 50 תווים' };
  return { valid: true };
}

export function validateAddress(value) {
  const v = (value || '').trim();
  if (!v) return { valid: false, error: 'שדה חובה' };
  if (v.length < 5) return { valid: false, error: 'לפחות 5 תווים' };
  return { valid: true };
}

export function validateOrgType(value) {
  const v = (value || '').trim();
  if (!v) return { valid: false, error: 'נא לבחור סוג' };
  return { valid: true };
}

// ─── Property ───
export function validatePropertyName(value) {
  const v = (value || '').trim();
  if (!v) return { valid: false, error: 'שדה חובה' };
  if (v.length < 2) return { valid: false, error: 'לפחות 2 תווים' };
  return { valid: true };
}

export function validateRooms(value) {
  const n = parseInt(value, 10);
  if (isNaN(n) || value === '' || value === null) return { valid: false, error: 'שדה חובה' };
  if (n < 1 || n > 100) return { valid: false, error: 'מספר בין 1 ל-100' };
  if (/[a-zA-Z]/.test(String(value))) return { valid: false, error: 'מספרים בלבד' };
  return { valid: true };
}

export function validatePricePerNight(value) {
  const n = parseFloat(String(value).replace(/[^\d.]/g, ''));
  if (isNaN(n) || value === '' || value === null) return { valid: false, error: 'שדה חובה' };
  if (n <= 0) return { valid: false, error: 'מחיר חייב להיות גדול מ-0' };
  if (/[a-zA-Z]/.test(String(value))) return { valid: false, error: 'מספרים בלבד' };
  return { valid: true };
}

// ─── Luhn algorithm for card validation ───
function luhnCheck(cardNumber) {
  const digits = cardNumber.replace(/\D/g, '');
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

export function validateCardNumber(value) {
  const digits = (value || '').replace(/\D/g, '');
  if (digits.length !== 16) return { valid: false, error: '16 ספרות בדיוק' };
  if (!/^\d+$/.test(digits)) return { valid: false, error: 'ספרות בלבד' };
  if (!luhnCheck(digits)) return { valid: false, error: 'מספר כרטיס לא תקין' };
  return { valid: true };
}

export function getCardType(cardNumber) {
  const d = (cardNumber || '').replace(/\D/g, '');
  if (/^4/.test(d)) return 'visa';
  if (/^5[1-5]|^2[2-7]/.test(d)) return 'mastercard';
  return null;
}

export function formatCardNumber(value) {
  const digits = (value || '').replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

// ─── Expiry MM/YY ───
export function validateExpiry(value) {
  const v = (value || '').replace(/\D/g, '');
  if (v.length !== 4) return { valid: false, error: 'פורמט MM/YY' };
  const mm = parseInt(v.slice(0, 2), 10);
  const yy = parseInt(v.slice(2, 4), 10) + 2000;
  if (mm < 1 || mm > 12) return { valid: false, error: 'חודש לא תקין' };
  const now = new Date();
  const exp = new Date(yy, mm - 1);
  if (exp <= now) return { valid: false, error: 'תוקף הכרטיס פג' };
  return { valid: true };
}

export function formatExpiry(value) {
  const digits = (value || '').replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

// ─── CVV ───
export function validateCvv(value) {
  const v = (value || '').replace(/\D/g, '');
  if (v.length < 3 || v.length > 4) return { valid: false, error: '3 או 4 ספרות' };
  return { valid: true };
}

// ─── Name on card ───
const CARD_NAME_REGEX = /^[\u0590-\u05FFa-zA-Z\s'-]+$/;

export function validateNameOnCard(value) {
  const v = (value || '').trim();
  if (!v) return { valid: false, error: 'שדה חובה' };
  if (v.length < 3) return { valid: false, error: 'לפחות 3 תווים' };
  if (!CARD_NAME_REGEX.test(v)) return { valid: false, error: 'אותיות בלבד' };
  return { valid: true };
}

// ─── Email ───
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value) {
  const v = (value || '').trim();
  if (!v) return { valid: false, error: 'שדה חובה' };
  if (!EMAIL_REGEX.test(v)) return { valid: false, error: 'כתובת אימייל לא תקינה' };
  return { valid: true };
}

// ─── Password strength ───
export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (score <= 2) return { score, label: 'חלש', color: '#EF4444' };
  if (score <= 4) return { score, label: 'בינוני', color: '#F59E0B' };
  return { score, label: 'חזק', color: '#22C55E' };
}

export function validatePassword(value) {
  const v = value || '';
  if (v.length < 8) return { valid: false, error: 'לפחות 8 תווים' };
  if (!/\d/.test(v)) return { valid: false, error: 'חייבת להכיל לפחות ספרה אחת' };
  if (!/[a-zA-Z]/.test(v)) return { valid: false, error: 'חייבת להכיל לפחות אות אחת' };
  return { valid: true };
}
