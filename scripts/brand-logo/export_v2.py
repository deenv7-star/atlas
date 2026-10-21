"""Logo v2 (Deen, 21.10.2026) -> repo assets.

Geometry: scripts/brand-logo/geom-v2.json, made by scripts/brand-logo/v2/trace.py from Deen's own two PNGs
(wordmark: squared geometric lowercase "atlas"; icon: single-stroke script "a" on an indigo square).
Straight edges are exact H/V lines, curves are G1 cubic Beziers; overlay IoU vs his PNGs is stored in the json.
Never redraw or re-letter: change the source PNG and re-run the tracer instead.

python3 scripts/brand-logo/export_v2.py <repo>
"""
import sys, os, io, json
import cairosvg
from PIL import Image

REPO = sys.argv[1] if len(sys.argv) > 1 else '.'
G = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'geom-v2.json')))
NAVY, INDIGO, WHITE = '#1B2656', '#3E2BF1', '#FFFFFF'
PUB = f'{REPO}/public'
WD, WVB, MD, MVB = G['wm_d'], G['wm_vb'], G['mark_d'], G['mark_vb']
_, _, WW, WH = map(float, WVB.split())
_, _, MW, MH = map(float, MVB.split())
# Deen's icon composition (his square PNG): mark origin and width relative to the tile
SRC_TILE = float(G.get('mark_source_size', [1254, 1254])[0])
MO_X, MO_Y = G['mark_origin_in_source_px']
HIS_FRAC = MW / SRC_TILE                      # mark width / tile width in his PNG (~0.75)
HIS_CX = (MO_X + MW / 2) / SRC_TILE           # mark centre in his PNG (fraction of tile)
HIS_CY = (MO_Y + MH / 2) / SRC_TILE


def svg(d, vb, fill):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="atlas"><title>atlas</title>'
            f'<path fill="{fill}" fill-rule="evenodd" d="{d}"/></svg>')


def tile(fg, bg, frac=HIS_FRAC, rx=0, cx=HIS_CX, cy=HIS_CY, grow=0.0):
    """Square tile with the mark; frac = mark width / tile. grow = optical stroke for tiny favicons (path units)."""
    S = 1000; s = S * frac / MW
    tx = S * cx - MW * s / 2; ty = S * cy - MH * s / 2
    bgel = f'<rect width="{S}" height="{S}" rx="{rx}" fill="{bg}"/>' if bg else ''
    st = f' stroke="{fg}" stroke-width="{grow}" stroke-linejoin="round"' if grow else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}"><title>atlas</title>{bgel}'
            f'<path transform="matrix({s:.5f} 0 0 {s:.5f} {tx:.2f} {ty:.2f})" fill="{fg}" fill-rule="evenodd"{st} d="{MD}"/></svg>')


def put(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'w').write(s)


def png(s, w, p):
    os.makedirs(os.path.dirname(p), exist_ok=True); cairosvg.svg2png(bytestring=s.encode(), write_to=p, output_width=w)


def png_im(s, w):
    return Image.open(io.BytesIO(cairosvg.svg2png(bytestring=s.encode(), output_width=w))).convert('RGBA')


# --- wordmark
put(f'{PUB}/atlas-logo.svg', svg(WD, WVB, NAVY))
put(f'{PUB}/atlas-logo-navy.svg', svg(WD, WVB, NAVY))
put(f'{PUB}/atlas-logo-indigo.svg', svg(WD, WVB, INDIGO))
put(f'{PUB}/atlas-logo-white.svg', svg(WD, WVB, WHITE))
for f in ['atlas-logo', 'atlas-logo-clean', 'atlas-logo-final', 'atlas-logo-source', 'atlas-logo-transparent']:
    png(svg(WD, WVB, NAVY), 1720, f'{PUB}/{f}.png')
for k in (1, 2, 3):
    sfx = '' if k == 1 else f'@{k}x'
    png(svg(WD, WVB, NAVY), 130 * k, f'{PUB}/brand/atlas-logo-130{sfx}.png')
    png(svg(WD, WVB, WHITE), 130 * k, f'{PUB}/brand/atlas-logo-white-130{sfx}.png')

# --- mark alone (transparent)
put(f'{PUB}/atlas-mark.svg', svg(MD, MVB, INDIGO))
put(f'{PUB}/atlas-mark-white.svg', svg(MD, MVB, WHITE))

# --- favicons: rounded indigo tile, mark larger than on the app icon so it reads at 16/32 px.
# Optical weight only (grow) at 16/32 px: the stroke is otherwise ~1.2 px at 16 px. Shape unchanged.
FAV = dict(frac=0.84, rx=220, cx=0.5, cy=0.5)
put(f'{PUB}/favicon.svg', tile(WHITE, INDIGO, **FAV))
f16 = tile(WHITE, INDIGO, frac=0.88, rx=200, cx=0.5, cy=0.5, grow=36)
f32 = tile(WHITE, INDIGO, frac=0.86, rx=200, cx=0.5, cy=0.5, grow=16)
f48 = tile(WHITE, INDIGO, frac=0.84, rx=200, cx=0.5, cy=0.5)
png(f16, 16, f'{PUB}/favicon-16x16.png')
png(f32, 32, f'{PUB}/favicon-32x32.png')
ims = [png_im(f16, 16), png_im(f32, 32), png_im(f48, 48)]
ims[2].save(f'{PUB}/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)], append_images=ims[:2])

# --- app icons: full-bleed brand indigo #3E2BF1, Deen's own composition (iOS/Android apply their corner mask).
# Checked 21.10: farthest ink point 0.406 of the tile from centre, clear of the iOS corner squircle.
APP = tile(WHITE, INDIGO)
png(APP, 180, f'{PUB}/apple-touch-icon.png')
for sz in (72, 96, 120, 128, 144, 152, 167, 180, 192, 512, 1024):
    png(APP, sz, f'{PUB}/icons/icon-{sz}x{sz}.png')
# maskable: whole mark inside the 80% safe circle (frac .62 -> farthest ink point 0.337 of the tile from centre)
MASK = tile(WHITE, INDIGO, frac=0.62, cx=0.5, cy=0.5)
for sz in (192, 512):
    png(MASK, sz, f'{PUB}/icons/maskable-{sz}x{sz}.png')

# --- exported sets per colourway
for nm, fg, bg in (('white-on-indigo', WHITE, INDIGO), ('white-on-navy', WHITE, NAVY), ('indigo-on-white', INDIGO, WHITE), ('navy-on-white', NAVY, WHITE)):
    b = f'{PUB}/brand/icons/{nm}'
    put(f'{b}/app-icon.svg', tile(fg, bg)); put(f'{b}/maskable.svg', tile(fg, bg, frac=0.62, cx=0.5, cy=0.5)); put(f'{b}/favicon.svg', tile(fg, bg, **FAV))
    png(tile(fg, bg, frac=0.88, rx=200, cx=0.5, cy=0.5, grow=36), 16, f'{b}/favicon-16.png')
    png(tile(fg, bg, frac=0.86, rx=200, cx=0.5, cy=0.5, grow=16), 32, f'{b}/favicon-32.png')
    for sz in (180, 192, 512): png(tile(fg, bg), sz, f'{b}/icon-{sz}.png')
    for sz in (192, 512): png(tile(fg, bg, frac=0.62, cx=0.5, cy=0.5), sz, f'{b}/maskable-{sz}.png')

# --- React component. Height kept identical to v1 (1.3599em / size*1.3599) so headers do not shift; width follows the new aspect.
H_EM = 1.3599
W_EM = round(H_EM * WW / WH, 4)
jsx = f'''import React from 'react';

/** atlas logo v2 (Deen, 21.10.2026): faithful vector of his squared geometric lowercase "atlas" wordmark
 * and his single-stroke script "a" icon. Source + tracer: scripts/brand-logo/geom-v2.json, scripts/brand-logo/v2/.
 * Wordmark inherits currentColor (wrappers set navy #1B2656 on light), white when inverted.
 * Same API as before: height {H_EM}em (or size * {H_EM} px); width follows the wordmark aspect ({WW / WH:.4f}).
 * BrandMark = the script "a" icon mark (indigo on light, white when inverted).
 */
const D = '{WD}';
const MARK = '{MD}';

export default function BrandWordmark({{ size, className, inverted = false }}) {{
  const width = size == null ? '{W_EM}em' : size * {W_EM};
  const height = size == null ? '{H_EM}em' : size * {H_EM};
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
      style={{{{ display: 'inline-block', height: size, width: size * {MW:g} / {MH:g}, flexShrink: 0,
        color: inverted ? '#fff' : '{INDIGO}' }}}}>
      <path fillRule="evenodd" d={{MARK}} />
    </svg>
  );
}}
'''
put(f'{REPO}/src/components/common/BrandWordmark.jsx', jsx)

# --- manifest: cache-busted icon urls
V = 'v=2'
mp = f'{PUB}/manifest.json'; m = json.load(open(mp))
for i in m['icons']:
    i['src'] = i['src'].split('?')[0] + '?' + V
open(mp, 'w').write(json.dumps(m, ensure_ascii=False, indent=2) + '\n')
print('exported logo v2; wordmark aspect', round(WW / WH, 4), 'width em', W_EM)
