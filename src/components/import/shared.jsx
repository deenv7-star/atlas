/**
 * ייבוא מתחם: the pieces both versions share (A conversational, B cards). The flow logic lives in useImportFlow so the
 * two versions differ only in how they look and pace the conversation, never in what they ask or save.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Loader2, ClipboardPaste, Images, Link2, Globe, Plus, Camera, X } from 'lucide-react';
import { importComplex, shrinkImage, ImportError } from '@/lib/import/api';
import { savePlan } from '@/lib/import/save';
import { linkKind, linkHint, linkOk, extractLinks, summaryChips, foundRows, questionsFor, applyAnswer, QUESTIONS, KIND_CHOICES, TIMES_IN, TIMES_OUT, MAX_LINKS } from '@/lib/import/model';
import { phoneValid, kindInfo } from '@/lib/onboarding/v2/model';
import './import.css';

const DRAFT_KEY = (uid) => `atlas.import.v1.${uid || 'local'}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── the flow (same for A and B) ─────────────────────────────────────────────────────────────── */

export function useImportFlow(user) {
  const [s, setS] = useState(() => {
    try { const d = JSON.parse(sessionStorage.getItem(DRAFT_KEY(user?.id)) || 'null'); if (d?.v === 1 && d.draft) return { ...d, phase: d.phase === 'reading' || d.phase === 'save' ? 'found' : d.phase }; } catch { /* ignore */ }
    return { v: 1, phase: 'start', links: [''], text: '', images: [], draft: null, missing: [], queue: [], qi: 0, skipped: [], error: '', sources: [] };
  });
  const set = useCallback((patch) => setS((cur) => ({ ...cur, ...(typeof patch === 'function' ? patch(cur) : patch) })), []);
  useEffect(() => {
    try { const { images, ...keep } = s; sessionStorage.setItem(DRAFT_KEY(user?.id), JSON.stringify({ ...keep, images: [] })); } catch { /* quota */ }
  }, [s, user?.id]);

  const run = useCallback(async ({ fallback = false } = {}) => {
    const urls = fallback ? [] : s.links.map((l) => l.trim()).filter(linkOk);
    const text = fallback ? s.text : '';
    const images = fallback ? s.images : [];
    set({ phase: 'reading', error: '', mode: fallback ? 'fallback' : 'links', kinds: urls.map((u) => linkKind(u).kind) });
    try {
      const t0 = Date.now();
      const data = await importComplex({ urls, text, images });
      const left = 1400 - (Date.now() - t0);
      if (left > 0) await wait(left);
      const queue = questionsFor(data.result, data.missing).map((q) => q.id);
      set({ phase: 'found', draft: data.result, missing: data.missing || [], queue, qi: 0, sources: data.result?.sources || [] });
    } catch (e) {
      const err = e instanceof ImportError ? e : new ImportError('edge_error');
      set({ phase: fallback ? 'fallback' : 'error', error: err.message, sources: err.sources || [] });
    }
  }, [s.links, s.text, s.images, set]);

  const answer = useCallback((id, value) => set((cur) => ({ draft: applyAnswer(cur.draft || {}, id, value), qi: cur.qi + 1 })), [set]);
  const skip = useCallback((id) => set((cur) => ({ skipped: [...new Set([...cur.skipped, id])], qi: cur.qi + 1 })), [set]);
  const back = useCallback(() => set((cur) => (cur.qi > 0 ? { qi: cur.qi - 1 } : { phase: 'found' })), [set]);
  /** "לתקן" on a found row: ask that one question now, then come back to the preview. */
  const fix = useCallback((rowId) => {
    const id = rowId === 'location' ? null : rowId === 'unit_count' ? 'unit_count' : QUESTIONS[rowId] ? rowId : null;
    set((cur) => (id ? { phase: 'ask', queue: [id], qi: 0, fixing: true } : {}));
  }, [set]);
  const confirm = useCallback(() => set((cur) => {
    const queue = cur.fixing ? questionsFor(cur.draft, cur.missing).map((q) => q.id).filter((id) => !cur.skipped.includes(id) && !(cur.draft?.confidence?.[id] === 'high')) : cur.queue;
    return queue.length ? { phase: 'ask', queue, qi: 0, fixing: false } : { phase: 'save', fixing: false };
  }), [set]);
  const manual = useCallback(() => set({ phase: 'ask', draft: { confidence: {}, photos: [], sources: [] }, queue: questionsFor(null).map((q) => q.id), qi: 0, mode: 'manual' }), [set]);
  const reset = useCallback(() => { try { sessionStorage.removeItem(DRAFT_KEY(user?.id)); } catch { /* ignore */ } setS({ v: 1, phase: 'start', links: [''], text: '', images: [], draft: null, missing: [], queue: [], qi: 0, skipped: [], error: '', sources: [] }); }, [user?.id]);

  // finished the questions (or a fix): back to the preview after a fix, else save
  useEffect(() => {
    if (s.phase === 'ask' && s.qi >= s.queue.length) set(s.fixing ? { phase: 'found', fixing: false } : { phase: 'save' });
  }, [s.phase, s.qi, s.queue.length, s.fixing, set]);

  const q = s.phase === 'ask' ? QUESTIONS[s.queue[s.qi]] : null;
  return { s, set, run, answer, skip, back, fix, confirm, manual, reset, q };
}

/** Runs the save plan once; each line gets its check when its write finished. */
export function useSave(user, s, active) {
  const plan = useRef(null);
  if (active && !plan.current) plan.current = savePlan(user, s.draft, { skipped: s.skipped });
  const steps = plan.current || [];
  const [at, setAt] = useState(0);
  const [error, setError] = useState('');
  const running = useRef(false);
  const go = useCallback(async (from) => {
    if (running.current || !plan.current) return;
    running.current = true; setError('');
    for (let i = from; i < steps.length; i += 1) {
      setAt(i);
      const t0 = Date.now();
      try { await steps[i].run(); } catch (e) {
        running.current = false;
        if (typeof console !== 'undefined') console.warn('import save', steps[i].id, e?.message);
        setError('השמירה נעצרה באמצע. שום דבר לא נמחק. נסו שוב.');
        return;
      }
      const left = 650 - (Date.now() - t0);
      if (left > 0) await wait(left);
    }
    setAt(steps.length); running.current = false;
  }, [steps]);
  useEffect(() => { if (active) go(0); }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
  return { steps, at, error, done: active && steps.length > 0 && at >= steps.length, retry: () => go(at) };
}

/* ── pieces ─────────────────────────────────────────────────────────────────────────────────── */

const SRC_BADGE = { booking: 'B', airbnb: 'A', site: <Globe aria-hidden />, booking_other: 'B', airbnb_other: 'A' };

export function LinkInput({ value, onChange, id, autoFocus, inputRef, label = 'קישור למתחם' }) {
  const k = linkKind(value).kind;
  const ok = linkOk(value);
  const hint = linkHint(value);
  const paste = async () => {
    try {
      const t = await navigator.clipboard.readText();
      const found = extractLinks(t);
      onChange(found[0] || t.trim());
    } catch { inputRef?.current?.focus(); }
  };
  return (
    <div>
      <label htmlFor={id} className="im-sr">{label}</label>
      <div className={`im-link${ok ? ' is-ok' : ''}`}>
        <span className={`im-src${ok ? ' is-ok' : ''}`} aria-hidden>{SRC_BADGE[k] || <Link2 aria-hidden style={{ width: 20, height: 20 }} />}</span>
        <input ref={inputRef} id={id} type="url" inputMode="url" autoComplete="off" autoCapitalize="off" spellCheck={false} dir="ltr"
          placeholder="הדביקו כאן קישור" value={value} autoFocus={autoFocus}
          onChange={(e) => { const v = e.target.value; const found = /\s/.test(v.trim()) ? extractLinks(v) : []; onChange(found[0] || v); }}
          aria-describedby={`${id}-hint`} onBlur={(e) => { e.target.scrollLeft = 0; }} />
        {!value ? (
          <button type="button" className="im-paste im-press" onClick={paste}><ClipboardPaste aria-hidden />הדבקה</button>
        ) : (
          <button type="button" className="im-paste im-press" onClick={() => { onChange(''); inputRef?.current?.focus(); }} aria-label="ניקוי הקישור"><X aria-hidden /></button>
        )}
      </div>
      <p id={`${id}-hint`} className={`im-hint${value && !ok ? ' is-bad' : ''}`} aria-live="polite">{hint}</p>
    </div>
  );
}

export function SourceBadges() {
  return (
    <div className="im-srcs" aria-label="מאיפה אפשר לייבא">
      <span><Check aria-hidden />Booking.com</span>
      <span><Check aria-hidden />Airbnb</span>
      <span><Check aria-hidden />האתר שלכם</span>
    </div>
  );
}

export function LinksEditor({ s, set }) {
  const refs = useRef([]);
  const setLink = (i, v) => set((cur) => { const links = [...cur.links]; links[i] = v; return { links }; });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {s.links.map((l, i) => (
        <LinkInput key={i} id={`im-link-${i}`} value={l} onChange={(v) => setLink(i, v)} inputRef={(el) => { refs.current[i] = el; }} autoFocus={i > 0} label={i ? `קישור נוסף ${i}` : 'קישור למתחם'} />
      ))}
      {s.links.length < MAX_LINKS && linkOk(s.links[s.links.length - 1]) ? (
        <button type="button" className="im-quiet is-ind im-press" style={{ alignSelf: 'flex-start' }} onClick={() => set((cur) => ({ links: [...cur.links, ''] }))}>
          <Plus aria-hidden style={{ width: 18, height: 18 }} />עוד קישור (למשל גם Airbnb)
        </button>
      ) : null}
    </div>
  );
}

const READ_STEPS = {
  booking: 'פותחים את המודעה ב-Booking',
  airbnb: 'פותחים את המודעה ב-Airbnb',
  site: 'קוראים את האתר שלכם',
  fallback: 'קוראים את מה ששלחתם',
};
/** While the import runs: honest, generic stages (no invented counts), one lights up every ~2.5s. */
export function ReadingList({ kinds = [], mode }) {
  const first = mode === 'fallback' ? [READ_STEPS.fallback] : [...new Set(kinds)].map((k) => READ_STEPS[k]).filter(Boolean);
  const lines = [...(first.length ? first : [READ_STEPS.site]), 'אוספים תמונות ויחידות', 'מוצאים שעות, כללים וחניה', 'מסדרים הכל בשבילכם'];
  const [n, setN] = useState(0);
  useEffect(() => { const t = setInterval(() => setN((x) => Math.min(lines.length - 1, x + 1)), 2500); return () => clearInterval(t); }, [lines.length]);
  return (
    <ul className="im-reading" aria-live="polite">
      {lines.map((l, i) => (
        <li key={l} className={`${i <= n ? 'is-on' : ''}${i < n ? ' is-done' : ''}`}>
          <span className="im-st" aria-hidden>{i < n ? <Check /> : i === n ? <Loader2 className="im-spin" /> : null}</span>{l}
        </li>
      ))}
    </ul>
  );
}

export function PreviewCard({ draft, onFix, eyebrow = 'מצאנו', limit = 6 }) {
  const [all, setAll] = useState(false);
  const thumbs = (draft?.thumbs || []).filter(Boolean);
  const chips = summaryChips(draft);
  const rows = foundRows(draft);
  const shown = all ? rows : rows.slice(0, limit);
  return (
    <article className="im-card" aria-label="מה מצאנו">
      {thumbs.length ? (
        <div className={`im-mosaic${thumbs.length < 3 ? ' is-1' : ''}`}>
          {thumbs.slice(0, thumbs.length < 3 ? 1 : 3).map((t, i) => <img key={i} src={t} alt={i === 0 ? `תמונה של ${draft.business_name || 'המתחם'}` : ''} loading="eager" decoding="async" />)}
          {draft.photos?.length ? <span className="im-count"><Images aria-hidden />{draft.photos.length} תמונות</span> : null}
        </div>
      ) : null}
      <div className="im-card-body">
        <p className="im-eyebrow">{eyebrow}</p>
        <h2>{draft?.business_name || 'המתחם שלכם'}</h2>
        {chips.length ? <div className="im-sumchips">{chips.map((c) => <span key={c.id}>{c.text}</span>)}</div> : null}
        <ul className="im-rows">
          {shown.map((r) => (
            <li key={r.id}>
              <button type="button" className="im-row" onClick={() => onFix?.(r.id)} aria-label={`${r.title}: ${r.value}. ${QUESTIONS[r.id] || r.id === 'unit_count' ? 'לתיקון' : ''}`}>
                <span className="im-tick" aria-hidden><Check /></span>
                <span className="im-txt"><small>{r.title}</small><span>{r.value}</span></span>
                {r.check ? <span className="im-check">בדקו</span> : (QUESTIONS[r.id] ? <span className="im-fix" aria-hidden>תיקון</span> : null)}
              </button>
            </li>
          ))}
        </ul>
        {rows.length > limit ? (
          <div className="im-more"><button type="button" className="im-quiet is-ind im-press" onClick={() => setAll((x) => !x)}>{all ? 'פחות' : `עוד ${rows.length - limit} פרטים`}</button></div>
        ) : null}
      </div>
    </article>
  );
}

/** One question, by kind. Single-choice answers on tap; the rest call onReady(value|null) so the version shows its button. */
export function QuestionInput({ q, draft, onAnswer, onReady, compact = false }) {
  const [v, setV] = useState(() => initialValue(q, draft));
  const [other, setOther] = useState(false);
  useEffect(() => { setV(initialValue(q, draft)); setOther(false); }, [q?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { onReady?.({ value: readyValue(q, v, other), button: needsButton(q) || (q?.kind === 'choice' && other) }); }, [v, other, q?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!q) return null;
  const k = kindInfo(draft?.property_type || 'zimmer_complex');

  if (q.kind === 'text') return <input className="im-input" id={`im-q-${q.id}`} aria-label={q.title} value={v || ''} onChange={(e) => setV(e.target.value)} placeholder={q.placeholder} autoFocus enterKeyHint="next" onKeyDown={(e) => { if (e.key === 'Enter' && String(v || '').trim()) onAnswer(v); }} />;
  if (q.kind === 'phone') {
    const bad = v && !phoneValid(v);
    return (
      <div>
        <input className="im-input is-ltr" id={`im-q-${q.id}`} aria-label={q.title} type="tel" inputMode="tel" autoComplete="tel" value={v || ''} onChange={(e) => setV(e.target.value)} placeholder="050-0000000" autoFocus enterKeyHint="done" aria-invalid={bad || undefined}
          onKeyDown={(e) => { if (e.key === 'Enter' && v && phoneValid(v)) onAnswer(v.trim()); }} />
        <p className="im-hint">{bad ? 'בדקו את המספר: 10 ספרות, מתחיל ב-05' : 'רק אורחים עם הזמנה יקבלו אותו'}</p>
      </div>
    );
  }
  if (q.kind === 'count') {
    const n = Number(v) || 1;
    return (
      <div className="im-step" role="group" aria-label={q.title}>
        <button type="button" className="im-press" onClick={() => setV(Math.min(30, n + 1))} aria-label="עוד יחידה" disabled={n >= 30}>+</button>
        <output aria-live="polite">{n}<small>{n === 1 ? k.unit : k.units}</small></output>
        <button type="button" className="im-press" onClick={() => setV(Math.max(1, n - 1))} aria-label="יחידה אחת פחות" disabled={n <= 1}>−</button>
      </div>
    );
  }
  if (q.kind === 'kind') {
    return (
      <div className="im-choices" role="radiogroup" aria-label={q.title}>
        {KIND_CHOICES.map((c) => (
          <button key={c.value} type="button" role="radio" aria-checked={v === c.value} className="im-choice im-press" onClick={() => { setV(c.value); onAnswer(c.value); }}>
            <span><b>{c.label}</b>{c.line ? <small>{c.line}</small> : null}</span><span className="im-dot" aria-hidden>{v === c.value ? <Check /> : null}</span>
          </button>
        ))}
      </div>
    );
  }
  if (q.kind === 'times') {
    const t = v || {};
    const pick = (key, val) => setV({ ...t, [key]: val });
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 14 : 20 }}>
        <div><span className="im-label" id="im-in">כניסה</span><div className="im-chips" role="radiogroup" aria-labelledby="im-in">{TIMES_IN.map((x) => <button key={x} type="button" role="radio" aria-checked={t.in === x} className="im-chip im-press" onClick={() => pick('in', x)}>{x}</button>)}</div></div>
        <div><span className="im-label" id="im-out">יציאה</span><div className="im-chips" role="radiogroup" aria-labelledby="im-out">{TIMES_OUT.map((x) => <button key={x} type="button" role="radio" aria-checked={t.out === x} className="im-chip im-press" onClick={() => pick('out', x)}>{x}</button>)}</div></div>
      </div>
    );
  }
  if (q.kind === 'rules') {
    const sel = Array.isArray(v) ? v : [];
    const toggle = (x) => setV(sel.includes(x) ? sel.filter((y) => y !== x) : [...sel, x]);
    return (
      <div className="im-chips" role="group" aria-label={q.title}>
        {[...new Set([...q.choices, ...sel])].map((x) => <button key={x} type="button" aria-pressed={sel.includes(x)} className="im-chip is-he im-press" onClick={() => toggle(x)}>{sel.includes(x) ? <Check aria-hidden style={{ width: 18, height: 18 }} /> : null}{x}</button>)}
      </div>
    );
  }
  // choice (+ "other")
  return (
    <div className="im-choices" role="radiogroup" aria-label={q.title}>
      {q.choices.map((c) => (
        <button key={c.value} type="button" role="radio" aria-checked={v === c.value && !other} className="im-choice im-press" onClick={() => { setOther(false); setV(c.value); onAnswer(c.value); }}>
          <span><b>{c.label}</b>{c.line ? <small>{c.line}</small> : null}</span><span className="im-dot" aria-hidden>{v === c.value && !other ? <Check /> : null}</span>
        </button>
      ))}
      {q.other ? (
        other ? (
          <textarea className="im-area" style={{ minHeight: 110 }} aria-label={q.title} autoFocus value={typeof v === 'string' && !q.choices.some((c) => c.value === v) ? v : ''} onChange={(e) => setV(e.target.value)} placeholder="כתבו במילים שלכם" />
        ) : (
          <button type="button" role="radio" aria-checked={false} className="im-choice im-press" onClick={() => { setOther(true); setV(''); }}><span><b>{q.other}</b></span><span className="im-dot" aria-hidden /></button>
        )
      ) : null}
    </div>
  );
}

function initialValue(q, d) {
  if (!q) return null;
  switch (q.kind) {
    case 'text': return d?.[q.id] || '';
    case 'phone': return d?.contact?.whatsapp || d?.contact?.phone || '';
    case 'count': return d?.unit_count || kindInfo(d?.property_type || 'zimmer').count || 1;
    case 'kind': return d?.property_type || null;
    case 'times': return { in: d?.check_in_time || '15:00', out: d?.check_out_time || '11:00' };
    case 'rules': return Array.isArray(d?.house_rules) ? d.house_rules : [];
    default: return d?.[q.id] || null;
  }
}
function readyValue(q, v, other) {
  if (!q) return null;
  switch (q.kind) {
    case 'text': return String(v || '').trim() ? v.trim() : null;
    case 'phone': return v && phoneValid(v) ? v.trim() : null;
    case 'count': return Number(v) || 1;
    case 'times': return v?.in && v?.out ? v : null;
    case 'rules': return Array.isArray(v) ? v : [];
    case 'kind': return v || null;
    default: return other ? (String(v || '').trim() || null) : (v || null);
  }
}
/** Kinds that need an explicit "save" tap (single choices answer on tap). */
export const needsButton = (q) => q && !['kind', 'choice'].includes(q.kind);

/** Screenshots / paste fallback. */
export function FallbackInputs({ s, set }) {
  const fileRef = useRef(null);
  const add = async (files) => {
    const list = [...(files || [])].filter((f) => /^image\//.test(f.type)).slice(0, 4 - s.images.length);
    const out = [];
    for (const f of list) { try { out.push(await shrinkImage(f)); } catch { /* skip */ } }
    set((cur) => ({ images: [...cur.images, ...out].slice(0, 4) }));
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <span className="im-label" id="im-shots-l">צילומי מסך מהמודעה או מהאתר (עד 4)</span>
        <div className="im-shots" aria-labelledby="im-shots-l">
          {s.images.map((src, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img src={src} alt={`צילום מסך ${i + 1}`} />
              <button type="button" className="im-icon" style={{ position: 'absolute', top: 4, left: 4, width: 32, height: 32, aspectRatio: 'auto', outline: 0 }} aria-label={`הסרת צילום ${i + 1}`} onClick={() => set((cur) => ({ images: cur.images.filter((_, j) => j !== i) }))}><X aria-hidden style={{ width: 16, height: 16 }} /></button>
            </div>
          ))}
          {s.images.length < 4 ? <button type="button" className="im-press" onClick={() => fileRef.current?.click()}><Camera aria-hidden />הוספה</button> : null}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      </div>
      <div>
        <label className="im-label" htmlFor="im-paste-text">או הדביקו את התיאור והתקנון</label>
        <textarea id="im-paste-text" className="im-area" value={s.text} onChange={(e) => set({ text: e.target.value.slice(0, 12000) })} placeholder="למשל: 4 צימרים עם ג׳קוזי, כניסה 15:00, יציאה 11:00, חניה ליד כל צימר…" />
      </div>
    </div>
  );
}

export function SaveList({ steps, at, error, onRetry }) {
  return (
    <div>
      <ul className="im-save" aria-live="polite">
        {steps.map((st, i) => {
          const cls = i < at ? 'is-done' : i === at && !error ? 'is-run' : 'is-wait';
          return (
            <li key={st.id} className={cls}>
              <span className="im-st" aria-hidden>{i < at ? <Check /> : i === at && !error ? <Loader2 className="im-spin" /> : null}</span>
              <span><b>{st.title}</b>{st.detail ? <small>{st.detail}</small> : null}</span>
            </li>
          );
        })}
      </ul>
      {error ? <div style={{ marginTop: 16 }}><p className="im-hint is-bad" role="alert">{error}</p><button type="button" className="im-btn im-press" onClick={onRetry}>לנסות שוב</button></div> : null}
    </div>
  );
}

/** What the import found, in one line, for chat bubbles / the done screen. */
export function foundSentence(d) {
  const parts = summaryChips(d).filter((c) => c.id !== 'rating').map((c) => c.text);
  return parts.length ? parts.join(', ') : '';
}

export function useOnce(fn) { const done = useRef(false); return useCallback((...a) => { if (done.current) return; done.current = true; fn(...a); }, [fn]); }
export { useMemo };
