/**
 * Version B entry point: the header button "שאלו את atlas" and the open/closed state of the panel.
 * Tiny on purpose (no markdown, no data): the panel itself is lazy-loaded on first open.
 */
import React, { useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { SparkMark } from './mark.jsx';
import './launcher.css';

let open = false;
let everOpened = false;
let opener = null;
const subs = new Set();
const emit = () => subs.forEach((s) => s());
export function setAssistantOpen(v, from) {
  open = !!v;
  if (open) { everOpened = true; if (from) opener = from; }
  if (typeof document !== 'undefined') document.documentElement.toggleAttribute('data-assistant-open', open);
  emit();
  if (!open && opener) { const el = opener; setTimeout(() => el?.focus?.(), 0); }
}
const subscribe = (cb) => { subs.add(cb); return () => subs.delete(cb); };
export function useAssistantOpen() {
  const isOpen = useSyncExternalStore(subscribe, () => open, () => false);
  const mounted = useSyncExternalStore(subscribe, () => everOpened, () => false);
  return { isOpen, mounted };
}

export function AskAtlasButton({ className = '' }) {
  const { isOpen } = useAssistantOpen();
  const { pathname } = useLocation();
  if (pathname.startsWith('/ai-assistant')) return null; // the full page is already open
  return (
    <button
      type="button"
      className={`as-open ${className}`}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      aria-label="שאלו את atlas"
      onClick={(e) => setAssistantOpen(!isOpen, e.currentTarget)}
    >
      <SparkMark size={22} />
      <span className="as-open-label" aria-hidden="true">שאלו את atlas</span>
    </button>
  );
}
