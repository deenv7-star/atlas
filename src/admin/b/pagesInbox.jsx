/* Admin B — "פניות מהאתר": messages sent from the public contact form, reply by WhatsApp or email. */
import { useMemo, useState } from 'react';
import { Search, MessageCircle, Mail, Check, Archive, RotateCcw, Phone } from 'lucide-react';
import { Head } from './Shell';
import { BError } from './pagesCustomers';
import { useAdmin } from '../hooks';
import { Pill, Skel, date } from '../ui';
import { relTime, fmtPhone } from '../metrics';
import { ADMIN_DEMO } from '../config';
import { useContactMessages, useContactStatus } from '../contactApi';

const FILTERS = [['new', 'חדשות'], ['inbox', 'הכל'], ['archived', 'ארכיון']];
const STATE = { NEW: { label: 'חדשה', tone: 'brand' }, READ: { label: 'נקראה', tone: 'gray' }, REPLIED: { label: 'ענינו', tone: 'mint' }, ARCHIVED: { label: 'בארכיון', tone: 'gray' } };
const PLAN = { starter: 'מתחיל', pro: 'מקצועי', business: 'עסקי' };
const initials = (s) => String(s || '').replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(Boolean).map((x) => x[0]).join('').slice(0, 2) || '·';
const waDigits = (p) => { const d = String(p || '').replace(/\D/g, ''); return !d ? '' : d.startsWith('972') ? d : d.startsWith('0') ? `972${d.slice(1)}` : d; };
const subjectOf = (s) => { const m = /^upgrade:(\w+)/.exec(String(s || '')); return m ? `בקשת שדרוג לחבילת ${PLAN[m[1]] || m[1]}` : s || ''; };
const clock = (iso) => new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

function Card({ m, me }) {
  const set = useContactStatus();
  const first = String(m.name || '').split(' ')[0];
  const subject = subjectOf(m.subject);
  const wa = waDigits(m.phone);
  const sender = (me?.full_name || '').split(' ')[0] || 'צוות';
  const waText = `שלום${first ? ` ${first}` : ''}, כאן ${sender} מ-atlas. קיבלנו את הפנייה שלך מהאתר${subject ? ` ("${subject.slice(0, 60)}")` : ''}.`;
  const mail = `mailto:${m.email}?subject=${encodeURIComponent(`atlas · ${subject || 'הפנייה שלך מהאתר'}`)}&body=${encodeURIComponent(`שלום${first ? ` ${first}` : ''},\n\n`)}`;
  const replied = () => { if (m.status === 'NEW' || m.status === 'READ') set.mutate({ id: m.id, status: 'REPLIED', silent: true }); };
  const isNew = m.status === 'NEW';
  return (
    <li className={`b-tile b-cm${isNew ? ' is-new' : ''}`}>
      <article aria-labelledby={`cm-${m.id}`}>
        <header className="b-cm-head">
          <span className={`b-av b-av--lg${isNew ? ' b-av--brand' : ''}`} aria-hidden>{initials(m.name)}</span>
          <div className="b-cm-who">
            <h2 id={`cm-${m.id}`}>{m.name}</h2>
            <p className="b-cm-contact">
              <span className="adm-ltr">{m.email}</span>
              {m.phone ? <><span aria-hidden> · </span><span className="adm-ltr">{fmtPhone(m.phone)}</span></> : null}
            </p>
          </div>
          <div className="b-cm-side">
            <time dateTime={m.created_at} title={`${date(m.created_at, { weekday: true, year: true })} · ${clock(m.created_at)}`}>{relTime(m.created_at)}</time>
            <Pill tone={STATE[m.status]?.tone}>{STATE[m.status]?.label || m.status}</Pill>
          </div>
        </header>
        {subject ? <p className="b-cm-subject">{subject}</p> : null}
        <p className="b-cm-body">{m.message}</p>
        <p className="b-cm-when b-muted b-small">{date(m.created_at, { weekday: true })} · {clock(m.created_at)}</p>
        <div className="b-cm-actions">
          {wa ? <a className="b-btn b-cm-btn" href={`https://wa.me/${wa}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noreferrer" onClick={replied}><MessageCircle size={17} strokeWidth={1.75} aria-hidden />וואטסאפ</a> : null}
          <a className="b-btn b-cm-btn" href={mail} onClick={replied}><Mail size={17} strokeWidth={1.75} aria-hidden />מייל</a>
          {m.phone ? <a className="b-btn b-cm-btn" href={`tel:${String(m.phone).replace(/[^\d+]/g, '')}`}><Phone size={17} strokeWidth={1.75} aria-hidden />חיוג</a> : null}
          <span className="b-cm-gap" />
          {m.status === 'ARCHIVED'
            ? <button type="button" className="b-btn b-cm-btn" onClick={() => set.mutate({ id: m.id, status: 'READ' })} disabled={set.isPending}><RotateCcw size={17} strokeWidth={1.75} aria-hidden />החזרה מהארכיון</button>
            : (
              <>
                {isNew
                  ? <button type="button" className="b-btn b-cm-btn" onClick={() => set.mutate({ id: m.id, status: 'READ' })} disabled={set.isPending}><Check size={17} strokeWidth={2} aria-hidden />סימון כנקרא</button>
                  : <button type="button" className="b-btn b-cm-btn b-cm-quiet" onClick={() => set.mutate({ id: m.id, status: 'NEW' })} disabled={set.isPending}>סימון כלא נקרא</button>}
                <button type="button" className="b-btn b-cm-btn b-cm-quiet" onClick={() => set.mutate({ id: m.id, status: 'ARCHIVED' })} disabled={set.isPending} aria-label={`העברה לארכיון: הפנייה של ${m.name}`}><Archive size={17} strokeWidth={1.75} aria-hidden />ארכיון</button>
              </>
            )}
        </div>
      </article>
    </li>
  );
}

export function Inbox() {
  const { me } = useAdmin();
  const { data, isLoading, error } = useContactMessages();
  const [filter, setFilter] = useState('new');
  const [q, setQ] = useState('');
  const all = data || [];
  const fresh = all.filter((m) => m.status === 'NEW').length;
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return all
      .filter((m) => (filter === 'new' ? m.status === 'NEW' : filter === 'archived' ? m.status === 'ARCHIVED' : m.status !== 'ARCHIVED'))
      .filter((m) => !s || [m.name, m.email, m.phone, subjectOf(m.subject), m.message].some((x) => String(x || '').toLowerCase().includes(s)));
  }, [all, filter, q]);

  if (error?.missing) {
    return (
      <>
        <Head title="פניות מהאתר" sub="הודעות מטופס יצירת הקשר" />
        <section className="b-tile"><h2>הפניות יופיעו כאן אחרי עדכון מסד הנתונים</h2><p className="b-muted">צריך להשלים עדכון אחד במסד הנתונים.</p></section>
      </>
    );
  }
  const empty = q.trim() ? 'לא מצאנו פניות שמתאימות לחיפוש.'
    : filter === 'new' ? (all.length ? 'אין פניות חדשות. כל הפניות נקראו.' : 'עוד לא הגיעו פניות מהאתר. כשמישהו ימלא את טופס יצירת הקשר, הפנייה תופיע כאן.')
      : filter === 'archived' ? 'אין פניות בארכיון.' : 'אין פניות להצגה.';
  return (
    <>
      <Head title="פניות מהאתר" sub={isLoading ? ' ' : fresh ? `${fresh} ${fresh === 1 ? 'פנייה חדשה' : 'פניות חדשות'} מטופס יצירת הקשר` : 'אין פניות חדשות'} />
      <BError error={error} />
      <div className="b-cm-bar">
        <div className="b-pills b-cm-pills" role="group" aria-label="סינון פניות">
          {FILTERS.map(([k, l]) => (
            <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}{k === 'new' && fresh ? <span className="b-pill-n"> ({fresh})</span> : null}</button>
          ))}
        </div>
        <label className="b-search b-cm-search">
          <Search size={18} strokeWidth={1.75} aria-hidden />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש שם, אימייל או טקסט" aria-label="חיפוש פניות" />
        </label>
      </div>
      {isLoading ? <div className="b-cm-list"><Skel h={180} r={24} /><Skel h={180} r={24} style={{ marginTop: 12 }} /></div>
        : rows.length === 0 ? <p className="b-tile b-muted b-cm-empty" role="status">{empty}</p>
          : <ul className="b-cm-list">{rows.map((m) => <Card key={m.id} m={m} me={me} />)}</ul>}
      {ADMIN_DEMO ? <p className="b-muted b-small b-cm-foot">מצב הדגמה: פניות לדוגמה, נשמרות רק בדפדפן הזה.</p> : null}
    </>
  );
}
