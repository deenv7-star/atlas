/**
 * The assistant's building blocks, shared by the full page (version A) and the side panel / sheet (B).
 * Calm by design: answers read like a note on the page (no bubbles, no robot), the question is a small
 * navy line, one real insight waits before anyone types, and every link leads back into the app.
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { safeHref, splitActions, insightOf, suggestionsOf } from './insights.js';
import { useAssistant } from './useAssistant.js';
import { ASSISTANT_DEMO } from './api.js';
import './assistant.css';

export { SparkMark } from './mark.jsx';
import { SparkMark } from './mark.jsx';

/* ── keyboard + safe area ─────────────────────────────────────────────── */
/** Writes --as-kb (px hidden by the on-screen keyboard) on the given element, from visualViewport. */
export function useKeyboardInset(ref) {
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    const el = ref.current;
    if (!vv || !el) return undefined;
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const hidden = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
        el.style.setProperty('--as-kb', `${hidden > 60 ? hidden : 0}px`);
        el.toggleAttribute('data-kb', hidden > 60);
      });
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => { cancelAnimationFrame(raf); vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
  }, [ref]);
}

const coarse = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

/* ── composer ─────────────────────────────────────────────────────────── */
export function Composer({ onSend, onStop, busy, autoFocus = false, inputRef: outerRef, placeholder = 'מה תרצו לדעת?' }) {
  const [text, setText] = useState('');
  const innerRef = useRef(null);
  const ref = outerRef || innerRef;
  const touch = useRef(false);
  useEffect(() => { touch.current = coarse(); }, []);

  useLayoutEffect(() => { // grow with the text, up to ~6 lines, then scroll inside
    const el = ref.current; if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [text, ref]);
  useEffect(() => { if (autoFocus && !coarse()) ref.current?.focus({ preventScroll: true }); }, [autoFocus, ref]);

  const submit = () => { if (onSend(text)) setText(''); };
  const onKeyDown = (e) => {
    if (e.key !== 'Enter' || e.isComposing || e.keyCode === 229) return;
    if (touch.current) return; // phones: Enter is a new line, the button sends
    if (e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (!busy) submit();
  };
  const empty = !text.trim();
  return (
    <form className="as-composer" onSubmit={(e) => { e.preventDefault(); if (busy) onStop(); else submit(); }}>
      <label className="as-sr" htmlFor="as-input">השאלה שלכם</label>
      <textarea
        id="as-input"
        ref={ref}
        rows={1}
        dir="auto"
        value={text}
        maxLength={2000}
        placeholder={placeholder}
        enterKeyHint={touch.current ? 'enter' : 'send'}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <button
        type="submit"
        className={`as-send${busy ? ' is-stop' : ''}`}
        aria-label={busy ? 'עצירת התשובה' : 'שליחה'}
        disabled={!busy && empty}
      >
        <span className="as-send-icon" aria-hidden="true">
          {busy
            ? <svg viewBox="0 0 24 24" width="18" height="18"><rect x="7" y="7" width="10" height="10" rx="2.5" fill="currentColor" /></svg>
            : <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M12 19V5M12 5l-6 6M12 5l6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </span>
      </button>
    </form>
  );
}

/* ── answer pieces ────────────────────────────────────────────────────── */
function MdLink({ href, children, onNavigate }) {
  const to = safeHref(href);
  if (!to) return <span>{children}</span>;
  return <Link to={to} className="as-link" onClick={onNavigate}>{children}</Link>;
}

function Markdown({ text, onNavigate }) {
  return (
    <div className="as-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ href, children }) => <MdLink href={href} onNavigate={onNavigate}>{children}</MdLink>,
          img: () => null,
          table: ({ children }) => (
            <div className="as-table" role="region" aria-label="טבלה" tabIndex={0}><table>{children}</table></div>
          ),
          h1: ({ children }) => <p className="as-h">{children}</p>,
          h2: ({ children }) => <p className="as-h">{children}</p>,
          h3: ({ children }) => <p className="as-h">{children}</p>,
          code: ({ children }) => <span className="as-code">{children}</span>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export function Thinking() {
  return (
    <p className="as-thinking" role="status">
      <SparkMark size={18} live />
      <span className="as-shimmer">בודקים בנתונים שלכם</span>
    </p>
  );
}

function CopyButton({ text }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1600); } catch { /* blocked */ }
  };
  return (
    <button type="button" className="as-tool" onClick={copy} aria-label={done ? 'הועתק' : 'העתקת התשובה'}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
        {done
          ? <path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          : <><rect x="8.5" y="8.5" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.7" /><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.7" /></>}
      </svg>
      <span>{done ? 'הועתק' : 'העתקה'}</span>
    </button>
  );
}

function RetryButton({ onClick, label = 'תשובה אחרת' }) {
  return (
    <button type="button" className="as-tool" onClick={onClick}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v3.7h3.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <span>{label}</span>
    </button>
  );
}

export function Answer({ msg, onRetry, onNavigate, last }) {
  if (msg.status === 'pending') return <Thinking />;
  const { body, actions } = msg.status === 'streaming' ? { body: msg.content, actions: [] } : splitActions(msg.content);
  return (
    <article className={`as-answer${msg.status === 'streaming' ? ' is-streaming' : ''}`} aria-busy={msg.status === 'streaming'}>
      {body ? <Markdown text={body} onNavigate={onNavigate} /> : null}
      {msg.status === 'error' ? <p className="as-error" role="alert">{msg.error}</p> : null}
      {msg.status === 'stopped' ? <p className="as-note">{body ? 'התשובה נעצרה באמצע.' : 'התשובה נעצרה.'}</p> : null}
      {actions.length ? (
        <div className="as-actions">
          {actions.map((a) => <Link key={a.href} to={a.href} className="as-chip as-chip--go" onClick={onNavigate}>{a.label}<span aria-hidden="true">←</span></Link>)}
        </div>
      ) : null}
      {msg.status !== 'streaming' ? (
        <div className={`as-tools${last ? ' is-last' : ''}`}>
          {msg.status === 'done' && msg.content ? <CopyButton text={msg.content} /> : null}
          <RetryButton onClick={() => onRetry(msg.id)} label={msg.status === 'done' ? 'תשובה אחרת' : 'נסו שוב'} />
        </div>
      ) : null}
    </article>
  );
}

/* ── empty state: one real insight, then one-tap questions ─────────────── */
export function InsightCard({ insight, onAsk, onNavigate }) {
  if (!insight) return null;
  return (
    <section className="as-insight" aria-label="שווה לדעת">
      <p className="as-kicker">שווה לדעת עכשיו</p>
      <p className="as-insight-title">{insight.title}</p>
      <p className="as-insight-body">{insight.body}</p>
      <div className="as-insight-row">
        <button type="button" className="as-chip as-chip--primary" onClick={() => onAsk(insight.ask)}>{insight.ask}</button>
        {insight.action ? <Link to={insight.action.href} className="as-chip as-chip--go" onClick={onNavigate}>{insight.action.label}<span aria-hidden="true">←</span></Link> : null}
      </div>
    </section>
  );
}

export function Suggestions({ items, onPick, label = 'אפשר לשאול' }) {
  if (!items?.length) return null;
  return (
    <div className="as-suggest">
      <p className="as-kicker">{label}</p>
      <ul>{items.map((q) => <li key={q}><button type="button" className="as-chip" onClick={() => onPick(q)}>{q}</button></li>)}</ul>
    </div>
  );
}

function EmptyNoData({ onNavigate }) {
  return (
    <section className="as-insight as-insight--quiet">
      <p className="as-insight-title">כאן יופיעו תשובות מההזמנות שלכם</p>
      <p className="as-insight-body">אחרי הזמנה ראשונה ביומן אפשר לשאול על כסף, לילות פנויים ואורחים.</p>
      <div className="as-insight-row">
        <Link to="/integrations" className="as-chip as-chip--go" onClick={onNavigate}>חיבור Booking ו-Airbnb<span aria-hidden="true">←</span></Link>
      </div>
    </section>
  );
}

/* ── the whole conversation ───────────────────────────────────────────── */
/**
 * <Conversation facts loading page variant="page"|"panel" onNavigate />
 * Owns the thread, the scroll, the composer and the live region.
 */
export function Conversation({ facts, loading, page = '', variant = 'page', onNavigate, inputRef, autoFocus, header = null }) {
  const { messages, busy, send, stop, retry, clear } = useAssistant({ facts, page });
  const scrollRef = useRef(null);
  const rootRef = useRef(null);
  const pinned = useRef(true);
  const [announce, setAnnounce] = useState('');
  useKeyboardInset(rootRef);

  const scroller = useCallback(() => (variant === 'page' ? document.getElementById('atlas-main-scroll') : scrollRef.current), [variant]);
  useEffect(() => {
    const el = scroller(); if (!el) return undefined;
    const onScroll = () => { pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120; };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scroller]);
  const lastLen = messages.length ? messages[messages.length - 1].content.length : 0;
  useEffect(() => {
    const el = scroller();
    if (el && pinned.current) el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
  }, [messages.length, lastLen, scroller]);
  const lastStatus = messages.length ? messages[messages.length - 1].status : '';
  useEffect(() => {
    const m = messages[messages.length - 1];
    if (m?.role === 'assistant' && m.status === 'done') setAnnounce(splitActions(m.content).body.slice(0, 400));
    if (m?.role === 'assistant' && m.status === 'error') setAnnounce(m.error || '');
  }, [lastStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const ask = (q) => { pinned.current = true; return send(q); };
  const insight = facts ? insightOf(facts) : null;
  const suggestions = facts ? suggestionsOf(facts, page, insight ? 3 : 4) : [];
  const empty = messages.length === 0;
  const lastAnswerId = [...messages].reverse().find((m) => m.role === 'assistant')?.id;

  return (
    <div ref={rootRef} className={`as-root as-root--${variant}`} dir="rtl">
      {header ? header({ clear, hasThread: !empty, busy }) : null}
      <div ref={scrollRef} className="as-scroll">
        <div className="as-thread">
          {empty ? (
            loading ? (
              <div className="as-skel" aria-busy="true" aria-label="טוענים את הנתונים"><span /><span /><span /></div>
            ) : facts?.hasData ? (
              <>
                <InsightCard insight={insight} onAsk={ask} onNavigate={onNavigate} />
                <Suggestions items={suggestions} onPick={ask} label={insight ? 'או שאלו' : 'אפשר לשאול'} />
              </>
            ) : <EmptyNoData onNavigate={onNavigate} />
          ) : messages.map((m) => (m.role === 'user'
            ? <p key={m.id} className="as-question" dir="auto">{m.content}</p>
            : <Answer key={m.id} msg={m} onRetry={retry} onNavigate={onNavigate} last={m.id === lastAnswerId} />))}
          {!empty && !busy && lastStatus === 'done' && suggestions.length ? (
            <Suggestions items={suggestions.slice(0, 2)} onPick={ask} label="עוד שאלה" />
          ) : null}
        </div>
      </div>
      <div className="as-dock">
        <Composer onSend={ask} onStop={stop} busy={busy} inputRef={inputRef} autoFocus={autoFocus} />
        <p className="as-fine">{ASSISTANT_DEMO ? 'הדגמה: התשובות מחושבות מהנתונים בדפדפן הזה.' : 'התשובות מבוססות על הנתונים שלכם. כדאי לבדוק לפני שפועלים.'}</p>
      </div>
      <p className="as-sr" aria-live="polite">{announce}</p>
    </div>
  );
}
