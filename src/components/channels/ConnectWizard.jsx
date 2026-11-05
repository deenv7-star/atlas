/**
 * V1 "מדריך צעד־אחר־צעד": pick the channel with a big logo button, then one step per screen with a drawing
 * of the exact screen on Airbnb / Booking.com, a button that opens the right page there, one big paste box
 * (the channel is recognised from the link), the live check, atlas's own link back to the channel, and a
 * plain success screen. Stuck on the paste step, or Booking does not show "סנכרון יומנים": the navy help box
 * (phone + WhatsApp with the pasted link already in the message, from V2).
 */
import React, { useState } from 'react';
import { ExternalLink, Check, ChevronLeft, Phone, RefreshCw } from 'lucide-react';
import { CHANNELS, ATLAS_EVERY, SUPPORT, checkPasted } from './channelKit';
import ChannelLogo from './ChannelLogo';
import ScreenMock from './ScreenMock';
import { Sheet, PasteField, CopyBig, exportLinkFor, useConnect, Bidi, HelpBox } from './ConnectParts';

const FLOWS = {
  AIRBNB: [
    { kind: 'guide', mock: 'a-open', title: 'פתחו את לוח השנה ב-Airbnb', text: (u) => `היכנסו עם השם והסיסמה הרגילים, ובחרו את המודעה של ${u}.`, open: true },
    { kind: 'guide', mock: 'a-avail', title: 'לחצו על "זמינות"', en: 'Availability', text: () => 'הכפתור נמצא ליד לוח השנה.' },
    { kind: 'guide', mock: 'a-connect', title: 'לחצו על "חיבור לאתר אחר"', en: 'Connect to another website', text: () => 'גללו למטה עד "חיבור לוחות שנה" (Connect calendars).' },
    { kind: 'guide', mock: 'a-copy', title: 'העתיקו את הקישור של Airbnb', en: 'Copy', text: () => 'בחלון שנפתח יש קישור שנגמר ב-ics. לחצו "העתקה" לידו.' },
    { kind: 'paste' },
    { kind: 'export', mock: 'a-import', items: ['חזרו לאותו חלון ב-Airbnb.', 'הדביקו בשדה "כתובת לוח השנה" (Calendar address).', 'בשם כתבו atlas, ולחצו "הוספת לוח שנה" (Add calendar).'] },
  ],
  BOOKING_COM: [
    { kind: 'guide', mock: 'b-open', title: 'פתחו את "סנכרון יומנים" ב-Booking', text: () => 'הכפתור פותח את האקסטרא-נט, האתר שבו מנהלים את המודעה. היכנסו עם השם והסיסמה הרגילים.', open: true, note: { title: 'לא מופיע "סנכרון יומנים"?', text: 'Booking פותח אותו רק כשבכל סוג חדר יש יחידה אחת. נבדוק את זה יחד.' } },
    { kind: 'guide', mock: 'b-add', title: 'ליד היחידה, לחצו "הוספת חיבור ליומן"', en: 'Add calendar connection', text: (u) => `בחרו את השורה של ${u}.` },
    { kind: 'guide', mock: 'b-skip', title: 'לחצו "דילוג לייצוא"', en: 'Skip to export', text: () => 'את הקישור של atlas נדביק שם בשלב הבא.' },
    { kind: 'guide', mock: 'b-copy', title: 'כתבו atlas ולחצו "העתקת קישור"', en: 'Copy link', text: () => 'הקישור נשמר בטלפון או במחשב, מוכן להדבקה.' },
    { kind: 'paste' },
    { kind: 'export', mock: 'b-import', items: ['ב-Booking לחצו שוב "הוספת חיבור ליומן" ליד אותה יחידה.', 'הדביקו בשדה הקישור, ובשם כתבו atlas.', 'לחצו "השלב הבא" (Next step), ואז "סיום" (Done).'] },
  ],
  ICAL: [
    { kind: 'guide', mock: 'o-copy', title: 'העתיקו את קישור היומן מהאתר השני', text: () => 'בהגדרות היומן שם חפשו "ייצוא יומן", "סנכרון" או "iCal" (כך נקרא קישור יומן). בדרך כלל הוא נגמר ב-ics.' },
    { kind: 'paste' },
    { kind: 'export', mock: 'o-import', items: ['באותו אתר חפשו "ייבוא יומן".', 'הדביקו את הקישור ושמרו.'] },
  ],
};

function PickChannel({ unit, onPick }) {
  const opts = [
    { k: 'AIRBNB', line: 'לוח השנה של Airbnb' },
    { k: 'BOOKING_COM', line: 'האקסטרא-נט של Booking' },
    { k: 'ICAL', line: 'אתר צימרים או יומן אחר' },
  ];
  return (
    <>
      <h1 className="ch-h1" tabIndex={-1}>איזה ערוץ מחברים?</h1>
      <p className="ch-sub">ליחידה "<bdi>{unit}</bdi>". חינם, ולוקח כמה דקות.</p>
      <ul className="ch-picks">
        {opts.map((o) => (
          <li key={o.k}>
            <button type="button" className="ch-pick ch-press" onClick={() => onPick(o.k)}>
              <ChannelLogo channel={o.k} size={56} />
              <span className="ch-pick-t"><b>{CHANNELS[o.k].name}</b><small>{o.line}</small></span>
              <ChevronLeft className="ch-pick-go" strokeWidth={2} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function HelpLine() {
  return (
    <p className="ch-help">
      תקועים? <a href={SUPPORT.phoneHref} className="ch-a"><Phone strokeWidth={2} aria-hidden />התקשרו אלינו ונחבר יחד</a>
    </p>
  );
}

export default function ConnectWizard({ property, orgId, existing, onClose, onDone, initialChannel = '' }) {
  const unit = property?.name || 'היחידה';
  const [channel, setChannel] = useState(initialChannel);
  const [i, setI] = useState(0);
  const [link, setLink] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const { connect, busy } = useConnect({ orgId, property, existing });

  const flow = channel ? FLOWS[channel] : null;
  const step = flow && i < flow.length ? flow[i] : null;
  const done = flow && i >= flow.length;
  const C = CHANNELS[result?.channel || channel] || CHANNELS.ICAL;
  const total = flow ? flow.length : 0;
  const check = checkPasted(link, { exportToken: property?.ical_export_token });

  const back = () => {
    setError('');
    if (!channel) return onClose();
    if (i === 0) { setChannel(''); return undefined; }
    setI(i - 1);
    return undefined;
  };

  const submit = async () => {
    if (!check.ok) return;
    setError('');
    const r = await connect({ url: check.url, channel: check.channel });
    if (!r.ok) { setError(r.message); return; }
    setResult({ ...r, channel: check.channel });
    onDone?.();
    setI(i + 1);
  };

  let body = null;
  let footer = null;
  if (!channel) {
    body = <PickChannel unit={unit} onPick={(k) => { setChannel(k); setI(0); }} />;
    footer = <HelpLine />;
  } else if (step?.kind === 'guide') {
    body = (
      <>
        <p className="ch-kicker">שלב {i + 1} מתוך {total}</p>
        <h1 className="ch-h1" tabIndex={-1}>{step.title}</h1>
        {step.en ? <p className="ch-en">באנגלית: <bdi dir="ltr">{step.en}</bdi></p> : null}
        <p className="ch-sub"><Bidi text={step.text(unit)} /></p>
        <ScreenMock id={step.mock} caption={step.title} />
        {step.note ? <HelpBox unit={unit} title={step.note.title} text={step.note.text} /> : null}
      </>
    );
    footer = (
      <>
        {step.open ? (
          <a href={CHANNELS[channel].open} target="_blank" rel="noopener noreferrer" className="ch-btn is-primary ch-press" onClick={() => window.setTimeout(() => setI(i + 1), 400)}>
            פתחו את {CHANNELS[channel].name === 'Booking.com' ? 'Booking' : CHANNELS[channel].name}<ExternalLink strokeWidth={2} aria-hidden />
          </a>
        ) : null}
        <button type="button" className={`ch-btn ${step.open ? 'is-ghost' : 'is-primary'} ch-press`} onClick={() => setI(i + 1)}>
          {step.open ? 'כבר פתוח אצלי' : 'עשיתי, הלאה'}
        </button>
        {step.note ? null : <HelpLine />}
      </>
    );
  } else if (step?.kind === 'paste') {
    body = (
      <>
        <p className="ch-kicker">שלב {i + 1} מתוך {total}</p>
        <h1 className="ch-h1" tabIndex={-1}>הדביקו כאן את הקישור</h1>
        <p className="ch-sub">{channel === 'ICAL' ? 'את הקישור שהעתקתם מהאתר השני.' : `את הקישור שהעתקתם מ-${CHANNELS[channel].name}.`}</p>
        <PasteField value={link} onChange={(v) => { setLink(v); setError(''); }} exportToken={property?.ical_export_token} expected={channel} />
        {error ? (
          <div className="ch-err" role="alert"><b>לא הצלחנו לחבר</b><p>{error}</p></div>
        ) : null}
        <HelpBox unit={unit} link={check.url && /^(https?|webcal):\/\//i.test(check.url) ? check.url : ''} />
      </>
    );
    footer = (
      <>
        <button type="button" className={`ch-btn is-primary ch-press ${busy ? 'is-busy' : ''}`} onClick={submit} disabled={!check.ok || busy} aria-disabled={!check.ok || busy}>
          {busy ? <><RefreshCw className="ch-spin" strokeWidth={2} aria-hidden />בודקים את הקישור…</> : 'חברו את היומן'}
        </button>
        {!check.ok && !busy ? <p className="ch-hint">הדביקו קישור כדי להמשיך</p> : null}
      </>
    );
  } else if (step?.kind === 'export') {
    const name = CHANNELS[result?.channel || channel].name;
    body = (
      <>
        <p className="ch-kicker">שלב {i + 1} מתוך {total} · כמעט סיימנו</p>
        <h1 className="ch-h1" tabIndex={-1}>עכשיו בכיוון השני</h1>
        <p className="ch-sub">{channel === 'ICAL' ? 'כדי שגם האתר השני יחסום תאריכים שנתפסו אצלכם.' : `כדי ש-${name} יחסום תאריכים שנתפסו אצלכם בטלפון או בערוץ אחר.`}</p>
        <CopyBig value={exportLinkFor(property, result?.channel || channel)} />
        <ol className="ch-list">{step.items.map((t) => <li key={t}><Bidi text={t} /></li>)}</ol>
        <ScreenMock id={step.mock} caption="הדבקת הקישור של atlas בערוץ" />
      </>
    );
    footer = (
      <>
        <button type="button" className="ch-btn is-primary ch-press" onClick={() => setI(i + 1)}>הדבקתי, סיימתי</button>
        <button type="button" className="ch-btn is-ghost ch-press" onClick={() => { setResult((r) => ({ ...r, skippedExport: true })); setI(i + 1); }}>אעשה את זה אחר כך</button>
      </>
    );
  } else if (done) {
    body = (
      <div className="ch-done">
        <span className="ch-done-mark" aria-hidden><Check strokeWidth={3} /></span>
        <h1 className="ch-h1" tabIndex={-1}>{C.name === 'אתר אחר' ? 'היומן' : C.name} מחובר <span aria-hidden>✓</span></h1>
        <p className="ch-status">
          עדכון אחרון: עכשיו{result ? <> · {result.events} תאריכים תפוסים{result.demo ? ' (דוגמה)' : ''}</> : null}
        </p>
        <ul className="ch-facts">
          <li>הזמנות מ-{C.name === 'אתר אחר' ? 'האתר השני' : C.name} נכנסות ליומן של atlas לבד. atlas בודק {ATLAS_EVERY}.</li>
          {result?.skippedExport
            ? <li>הכיוון השני עוד לא חובר. אפשר להשלים אותו מכאן בכל רגע.</li>
            : <li>{C.name === 'אתר אחר' ? 'האתר השני' : C.name} בודק את atlas {C.pullsEvery}, ולכן הזמנה חדשה נחסמת שם תוך כמה שעות.</li>}
          {result?.warning ? <li>{result.warning}</li> : null}
        </ul>
        {result?.demo ? <p className="ch-note">חשבון דוגמה: שום דבר לא נשלח. בחשבון שלכם הקישור נבדק מול הערוץ.</p> : null}
      </div>
    );
    footer = (
      <>
        <button type="button" className="ch-btn is-primary ch-press" onClick={onClose}>סיום</button>
        <button type="button" className="ch-btn is-ghost ch-press" onClick={() => { setChannel(''); setI(0); setLink(''); setResult(null); }}>חברו ערוץ נוסף</button>
      </>
    );
  }

  return (
    <Sheet
      title={channel ? `חיבור ${CHANNELS[channel].name === 'אתר אחר' ? 'יומן' : CHANNELS[channel].name}` : 'חיבור ערוץ'}
      label={`חיבור ערוץ ל${unit}`}
      onClose={onClose}
      onBack={done ? null : back}
      progress={flow && !done ? [i + 1, total] : null}
      footer={footer}
      stepKey={`${channel}-${i}`}
    >
      {body}
    </Sheet>
  );
}
