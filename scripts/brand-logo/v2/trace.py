"""Trace Deen's two logo PNGs -> scripts/brand-logo/geom-v2.json (+ overlay diff PNGs in --qa).

python3 scripts/brand-logo/v2/trace.py WORDMARK.png ICON.png [--qa DIR]
  WORDMARK.png: black lowercase "atlas" on white (his upload A4B4FCDC-..., 2000x2000, ink bbox ~530..1469 x 831..1160)
  ICON.png:     white script "a" on an indigo square (his upload A0A632DD-..., 1254x1254, ink bbox ~160..1102 x 414..879)
Results on 21.10.2026: wordmark IoU 0.9976 (66 nodes: 34 C + 32 exact H/V), icon mark IoU 0.9950 (31 C).
Needs: pip install scikit-image scipy cairosvg pillow numpy
"""
import sys, os, io, re, json
import numpy as np, cairosvg
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fitlib import contours
from vectorize import vectorize, to_d

args = [a for a in sys.argv[1:] if not a.startswith('--')]
QA = sys.argv[sys.argv.index('--qa') + 1] if '--qa' in sys.argv else None
if QA: args = [a for a in args if a != QA]
WM_SRC, IC_SRC = args[0], args[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'geom-v2.json')


def ink_bbox(mask, pad):
    ys, xs = np.where(mask)
    return max(0, xs.min() - pad), max(0, ys.min() - pad), min(mask.shape[1], xs.max() + pad), min(mask.shape[0], ys.max() + pad)


def parse(D):
    toks = re.findall(r'[MLHVCZ]|-?[\d.]+', D); i = 0; cur = None; shapes = []; segs = None
    while i < len(toks):
        t = toks[i]; i += 1
        if t == 'M': cur = np.array([float(toks[i]), float(toks[i + 1])]); i += 2; segs = []
        elif t == 'H': b = np.array([float(toks[i]), cur[1]]); i += 1; segs.append(('L', cur, b)); cur = b
        elif t == 'V': b = np.array([cur[0], float(toks[i])]); i += 1; segs.append(('L', cur, b)); cur = b
        elif t == 'L': b = np.array([float(toks[i]), float(toks[i + 1])]); i += 2; segs.append(('L', cur, b)); cur = b
        elif t == 'C':
            c = [np.array([float(toks[i + 2 * k]), float(toks[i + 2 * k + 1])]) for k in range(3)]; i += 6
            segs.append(('B', cur, *c)); cur = c[2]
        elif t == 'Z': shapes.append(segs)
    return shapes


def bbox(shapes):
    pts = []; t = np.linspace(0, 1, 200)[:, None]
    for segs in shapes:
        for s in segs:
            if s[0] == 'L': pts += [s[1], s[2]]
            else:
                a, c1, c2, b = s[1:]; pts += list((1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * c1 + 3 * (1 - t) * t ** 2 * c2 + t ** 3 * b)
    P = np.array(pts); return P.min(0), P.max(0)


def overlay(D, ox, oy, ink, w, h, name):
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}"><rect width="{w}" height="{h}" fill="#fff"/>'
           f'<path fill-rule="evenodd" transform="translate({ox + 0.5} {oy + 0.5})" d="{D}"/></svg>')
    r = np.array(Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode()))).convert('L')) < 128
    iou = (r & ink).sum() / (r | ink).sum()
    if QA:
        os.makedirs(QA, exist_ok=True)
        diff = np.zeros(r.shape + (3,), np.uint8) + 255
        diff[ink & r] = (210, 210, 210); diff[ink & ~r] = (255, 0, 0); diff[r & ~ink] = (0, 120, 255)
        x0, y0, x1, y1 = ink_bbox(ink, 20); Image.fromarray(diff[y0:y1, x0:x1]).save(f'{QA}/overlay-{name}.png')
    return float(iou), int((r ^ ink).sum())


out = {}
# wordmark: ink = dark
g = np.array(Image.open(WM_SRC).convert('L'))
ink = g < 128; x0, y0, x1, y1 = ink_bbox(ink, 30)
cs = [c + [x0, y0] for c in contours(g[y0:y1, x0:x1], up=4, sigma=1.2)]
wm = vectorize(cs, err=0.5)
# icon: ink = white strokes on indigo -> invert so ink is dark for the tracer
a = np.array(Image.open(IC_SRC).convert('RGB')).astype(float)
gi = (255 - np.clip((a[:, :, 0] + a[:, :, 1]) / 2, 0, 255)).astype(np.uint8)
inki = gi < 128; X0, Y0, X1, Y1 = ink_bbox(inki, 30)
csi = [c + [X0, Y0] for c in contours(gi[Y0:Y1, X0:X1], up=3, sigma=1.5)]
mk = vectorize(csi, err=0.6, cornerAng=np.radians(50), minLine=1e9)
for name, shapes, ink_m, size in (('wm', wm, ink, g.shape), ('mark', mk, inki, gi.shape)):
    mn, mx = bbox(shapes); ox, oy = mn
    d = to_d(shapes, ox=ox, oy=oy, prec=2)
    W, H = round(float(mx[0] - mn[0]), 2), round(float(mx[1] - mn[1]), 2)
    iou, xor = overlay(d, ox, oy, ink_m, size[1], size[0], name)
    out[name + '_d'] = d; out[name + '_vb'] = f'0 0 {W:g} {H:g}'
    out[name + '_origin_in_source_px'] = [round(float(ox) + 0.5, 3), round(float(oy) + 0.5, 3)]
    out[name + '_source_size'] = [int(size[1]), int(size[0])]
    out[name + '_iou'] = round(iou, 5)
    print(name, out[name + '_vb'], 'IoU %.4f xor %d nodes %d' % (iou, xor, len(re.findall('[LHVC]', d))))
json.dump(out, open(OUT, 'w'), indent=1)
print('wrote', os.path.abspath(OUT))
if out['wm_iou'] < 0.98: sys.exit('wordmark overlay below 98%')
