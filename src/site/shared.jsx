import BrandWordmark from '@/components/common/BrandWordmark';
/**
 * Building blocks shared by both site designs (A and B). Design-specific layout and CSS
 * live in src/site/design/. Everything here renders identically on the server and in the browser.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LEGAL, SUBPROCESSORS, WHATSAPP_URL, BUSINESS_LINE, legalValue } from '@/config/legal';
import { Markdown, parseMd, tocFromBlocks, mdToText, Placeholder } from '@/site/lib/md';
import { POSTS } from '@/site/content/posts';

/* ---------------- article bodies (lazy on the client, preloaded on the server) ---------------- */
const lazyBodies = import.meta.glob('./content/blog/*.md', { query: '?raw', import: 'default' });
const bodyCache = {};

export function primeBodies(map) { Object.assign(bodyCache, map); }

function readEmbeddedBody(slug) {
  if (typeof document === 'undefined') return null;
  const el = document.getElementById('site-body');
  if (!el || el.dataset.slug !== slug) return null;
  try { return JSON.parse(el.textContent); } catch { return null; }
}

export function useArticleBody(slug) {
  const [body, setBody] = useState(() => bodyCache[slug] ?? readEmbeddedBody(slug));
  useEffect(() => {
    if (body) { bodyCache[slug] = body; return undefined; }
    let alive = true;
    const loader = lazyBodies[`./content/blog/${slug}.md`];
    if (loader) loader().then((txt) => { bodyCache[slug] = txt; if (alive) setBody(txt); });
    return () => { alive = false; };
  }, [slug, body]);
  return body;
}

/* ---------------- tiny helpers ---------------- */
const HE_MONTHS = ['בינואר', 'בפברואר', 'במרץ', 'באפריל', 'במאי', 'ביוני', 'ביולי', 'באוגוסט', 'בספטמבר', 'באוקטובר', 'בנובמבר', 'בדצמבר'];
export function heDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${HE_MONTHS[m - 1]} ${y}`;
}

export function readingMinutes(md, faq = []) {
  const words = (mdToText(md) + ' ' + faq.map((f) => f.q + ' ' + f.a).join(' ')).split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.round(words / 180));
}

export function articleBlocks(md) {
  const blocks = parseMd(md);
  const first = blocks[0];
  const summary = first && first.type === 'callout' ? first.text : null;
  const rest = summary ? blocks.slice(1) : blocks;
  return { summary, blocks: rest, toc: tocFromBlocks(rest) };
}

/** Dispatch once the page content is in the DOM, so main.jsx can swap out the prerendered copy. */
export function useSiteReady(ready = true) {
  useEffect(() => {
    if (!ready || typeof window === 'undefined') return;
    const id = window.requestAnimationFrame(() => window.dispatchEvent(new Event('atlas:site-ready')));
    return () => window.cancelAnimationFrame(id);
  }, [ready]);
}

/* ---------------- shared UI ---------------- */
export function SkipLink() {
  return <a className="s-skip" href="#main">דלגו לתוכן</a>;
}

export function Wordmark() {
  return <span className="s-wm" dir="ltr"><BrandWordmark /></span>;
}

export function WhatsAppIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.42.25-.69.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35M12.05 21.79h0a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h0c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.42" />
    </svg>
  );
}

export function Breadcrumbs({ items }) {
  return (
    <nav className="s-crumbs" aria-label="פירורי לחם">
      <ol>
        {items.map((c, i) => (
          <li key={c.path}>
            {i < items.length - 1 ? <Link to={c.path}>{c.name}</Link> : <span aria-current="page">{c.name}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Toc({ items, title = 'בעמוד הזה' }) {
  if (!items.length) return null;
  return (
    <nav className="s-toc" aria-label={title}>
      <p className="s-toc-t">{title}</p>
      <ol>{items.map((t) => <li key={t.id}><a href={`#${t.id}`}>{t.text}</a></li>)}</ol>
    </nav>
  );
}

export function SubprocessorsTable() {
  return (
    <div className="s-table" role="region" aria-label="ספקי שירות" tabIndex={0}>
      <table>
        <thead><tr><th scope="col">ספק</th><th scope="col">תפקיד</th><th scope="col">מיקום</th></tr></thead>
        <tbody>
          {SUBPROCESSORS.map((s) => (
            <tr key={s.name}>
              <td><a href={s.url} target="_blank" rel="noopener noreferrer" dir="ltr">{s.name}<span className="s-sr"> (מדיניות הפרטיות שלו, נפתח בחלון חדש)</span></a></td>
              <td>{s.role}</td>
              <td>{s.where}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Markdown with the {{SUBPROCESSORS_TABLE}} block swapped for the real table. */
export function LegalBody({ md }) {
  const blocks = parseMd(md);
  const out = [];
  let buf = [];
  blocks.forEach((b, i) => {
    if (b.type === 'p' && b.text.trim() === '{{SUBPROCESSORS_TABLE}}') {
      if (buf.length) out.push(<Markdown key={`m${i}`} blocks={buf} />);
      buf = [];
      out.push(<SubprocessorsTable key={`t${i}`} />);
    } else buf.push(b);
  });
  if (buf.length) out.push(<Markdown key="mend" blocks={buf} />);
  return <>{out}</>;
}

export function FaqList({ items, headingId = 'faq', title = 'שאלות נפוצות' }) {
  return (
    <section className="s-faq" aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      {items.map((f) => (
        <details key={f.q}>
          <summary><span>{f.q}</span><i aria-hidden="true" /></summary>
          <p>{f.a}</p>
        </details>
      ))}
    </section>
  );
}

export function Sources({ items }) {
  return (
    <section className="s-sources" aria-labelledby="sources">
      <h2 id="sources">מקורות</h2>
      <ol>
        {items.map((s) => (
          <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}<span className="s-sr"> (נפתח בחלון חדש)</span></a></li>
        ))}
      </ol>
      <p className="s-note">המאמר נכתב על סמך המקורות האלה, כפי שהיו זמינים ב-18 באוקטובר 2026. הוא מידע כללי ואינו ייעוץ משפטי, מיסויי או מקצועי.</p>
    </section>
  );
}

export function relatedPosts(slug, n = 2) {
  const i = POSTS.findIndex((p) => p.slug === slug);
  const list = [];
  for (let k = 1; list.length < n && k < POSTS.length; k += 1) list.push(POSTS[(i + k) % POSTS.length]);
  return list;
}

export function WhatsAppButton({ className = '', text, children = 'כתבו לנו בוואטסאפ' }) {
  const href = text ? `${WHATSAPP_URL}?text=${encodeURIComponent(text)}` : WHATSAPP_URL;
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      <WhatsAppIcon /> <span>{children}</span><span className="s-sr"> (נפתח בוואטסאפ)</span>
    </a>
  );
}

/* ---------------- contact form: saved to contact_messages (Supabase), WhatsApp stays one tap away ---------------- */
const TOPICS = ['שאלה לפני הרשמה', 'תמיכה בשימוש', 'ביטול מנוי', 'פרטיות ומידע אישי', 'נגישות', 'אחר'];
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function ContactForm({ className = '' }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', topic: TOPICS[0], message: '', website: '' });
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ status: 'idle', error: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const waText = () => `שלום ATLAS,\nשם: ${form.name.trim()}\n${form.phone.trim() ? `טלפון: ${form.phone.trim()}\n` : ''}נושא: ${form.topic}\n\n${form.message.trim()}`;
  const submit = async (e) => {
    e.preventDefault();
    if (state.status === 'sending') return;
    const err = {};
    if (!form.name.trim()) err.name = 'כתבו שם, כדי שנדע איך לפנות אליכם.';
    if (!EMAIL_RE.test(form.email.trim())) err.email = 'כתבו אימייל תקין, כדי שנוכל לענות לכם.';
    if (!form.message.trim()) err.message = 'כתבו במה נוכל לעזור.';
    setErrors(err);
    if (Object.keys(err).length) {
      const first = document.getElementById(`cf-${Object.keys(err)[0]}`);
      if (first) first.focus();
      return;
    }
    setState({ status: 'sending', error: '' });
    try {
      const { submitPublicContact } = await import('@/lib/submitPublicContact');
      const res = await submitPublicContact({
        name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || undefined,
        subject: form.topic, message: form.message.trim(), website: form.website,
      });
      if (res.ok || res.status === 204) setState({ status: 'sent', error: '' });
      else setState({ status: 'error', error: (res.data && typeof res.data.error === 'string' && res.data.error) || 'לא הצלחנו לשלוח את ההודעה.' });
    } catch {
      setState({ status: 'error', error: 'לא הצלחנו לשלוח את ההודעה.' });
    }
  };
  if (state.status === 'sent') {
    return (
      <div className={`s-form s-form-done ${className}`} role="status">
        <p><strong>ההודעה התקבלה. תודה!</strong></p>
        <p>נחזור אליכם בהקדם לאימייל שכתבתם. ממהרים? אפשר לכתוב לנו גם בוואטסאפ.</p>
        <WhatsAppButton>לוואטסאפ</WhatsAppButton>
      </div>
    );
  }
  return (
    <form className={`s-form ${className}`} onSubmit={submit} noValidate>
      <div className="s-field">
        <label htmlFor="cf-name">שם</label>
        <input id="cf-name" name="name" autoComplete="name" maxLength={120} value={form.name} onChange={set('name')} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'cf-name-e' : undefined} />
        {errors.name && <p className="s-err" id="cf-name-e">{errors.name}</p>}
      </div>
      <div className="s-field">
        <label htmlFor="cf-email">אימייל</label>
        <input id="cf-email" name="email" type="email" inputMode="email" autoComplete="email" dir="ltr" maxLength={200} value={form.email} onChange={set('email')} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'cf-email-e' : undefined} />
        {errors.email && <p className="s-err" id="cf-email-e">{errors.email}</p>}
      </div>
      <div className="s-field">
        <label htmlFor="cf-phone">טלפון <span className="s-opt">(לא חובה)</span></label>
        <input id="cf-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" maxLength={40} value={form.phone} onChange={set('phone')} />
      </div>
      <div className="s-field">
        <label htmlFor="cf-topic">נושא</label>
        <select id="cf-topic" name="topic" value={form.topic} onChange={set('topic')}>
          {TOPICS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="s-field">
        <label htmlFor="cf-message">ההודעה</label>
        <textarea id="cf-message" name="message" rows={5} maxLength={5000} value={form.message} onChange={set('message')} aria-invalid={!!errors.message} aria-describedby={errors.message ? 'cf-message-e' : 'cf-hint'} />
        {errors.message && <p className="s-err" id="cf-message-e">{errors.message}</p>}
      </div>
      <div className="s-hp" aria-hidden="true">
        <label htmlFor="cf-website">אתר</label>
        <input id="cf-website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
      </div>
      <p className="s-hint" id="cf-hint">ההודעה נשמרת אצלנו ונענה לאימייל שכתבתם.</p>
      {state.status === 'error' && (
        <p className="s-err" role="alert">{state.error} אפשר גם <a href={`${WHATSAPP_URL}?text=${encodeURIComponent(waText())}`} target="_blank" rel="noopener noreferrer">לשלוח את אותה הודעה בוואטסאפ<span className="s-sr"> (נפתח בוואטסאפ)</span></a>.</p>
      )}
      <button type="submit" className="s-btn s-btn-primary" disabled={state.status === 'sending'} aria-busy={state.status === 'sending'}>
        <span>{state.status === 'sending' ? 'שולחים…' : 'שליחה'}</span>
      </button>
    </form>
  );
}

export function ContactDetails() {
  const rows = [
    { label: 'וואטסאפ', value: <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" dir="ltr">{LEGAL.WHATSAPP_DISPLAY}<span className="s-sr"> (נפתח בוואטסאפ)</span></a> },
    legalValue('BUSINESS_PHONE') && { label: 'טלפון', value: <a href={`tel:+972${String(LEGAL.BUSINESS_PHONE).replace(/\D/g, '').replace(/^0/, '')}`} dir="ltr">{LEGAL.BUSINESS_PHONE}</a> },
    legalValue('SUPPORT_EMAIL') && { label: 'מייל', value: <a href={`mailto:${LEGAL.SUPPORT_EMAIL}`} dir="ltr">{LEGAL.SUPPORT_EMAIL}</a> },
    legalValue('BUSINESS_ADDRESS') && { label: 'כתובת למכתבים', value: <Placeholder name="BUSINESS_ADDRESS" /> },
    BUSINESS_LINE && { label: 'פרטי העסק', value: <span>{BUSINESS_LINE}</span> },
    { label: 'טופס פנייה', value: <a href="#c-form">כתבו לנו כאן</a> },
  ].filter(Boolean);
  return (
    <dl className="s-dl">
      {rows.map((r) => (
        <div key={r.label}><dt>{r.label}</dt><dd>{r.value}</dd></div>
      ))}
    </dl>
  );
}

export const CONTACT_TOPICS = [
  { title: 'ביטול מנוי', text: 'הודעה אחת מספיקה. הפרטים ב', link: { to: '/cancellation', label: 'מדיניות ביטול עסקה' } },
  { title: 'פרטיות ומידע אישי', text: 'עיון, תיקון ומחיקה של מידע. הפרטים ב', link: { to: '/privacy', label: 'מדיניות הפרטיות' } },
  { title: 'נגישות', text: 'משהו לא נגיש לכם? הפרטים ב', link: { to: '/accessibility', label: 'הצהרת הנגישות' } },
];
