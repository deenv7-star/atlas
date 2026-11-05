/**
 * V2 "תעשו את זה בשבילי": one screen. Paste the link (the channel is recognised from it) and we connect it,
 * or get a person on the phone / WhatsApp who connects it with you. Short tips per channel stay folded.
 */
import React, { useState } from 'react';
import { Check, ChevronDown, ExternalLink, Phone, RefreshCw } from 'lucide-react';
import { WHATSAPP } from '@/components/landing/v5/brandPaths';
import { CHANNELS, ATLAS_EVERY, SUPPORT, checkPasted } from './channelKit';
import ChannelLogo from './ChannelLogo';
import { Sheet, PasteField, CopyBig, exportLinkFor, useConnect, Bidi } from './ConnectParts';

const TIPS = [
  { k: 'AIRBNB', title: 'איפה הקישור ב-Airbnb?', steps: ['לוח שנה ← בוחרים את המודעה.', 'לוחצים "זמינות" (Availability).', '"חיבור לאתר אחר" (Connect to another website).', 'מעתיקים את הקישור שנגמר ב-ics.'] },
  { k: 'BOOKING_COM', title: 'איפה הקישור ב-Booking?', steps: ['באקסטרא-נט: "תעריפים וזמינות" ← "סנכרון יומנים".', 'ליד היחידה: "הוספת חיבור ליומן" (Add calendar connection).', '"דילוג לייצוא" (Skip to export).', 'כותבים atlas ולוחצים "העתקת קישור" (Copy link).'] },
  { k: 'ICAL', title: 'אתר אחר?', steps: ['בהגדרות היומן שם חפשו "ייצוא יומן" או "iCal" (כך נקרא קישור יומן).', 'מעתיקים את הקישור, בדרך כלל נגמר ב-ics.'] },
];

function Tip({ t }) {
  const [open, setOpen] = useState(false);
  const C = CHANNELS[t.k];
  return (
    <div className="ch-tip">
      <button type="button" aria-expanded={open} aria-controls={`tip-${t.k}`} onClick={() => setOpen((o) => !o)} className="ch-press">
        <ChannelLogo channel={t.k} size={40} />{t.title}<ChevronDown className="ch-chev" strokeWidth={2} aria-hidden />
      </button>
      {open ? (
        <div id={`tip-${t.k}`}>
          <ol>{t.steps.map((s) => <li key={s}><Bidi text={s} /></li>)}</ol>
          {C.open ? <a href={C.open} target="_blank" rel="noopener noreferrer" className="ch-a">פתחו את {C.name === 'Booking.com' ? 'Booking' : C.name}<ExternalLink strokeWidth={2} aria-hidden /></a> : null}
        </div>
      ) : null}
    </div>
  );
}

function WaIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden><path d={WHATSAPP} fill="currentColor" /></svg>;
}

function HelpBox({ unit, link }) {
  const text = link
    ? `שלום, זה הקישור לחיבור היחידה "${unit}" ב-atlas:\n${link}`
    : `שלום, אני רוצה עזרה בחיבור Airbnb או Booking ליחידה "${unit}" ב-atlas.`;
  return (
    <section className="ch-helpbox" aria-labelledby="ch-help-h">
      <h2 id="ch-help-h">צריכים עזרה? נחבר יחד בטלפון</h2>
      <p>{SUPPORT.line}. בשיחה אחת מחברים את כל הערוצים.</p>
      <a href={SUPPORT.phoneHref} className="ch-btn is-white ch-press"><Phone strokeWidth={2} aria-hidden />התקשרו: <bdi dir="ltr">{SUPPORT.phoneDisplay}</bdi></a>
      <a href={SUPPORT.whatsapp(text)} target="_blank" rel="noopener noreferrer" className="ch-btn is-line ch-press"><WaIcon />{link ? 'שלחו את הקישור בוואטסאפ' : 'כתבו לנו בוואטסאפ'}</a>
    </section>
  );
}

export default function SendLink({ property, orgId, existing, onClose, onDone }) {
  const unit = property?.name || 'היחידה';
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const { connect, busy } = useConnect({ orgId, property, existing });
  const check = checkPasted(link, { exportToken: property?.ical_export_token });

  const submit = async () => {
    if (!check.ok) return;
    setError('');
    const r = await connect({ url: check.url, channel: check.channel });
    if (!r.ok) { setError(r.message); return; }
    setResult({ ...r, channel: check.channel });
    onDone?.();
  };

  if (result) {
    const C = CHANNELS[result.channel];
    const name = result.channel === 'ICAL' ? 'האתר השני' : C.name;
    return (
      <Sheet title="חיבור ערוץ" label={`חיבור ערוץ ל${unit}`} onClose={onClose} stepKey="done"
        footer={<>
          <button type="button" className="ch-btn is-primary ch-press" onClick={onClose}>סיום</button>
          <button type="button" className="ch-btn is-ghost ch-press" onClick={() => { setResult(null); setLink(''); }}>שלחו קישור נוסף</button>
        </>}>
        <div className="ch-done">
          <span className="ch-done-mark" aria-hidden><Check strokeWidth={3} /></span>
          <h1 className="ch-h1" tabIndex={-1}>{result.channel === 'ICAL' ? 'היומן' : C.name} מחובר <span aria-hidden>✓</span></h1>
          <p className="ch-status">עדכון אחרון: עכשיו · {result.events} תאריכים תפוסים{result.demo ? ' (דוגמה)' : ''}</p>
          <ul className="ch-facts">
            <li>הזמנות מ-{name} נכנסות ליומן של atlas לבד. atlas בודק {ATLAS_EVERY}.</li>
            {result.warning ? <li>{result.warning}</li> : null}
          </ul>
        </div>
        <section className="ch-tip" style={{ marginTop: 18, padding: '16px 16px 18px' }} aria-labelledby="ch-back-h">
          <h2 id="ch-back-h" className="ch-label" style={{ margin: 0, fontSize: 21 }}>ועכשיו בכיוון השני</h2>
          <p className="ch-sub" style={{ marginTop: 6 }}>כדי ש-{name} יחסום תאריכים שנתפסו אצלכם. העתיקו, והדביקו ב-{name} באותו מקום שממנו העתקתם.</p>
          <CopyBig value={exportLinkFor(property, result.channel)} />
          <p className="ch-help" style={{ marginTop: 8 }}><a href={SUPPORT.phoneHref} className="ch-a"><Phone strokeWidth={2} aria-hidden />נעשה את זה יחד בטלפון</a></p>
        </section>
        {result.demo ? <p className="ch-note">חשבון דוגמה: שום דבר לא נשלח. בחשבון שלכם הקישור נבדק מול הערוץ.</p> : null}
      </Sheet>
    );
  }

  return (
    <Sheet title="חיבור ערוץ" label={`חיבור ערוץ ל${unit}`} onClose={onClose} stepKey="send"
      footer={<>
        <button type="button" className={`ch-btn is-primary ch-press ${busy ? 'is-busy' : ''}`} onClick={submit} disabled={!check.ok || busy} aria-disabled={!check.ok || busy}>
          {busy ? <><RefreshCw className="ch-spin" strokeWidth={2} aria-hidden />בודקים את הקישור…</> : 'חברו'}
        </button>
        {!check.ok && !busy ? <p className="ch-hint">הדביקו קישור, ואנחנו נזהה מאיזה ערוץ הוא</p> : null}
      </>}>
      <h1 className="ch-h1" tabIndex={-1}>שלחו לנו את הקישור</h1>
      <p className="ch-sub">של היומן מ-Airbnb, מ-Booking או מכל אתר אחר. נזהה מאיפה הוא ונחבר ליחידה "<bdi>{unit}</bdi>".</p>
      <PasteField value={link} onChange={(v) => { setLink(v); setError(''); }} exportToken={property?.ical_export_token} />
      {error ? <div className="ch-err" role="alert"><b>לא הצלחנו לחבר</b><p>{error} אפשר גם לשלוח לנו אותו בוואטסאפ, ונבדוק.</p></div> : null}
      <HelpBox unit={unit} link={check.ok ? check.url : ''} />
      <div className="ch-tips">{TIPS.map((t) => <Tip key={t.k} t={t} />)}</div>
    </Sheet>
  );
}
