/**
 * Guided tour controller (shared by both designs). Mounted once in the app shell.
 *
 *   - Opens by itself once, right after onboarding (tour state "pending" on the account),
 *     and any time from Settings → "סיור במערכת" or the account menu.
 *   - Moves screen to screen (Today → calendar → bookings → leads → messages → payments → settings),
 *     waits for each screen's element (data-tour="…"), scrolls it into view and tracks its box.
 *   - Optional voice-over (one short clip per step, default off); the step text is the caption.
 *   - Saves progress on the account: reload in the middle and it continues where it stopped.
 *
 * The look lives in ./TourView.jsx (design A: spotlight, design B: docked guide card).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { TOUR_STEPS } from '@/content/help.he';
import { getTourState, setTourState, onTourStart, voicePref, setVoicePref } from '@/lib/tour/tourState';
import TourView from './TourView';

const FALLBACK = {
  'today-board': ['today-board'],
  'calendar-grid': ['calendar-grid'],
  'bookings-list': ['bookings-list', 'bookings-page'],
  'leads-list': ['leads-list', 'leads-page'],
  'messages-list': ['messages-list', 'messages-page'],
  'payments-stats': ['payments-stats', 'payments-page'],
  'settings-tour': ['settings-tour'],
};

const HOME = ['/dashboard', '/today'];
const samePath = (a, b) => a === b || (HOME.includes(a) && HOME.includes(b));

function visibleEl(name) {
  for (const n of FALLBACK[name] || [name]) {
    for (const el of document.querySelectorAll(`[data-tour="${n}"]`)) {
      const r = el.getBoundingClientRect();
      if (r.width > 40 && r.height > 40) return el;
    }
  }
  return null;
}

function scrollParent(el) {
  let p = el?.parentElement;
  while (p && p !== document.body) {
    const s = getComputedStyle(p);
    if (/(auto|scroll)/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 1) return p;
    p = p.parentElement;
  }
  return document.scrollingElement || document.documentElement;
}

export function useReducedMotionPref() {
  const q = '(prefers-reduced-motion: reduce)';
  const [r, setR] = useState(() => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q).matches : false));
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(q);
    const h = () => setR(mq.matches);
    mq.addEventListener?.('change', h);
    return () => mq.removeEventListener?.('change', h);
  }, []);
  return r;
}

export default function TourHost({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const reduced = useReducedMotionPref();
  const [active, setActive] = useState(false);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState(null);      // the highlighted element's box (viewport px), null = centered card
  const [ready, setReady] = useState(false);   // the step's screen + element are in place
  const [voiceOn, setVoiceOn] = useState(() => voicePref());
  const [speaking, setSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState(false);
  const elRef = useRef(null);
  const audioRef = useRef(null);
  const returnFocus = useRef(null);
  const step = TOUR_STEPS[idx];
  const total = TOUR_STEPS.length;

  /* open by itself once after onboarding, or from anywhere via startTour() */
  useEffect(() => {
    if (!user?.id) return undefined;
    let alive = true;
    getTourState(user).then((st) => {
      if (!alive || st?.status !== 'pending') return;
      setTimeout(() => { if (alive) { setIdx(Math.min(st.step || 0, total - 1)); setActive(true); } }, 700);
    });
    return () => { alive = false; };
  }, [user?.id]);

  useEffect(() => onTourStart((s) => {
    returnFocus.current = document.activeElement;
    setIdx(Math.max(0, Math.min(s, total - 1)));
    setActive(true);
  }), [total]);

  /* go to the step's screen, wait for its element, bring it into view */
  useEffect(() => {
    if (!active || !step) return undefined;
    let alive = true;
    setReady(false);
    elRef.current = null;
    if (!samePath(location.pathname, step.path)) {
      navigate(step.path);
      return undefined; // runs again when the path changes
    }
    if (!step.target) { setRect(null); setReady(true); return undefined; }
    const t0 = Date.now();
    const find = () => {
      if (!alive) return;
      const el = visibleEl(step.target);
      if (!el && Date.now() - t0 < 5000) { setTimeout(find, 120); return; }
      if (!el) { setRect(null); setReady(true); return; }
      elRef.current = el;
      const sp = scrollParent(el);
      const top = el.getBoundingClientRect().top - (sp.getBoundingClientRect?.().top || 0) + sp.scrollTop;
      const header = window.innerWidth < 1024 ? 76 : 104;
      sp.scrollTo({ top: Math.max(0, top - header - 12), behavior: reduced ? 'auto' : 'smooth' });
      setTimeout(() => { if (alive) { setRect(el.getBoundingClientRect()); setReady(true); } }, reduced ? 60 : 380);
    };
    setTimeout(find, 120);
    return () => { alive = false; };
  }, [active, idx, location.pathname]);

  /* keep the box in sync with scroll / resize / late content */
  useEffect(() => {
    if (!active || !ready) return undefined;
    let raf = 0;
    const upd = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { if (elRef.current?.isConnected) setRect(elRef.current.getBoundingClientRect()); });
    };
    window.addEventListener('resize', upd);
    window.addEventListener('scroll', upd, true);
    const ro = typeof ResizeObserver !== 'undefined' && elRef.current ? new ResizeObserver(upd) : null;
    if (ro) ro.observe(elRef.current);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', upd); window.removeEventListener('scroll', upd, true); ro?.disconnect(); };
  }, [active, ready, idx]);

  /* while the tour runs the help-chat launcher (bottom-left, above the tab bar) is hidden and its chat closed,
     so the guide card never sits on top of it or under it */
  useEffect(() => {
    const root = document.documentElement;
    if (active) root.setAttribute('data-tour-running', '');
    else root.removeAttribute('data-tour-running');
    window.dispatchEvent(new CustomEvent('atlas:tour-active', { detail: { active } }));
    return () => root.removeAttribute('data-tour-running');
  }, [active]);

  /* progress on the account (reload mid-way → continue) */
  useEffect(() => {
    if (active && user?.id) setTourState(user, { status: 'pending', step: idx });
  }, [active, idx]);

  /* voice-over */
  const stopVoice = useCallback(() => {
    const a = audioRef.current;
    if (a) { a.pause(); }
    setSpeaking(false);
  }, []);
  useEffect(() => {
    if (!active || !voiceOn || !ready || !step) { stopVoice(); return undefined; }
    let a = audioRef.current;
    if (!a) {
      a = new Audio();
      a.preload = 'auto';
      a.addEventListener('playing', () => setSpeaking(true));
      a.addEventListener('pause', () => setSpeaking(false));
      a.addEventListener('ended', () => setSpeaking(false));
      a.addEventListener('error', () => { setSpeaking(false); setVoiceError(true); });
      audioRef.current = a;
    }
    a.src = `/tour/voice/${step.id}.mp3`;
    a.currentTime = 0;
    const p = a.play();
    if (p && p.catch) p.catch(() => setSpeaking(false));
    return () => a.pause();
  }, [active, voiceOn, ready, idx]);
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const finish = useCallback((status) => {
    stopVoice();
    setActive(false);
    setRect(null);
    setReady(false);
    if (user?.id) setTourState(user, { status, step: 0 });
    const back = returnFocus.current;
    returnFocus.current = null;
    if (back && back.isConnected && typeof back.focus === 'function') setTimeout(() => back.focus(), 0);
  }, [user?.id, stopVoice]);

  const next = useCallback(() => { if (idx >= total - 1) finish('done'); else setIdx((i) => i + 1); }, [idx, total, finish]);
  const back = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);
  const skip = useCallback(() => finish(idx >= total - 1 ? 'done' : 'skipped'), [finish, idx, total]);
  const toggleVoice = useCallback(() => {
    setVoiceError(false);
    setVoiceOn((v) => { setVoicePref(!v); return !v; });
  }, []);

  /* keyboard: Esc closes, arrows move (RTL: ← is forward) */
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => {
      if (e.defaultPrevented) return;
      if (e.key === 'Escape') { e.preventDefault(); skip(); }
      else if (e.key === 'ArrowLeft' && !/INPUT|TEXTAREA/.test(e.target?.tagName || '')) { e.preventDefault(); next(); }
      else if (e.key === 'ArrowRight' && !/INPUT|TEXTAREA/.test(e.target?.tagName || '')) { e.preventDefault(); back(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, next, back, skip]);

  if (!active || !step || typeof document === 'undefined') return null;
  return createPortal(
    <TourView
      step={step}
      idx={idx}
      total={total}
      steps={TOUR_STEPS}
      rect={rect}
      ready={ready}
      reduced={reduced}
      voiceOn={voiceOn}
      voiceError={voiceError}
      speaking={speaking}
      onNext={next}
      onBack={back}
      onSkip={skip}
      onToggleVoice={toggleVoice}
      onGo={(i) => setIdx(i)}
    />,
    document.body,
  );
}
