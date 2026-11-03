/**
 * atlas "glow" face: a navy→indigo glass speech-bubble whose tail is the tail of the script "a",
 * with two soft light-pill eyes. Pure SVG + CSS: an expression is only eye shape + lid + a little motion.
 * Single source for the app component and the brand sheet / static SVGs.
 * Palette: #1B2656 #3E2BF1 #F7F8FB white (+ alpha tints).
 */
export const FACE_MOODS = ['neutral', 'attentive', 'look', 'happy', 'thinking', 'typing', 'sleepy', 'surprised', 'concerned', 'blink'];

export const FACE_ALT = {
  neutral: 'atlas, העוזר האישי שלכם',
  attentive: 'atlas מקשיב',
  look: 'atlas מסתכל על ההודעה החדשה',
  happy: 'atlas מחייך',
  thinking: 'atlas חושב',
  typing: 'atlas כותב תשובה',
  sleepy: 'atlas נח, אין כאן עדיין כלום',
  surprised: 'atlas מופתע',
  concerned: 'atlas מתנצל',
  blink: 'atlas',
};

const BODY = 'M42 8H78C96 8 110 22 110 40V70C110 81 106 89 99.5 95.5C102 102.5 107 108 114 112C103.5 113.5 93 110.5 85.5 104H42C24 104 10 90 10 72V40C10 22 24 8 42 8Z';

export function faceMarkup(id = 'af', mood = 'neutral', { still = false } = {}) {
  const u = (k) => `${id}-${k}`;
  return `<svg class="af${still ? ' af--still' : ''}" data-mood="${mood}" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
<defs>
<linearGradient id="${u('bg')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B2656"/><stop offset=".5" stop-color="#1B2656"/><stop offset="1" stop-color="#3E2BF1"/></linearGradient>
<radialGradient id="${u('glow')}" cx=".5" cy="1.08" r=".62"><stop offset="0" stop-color="#3E2BF1" stop-opacity="1"/><stop offset=".55" stop-color="#3E2BF1" stop-opacity=".55"/><stop offset="1" stop-color="#3E2BF1" stop-opacity="0"/></radialGradient>
<radialGradient id="${u('core')}" cx=".5" cy="1.02" r=".42"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<linearGradient id="${u('rim')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".45" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#fff" stop-opacity=".55"/></linearGradient>
<linearGradient id="${u('eye')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#F7F8FB"/></linearGradient>
<filter id="${u('soft')}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter>
<clipPath id="${u('body')}"><path d="${BODY}"/></clipPath>
<clipPath id="${u('lidL')}"><rect class="af-lid af-lid--l" x="30" y="20" width="32" height="70"/></clipPath>
<clipPath id="${u('lidR')}"><rect class="af-lid af-lid--r" x="58" y="20" width="32" height="70"/></clipPath>
</defs>
<path d="${BODY}" fill="url(#${u('bg')})"/>
<g clip-path="url(#${u('body')})">
<rect class="af-glow" x="0" y="20" width="120" height="100" fill="url(#${u('glow')})"/>
<rect x="0" y="40" width="120" height="80" fill="url(#${u('core')})"/>
<ellipse cx="54" cy="16" rx="34" ry="8" fill="#fff" opacity=".07"/>
</g>
<path d="${BODY}" fill="none" stroke="url(#${u('rim')})" stroke-width="1.4"/>
<g class="af-gaze"><g class="af-eyes">
<g class="af-eye af-eye--l" clip-path="url(#${u('lidL')})"><rect class="af-halo" x="38" y="41" width="16" height="26" rx="8" fill="#fff" opacity=".55" filter="url(#${u('soft')})"/><rect class="af-pill" x="38" y="41" width="16" height="26" rx="8" fill="url(#${u('eye')})"/></g>
<g class="af-eye af-eye--r" clip-path="url(#${u('lidR')})"><rect class="af-halo" x="66" y="41" width="16" height="26" rx="8" fill="#fff" opacity=".55" filter="url(#${u('soft')})"/><rect class="af-pill" x="66" y="41" width="16" height="26" rx="8" fill="url(#${u('eye')})"/></g>
<path class="af-smile" d="M38.5 57.5Q46 46.5 53.5 57.5M66.5 57.5Q74 46.5 81.5 57.5" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
</g></g>
</svg>`;
}

/* styles: atlasFace.css (generated from the brand source) */
