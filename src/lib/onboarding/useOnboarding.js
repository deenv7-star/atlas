/**
 * Draft state for onboarding: starts from the local autosave (if any), else from what the account
 * already holds; every change is autosaved on this device; "back" never loses an answer.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { EMPTY_DRAFT, loadDraft, saveDraft, loadExisting } from './store';

export function useOnboardingDraft(user) {
  const uid = user?.id;
  const [draft, setDraft] = useState(() => loadDraft(uid));
  const [ready, setReady] = useState(!!draft);
  const first = useRef(true);

  useEffect(() => {
    let alive = true;
    if (draft) { setReady(true); return undefined; }
    (async () => {
      const existing = user ? await loadExisting(user) : { ...EMPTY_DRAFT };
      if (!alive) return;
      setDraft(existing);
      setReady(true);
    })();
    return () => { alive = false; };
  }, [uid]);

  useEffect(() => {
    if (!draft) return;
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => saveDraft(uid, draft), 250);
    return () => clearTimeout(t);
  }, [draft, uid]);

  const update = useCallback((patch) => {
    setDraft((d) => ({ ...(d || EMPTY_DRAFT), ...(typeof patch === 'function' ? patch(d || EMPTY_DRAFT) : patch) }));
  }, []);

  return { draft: draft || EMPTY_DRAFT, update, ready };
}
