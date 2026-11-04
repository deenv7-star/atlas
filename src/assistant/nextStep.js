/**
 * "היא תכווין כל הזמן" (Deen, 04.11.2026): after every answer, ONE natural next step, from real data only.
 * Pure (node --test): nextStep(facts, { question, answer }) → { line, ask, label, options } | null
 *   line    what the card / atlas says ("נועה מגיעה היום. נכין הודעת הגעה?") — plural "we", no gender
 *   ask     the exact question sent when the owner taps (it becomes a proposal card, still needs "אישור")
 *   label   the chip text
 *   options when the owner is unsure: 2-3 concrete choices [{ label, ask }]
 * Never pushy: one step, never the same step twice in a row, nothing the app cannot really do.
 */
/** ל + a person's name: Hebrew glued (לנועה, להדס: never drop a ה from a name), Latin with a hyphen (ל-Dana). */
const L = (n) => { const s = String(n || '').trim(); return /^[A-Za-z0-9]/.test(s) ? `ל-${s}` : `ל${s}`; };
const TOPIC = [
  ['money', /חייב|יתר|שולם|תשלום|לגבות|גבייה|כסף/],
  ['free', /פנוי|לילות|סופ"?ש|סוף שבוע|ריק|למלא/],
  ['tomorrow', /מחר/],
  ['today', /היום|כניס|יציא|מגיע/],
  ['month', /חודש|הכנסה|הכנסות|תפוסה|השווא/],
  ['leads', /ליד|פני/],
  ['message', /הודעה|וואטסאפ|תזכורת/],
  ['booking', /הזמנה חדשה|תכינו הזמנה|תוסיפו הזמנה/],
];
export const topicOf = (q) => (TOPIC.find(([, re]) => re.test(String(q || ''))) || ['other'])[0];

/** Greetings and small talk: one warm line, then back to business (the brain does the same live). */
const SMALL_TALK = /^(היי|הי|שלום|בוקר טוב|ערב טוב|צהריים טובים|מה נשמע|מה שלומכם|מה קורה|מה המצב|תודה|תודה רבה|אחלה|סבבה)[\s,.?!]*$/;
export const isSmallTalk = (q) => SMALL_TALK.test(String(q || '').trim()) || /^(מה שלומך|איך את|איך אתה|מה איתך)/.test(String(q || '').trim());

const step = (line, label, ask) => ({ line, label, ask });

/** 2-3 concrete things to do now, for when the owner is not sure what to ask. */
export function optionsOf(f) {
  if (!f?.hasData) return [{ label: 'איך מחברים את Booking', ask: 'איך מחברים את Booking ו-Airbnb?' }, { label: 'איך מוסיפים הזמנה', ask: 'איך מוסיפים הזמנה ראשונה?' }];
  const out = [];
  if (f.arrivals.length) out.push({ label: 'מי מגיע היום', ask: 'מי מגיע היום?' });
  if (f.overdue.length) out.push({ label: 'מי עוד חייב כסף', ask: 'מי עוד חייב לנו כסף?' });
  if (f.openLeads.length) out.push({ label: f.openLeads.length === 1 ? 'פנייה שמחכה' : `${f.openLeads.length} פניות שמחכות`, ask: 'אילו פניות מחכות לתשובה?' });
  if (f.freeTotal) out.push({ label: 'לילות פנויים', ask: 'אילו לילות פנויים בשבועיים הקרובים?' });
  out.push({ label: 'החודש מול הקודם', ask: 'איך החודש לעומת החודש שעבר?' });
  return out.slice(0, 3);
}

export function nextStep(f, { question = '', answer = '', last = '' } = {}) {
  if (isSmallTalk(question) || /לא יודע|לא בטוח|מה אפשר|במה אפשר|מה אתם יודעים|עזרה/.test(question)) {
    return { line: 'במה נתחיל?', label: '', ask: '', options: optionsOf(f) };
  }
  if (!f?.hasData) return { line: 'נחבר את היומן של Booking ו-Airbnb?', label: 'איך מחברים', ask: 'איך מחברים את Booking ו-Airbnb?', options: [] };
  const t = topicOf(question);
  const debtor = f.overdue[0];
  const arriving = f.arrivals[0] || null;
  const lead = f.openLeads[0];
  const wkUnit = f.freeNights.find((u) => u.weekend.length);
  const picks = [];
  if (t === 'money' && debtor) picks.push(step(`נכין ${L(debtor.name)} תזכורת על היתרה בוואטסאפ?`, `תזכורת ${L(debtor.name)}`, `תשלחו תזכורת על התשלום ${L(debtor.name)}`));
  if ((t === 'today' || t === 'tomorrow') && arriving) picks.push(step(`נכין ${L(arriving.name)} הודעה עם הוראות הגעה?`, `הודעת הגעה ${L(arriving.name)}`, `תכינו הודעה ${L(arriving.name)} עם הוראות הגעה`));
  if (t === 'free' && wkUnit) picks.push(step('נכין הזמנה ללילות הפנויים בסוף השבוע?', 'הזמנה לסוף השבוע', 'תכינו הזמנה חדשה לסוף השבוע'));
  if (t === 'leads' && lead) picks.push(step(`נכין ${L(lead.name)} תשובה בוואטסאפ?`, `תשובה ${L(lead.name)}`, `תכינו הודעה ${L(lead.name)} בתשובה לפנייה`));
  if (t === 'month' && f.freeTotal) picks.push(step('לבדוק אילו לילות עוד אפשר למלא?', 'לילות למלא', 'אילו לילות פנויים בשבועיים הקרובים?'));
  // proactive: something real waiting elsewhere (leads first: money already has its own cards)
  if (lead && t !== 'leads') picks.push(step(f.openLeads.length === 1 ? 'יש פנייה שעוד לא חזרתם אליה. לעבור עליה?' : `יש ${f.openLeads.length} פניות שעוד לא חזרתם אליהן. לעבור עליהן?`, 'לעבור על הפניות', 'אילו פניות מחכות לתשובה?'));
  if (debtor && t !== 'money') picks.push(step('יש יתרות שעבר מועד התשלום שלהן. לבדוק מי?', 'יתרות באיחור', 'מי עוד חייב לנו כסף?'));
  if (arriving && t !== 'today') picks.push(step(`${arriving.name} מגיעים היום. נכין הודעת הגעה?`, `הודעת הגעה ${L(arriving.name)}`, `תכינו הודעה ${L(arriving.name)} עם הוראות הגעה`));
  const pick = picks.find((p) => p.ask !== last && !String(answer).includes(p.line)) || null;
  return pick ? { ...pick, options: [] } : { line: 'עוד משהו לבדוק?', label: '', ask: '', options: optionsOf(f) };
}
