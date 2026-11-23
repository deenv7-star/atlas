/* The voice stage, copied unchanged from LandingM (landing simplify V2, 12.11.2026) so the t9 redesigns can
   restyle it per template without pulling the whole v8 page in. Real AssistantScreen stills, example data. */
import React, { useEffect, useRef, useState } from 'react';
import { Mic } from 'lucide-react';
import { prefersReducedMotion } from '../v5/motion';
import '../v8/voice-stage.css';

const STAGE = [
  { img: 'say', t: 'אומרים', d: 'במילים שלכם, בעברית. בלי טפסים.', alt: 'העוזר הקולי באפליקציה של atlas: בעל המתחם אמר ״תוסיף לי הזמנה לצימר מיום חמישי לסופ״ש ליוסי ב-3,500 ש״ח״ (נתוני דוגמה)' },
  { img: 'card', t: 'atlas מכין', d: 'בודק שהיחידה פנויה ומכין את ההזמנה.', alt: 'כרטיס הזמנה חדשה שמחכה לאישור: צימר הזית, יום ה׳ 12.11 עד יום ש׳ 14.11, ‏₪3,500 (נתוני דוגמה)' },
  { img: 'saved', t: 'מאשרים', d: 'בלחיצה אחת. רק אז זה נשמר בלוח.', alt: 'אחרי האישור: ההזמנה נשמרה ומופיעה בלוח (נתוני דוגמה)' },
];
const STAGE_MS = 3200;

export default function VoiceStage({ className = '' }) {
  const ref = useRef(null);
  const [cur, setCur] = useState(0);
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return undefined;
    // a fast scroll can batch several records for this one target: the LAST one is the current state
    const io = new IntersectionObserver((entries) => setAuto(entries[entries.length - 1].isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!auto) return undefined;
    const t = window.setTimeout(() => setCur((c) => (c + 1) % STAGE.length), STAGE_MS);
    return () => window.clearTimeout(t);
  }, [auto, cur]);
  return (
    <section ref={ref} id="voice" className={`vt ${className}${auto ? ' is-auto' : ''}`} aria-labelledby="voice-title">
      <div className="l5-wrap">
        <div className="vt-grid">
          <div className="vt-copy">
            <p className="vt-k"><Mic size={16} strokeWidth={2.2} aria-hidden="true" />העוזר הקולי</p>
            <h2 id="voice-title" className="v8-h2 vt-h">בלי טפסים. <span className="is-ind">בלי להקליד.</span></h2>
            <ol className="vt-steps">
              {STAGE.map((s, i) => (
                <li key={s.img}>
                  <button type="button" className={`vt-step${i === cur ? ' is-on' : ''}`} aria-current={i === cur ? 'step' : undefined} onClick={() => { setCur(i); setAuto(false); }}>
                    <span className="vt-n num" aria-hidden="true">{i + 1}</span>
                    <span className="vt-t">{s.t}</span>
                    <span className="vt-bar" aria-hidden="true"><i key={`${cur}-${auto}`} /></span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="vt-d">{STAGE[cur].d}</p>
          </div>
          <figure className="vt-phone">
            <div className="vt-scr">
              {STAGE.map((s, i) => (
                <img key={s.img} className={i === cur ? 'is-on' : ''} aria-hidden={i === cur ? undefined : 'true'} src={`/landing-voice/vs-${s.img}-600.webp`} srcSet={`/landing-voice/vs-${s.img}-300.webp 300w, /landing-voice/vs-${s.img}-600.webp 600w`} sizes="(min-width: 900px) 300px, 230px" alt={s.alt} width="600" height="1067" loading="lazy" decoding="async" />
              ))}
            </div>
            <figcaption>צילומי מסך מהאפליקציה, נתוני דוגמה</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

