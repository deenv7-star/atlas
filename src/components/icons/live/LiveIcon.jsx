/**
 * atlas animated line icons ("live window B", 02.11.2026).
 * Our own set, drawn for atlas: viewBox 48, 2px round navy line (currentColor), ONE small indigo
 * accent fill, a soft indigo ground ellipse under the object. Each icon tells its meaning in one
 * short motion (400–700ms, transform / opacity / stroke-draw only) when it mounts and whenever
 * `playKey` changes (tap, tab becomes active). prefers-reduced-motion: static (see live-icons.css).
 */
import React, { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import './live-icons.css';

const Ground = () => <ellipse className="li-ground" cx="24" cy="42" rx="9" ry="2.6" />;

const ICONS = {
  /* check-in: the key turns in the lock */
  key: (
    <>
      <Ground />
      <g className="li-key">
        <circle cx="16" cy="23" r="7" />
        <path d="M23 23h16M33 23v5M38 23v4" />
        <circle className="li-acc" cx="16" cy="23" r="2.4" />
      </g>
    </>
  ),
  /* check-out: the door swings open and settles */
  door: (
    <>
      <Ground />
      <path d="M12 39h24" />
      <path d="M14 39V9h20v30" />
      <g className="li-door">
        <path d="M14 39V9l14 3v30z" />
        <circle className="li-acc" cx="24.5" cy="25.5" r="1.9" />
      </g>
    </>
  ),
  /* cleaning: the broom sweeps, dust lifts */
  broom: (
    <>
      <Ground />
      <g className="li-broom">
        <path d="M31 6 24 27" />
        <path d="M16 38l3-11h10l2 11z" />
        <path d="M21 38l.6-6M25 38v-6M29 38l-.6-6" />
        <rect className="li-acc" x="19.5" y="25" width="9.5" height="3.6" rx="1.4" transform="rotate(0)" />
      </g>
      <g className="li-dust">
        <circle cx="11" cy="35" r="1" />
        <circle cx="8" cy="31" r=".9" />
        <circle cx="12" cy="29" r=".8" />
      </g>
    </>
  ),
  /* WhatsApp: the bubble pops, three dots type */
  whatsapp: (
    <>
      <Ground />
      <g className="li-bubble">
        <path d="M24 8c8.3 0 15 5.8 15 13s-6.7 13-15 13c-1.9 0-3.7-.3-5.3-.8L11 36l2.2-6.4C10.6 27.3 9 24.3 9 21 9 13.8 15.7 8 24 8z" />
        <circle className="li-acc li-t1" cx="18" cy="21" r="2" />
        <circle className="li-acc li-t2" cx="24" cy="21" r="2" />
        <circle className="li-acc li-t3" cx="30" cy="21" r="2" />
      </g>
    </>
  ),
  /* payment / money: the coin drops and lands */
  coin: (
    <>
      <Ground />
      <g className="li-coin">
        <circle cx="24" cy="23" r="12" />
        <path d="M19 29v-11h4.5a2.5 2.5 0 0 1 2.5 2.5V25M29 17v11h-4.5a2.5 2.5 0 0 1-2.5-2.5V22" />
        <circle className="li-acc" cx="33" cy="13.5" r="2.2" />
      </g>
    </>
  ),
  /* calendar: the page flips down */
  calendar: (
    <>
      <Ground />
      <g className="li-cal">
        <rect x="10" y="12" width="28" height="26" rx="5" />
        <path d="M17 8v7M31 8v7" />
        <g className="li-page">
          <path d="M10 20h28" />
          <rect className="li-acc" x="26" y="26" width="6" height="6" rx="1.6" />
        </g>
      </g>
    </>
  ),
  /* receipt: it prints upward */
  receipt: (
    <>
      <Ground />
      <g className="li-receipt">
        <path d="M14 8h20v30l-3.3-2.2L27.3 38 24 35.8 20.7 38l-3.4-2.2L14 38z" />
        <path d="M19 16h10M19 22h10" />
        <circle className="li-acc" cx="24" cy="29" r="2.2" />
      </g>
    </>
  ),
  /* done: the check draws itself */
  check: (
    <>
      <Ground />
      <g className="li-chk">
        <circle className="li-acc" cx="24" cy="22" r="13" />
        <path className="li-draw li-white" pathLength="1" d="M18 22.5l4.2 4.2L30.5 18" />
      </g>
    </>
  ),
  /* today: the sun rises, rays open */
  today: (
    <>
      <Ground />
      <g className="li-sun">
        <circle className="li-acc" cx="24" cy="23" r="6" />
      </g>
      <g className="li-rays">
        <path d="M24 9v4M24 33v4M10 23h4M34 23h4M14.1 13.1l2.8 2.8M31.1 30.1l2.8 2.8M14.1 32.9l2.8-2.8M31.1 15.9l2.8-2.8" />
      </g>
    </>
  ),
  /* inquiries: a letter drops into the tray */
  inbox: (
    <>
      <Ground />
      <g className="li-letter">
        <rect x="17" y="8" width="14" height="14" rx="2.5" />
        <circle className="li-acc" cx="24" cy="15" r="2.2" />
      </g>
      <path d="M9 26l4.5-8H17M31 18h3.5L39 26v8a4 4 0 0 1-4 4H13a4 4 0 0 1-4-4z" />
      <path d="M9 26h9l2 4h8l2-4h9" />
    </>
  ),
  /* the complex: the house lands, window lights */
  home: (
    <>
      <Ground />
      <g className="li-home">
        <path d="M10 22 24 10l14 12" />
        <path d="M14 19v18h20V19" />
        <rect className="li-acc li-win" x="20.5" y="25" width="7" height="7" rx="1.6" />
      </g>
    </>
  ),
};

export const LIVE_ICON_NAMES = Object.keys(ICONS);

/** [playKey, replay]: bump the key to run an icon's motion again (tap, tab activated). */
export function useReplay() {
  const [k, setK] = useState(0);
  const replay = useCallback(() => setK((n) => n + 1), []);
  return [k, replay];
}

export default function LiveIcon({ name, size = 28, playKey = 0, className, title }) {
  const body = ICONS[name];
  if (!body) return null;
  return (
    <svg
      key={playKey}
      className={cn('li', `li--${name}`, className)}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {body}
    </svg>
  );
}
