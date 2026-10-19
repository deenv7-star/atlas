"""Deen's final logo (brand/logo-final/atlas-logo-deen.svg) -> repo assets. Geometry untouched:
the path data is the original string; only fill colour, viewBox (padding trimmed, translate dropped) and title change.
The mark is the original first two subpaths of the "a" (arm + orb), split out of the same compound path.
python3 export_final.py A|B <repo>
"""
import sys, os, io, json, re
import cairosvg
from PIL import Image

V, REPO = sys.argv[1], sys.argv[2]
G = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'geom.json')))
NAVY, INDIGO, WHITE = '#1B2656', '#3E2BF1', '#FFFFFF'
WM_COLOR = NAVY if V == 'A' else INDIGO
# icon: A = indigo mark on white; B = white mark on navy tile
ICON_FG, ICON_BG = (INDIGO, WHITE) if V == 'A' else (WHITE, NAVY)
PUB = f'{REPO}/public'
WD, WVB, MD, MVB = G['wm_d'], G['wm_vb'], G['mark_d'], G['mark_vb']


def svg(d, vb, fill):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="atlas"><title>atlas</title>'
            f'<path fill="{fill}" fill-rule="evenodd" d="{d}"/></svg>')


def tile(fg, bg, frac, rx=0):
    x, y, w, h = map(float, MVB.split()); S = 1000; s = S * frac / max(w, h)
    tx = (S - w * s) / 2 - x * s; ty = (S - h * s) / 2 - y * s
    bgel = f'<rect width="{S}" height="{S}" rx="{rx}" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}"><title>atlas</title>{bgel}'
            f'<path transform="matrix({s:.5f} 0 0 {s:.5f} {tx:.2f} {ty:.2f})" fill="{fg}" fill-rule="evenodd" d="{MD}"/></svg>')


def put(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'w').write(s)


def png(s, w, p):
    os.makedirs(os.path.dirname(p), exist_ok=True); cairosvg.svg2png(bytestring=s.encode(), write_to=p, output_width=w)


put(f'{PUB}/atlas-logo.svg', svg(WD, WVB, WM_COLOR))
put(f'{PUB}/atlas-logo-navy.svg', svg(WD, WVB, NAVY))
put(f'{PUB}/atlas-logo-indigo.svg', svg(WD, WVB, INDIGO))
put(f'{PUB}/atlas-logo-white.svg', svg(WD, WVB, WHITE))
put(f'{PUB}/atlas-mark.svg', svg(MD, MVB, ICON_FG if V == 'A' else NAVY))
put(f'{PUB}/atlas-mark-white.svg', svg(MD, MVB, WHITE))
for f in ['atlas-logo', 'atlas-logo-clean', 'atlas-logo-final', 'atlas-logo-source', 'atlas-logo-transparent']:
    png(svg(WD, WVB, WM_COLOR), 1720, f'{PUB}/{f}.png')
for k in (1, 2, 3):
    sfx = '' if k == 1 else f'@{k}x'
    png(svg(WD, WVB, WM_COLOR), 130 * k, f'{PUB}/brand/atlas-logo-130{sfx}.png')
    png(svg(WD, WVB, WHITE), 130 * k, f'{PUB}/brand/atlas-logo-white-130{sfx}.png')

# favicons: rounded tile so the mark stays crisp on light and dark browser tabs
put(f'{PUB}/favicon.svg', tile(ICON_FG, ICON_BG, 0.80, 220))
png(tile(ICON_FG, ICON_BG, 0.86, 200), 16, f'{PUB}/favicon-16x16.png')
png(tile(ICON_FG, ICON_BG, 0.80, 200), 32, f'{PUB}/favicon-32x32.png')
ims = [Image.open(io.BytesIO(cairosvg.svg2png(bytestring=tile(ICON_FG, ICON_BG, fr, 200).encode(), output_width=sz))).convert('RGBA')
       for sz, fr in ((16, .86), (32, .80), (48, .80))]
ims[2].save(f'{PUB}/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)], append_images=ims[:2])
# app icons: full bleed (iOS / Android apply their own mask)
png(tile(ICON_FG, ICON_BG, 0.64), 180, f'{PUB}/apple-touch-icon.png')
for sz in (72, 96, 120, 128, 144, 152, 167, 180, 192, 512, 1024):
    png(tile(ICON_FG, ICON_BG, 0.64), sz, f'{PUB}/icons/icon-{sz}x{sz}.png')
for sz in (192, 512):   # maskable: mark inside the 80% safe circle
    png(tile(ICON_FG, ICON_BG, 0.52), sz, f'{PUB}/icons/maskable-{sz}x{sz}.png')
# exported sets, both colourways (+ the version's own)
for nm, fg, bg in (('indigo-on-white', INDIGO, WHITE), ('white-on-navy', WHITE, NAVY), ('white-on-indigo', WHITE, INDIGO), ('navy-on-white', NAVY, WHITE)):
    b = f'{PUB}/brand/icons/{nm}'
    put(f'{b}/app-icon.svg', tile(fg, bg, .64)); put(f'{b}/maskable.svg', tile(fg, bg, .52)); put(f'{b}/favicon.svg', tile(fg, bg, .80, 220))
    png(tile(fg, bg, .86, 200), 16, f'{b}/favicon-16.png'); png(tile(fg, bg, .80, 200), 32, f'{b}/favicon-32.png')
    for sz in (180, 192, 512): png(tile(fg, bg, .64), sz, f'{b}/icon-{sz}.png')
    for sz in (192, 512): png(tile(fg, bg, .52), sz, f'{b}/maskable-{sz}.png')

x, y, w, h = map(float, WVB.split()); mx, my, mw, mh = map(float, MVB.split())
jsx = f'''import React from 'react';

/** atlas wordmark: Deen's final logo (brand/logo-final/atlas-logo-deen.svg), path data unchanged.
 * Version {V}: wordmark {WM_COLOR}{' (navy)' if V == 'A' else ' (indigo)'} via the wrappers' CSS colour (inherits currentColor), white when inverted. Keeps the API: width 4.54em (or size * 4.54 px).
 * BrandMark = the orb "a" alone (the same two subpaths, split out of the compound path).
 */
const D = '{WD}';
const MARK = '{MD}';

export default function BrandWordmark({{ size, className, inverted = false }}) {{
  const width = size == null ? '4.54em' : size * 4.54;
  const height = size == null ? '{4.54 * h / w:.4f}em' : size * 4.54 * {h:g} / {w:g};
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="{WVB}"
      role="img" aria-label="atlas" focusable="false" className={{className}}
      style={{{{ display: 'inline-block', width, height, maxWidth: '100%', flexShrink: 0,
        verticalAlign: 'middle', color: inverted ? '#fff' : undefined }}}} fill="currentColor">
      <path fillRule="evenodd" d={{D}} />
    </svg>
  );
}}

export function BrandMark({{ size = 24, className, inverted = false }}) {{
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="{MVB}" role="img" aria-label="atlas"
      focusable="false" className={{className}} fill="currentColor"
      style={{{{ display: 'inline-block', height: size, width: size * {mw:g} / {mh:g}, flexShrink: 0,
        color: inverted ? '#fff' : '{ICON_FG if V == 'A' else NAVY}' }}}}>
      <path fillRule="evenodd" d={{MARK}} />
    </svg>
  );
}}
'''
put(f'{REPO}/src/components/common/BrandWordmark.jsx', jsx)
mp = f'{PUB}/manifest.json'; m = json.load(open(mp))
ic = [i for i in m['icons'] if 'maskable-' not in i['src']]
for i in ic: i['purpose'] = 'any'
ic += [{'src': f'/icons/maskable-{s}x{s}.png', 'sizes': f'{s}x{s}', 'type': 'image/png', 'purpose': 'maskable'} for s in (192, 512)]
m['icons'] = ic; open(mp, 'w').write(json.dumps(m, ensure_ascii=False, indent=2) + '\n')
print('exported', V, 'aspect', round(w / h, 4))
