/* Admin B — "תמיכה": live inbox of help conversations, reply as a human, open / close. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MessageCircle, Mail, Bell, BellOff, CheckCircle2, RotateCcw, ArrowUp, Bot, Headset, ChevronLeft, Clock } from 'lucide-react';
import { Head } from './Shell';
import { useAdmin } from '../hooks';
import { Pill, Skel } from '../ui';
import { relTime, fmtPhone } from '../metrics';
import { SUPPORT_ADMIN_READY, ADMIN_DEMO } from '../config';
import { useSupportList, useSupportMessages, useSupportActions, useSupportLive, setSupportActor } from '../supportApi';
import Markdown from '@/support/Markdown';
import '@/support/support.css';

const FILTERS = [['waiting', 'ממתינות לנציג'], ['open', 'פתוחות'], ['closed', 'סגורות'], ['all', 'הכל']];
const MODE = { human: { label: 'נציג', tone: 'lilac' }, bot: { label: 'בוט', tone: 'gray' } };
const REASON = { button: 'לחץ "דבר עם נציג"', keyword: 'ביקש נציג', unhelpful: 'הבוט לא עזר', bot_error: 'תקלה בבוט', agent: 'נציג נכנס לשיחה' };
const CHANNEL = { BOOKING_COM: 'Booking.com', AIRBNB: 'Airbnb', GOOGLE: 'Google', OUTLOOK: 'Outlook', ICAL: 'iCal' };
const PLAN = { starter: 'מתחיל', pro: 'מקצועי', business: 'עסקי' };
const initials = (s) => String(s || '').replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(Boolean).map((x) => x[0]).join('').slice(0, 2) || '·';
const waDigits = (p) => { const d = String(p || '').replace(/\D/g, ''); return !d ? '' : d.startsWith('972') ? d : d.startsWith('0') ? `972${d.slice(1)}` : d; };
const time = (iso) => new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

function useNotify() {
  const supported = typeof window !== 'undefined' && 'Notification' in window;
  const [perm, setPerm] = useState(supported ? Notification.permission : 'unsupported');
  const ask = async () => { if (supported) setPerm(await Notification.requestPermission()); };
  const show = useCallback((title, body, tag) => {
    if (!supported || Notification.permission !== 'granted' || document.visibilityState === 'visible') return;
    try { new Notification(title, { body, tag, lang: 'he', dir: 'rtl' }); } catch { /* some browsers need a SW */ }
  }, [supported]);
  return { supported, perm, ask, show };
}

function Thread({ conv, onBack }) {
  const { me } = useAdmin();
  const msgs = useSupportMessages(conv.id);
  const { reply, setStatus, markRead } = useSupportActions();
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => { setSupportActor((me?.full_name || '').split(' ')[0] || me?.email?.split('@')[0]); }, [me]);
  useEffect(() => { if (conv.unread_admin > 0) markRead.mutate(conv.id); }, [conv.id, conv.unread_admin]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs.data?.length, conv.id]);
  useEffect(() => { const el = inputRef.current; if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 160)}px`; } }, [draft]);
  const ctx = conv.context || {};
  const phone = conv.user_phone;
  const wa = waDigits(phone);
  const first = (conv.user_name || '').split(' ')[0];
  const waText = `שלום${first ? ` ${first}` : ''}, כאן ${(me?.full_name || '').split(' ')[0] || 'צוות'} מ-ATLAS לגבי הפנייה שלכם בעזרה: "${(conv.subject || '').slice(0, 80)}"`;
  const submit = (e) => {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || reply.isPending) return;
    reply.mutate({ convId: conv.id, body }, { onSuccess: () => setDraft('') });
  };
  return (
    <section className="b-tile b-sup-thread" aria-labelledby="sup-t">
      <header className="b-sup-thead">
        <button type="button" className="b-btn b-btn--sm b-btn--icon b-sup-back" onClick={onBack} aria-label="חזרה לרשימה"><ChevronLeft size={18} strokeWidth={1.75} style={{ transform: 'scaleX(-1)' }} /></button>
        <span className="b-av b-av--lg" aria-hidden>{initials(conv.user_name || conv.user_email)}</span>
        <div className="b-sup-who">
          <h2 id="sup-t">{conv.user_name || conv.user_email || 'לקוח'}</h2>
          <p>{conv.org_name || ctx.org_name || '—'}{conv.plan_key || ctx.plan ? ` · ${PLAN[conv.plan_key || ctx.plan] || conv.plan_key || ctx.plan}` : ''}{ctx.units != null ? ` · ${ctx.units} יחידות` : ''}{ctx.channels?.length ? ` · ${ctx.channels.map((c) => CHANNEL[c] || c).join(', ')}` : ''}</p>
        </div>
        <div className="b-sup-actions">
          {wa ? <a className="b-btn b-btn--sm" href={`https://wa.me/${wa}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noreferrer"><MessageCircle size={16} strokeWidth={1.75} aria-hidden />וואטסאפ {fmtPhone(phone)}</a> : null}
          {conv.user_email ? <a className="b-btn b-btn--sm" href={`mailto:${conv.user_email}?subject=${encodeURIComponent('ATLAS · הפנייה שלכם')}`}><Mail size={16} strokeWidth={1.75} aria-hidden />מייל</a> : null}
          {conv.status === 'open'
            ? <button type="button" className="b-btn b-btn--sm" onClick={() => setStatus.mutate({ convId: conv.id, status: 'closed' })} disabled={setStatus.isPending}><CheckCircle2 size={16} strokeWidth={1.75} aria-hidden />סגירה</button>
            : <button type="button" className="b-btn b-btn--sm" onClick={() => setStatus.mutate({ convId: conv.id, status: 'open' })} disabled={setStatus.isPending}><RotateCcw size={16} strokeWidth={1.75} aria-hidden />פתיחה מחדש</button>}
        </div>
      </header>
      {conv.handoff_at ? <p className="b-sup-handoff"><Headset size={15} strokeWidth={1.75} aria-hidden />הועבר לנציג {relTime(conv.handoff_at)} · {REASON[conv.handoff_reason] || ''}{conv.page_path ? ` · נפתח במסך ${conv.page_path}` : ''}</p> : null}
      <div className="b-sup-msgs" ref={listRef} aria-live="polite">
        {msgs.isLoading ? <Skel h={80} /> : (msgs.data || []).map((m) => (
          <div key={m.id} className={`b-sup-m b-sup-m--${m.sender}`}>
            {m.sender === 'system' ? <p className="b-sup-sys">{m.body}</p> : (
              <>
                <div className="b-sup-meta">
                  {m.sender === 'bot' ? <><Bot size={14} strokeWidth={1.75} aria-hidden />בוט</> : m.sender === 'agent' ? <><Headset size={14} strokeWidth={1.75} aria-hidden />{m.author_name || 'נציג'}</> : (conv.user_name || 'לקוח')}
                  <span>· {time(m.created_at)}</span>
                  {m.sender === 'bot' && m.meta?.confidence ? <span className={`b-sup-conf b-sup-conf--${m.meta.confidence}`}>{m.meta.confidence === 'high' ? 'בטוח' : m.meta.confidence === 'medium' ? 'חלקי' : 'לא בטוח'}</span> : null}
                  {m.feedback ? <span className={`b-sup-conf b-sup-conf--${m.feedback === 'up' ? 'high' : 'low'}`}>{m.feedback === 'up' ? 'עזר' : 'לא עזר'}</span> : null}
                </div>
                <div className="b-sup-body">{m.sender === 'user' ? m.body : <Markdown text={m.body} />}</div>
              </>
            )}
          </div>
        ))}
      </div>
      <form className="b-sup-reply" onSubmit={submit}>
        <label htmlFor="sup-reply" className="adm-sr">תשובה ללקוח</label>
        <textarea id="sup-reply" ref={inputRef} rows={2} value={draft} maxLength={8000} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e); }}
          placeholder={`תשובה ל${first || 'לקוח'}. היא תופיע אצלו בחלון העזרה מיד.`} />
        <button type="submit" className="b-btn b-btn--primary" disabled={!draft.trim() || reply.isPending}><ArrowUp size={18} strokeWidth={2.25} aria-hidden />{reply.isPending ? 'שולחים…' : 'שליחה'}</button>
      </form>
      <p className="b-sup-hint">Ctrl+Enter לשליחה · התשובה נשמרת ביומן הפעולות · השיחה עוברת לנציג ולא לבוט</p>
    </section>
  );
}

export function Support() {
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState('waiting');
  const [q, setQ] = useState('');
  const list = useSupportList(filter);
  const counts = useSupportList('waiting');
  const notify = useNotify();
  const selected = params.get('c');
  const onEvent = useCallback((row) => {
    if (row?.sender === 'system' || (row?.sender === 'user')) notify.show('ATLAS · פנייה בתמיכה', String(row.body || '').slice(0, 120), row.conversation_id);
  }, [notify.show]); // eslint-disable-line react-hooks/exhaustive-deps
  useSupportLive(onEvent);
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (list.data || []).filter((c) => !s || [c.user_name, c.user_email, c.org_name, c.subject, c.last_message_preview].some((x) => String(x || '').toLowerCase().includes(s)));
  }, [list.data, q]);
  // the open thread comes from the 'all' list so it stays visible after a filter change
  const all = useSupportList('all');
  const conv = (all.data || []).find((c) => c.id === selected) || rows.find((c) => c.id === selected) || null;
  useEffect(() => { if (!selected && rows[0] && window.matchMedia('(min-width: 1024px)').matches) setParams({ c: rows[0].id }, { replace: true }); }, [selected, rows, setParams]);

  if (!SUPPORT_ADMIN_READY || list.error?.missing) {
    return (
      <>
        <Head title="תמיכה" sub="שיחות מהעזרה באפליקציה" />
        <section className="b-tile"><h2>התמיכה תופעל אחרי עדכון מסד הנתונים</h2><p className="b-muted">צריך להריץ את 020_support.sql ולפרוס את הפונקציה support-chat.</p></section>
      </>
    );
  }
  const waiting = counts.data?.length || 0;
  return (
    <>
      <Head
        title="תמיכה"
        sub={waiting ? `${waiting} ${waiting === 1 ? 'שיחה ממתינה' : 'שיחות ממתינות'} לנציג` : 'אין שיחות שממתינות לנציג'}
        actions={notify.supported ? (
          notify.perm === 'granted'
            ? <span className="b-sup-notif"><Bell size={16} strokeWidth={1.75} aria-hidden />התראות בדפדפן פעילות</span>
            : <button type="button" className="b-btn" onClick={notify.ask} disabled={notify.perm === 'denied'}>{notify.perm === 'denied' ? <BellOff size={17} strokeWidth={1.75} aria-hidden /> : <Bell size={17} strokeWidth={1.75} aria-hidden />}{notify.perm === 'denied' ? 'התראות חסומות בדפדפן' : 'התראה על פנייה חדשה'}</button>
        ) : null}
      />
      <div className={`b-sup${conv ? ' has-thread' : ''}`}>
        <section className="b-tile b-sup-list" aria-label="שיחות">
          <div className="b-pills b-sup-pills" role="tablist" aria-label="סינון שיחות">
            {FILTERS.map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}>{l}{k === 'waiting' && waiting ? <span className="b-pill-n">({waiting})</span> : null}</button>
            ))}
          </div>
          <label className="b-search b-sup-search">
            <Search size={18} strokeWidth={1.75} aria-hidden />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש לקוח, עסק או שאלה" aria-label="חיפוש שיחות" />
          </label>
          {list.isLoading ? <div className="b-pad"><Skel h={64} /><Skel h={64} style={{ marginTop: 8 }} /></div> : rows.length === 0 ? (
            <p className="b-muted b-sup-empty">{filter === 'waiting' ? 'אין שיחות שממתינות לנציג. כשלקוח ילחץ "דבר עם נציג", השיחה תופיע כאן מיד.' : 'אין שיחות בסינון הזה.'}</p>
          ) : (
            <ul className="b-sup-rows">
              {rows.map((c) => (
                <li key={c.id}>
                  <Link to={`/admin/support?c=${c.id}`} className="b-sup-row" aria-current={c.id === selected ? 'true' : undefined}>
                    <span className={`b-av${c.mode === 'human' && c.unread_admin ? ' b-av--brand' : ''}`} aria-hidden>{initials(c.user_name || c.user_email)}</span>
                    <span className="b-sup-row-main">
                      <span className="b-sup-row-top"><b>{c.user_name || c.user_email || 'לקוח'}</b><time>{relTime(c.last_message_at)}</time></span>
                      <span className="b-sup-row-sub">{c.org_name || '—'}</span>
                      <span className="b-sup-row-prev">{c.last_sender === 'agent' ? 'אתם: ' : c.last_sender === 'bot' ? 'בוט: ' : ''}{c.last_message_preview || c.subject}</span>
                    </span>
                    <span className="b-sup-row-side">
                      {c.unread_admin ? <span className="b-sup-unread" aria-label={`${c.unread_admin} חדשות`}>{c.unread_admin}</span> : null}
                      {c.status === 'closed' ? <Pill tone="gray">סגורה</Pill> : <Pill tone={MODE[c.mode]?.tone}>{MODE[c.mode]?.label}</Pill>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="b-sup-foot"><Clock size={14} strokeWidth={1.75} aria-hidden />מתעדכן בזמן אמת{ADMIN_DEMO ? ' · מצב הדגמה: שיחות מהעזרה בדפדפן הזה' : ''}</p>
        </section>
        {conv ? <Thread key={conv.id} conv={conv} onBack={() => setParams({}, { replace: true })} /> : (
          <section className="b-tile b-sup-none"><p className="b-muted">בחרו שיחה מהרשימה.</p></section>
        )}
      </div>
    </>
  );
}
