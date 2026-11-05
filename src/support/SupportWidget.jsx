/**
 * persona-clarity (05.11.2026): the ONE help place. The labelled "עזרה" button in the top bar opens this panel, which
 * starts with three plain blocks: שאלו את atlas (the assistant, voice or text) · דברו עם נציג (a person, 24/7) ·
 * מדריכים קצרים (how-to answers from the help bot, here in the panel).
 * Help in every app screen: a quiet "עזרה" button → the ATLAS help bot, with a human one tap away.
 *   Desktop: white pill bottom-left, opens a 400px panel anchored to it (non-modal, the app stays usable).
 *   Phone:   a 48px round button above the floating tab bar (never covers the tab bar or its "+"),
 *            opens a full-screen sheet.
 * Calm on purpose (brand/atlas-brand.md): white surfaces, navy text, indigo only for the primary action.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Headset, ArrowUp, Clock, SquarePen, ChevronLeft, ThumbsUp, ThumbsDown, WifiOff, RotateCw, MessageCircle, ArrowUpLeft, Mic, Keyboard } from 'lucide-react';
import { openAssistant } from '@/assistant/launcher';
import { VOICE_ENABLED } from '@/assistant/voice/config.js';
import { AtlasFace } from '@/components/mascot/AtlasFace.jsx';
import { useAuth } from '@/lib/AuthContext';
import { useShellProperties } from '@/components/app/shell/shared';
import { supportApi } from './api';
import { SUPPORT_ENABLED, SUPPORT_WHATSAPP_DISPLAY, suggestionsFor, waSupportLink } from './config';
import Markdown from './Markdown';
import { onHelpOpen, reportHelpUnread } from './openHelp';
import { heError } from '@/lib/heError';
import './support.css';

const DESK = '(min-width: 1024px)';
const useIsDesktop = () => {
  const [d, setD] = useState(() => typeof window !== 'undefined' && window.matchMedia(DESK).matches);
  useEffect(() => { const m = window.matchMedia(DESK); const on = () => setD(m.matches); m.addEventListener('change', on); return () => m.removeEventListener('change', on); }, []);
  return d;
};
const useOnline = () => {
  const [on, setOn] = useState(() => typeof navigator === 'undefined' || navigator.onLine !== false);
  useEffect(() => { const u = () => setOn(true), d = () => setOn(false); window.addEventListener('online', u); window.addEventListener('offline', d); return () => { window.removeEventListener('online', u); window.removeEventListener('offline', d); }; }, []);
  return on;
};
const convKey = (uid) => `atlas_support_conv_${uid || 'anon'}`;
const firstName = (s) => String(s || '').trim().split(/\s+/)[0] || '';
const initials = (s) => String(s || '').trim().split(/\s+/).map((x) => x[0]).join('').slice(0, 2);
const MONTHS = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];
function when(iso) {
  const d = new Date(iso); const now = new Date();
  const hm = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return hm;
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return `אתמול, ${hm}`;
  return `${d.getDate()} ב${MONTHS[d.getMonth()]}`;
}
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

/* ── one message ──────────────────────────────────────────────────────── */
function BotMark() {
  return <span className="sp-mark" aria-hidden>A</span>;
}
function Msg({ m, last, onLink, onFollow, onFeedback, onRetry }) {
  if (m.sender === 'system') return <div className="sp-system" role="status"><Headset size={16} strokeWidth={1.75} aria-hidden /><span>{m.body}</span></div>;
  if (m.sender === 'user') {
    return (
      <div className="sp-row sp-row--user">
        <div className="sp-bubble">{m.body}</div>
        {m._failed ? (
          <div className="sp-failed" role="alert">
            <span>{m._error || 'לא נשלח'}</span>
            <button type="button" className="sp-textbtn" onClick={() => onRetry(m)}><RotateCw size={14} strokeWidth={2} aria-hidden />נסו שוב</button>
          </div>
        ) : null}
      </div>
    );
  }
  const agent = m.sender === 'agent';
  const follow = last && !agent ? (m.meta?.follow_ups || []) : [];
  return (
    <div className={`sp-row sp-row--bot${agent ? ' sp-row--agent' : ''}`}>
      <div className="sp-who">
        {agent ? <span className="sp-av" aria-hidden>{initials(m.author_name || 'צוות')}</span> : <BotMark />}
        <span>{agent ? `${m.author_name || 'נציג'} · צוות atlas` : 'העזרה של atlas'}</span>
      </div>
      <div className="sp-answer"><Markdown text={m.body} /></div>
      {m.links?.length ? (
        <div className="sp-links">
          {m.links.map((l) => (
            <button key={l.path} type="button" className="sp-link" onClick={() => onLink(l.path)}>
              {l.label}<ArrowUpLeft size={15} strokeWidth={2} aria-hidden />
            </button>
          ))}
        </div>
      ) : null}
      {!agent && m.id && !String(m.id).startsWith('tmp') ? (
        <div className="sp-fb">
          <span>עזר?</span>
          <button type="button" aria-label="התשובה עזרה" aria-pressed={m.feedback === 'up'} onClick={() => onFeedback(m, m.feedback === 'up' ? null : 'up')}><ThumbsUp size={15} strokeWidth={1.75} /></button>
          <button type="button" aria-label="התשובה לא עזרה" aria-pressed={m.feedback === 'down'} onClick={() => onFeedback(m, m.feedback === 'down' ? null : 'down')}><ThumbsDown size={15} strokeWidth={1.75} /></button>
        </div>
      ) : null}
      {follow.length ? (
        <div className="sp-follow" aria-label="שאלות המשך">
          {follow.map((f) => <button key={f} type="button" onClick={() => onFollow(f)}>{f}</button>)}
        </div>
      ) : null}
    </div>
  );
}

/* ── שאלו את atlas: the assistant, from inside help ───────────────────── */
function AskAtlasCard({ onGo }) {
  const go = (how) => (e) => { onGo(); openAssistant(how, e.currentTarget); };
  return (
    <section className="sp-ask" aria-labelledby="sp-ask-t">
      <div className="sp-ask-top">
        <span className="sp-ask-face" aria-hidden><AtlasFace live size={44} decorative /></span>
        <div className="min-w-0">
          <h3 id="sp-ask-t">שאלו את atlas</h3>
          <p>שאלו במילים שלכם, למשל „מי מגיע מחר?". atlas עונה מתוך ההזמנות שלכם, ויכול גם לרשום הזמנה או להכין הודעה לאורח.</p>
        </div>
      </div>
      <div className="sp-ask-btns">
        {VOICE_ENABLED ? <button type="button" className="sp-primary" onClick={go('voice')}><Mic size={18} strokeWidth={2} aria-hidden />דברו</button> : null}
        <button type="button" className={VOICE_ENABLED ? 'sp-secondary' : 'sp-primary'} onClick={go('text')}><Keyboard size={18} strokeWidth={1.75} aria-hidden />כתבו</button>
      </div>
    </section>
  );
}

/* ── the widget ───────────────────────────────────────────────────────── */
export default function SupportWidget() {
  const { user } = useAuth();
  const isDesktop = useIsDesktop();
  const online = useOnline();
  const location = useLocation();
  const navigate = useNavigate();
  const properties = useShellProperties(user);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('chat'); // chat | history
  const [convId, setConvId] = useState(() => { try { return localStorage.getItem(convKey(user?.id)) || null; } catch { return null; } });
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState('bot');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [offer, setOffer] = useState(false);
  const [handingOff, setHandingOff] = useState(false);
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('');
  const [history, setHistory] = useState(null);
  const [unread, setUnread] = useState(0);
  const [ready, setReady] = useState(null); // null = checking, true = 020 applied, false = WhatsApp fallback
  useEffect(() => { let a = true; supportApi.probe().then((r) => a && setReady(r)); return () => { a = false; }; }, []);
  const SUPPORT_DB_READY = ready !== false;
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const device = isDesktop ? 'desktop' : 'mobile';
  const page = location.pathname;
  const suggestions = useMemo(() => suggestionsFor(page), [page]);
  const ctx = useMemo(() => ({ units: { count: properties.length } }), [properties.length]);

  // remember the current thread per user
  useEffect(() => { try { if (convId) localStorage.setItem(convKey(user?.id), convId); else localStorage.removeItem(convKey(user?.id)); } catch { /* ignore */ } }, [convId, user?.id]);

  // load the thread
  useEffect(() => {
    if (!convId || !ready || !user) { setMessages([]); setMode('bot'); return undefined; }
    let alive = true;
    setLoading(true);
    Promise.all([supportApi.getMessages(convId), supportApi.listConversations(user)])
      .then(([msgs, convs]) => {
        if (!alive) return;
        const c = convs.find((x) => x.id === convId);
        if (!c) { setConvId(null); setMessages([]); return; }
        setMessages(msgs);
        setMode(c.mode || 'bot');
        setUnread(c.unread_user || 0);
        const lastBot = [...msgs].reverse().find((m) => m.sender === 'bot');
        setOffer(Boolean(lastBot?.meta?.offer_handoff) && c.mode !== 'human' && msgs[msgs.length - 1]?.id === lastBot?.id);
      })
      .catch(() => alive && setNotice('לא הצלחנו לטעון את השיחה. נסו שוב בעוד רגע.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [convId, user, ready]);

  // live: agent replies (Realtime in Supabase mode, storage events in demo)
  useEffect(() => {
    if (!convId || !ready) return undefined;
    return supportApi.subscribe(convId, (m) => {
      setMessages((list) => (list.some((x) => x.id === m.id) ? list : [...list.filter((x) => !(x._tmp && x.sender === m.sender && x.body === m.body)), m]));
      if (m.sender === 'agent') { setMode('human'); setOffer(false); if (!openRef.current) setUnread((n) => n + 1); }
      if (m.sender === 'system') setMode('human');
    });
  }, [convId, ready]);
  const openRef = useRef(open);
  useEffect(() => { openRef.current = open; if (open && convId && unread) { setUnread(0); supportApi.markRead(convId).catch(() => {}); } }, [open, convId, unread]);

  // keep the newest message in view
  // (persona-clarity: the empty hub starts at its top, so "שאלו את atlas" is the first thing seen)
  useEffect(() => { const el = listRef.current; if (!el) return; if (!messages.length) { el.scrollTop = 0; return; } el.scrollTo({ top: el.scrollHeight, behavior: messages.length > 1 ? 'smooth' : 'auto' }); }, [messages, typing, offer, open, view]);

  // open / close + focus
  // focus goes back to whatever opened the panel (a nav row, the sidebar item), else the hidden launcher's spot
  const openerRef = useRef(null);
  const close = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      const el = openerRef.current;
      if (el && el.isConnected && typeof el.focus === 'function') el.focus();
    }, 0);
  }, []);
  // opened from the navigation (openHelp)
  // panel is portalled to <body> so it also opens above full-screen sheets (channels wizard) that call openHelp({ text })
  const prefillRef = useRef('');
  const personRef = useRef(false);
  useEffect(() => onHelpOpen(({ opener, text, person }) => {
    openerRef.current = opener || null; setOpen(true); setView('chat');
    if (person) personRef.current = true;
    if (text) setDraft((d) => { const keep = d && d !== prefillRef.current; prefillRef.current = text; return keep ? d : text; });
  }), []);
  useEffect(() => { reportHelpUnread(unread); }, [unread]);
  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), isDesktop ? 60 : 260);
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    if (!isDesktop) document.documentElement.classList.add('sp-lock');
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); document.documentElement.classList.remove('sp-lock'); };
  }, [open, isDesktop, close]);
  // the guided tour owns the screen while it runs: close the chat (the launcher is hidden by CSS on html[data-tour-running])
  useEffect(() => {
    const onTour = (e) => { if (e?.detail?.active) setOpen(false); };
    window.addEventListener('atlas:tour-active', onTour);
    return () => window.removeEventListener('atlas:tour-active', onTour);
  }, []);
  // screens that hide the floating launcher (phone Today) open help from an in-page button
  useEffect(() => {
    const onOpen = () => { setOpen(true); setView('chat'); };
    // asked for before this widget had mounted (it mounts when the browser is idle, src/Layout.jsx)
    if (window.__atlasSupportPending) { window.__atlasSupportPending = false; onOpen(); }
    window.addEventListener('atlas:open-support', onOpen);
    return () => window.removeEventListener('atlas:open-support', onOpen);
  }, []);
  useEffect(() => { const el = inputRef.current; if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 132)}px`; } }, [draft]);

  const send = useCallback(async (textIn, retryOf = null) => {
    const text = String(textIn ?? draft).trim();
    if (!text || typing) return;
    if (!online) { setNotice('אין חיבור לאינטרנט. ההודעה תישלח כשהחיבור יחזור.'); return; }
    setNotice('');
    setOffer(false);
    if (!retryOf) setDraft('');
    const clientId = retryOf?._client || uid();
    const tmp = { id: `tmp-${clientId}`, _tmp: true, _client: clientId, sender: 'user', body: text, created_at: new Date().toISOString() };
    setMessages((l) => [...l.filter((x) => x.id !== retryOf?.id), tmp]);
    setTyping(mode !== 'human');
    try {
      const r = await supportApi.send({ conversationId: convId, text, clientId, page, device, user, ctx });
      if (r.duplicate) { setTyping(false); return; }
      if (!convId && r.conversation_id) setConvId(r.conversation_id);
      setMode(r.mode || 'bot');
      setMessages((l) => {
        const base = l.filter((x) => x.id !== tmp.id && !(r.user_message && x.id === r.user_message.id) && !(r.reply && x.id === r.reply.id));
        return [...base, r.user_message || { ...tmp, _tmp: false }, ...(r.reply ? [r.reply] : [])];
      });
      setOffer(Boolean(r.offer_handoff));
    } catch (e) {
      setMessages((l) => l.map((x) => (x.id === tmp.id ? { ...x, _failed: true, _error: heError(e, 'ההודעה לא נשלחה. בדקו את החיבור ונסו שוב.') } : x)));
      if (e.code === 'rate_limited') setOffer(true);
    } finally {
      setTyping(false);
    }
  }, [draft, typing, online, mode, convId, page, device, user, ctx]);

  const handoff = useCallback(async (reason = 'button') => {
    if (handingOff || mode === 'human') return;
    setHandingOff(true); setNotice('');
    try {
      const r = await supportApi.handoff({ conversationId: convId, reason, page, device, user });
      if (!convId && r.conversation_id) setConvId(r.conversation_id);
      setMode('human'); setOffer(false);
      setMessages((l) => (l.some((x) => x.id === r.system_message?.id) ? l : [...l, r.system_message]));
    } catch (e) {
      setNotice(`${heError(e, 'לא הצלחנו להעביר לנציג כרגע.')} אפשר גם לכתוב לנו בוואטסאפ ${SUPPORT_WHATSAPP_DISPLAY}, 24/7.`);
    } finally { setHandingOff(false); }
  }, [handingOff, mode, convId, page, device, user]);

  // "דברו עם נציג" from the top-bar menu (version B): open straight into a person, once the thread is ready
  useEffect(() => {
    if (!open || !personRef.current || ready !== true) return;
    personRef.current = false;
    handoff('menu');
  }, [open, ready, handoff]);

  const onLink = (path) => { navigate(path); if (!isDesktop) close(); };
  const onFeedback = async (m, v) => {
    setMessages((l) => l.map((x) => (x.id === m.id ? { ...x, feedback: v } : x)));
    try { await supportApi.feedback(m.id, v); } catch { /* keep optimistic state */ }
    if (v === 'down' && mode !== 'human') setOffer(true);
  };
  const newChat = () => { setConvId(null); setMessages([]); setMode('bot'); setOffer(false); setView('chat'); setNotice(''); setTimeout(() => inputRef.current?.focus(), 30); };
  const openHistory = async () => {
    setView('history'); setHistory(null);
    try { setHistory(await supportApi.listConversations(user)); } catch { setHistory([]); }
  };

  if (!user || !SUPPORT_ENABLED) return null;
  const name = firstName(user.full_name);
  const empty = !messages.length && !loading;
  const lastBotId = [...messages].reverse().find((m) => m.sender === 'bot' || m.sender === 'agent')?.id;

  return (
    <>
      {/* no floating launcher (APP-020): help opens from the navigation via openHelp() */}

      {open ? createPortal(
        <section id="atlas-support" className={`sp-panel ${isDesktop ? 'sp-panel--desk' : 'sp-panel--sheet'}`} role="dialog" aria-modal={!isDesktop} aria-labelledby="sp-title" dir="rtl">
          <header className="sp-head">
            <div className="sp-head-row">
              {view === 'history' ? (
                <button type="button" className="sp-icon" onClick={() => setView('chat')} aria-label="חזרה לשיחה"><ChevronLeft size={20} strokeWidth={1.75} style={{ transform: 'scaleX(-1)' }} /></button>
              ) : null}
              <div className="sp-head-text">
                <h2 id="sp-title">{view === 'history' ? 'שיחות קודמות' : 'עזרה'}</h2>
                {view === 'chat' ? (
                  mode === 'human'
                    ? <p className="sp-live"><i aria-hidden />נציג מצוות atlas בשיחה</p>
                    : <p>{empty ? 'שאלה, בקשה או בן אדם מהצוות. הכל כאן.' : 'תשובות מיידיות. נציג אנושי בלחיצה.'}</p>
                ) : null}
              </div>
              {view === 'chat' && SUPPORT_DB_READY ? (
                <>
                  <button type="button" className="sp-icon" onClick={openHistory} aria-label="שיחות קודמות"><Clock size={19} strokeWidth={1.75} /></button>
                  {messages.length ? <button type="button" className="sp-icon" onClick={newChat} aria-label="שיחה חדשה"><SquarePen size={19} strokeWidth={1.75} /></button> : null}
                </>
              ) : null}
              <button type="button" className="sp-icon" onClick={close} aria-label="סגירת העזרה"><X size={20} strokeWidth={1.75} /></button>
            </div>
            {view === 'chat' && SUPPORT_DB_READY && !empty ? (
              <div className="sp-human">
                {mode === 'human' ? (
                  <span className="sp-human-on"><Headset size={16} strokeWidth={1.75} aria-hidden />השיחה אצל נציג. התשובה תגיע לכאן.</span>
                ) : (
                  <button type="button" className="sp-human-btn" onClick={() => handoff('button')} disabled={handingOff}>
                    <Headset size={17} strokeWidth={1.75} aria-hidden />{handingOff ? 'מעבירים…' : 'שיחה עם נציג'}
                  </button>
                )}
              </div>
            ) : null}
          </header>

          {!online ? <div className="sp-offline" role="status"><WifiOff size={16} strokeWidth={1.75} aria-hidden />אין חיבור לאינטרנט. נחזור לעבוד כשהחיבור יחזור.</div> : null}

          {!SUPPORT_DB_READY ? (
            <div className="sp-body">
              <AskAtlasCard onGo={close} />
              <section className="sp-person" aria-labelledby="sp-person-t">
                <span className="sp-hello-icon" aria-hidden><MessageCircle size={22} strokeWidth={1.75} /></span>
                <div className="min-w-0">
                  <h3 id="sp-person-t">דברו עם נציג</h3>
                  <p>בן אדם מהצוות עונה בוואטסאפ, בדרך כלל באותו יום.</p>
                </div>
                <a className="sp-secondary" href={waSupportLink('שלום, צריך עזרה עם atlas')} target="_blank" rel="noreferrer">וואטסאפ</a>
              </section>
            </div>
          ) : view === 'history' ? (
            <div className="sp-body">
              {history == null ? <p className="sp-muted">טוען…</p> : history.length === 0 ? <p className="sp-muted">עוד אין שיחות קודמות.</p> : (
                <ul className="sp-hist">
                  {history.map((c) => (
                    <li key={c.id}>
                      <button type="button" onClick={() => { setConvId(c.id); setView('chat'); }} aria-current={c.id === convId ? 'true' : undefined}>
                        <span className="sp-hist-t">{c.subject || 'שיחה עם נציג'}</span>
                        <span className="sp-hist-m">{when(c.last_message_at)} · {c.mode === 'human' ? 'נציג' : 'בוט'}{c.status === 'closed' ? ' · נסגרה' : ''}{c.unread_user ? ` · ${c.unread_user} חדשות` : ''}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" className="sp-secondary" onClick={newChat}><SquarePen size={17} strokeWidth={1.75} aria-hidden />שיחה חדשה</button>
            </div>
          ) : (
            <div className="sp-body" ref={listRef} aria-live="polite" aria-busy={typing || loading}>
              {loading ? <p className="sp-muted">טוען את השיחה…</p> : null}
              {empty ? (
                <div className="sp-hello">
                  <p className="sp-hello-hi">{name ? `שלום ${name}, במה אפשר לעזור?` : 'במה אפשר לעזור?'}</p>
                  <AskAtlasCard onGo={close} />
                  <section className="sp-person" aria-labelledby="sp-person-t">
                    <span className="sp-hello-icon" aria-hidden><Headset size={22} strokeWidth={1.75} /></span>
                    <div className="min-w-0">
                      <h3 id="sp-person-t">דברו עם נציג</h3>
                      <p>בן אדם מהצוות, 24/7. הוא רואה את השאלה שלכם וממשיך מכאן.</p>
                    </div>
                    <button type="button" className="sp-secondary" onClick={() => handoff('button')} disabled={handingOff}>{handingOff ? 'מחברים…' : 'לנציג'}</button>
                  </section>
                  <h3 className="sp-guides-t">מדריכים קצרים</h3>
                  <ul className="sp-suggest" aria-label="מדריכים קצרים">
                    {suggestions.map((q) => (
                      <li key={q}><button type="button" onClick={() => send(q)}><span>{q}</span><ArrowUpLeft size={16} strokeWidth={1.75} aria-hidden /></button></li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {messages.map((m) => (
                <Msg key={m.id} m={m} last={m.id === lastBotId && !typing} onLink={onLink} onFollow={(q) => send(q)} onFeedback={onFeedback} onRetry={(x) => send(x.body, x)} />
              ))}
              {typing ? (
                <div className="sp-row sp-row--bot" aria-label="העזרה כותבת">
                  <div className="sp-who"><BotMark /><span>העזרה של atlas</span></div>
                  <div className="sp-typing" aria-hidden><i /><i /><i /></div>
                </div>
              ) : null}
              {offer && mode !== 'human' ? (
                <div className="sp-offer" role="group" aria-label="מעבר לנציג">
                  <p>רוצים שנציג מהצוות ימשיך מכאן? הוא יראה את כל השיחה.</p>
                  <div>
                    <button type="button" className="sp-primary sp-primary--sm" onClick={() => handoff('unhelpful')} disabled={handingOff}><Headset size={16} strokeWidth={1.75} aria-hidden />שיחה עם נציג</button>
                    <button type="button" className="sp-textbtn" onClick={() => setOffer(false)}>לא עכשיו</button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {notice ? <div className="sp-notice" role="alert">{notice}</div> : null}

          {SUPPORT_DB_READY && view === 'chat' ? (
            <form className="sp-compose" onSubmit={(e) => { e.preventDefault(); send(); }}>
              <label htmlFor="sp-input" className="sp-sr">כתבו שאלה</label>
              <textarea
                id="sp-input"
                ref={inputRef}
                rows={1}
                value={draft}
                maxLength={2000}
                placeholder={mode === 'human' ? 'כתבו לנציג…' : 'או כתבו כאן שאלה על איך עושים משהו…'}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && isDesktop && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
                enterKeyHint="send"
                dir="auto"
              />
              <button type="submit" className="sp-send" aria-label="שליחה" disabled={!draft.trim() || typing || !online}><ArrowUp size={20} strokeWidth={2.25} /></button>
            </form>
          ) : null}
        </section>
      , document.body) : null}
    </>
  );
}
