/** The onboarding v2 answers: autosaved on this device after every change, first name from the register screen. */
import { useCallback, useEffect, useState } from 'react';
import { readPendingBusiness } from '@/lib/auth/useRegister';
import { defaultAnswers } from '@/lib/onboarding/v2/model';
import { loadAnswers, saveAnswers } from '@/lib/onboarding/v2/actions';

export function useAnswers(user) {
  const [a, setA] = useState(() => {
    const saved = loadAnswers(user?.id);
    if (saved) return saved;
    const d = defaultAnswers();
    const pending = readPendingBusiness() || (user?.organization_name && user.organization_name !== 'My Organization' ? user.organization_name : '');
    return { ...d, name: pending || '' };
  });
  useEffect(() => { const t = setTimeout(() => saveAnswers(user?.id, a), 200); return () => clearTimeout(t); }, [a, user?.id]);
  const update = useCallback((patch) => setA((cur) => ({ ...cur, ...(typeof patch === 'function' ? patch(cur) : patch) })), []);
  return [a, update];
}

