/**
 * One sheet per kind of connection, all in the same calm full-screen pattern as the calendar wizard:
 * one task per screen, numbered steps, big buttons, plain words (no "API", no "webhook" on screen).
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ExternalLink, Check, RefreshCw, Lock, MessageCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { icalExportUrl } from '@/lib/real/edge';
import { DB_FEATURES } from '@/config/dbFeatures';
import { submitPublicContact } from '@/lib/submitPublicContact';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { UnitPhoto } from '@/components/app/atoms';
import { Sheet, CopyBig } from '@/components/channels/ConnectParts';
import { SUPPORT, DEMO_EXPORT } from '@/components/channels/channelKit';
import ConnectWizard from '@/components/channels/ConnectWizard';
import BrandTile from './BrandTile';
import { ICAL_SITES, INTEGRATIONS_V1 } from './catalog';
import { IS_DEMO, issuedPaymentIds } from './useIntegrations';
import { createPageUrl } from '@/utils';

function Steps({ items }) {
  return <ol className="ch-list ih-steps">{items.map((t, i) => <li key={i}>{t}</li>)}</ol>;
}

function Lead({ item, title, sub }) {
  return (
    <div className="ih-lead">
      <BrandTile item={item} size={64} />
      <h1 className="ch-h1" tabIndex={-1}>{title}</h1>
      {sub ? <p className="ch-sub">{sub}</p> : null}
    </div>
  );
}

/** Pick a unit first when the account has more than one (calendar links are per unit). */
function UnitPicker({ item, units, onPick, onClose }) {
  return (
    <Sheet title={`חיבור ${item.name}`} onClose={onClose} label={`חיבור ${item.name}`} stepKey="units">
      <h1 className="ch-h1" tabIndex={-1}>לאיזו יחידה?</h1>
      <p className="ch-sub">לכל יחידה יש יומן משלה. אחר כך אפשר לחבר גם את השאר.</p>
      <ul className="ch-picks">
        {units.map((u) => (
          <li key={u.id}>
            <button type="button" className="ch-pick ch-press" onClick={() => onPick(u)}>
              <UnitPhoto property={u} className="h-14 w-14" rounded="rounded-[16px]" />
              <span className="ch-pick-t"><b>{u.name}</b></span>
              <ChevronLeft className="ch-pick-go" strokeWidth={2} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

export function CalendarConnect({ item, units, orgId, syncs, onClose, onDone }) {
  const [unit, setUnit] = useState(units.length === 1 ? units[0] : null);
  if (!units.length) {
    return (
      <Sheet title={`חיבור ${item.name}`} onClose={onClose} stepKey="nounits"
        footer={<button type="button" className="ch-btn is-primary ch-press" onClick={onClose}>הבנתי</button>}>
        <Lead item={item} title="קודם מוסיפים יחידה" sub="יומן מתחבר ליחידה מסוימת. הוסיפו יחידה בהגדרות, ואז חזרו לכאן." />
      </Sheet>
    );
  }
  if (!unit) return <UnitPicker item={item} units={units} onPick={setUnit} onClose={onClose} />;
  return (
    <ConnectWizard property={unit} orgId={orgId} existing={syncs} initialChannel={item.channel}
      site={item.site ? ICAL_SITES[item.site] : null} onClose={onClose} onDone={onDone} />
  );
}

const EXPORT_APPS = {
  google: { label: 'Google', steps: ['במחשב, פתחו את Google Calendar.', 'בצד, ליד "יומנים אחרים", לחצו על +.', 'בחרו "מכתובת URL".', 'הדביקו את הקישור ולחצו "הוספת יומן".'], open: 'https://calendar.google.com/calendar/r/settings/addbyurl' },
  apple: { label: 'iPhone', steps: ['פתחו הגדרות ← יומן ← חשבונות.', 'לחצו "הוספת חשבון" ← "אחר".', 'בחרו "הוספת יומן מנוי".', 'הדביקו את הקישור ולחצו "הבא", ואז "שמירה".'] },
  outlook: { label: 'Outlook', steps: ['ב-Outlook פתחו את היומן.', 'לחצו "הוספת יומן" ← "הרשמה מהאינטרנט".', 'הדביקו את הקישור ותנו לו שם, למשל atlas.', 'לחצו "ייבוא".'] },
};

export function CalendarExport({ item, units, onClose }) {
  const [unit, setUnit] = useState(units.length === 1 ? units[0] : null);
  const [app, setApp] = useState('google');
  if (!units.length) return <CalendarConnect item={item} units={[]} onClose={onClose} />;
  if (!unit) return <UnitPicker item={item} units={units} onPick={setUnit} onClose={onClose} />;
  const link = icalExportUrl(unit) || (DB_FEATURES.realCore ? '' : DEMO_EXPORT);
  const A = EXPORT_APPS[app];
  return (
    <Sheet title="היומן בטלפון" onClose={onClose} onBack={units.length > 1 ? () => setUnit(null) : null} stepKey={`exp-${unit.id}`}
      footer={<button type="button" className="ch-btn is-primary ch-press" onClick={onClose}>סיימתי</button>}>
      <h1 className="ch-h1" tabIndex={-1}>היומן של "<bdi>{unit.name}</bdi>" בטלפון שלכם</h1>
      <p className="ch-sub">אחרי החיבור תראו את ההזמנות ביומן הרגיל של הטלפון. הוא מתעדכן לבד.</p>
      <div className="ih-seg" role="tablist" aria-label="איזה יומן">
        {Object.entries(EXPORT_APPS).map(([k, v]) => (
          <button key={k} type="button" role="tab" aria-selected={app === k} className={`ih-seg-b ch-press ${app === k ? 'is-on' : ''}`} onClick={() => setApp(k)}>{v.label}</button>
        ))}
      </div>
      <p className="ih-step-h">1. העתיקו את הקישור</p>
      <CopyBig value={link} label="העתיקו את הקישור" />
      <p className="ih-step-h">2. הדביקו אותו ב-{A.label}</p>
      <Steps items={A.steps} />
      {A.open ? <a className="ch-btn is-ghost ch-press" href={A.open} target="_blank" rel="noopener noreferrer">פתחו את Google Calendar<ExternalLink strokeWidth={2} aria-hidden /></a> : null}
      <p className="ch-note">ביומן יופיע רק "תפוס", בלי שמות ופרטי אורחים. Google ו-Apple מתעדכנים בקצב שלהם, לפעמים אחרי כמה שעות.</p>
    </Sheet>
  );
}

/** "בקשו חיבור": a real request in the admin inbox (contact_messages), same flow as plan requests. */
function useRequest(item, user) {
  const key = `atlas-int-req-${item.id}`;
  const [sent, setSent] = useState(() => { try { return !!sessionStorage.getItem(key); } catch { return false; } });
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    try {
      const { ok, data } = await submitPublicContact({
        name: user?.full_name || user?.organization_name || user?.email || 'לקוח atlas',
        email: user?.email || '',
        phone: user?.phone || '',
        subject: `integration:${item.id}`,
        message: `בקשה לחיבור: ${item.name}. ארגון: ${user?.organization_name || '—'} (${user?.organization_id || '—'}).`,
      });
      if (!ok) throw new Error(data?.error || '');
      try { sessionStorage.setItem(key, '1'); } catch { /* ignore */ }
      setSent(true);
      atlasToastApi.success('הבקשה נשמרה. נעדכן אתכם כשהחיבור ייפתח.');
    } catch (e) {
      atlasToastApi.error(e?.message || 'לא הצלחנו לשמור את הבקשה. נסו שוב בעוד רגע.');
    } finally { setBusy(false); }
  };
  return { sent, busy, send };
}

const META_NEEDS = {
  'wa-business': ['אפליקציית WhatsApp Business בטלפון (לא WhatsApp רגיל).', 'המספר שהאורחים כבר מכירים.', 'התחברות אחת לפייסבוק של העסק, כשנפתח את החיבור.'],
  messenger: ['דף פייסבוק של העסק.', 'התחברות אחת לפייסבוק, כשנפתח את החיבור.'],
  instagram: ['חשבון אינסטגרם עסקי.', 'התחברות אחת, כשנפתח את החיבור.'],
};

export function InfoSheet({ item, user, onClose }) {
  const nav = useNavigate();
  const { sent, busy, send } = useRequest(item, user);
  const builtin = item.flow === 'builtin';
  const footer = builtin ? (
    <button type="button" className="ch-btn is-primary ch-press" onClick={() => { onClose(); nav(createPageUrl('Today')); }}>להודעות המוכנות</button>
  ) : (
    <>
      <button type="button" className={`ch-btn ${sent ? 'is-done' : 'is-primary'} ch-press`} onClick={send} disabled={busy || sent} aria-disabled={busy || sent}>
        {sent ? <><Check strokeWidth={2.5} aria-hidden />ביקשתם. נעדכן אתכם</> : busy ? <><RefreshCw className="ch-spin" strokeWidth={2} aria-hidden />שומרים…</> : 'אני רוצה את החיבור הזה'}
      </button>
      <button type="button" className="ch-btn is-ghost ch-press" onClick={onClose}>סגירה</button>
    </>
  );
  return (
    <Sheet title={item.name} onClose={onClose} stepKey={`info-${item.id}`} footer={footer}>
      <Lead item={item} title={item.name} sub={item.gain} />
      <div className="ih-status-line">
        <span className={`ih-pill is-${builtin ? 'live' : item.status}`}>{builtin ? 'פעיל' : item.status === 'meta' ? 'בקרוב' : 'לפי בקשה'}</span>
      </div>
      {item.why ? <p className="ch-note">{item.why}</p> : null}
      {META_NEEDS[item.id] ? (
        <>
          <p className="ih-step-h">מה תצטרכו כשזה ייפתח</p>
          <Steps items={META_NEEDS[item.id]} />
        </>
      ) : null}
      {!builtin ? <p className="ch-hint ih-left">לחיצה על הכפתור שומרת בקשה אצלנו. שום דבר לא נשלח לאורחים ושום דבר לא מחויב.</p> : null}
    </Sheet>
  );
}

const PROVIDER_OF = { morning: 'MORNING', icount: 'ICOUNT' };
const KEY_GUIDE = {
  morning: {
    need: 'במורנינג צריך מסלול Best ומעלה. במסלולים הזולים יותר אין אפשרות חיבור.',
    steps: ['היכנסו למורנינג במחשב.', 'לחצו על השם שלכם למעלה ← "כלים למפתחים" ← "מפתחות API".', 'לחצו על + , כתבו את השם atlas ואשרו.', 'יופיעו שני קודים: "מזהה מפתח" ו"מפתח סודי". העתיקו את שניהם לכאן.'],
    open: 'https://app.greeninvoice.co.il/settings/developers/api',
    help: 'https://www.greeninvoice.co.il/help-center/generating-api-key/',
    fields: [{ k: 'client_id', label: 'מזהה מפתח' }, { k: 'client_secret', label: 'מפתח סודי', secret: true }],
    warn: 'את המפתח הסודי מורנינג מציגה פעם אחת בלבד. העתיקו אותו מיד.',
  },
  icount: {
    need: 'צריך משתמש iCount עם הרשאה להפיק מסמכים.',
    steps: ['היכנסו ל-iCount במחשב.', 'פתחו הגדרות ← אוטומציה ← לשונית "טוקנים".', 'צרו טוקן חדש בלי תאריך תפוגה.', 'העתיקו את הקוד שהתקבל לכאן.'],
    open: 'https://app.icount.co.il/admin/settings_automation.php#tabs-api-tokens',
    help: '',
    fields: [{ k: 'token', label: 'הקוד מ-iCount', secret: true }],
    warn: '',
  },
};

/** Recent paid payments without a document: issue one in a tap. */
function ReceiptList({ issueReceipt, orgId }) {
  const [rows, setRows] = useState(null);
  const [done, setDone] = useState(new Set());
  const [busy, setBusy] = useState('');
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [pays, issued] = await Promise.all([
          base44.entities.Payment.filter(orgId ? { org_id: orgId } : {}, '-paid_date', 30),
          issuedPaymentIds(),
        ]);
        if (!live) return;
        setRows((pays || []).filter((p) => String(p.status).toUpperCase() === 'PAID' && !issued.has(p.id)).slice(0, 5));
      } catch { if (live) setRows([]); }
    })();
    return () => { live = false; };
  }, [orgId]);
  const issue = async (p) => {
    setBusy(p.id);
    try {
      const r = await issueReceipt(p.id);
      if (!r?.ok) throw new Error(r?.message || 'לא הצלחנו להפיק. נסו שוב.');
      setDone((s) => new Set(s).add(p.id));
      atlasToastApi.success(r.demo ? 'חשבון דוגמה: לא הופק מסמך אמיתי.' : `הקבלה הופקה${r.doc_number ? ` (מספר ${r.doc_number})` : ''}.`);
    } catch (e) { atlasToastApi.error(e.message); } finally { setBusy(''); }
  };
  if (rows === null) return <p className="ch-hint ih-left">טוענים תשלומים…</p>;
  if (!rows.length) return <p className="ch-note">אין כרגע תשלומים ששולמו ומחכים לקבלה.</p>;
  return (
    <ul className="ih-rec">
      {rows.map((p) => (
        <li key={p.id}>
          <span className="ih-rec-t"><b className="tabular">₪{Number(p.amount || 0).toLocaleString('he-IL')}</b><small>{p.guest_name || p.description || 'תשלום'}{p.paid_date ? ` · ${p.paid_date}` : ''}</small></span>
          {done.has(p.id)
            ? <span className="ih-pill is-connected"><Check strokeWidth={2.5} aria-hidden />הופקה</span>
            : <button type="button" className="ih-mini ch-press" onClick={() => issue(p)} disabled={busy === p.id}>{busy === p.id ? 'מפיקים…' : 'הפקת קבלה'}</button>}
        </li>
      ))}
    </ul>
  );
}

export function InvoiceConnect({ item, integ, orgId, onClose }) {
  const provider = PROVIDER_OF[item.id];
  const G = KEY_GUIDE[item.id];
  const current = integ.has(provider);
  const other = !current && integ.items.find((x) => ['MORNING', 'ICOUNT'].includes(x.provider));
  const [step, setStep] = useState(current ? 'connected' : 'intro');
  const [vals, setVals] = useState({});
  const [docType, setDocType] = useState('receipt');
  const [sendEmail, setSendEmail] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const ready = G.fields.every((f) => String(vals[f.k] || '').trim().length >= 8);

  const submit = async () => {
    setErr(''); setBusy(true);
    try {
      const r = await integ.connect(provider, { credentials: vals, doc_type: docType, send_email: sendEmail });
      if (!r?.ok) { setErr(r?.message || 'לא הצלחנו לחבר. בדקו את הקודים ונסו שוב.'); return; }
      setVals({}); setStep('done');
    } catch (e) { setErr(e?.message || 'לא הצלחנו לחבר. נסו שוב בעוד דקה.'); } finally { setBusy(false); }
  };

  let body; let footer;
  if (!INTEGRATIONS_V1) {
    body = (
      <>
        <Lead item={item} title={item.name} sub={item.gain} />
        <div className="ih-status-line"><span className="ih-pill is-soon">בקרוב</span></div>
        <p className="ch-note">החיבור כמעט מוכן ונפתח בקרוב. עד אז atlas שומר את מספרי הקבלות שהפקתם בתוכנה שלכם.</p>
      </>
    );
    footer = <button type="button" className="ch-btn is-primary ch-press" onClick={onClose}>הבנתי</button>;
  } else if (step === 'intro') {
    body = (
      <>
        <Lead item={item} title={`חיבור ${item.name}`} sub="אחרי החיבור, בכל תשלום ששולם תוכלו להפיק קבלה בלחיצה. הקבלה יוצאת מהתוכנה שלכם ונשלחת לאורח במייל." />
        <p className="ih-step-h">מה צריך</p>
        <p className="ch-sub ih-tight">{G.need}</p>
        {other ? <p className="ch-note">כבר מחוברת תוכנת חשבוניות אחרת. חיבור {item.name} יחליף אותה.</p> : null}
        <p className="ih-safe"><Lock strokeWidth={2} aria-hidden />הקודים נשמרים מוצפנים ולא מוצגים שוב. אפשר לנתק בכל רגע.</p>
      </>
    );
    footer = (
      <>
        <button type="button" className="ch-btn is-primary ch-press" onClick={() => setStep('guide')}>בואו נתחיל</button>
        <button type="button" className="ch-btn is-ghost ch-press" onClick={onClose}>לא עכשיו</button>
      </>
    );
  } else if (step === 'guide') {
    body = (
      <>
        <p className="ch-kicker">שלב 1 מתוך 2</p>
        <h1 className="ch-h1" tabIndex={-1}>מעתיקים קוד מ{item.name}</h1>
        <Steps items={G.steps} />
        {G.warn ? <p className="ch-note">{G.warn}</p> : null}
      </>
    );
    footer = (
      <>
        <a className="ch-btn is-primary ch-press" href={G.open} target="_blank" rel="noopener noreferrer" onClick={() => window.setTimeout(() => setStep('form'), 400)}>פתחו את {item.name}<ExternalLink strokeWidth={2} aria-hidden /></a>
        <button type="button" className="ch-btn is-ghost ch-press" onClick={() => setStep('form')}>כבר העתקתי, הלאה</button>
      </>
    );
  } else if (step === 'form') {
    body = (
      <>
        <p className="ch-kicker">שלב 2 מתוך 2</p>
        <h1 className="ch-h1" tabIndex={-1}>הדביקו כאן</h1>
        {G.fields.map((f) => (
          <div className="ch-paste" key={f.k}>
            <label className="ch-label" htmlFor={`ih-${f.k}`}>{f.label}</label>
            <div className="ch-field"><input id={`ih-${f.k}`} dir="ltr" autoComplete="off" autoCapitalize="off" spellCheck={false} type={f.secret ? 'password' : 'text'}
              value={vals[f.k] || ''} onChange={(e) => { setVals((v) => ({ ...v, [f.k]: e.target.value })); setErr(''); }} placeholder="הדביקו כאן" /></div>
          </div>
        ))}
        <fieldset className="ih-radio">
          <legend className="ch-label">איזו קבלה להפיק?</legend>
          <label className={docType === 'receipt' ? 'is-on' : ''}><input type="radio" name="dt" checked={docType === 'receipt'} onChange={() => setDocType('receipt')} /><span><b>קבלה</b><small>לעוסק פטור</small></span></label>
          <label className={docType === 'invoice_receipt' ? 'is-on' : ''}><input type="radio" name="dt" checked={docType === 'invoice_receipt'} onChange={() => setDocType('invoice_receipt')} /><span><b>חשבונית מס-קבלה</b><small>לעוסק מורשה או חברה</small></span></label>
        </fieldset>
        <label className="ih-check"><input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} /><span>לשלוח את הקבלה לאורח במייל, כשיש לו מייל</span></label>
        {err ? <div className="ch-err" role="alert"><b>לא הצלחנו לחבר</b><p>{err}</p></div> : null}
      </>
    );
    footer = (
      <>
        <button type="button" className={`ch-btn is-primary ch-press ${busy ? 'is-busy' : ''}`} onClick={submit} disabled={!ready || busy}>
          {busy ? <><RefreshCw className="ch-spin" strokeWidth={2} aria-hidden />בודקים מול {item.name}…</> : `חברו את ${item.name}`}
        </button>
        {!ready && !busy ? <p className="ch-hint">הדביקו את הקוד כדי להמשיך</p> : null}
      </>
    );
  } else {
    const c = integ.has(provider);
    body = (
      <>
        {step === 'done' ? (
          <div className="ch-done">
            <span className="ch-done-mark" aria-hidden><Check strokeWidth={3} /></span>
            <h1 className="ch-h1" tabIndex={-1}>{item.name} מחובר <span aria-hidden>✓</span></h1>
            <p className="ch-sub">מעכשיו, בכל תשלום ששולם, לחיצה על "הפקת קבלה" מוציאה קבלה מ{item.name}.</p>
          </div>
        ) : (
          <Lead item={item} title={`${item.name} מחובר`} sub={c?.config?.doc_type === 'invoice_receipt' ? 'מפיקים חשבונית מס-קבלה' : 'מפיקים קבלה'} />
        )}
        {IS_DEMO ? <p className="ch-note">חשבון דוגמה: שום דבר לא נשלח למורנינג או ל-iCount.</p> : null}
        <p className="ih-step-h">תשלומים שמחכים לקבלה</p>
        <ReceiptList issueReceipt={integ.issueReceipt} orgId={orgId} />
      </>
    );
    footer = (
      <>
        <button type="button" className="ch-btn is-primary ch-press" onClick={onClose}>סיום</button>
        <button type="button" className="ch-btn is-ghost ch-press" onClick={async () => { await integ.disconnect(provider); atlasToastApi.success(`${item.name} נותק.`); onClose(); }}>ניתוק {item.name}</button>
      </>
    );
  }
  return (
    <Sheet title={item.name} onClose={onClose} stepKey={`inv-${step}`} progress={step === 'guide' ? [1, 2] : step === 'form' ? [2, 2] : null}
      onBack={step === 'guide' ? () => setStep('intro') : step === 'form' ? () => setStep('guide') : null} footer={footer}>
      {body}
    </Sheet>
  );
}

const HOOK_GUIDE = {
  zapier: ['ב-Zapier לחצו "Create" ← "Zap".', 'בתור התחלה בחרו "Webhooks by Zapier" ← "Catch Hook".', 'העתיקו את הכתובת ש-Zapier נותן.', 'הדביקו אותה כאן ולחצו "חברו".'],
  make: ['ב-Make צרו תרחיש חדש (Scenario).', 'בתור התחלה בחרו "Webhooks" ← "Custom webhook" ← "Add".', 'העתיקו את הכתובת ש-Make נותן.', 'הדביקו אותה כאן ולחצו "חברו".'],
  n8n: ['ב-n8n פתחו תהליך חדש.', 'הוסיפו צעד "Webhook" ובחרו POST.', 'העתיקו את הכתובת (Production URL).', 'הדביקו אותה כאן ולחצו "חברו".'],
};
const EVENTS = [
  { k: 'booking.created', label: 'הזמנה חדשה' },
  { k: 'booking.updated', label: 'שינוי בהזמנה' },
  { k: 'booking.cancelled', label: 'ביטול הזמנה' },
  { k: 'payment.paid', label: 'תשלום ששולם' },
  { k: 'lead.created', label: 'פנייה חדשה' },
];

export function AutomationConnect({ item, integ, onClose }) {
  const current = integ.has('WEBHOOK');
  const [step, setStep] = useState(current ? 'connected' : 'intro');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState(EVENTS.map((e) => e.k));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [secret, setSecret] = useState('');
  const okUrl = /^https:\/\/[^\s]+\.[^\s]+/i.test(url.trim());

  const submit = async () => {
    setErr(''); setBusy(true);
    try {
      const r = await integ.connect('WEBHOOK', { credentials: { url: url.trim() }, events });
      if (!r?.ok) { setErr(r?.message || 'לא הצלחנו לחבר. בדקו את הכתובת ונסו שוב.'); return; }
      setSecret(r.signing_secret || ''); setStep('done');
    } catch (e) { setErr(e?.message || 'לא הצלחנו לחבר. נסו שוב בעוד דקה.'); } finally { setBusy(false); }
  };

  let body; let footer;
  if (!INTEGRATIONS_V1) {
    body = (<><Lead item={item} title={item.name} sub={item.gain} /><div className="ih-status-line"><span className="ih-pill is-soon">בקרוב</span></div><p className="ch-note">החיבור כמעט מוכן ונפתח בקרוב.</p></>);
    footer = <button type="button" className="ch-btn is-primary ch-press" onClick={onClose}>הבנתי</button>;
  } else if (step === 'intro' || step === 'form') {
    body = (
      <>
        <Lead item={item} title={`חיבור ${item.name}`} sub={`אחרי החיבור, כל הזמנה חדשה, תשלום או פנייה יעברו ל${item.name}, ומשם לאן שתבחרו.`} />
        <p className="ih-step-h">איך מחברים</p>
        <Steps items={HOOK_GUIDE[item.id]} />
        <div className="ch-paste">
          <label className="ch-label" htmlFor="ih-hook">הכתובת מ-{item.name}</label>
          <div className={`ch-field ${url ? (okUrl ? 'is-ok' : 'is-bad') : ''}`}><input id="ih-hook" dir="ltr" inputMode="url" autoComplete="off" spellCheck={false} value={url} onChange={(e) => { setUrl(e.target.value); setErr(''); }} placeholder="https://" /></div>
          {url && !okUrl ? <p className="ch-msg is-bad"><span>הכתובת צריכה להתחיל ב-https.</span></p> : null}
        </div>
        <fieldset className="ih-events">
          <legend className="ch-label">מה לשלוח?</legend>
          {EVENTS.map((e) => (
            <label key={e.k} className="ih-check"><input type="checkbox" checked={events.includes(e.k)} onChange={(ev) => setEvents((s) => ev.target.checked ? [...s, e.k] : s.filter((x) => x !== e.k))} /><span>{e.label}</span></label>
          ))}
        </fieldset>
        <p className="ih-safe"><Lock strokeWidth={2} aria-hidden />נשלחים פרטי ההזמנה, כולל שם וטלפון של האורח, רק לכתובת שהדבקתם.</p>
        {err ? <div className="ch-err" role="alert"><b>לא הצלחנו לחבר</b><p>{err}</p></div> : null}
      </>
    );
    footer = (
      <>
        <button type="button" className="ch-btn is-primary ch-press" onClick={submit} disabled={!okUrl || !events.length || busy}>
          {busy ? <><RefreshCw className="ch-spin" strokeWidth={2} aria-hidden />שולחים בדיקה…</> : `חברו את ${item.name}`}
        </button>
        {!okUrl && !busy ? <p className="ch-hint">הדביקו את הכתובת כדי להמשיך</p> : null}
      </>
    );
  } else {
    const c = integ.has('WEBHOOK');
    body = (
      <>
        <div className="ch-done">
          <span className="ch-done-mark" aria-hidden><Check strokeWidth={3} /></span>
          <h1 className="ch-h1" tabIndex={-1}>מחובר <span aria-hidden>✓</span></h1>
          <p className="ch-sub">{step === 'done' ? `שלחנו הודעת בדיקה ל${item.name}. מעכשיו כל אירוע שבחרתם יישלח לשם.` : `נשלח אל ${c?.hint || ''}.`}</p>
        </div>
        {secret ? (<><p className="ih-step-h">קוד אימות (לא חובה)</p><p className="ch-sub ih-tight">אם תרצו לוודא שההודעות באמת מגיעות מאיתנו, שמרו את הקוד. הוא מוצג עכשיו בלבד.</p><CopyBig value={secret} label="העתיקו את קוד האימות" /></>) : null}
        {c?.last_error ? <p className="ch-err" role="alert">{c.last_error}</p> : null}
      </>
    );
    footer = (
      <>
        <button type="button" className="ch-btn is-primary ch-press" onClick={onClose}>סיום</button>
        <button type="button" className="ch-btn is-ghost ch-press" onClick={async () => { const r = await integ.testWebhook(); r?.ok ? atlasToastApi.success('הבדיקה נשלחה.') : atlasToastApi.error(r?.message || 'הבדיקה לא הגיעה.'); }}>שלחו בדיקה</button>
        <button type="button" className="ch-btn is-ghost ch-press" onClick={async () => { await integ.disconnect('WEBHOOK'); atlasToastApi.success('החיבור נותק.'); onClose(); }}>ניתוק</button>
      </>
    );
  }
  return <Sheet title={item.name} onClose={onClose} stepKey={`hook-${step}`} footer={footer}>{body}</Sheet>;
}

export function HelpLink({ text }) {
  if (!SUPPORT.enabled) return null;
  return (
    <button type="button" className="ih-help ch-press" onClick={() => SUPPORT.open(text)}>
      <MessageCircle strokeWidth={2} aria-hidden />לא מוצאים? כתבו לנו ונחבר יחד
    </button>
  );
}
