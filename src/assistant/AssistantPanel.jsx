/**
 * Version B: "שאלו את atlas" next to whatever screen is open.
 *   Desktop (≥1024px): a 420px panel on the left edge; the screen stays usable (non-modal).
 *   Phones: a bottom sheet (modal) that rises above the keyboard (visualViewport).
 * Context-aware: questions and the context sent to ai-chat follow the current screen.
 * The help launcher ("עזרה") lives in the same corner, so it steps aside while this is open.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Conversation, SparkMark, useKeyboardInset } from './ui.jsx';
import { useAssistantFacts } from './useAssistant.js';
import { SAFE_LINK } from './insights.js';
import { setAssistantOpen, useAssistantOpen } from './launcher.jsx';

function useIsDesktop() {
  const q = '(min-width: 1024px)';
  const [d, setD] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setD(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return d;
}

const screenName = (path) => SAFE_LINK[`/${(path.split('/')[1] || '')}`] || '';

export default function AssistantPanel() {
  const { isOpen } = useAssistantOpen();
  const { user } = useAuth();
  const orgId = user?.organization_id ?? user?.org_id ?? null;
  const { pathname } = useLocation();
  const desktop = useIsDesktop();
  const { facts, loading } = useAssistantFacts(isOpen ? orgId : null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  useKeyboardInset(panelRef);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setAssistantOpen(false); };
    document.addEventListener('keydown', onKey);
    if (!desktop) document.documentElement.classList.add('as-lock');
    const t = setTimeout(() => (desktop ? inputRef.current?.focus({ preventScroll: true }) : panelRef.current?.querySelector('.as-icon')?.focus()), 60);
    return () => { document.removeEventListener('keydown', onKey); document.documentElement.classList.remove('as-lock'); clearTimeout(t); };
  }, [isOpen, desktop]);

  // phones: keep Tab inside the sheet
  const onKeyDown = (e) => {
    if (desktop || e.key !== 'Tab') return;
    const f = [...panelRef.current.querySelectorAll('a[href],button:not([disabled]),textarea,[tabindex="0"]')];
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  };

  if (!isOpen) return null;
  const where = screenName(pathname);
  const close = () => setAssistantOpen(false);
  return (
    <div className="as-layer">
      {!desktop ? <div className="as-backdrop" onClick={close} aria-hidden="true" /> : null}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={!desktop}
        aria-labelledby="as-panel-title"
        className={`as-panel ${desktop ? 'as-panel--side' : 'as-panel--sheet'}`}
        onKeyDown={onKeyDown}
        dir="rtl"
      >
        {!desktop ? <span className="as-grab" aria-hidden="true" /> : null}
        <Conversation
          facts={facts}
          loading={loading}
          page={pathname}
          variant="panel"
          inputRef={inputRef}
          onNavigate={desktop ? undefined : close}
          header={({ clear, hasThread }) => (
            <div className="as-ph">
              <SparkMark size={24} />
              <div className="as-ph-title">
                <b id="as-panel-title">שאלו את atlas</b>
                <span>{where ? `מתוך: ${where}` : 'על ההזמנות, הכסף והלידים'}</span>
              </div>
              {hasThread ? (
                <button type="button" className="as-icon" onClick={clear} aria-label="שיחה חדשה">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>
                </button>
              ) : null}
              <Link to="/ai-assistant" className="as-icon" onClick={close} aria-label="פתיחה במסך מלא">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
              <button type="button" className="as-icon" onClick={close} aria-label="סגירה">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
}
