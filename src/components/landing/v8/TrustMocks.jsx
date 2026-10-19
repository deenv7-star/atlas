/**
 * Tiny UI mock-ups for the trust section (decorative, aria-hidden: the tile label carries the meaning).
 * Each one only illustrates a claim from trust-content.js. Motion is CSS-only (trust-mocks.css) and
 * starts when the tile gets `.is-in` from useReveal; with reduced motion the final state shows as is.
 */
import React from 'react';
import { CheckCheck, Check, Download, FileText, MessageCircle } from 'lucide-react';

export function MockTrial() {
  return (
    <div className="tm tm-trial" aria-hidden="true">
      <p className="tm-trial-n"><b className="num" dir="ltr">14</b><span>יום חינם</span></p>
      <div className="tm-row">
        <span>חיוב אוטומטי</span>
        <span className="tm-sw"><i /></span>
      </div>
    </div>
  );
}

export function MockCancel() {
  return (
    <div className="tm tm-chat" aria-hidden="true">
      <div className="tm-chat-hd"><span className="tm-av"><MessageCircle size={12} strokeWidth={2.4} /></span><b>atlas</b><small>וואטסאפ</small></div>
      <p className="tm-b is-out">לבטל את המנוי<CheckCheck size={12} strokeWidth={2.4} /></p>
      <div className="tm-slot">
        <span className="tm-typing"><i /><i /><i /></span>
        <p className="tm-b is-in-msg">קיבלתי. אישור בכתב בדרך.</p>
      </div>
    </div>
  );
}

const FILES = [['הזמנות', 'CSV'], ['לידים', 'CSV'], ['דוח חודשי', 'PDF']];
export function MockExport() {
  return (
    <div className="tm tm-export" aria-hidden="true">
      <span className="tm-dl"><Download size={14} strokeWidth={2.4} /></span>
      <ul>
        {FILES.map(([n, x], i) => (
          <li key={n} style={{ '--i': i }}>
            <FileText size={13} strokeWidth={2} /><span>{n}</span><em dir="ltr">{x}</em>
            <Check className="tm-ok" size={11} strokeWidth={3.2} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MockSecure() {
  return (
    <div className="tm tm-secure" aria-hidden="true">
      <span className="tm-lock">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path className="tm-shackle" d="M8 11V8a4 4 0 0 1 8 0v3" />
          <rect x="5" y="11" width="14" height="10" rx="2.5" />
          <path d="M12 15.2v2" />
        </svg>
      </span>
      <ul className="tm-chips">
        <li style={{ '--i': 0 }}>פרנקפורט · AWS</li>
        <li style={{ '--i': 1 }} dir="ltr">HTTPS</li>
        <li style={{ '--i': 2 }}>בידוד לכל עסק</li>
      </ul>
    </div>
  );
}

export const MOCKS = { trial: MockTrial, cancel: MockCancel, export: MockExport, secure: MockSecure };
