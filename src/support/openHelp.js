/**
 * Help has ONE entry (persona-clarity, 05.11.2026): the labelled "עזרה" button in the top bar, on every width.
 * Other screens may still call openHelp() (e.g. the channels wizard with a prefilled question);
 * the lazily loaded SupportWidget listens and opens its panel.
 * The widget reports unread agent replies back, so the entry points can show a count.
 */
import { useEffect, useState } from 'react';
import { SUPPORT_ENABLED } from './config';

export const HELP_ENABLED = SUPPORT_ENABLED;
const OPEN = 'atlas:help-open';
const UNREAD = 'atlas:help-unread';
let lastUnread = 0;

/** `text` (optional) is put in the chat box, ready to send; the user still presses send. */
/** `person: true` opens straight into a conversation with a person from the team (the "דברו עם נציג" row). */
export function openHelp({ text = '', person = false } = {}) {
  const opener = typeof document !== 'undefined' ? document.activeElement : null;
  window.dispatchEvent(new CustomEvent(OPEN, { detail: { opener, text: typeof text === 'string' ? text : '', person: !!person } }));
}

export function onHelpOpen(fn) {
  const h = (e) => fn(e?.detail || {});
  window.addEventListener(OPEN, h);
  return () => window.removeEventListener(OPEN, h);
}

export function reportHelpUnread(n) {
  lastUnread = n || 0;
  window.dispatchEvent(new CustomEvent(UNREAD, { detail: lastUnread }));
}

export function useHelpUnread() {
  const [n, setN] = useState(lastUnread);
  useEffect(() => {
    const h = (e) => setN(Number(e?.detail) || 0);
    window.addEventListener(UNREAD, h);
    return () => window.removeEventListener(UNREAD, h);
  }, []);
  return n;
}
