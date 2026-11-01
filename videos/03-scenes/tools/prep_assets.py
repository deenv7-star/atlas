"""Copy the real captures needed by the film into assets/cap and cut alpha-keyed element crops.
Only background pixels connected to the crop border (the parent page/card colour) become transparent;
UI pixels are never altered. Run: python3 -I tools/prep_assets.py (from 03-scenes)."""
import json, shutil, os
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = '/home/user/atlas/videos/01-captures'
DST = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'cap')

FULL = {
 'iphone': ['calendar-full','calendar-slot-empty','lead-saved-toast','lead-saved-toast-slot-empty',
            'today-message-ready-full','today-welcome-row-slot-empty','whatsapp-composer-full',
            'whatsapp-composer-text-slot-empty','whatsapp-sent-toast','messages-welcome-sent',
            'messages-welcome-sent-slot-empty','receipts-before','receipts-before-status-slot-empty',
            'receipts-after','receipts-after-status-slot-empty'],
 'mac': ['channels-a-none','channels-b-booking-no-booking-bar','channels-b-booking',
         'channels-c-both-no-airbnb-bar','channels-c-both',
         'today-income-chart-slot-empty','report-full','report-kpis-slot-empty'],
}
# element crops: name -> (source file, key tolerance or None for rounded-rect only, corner radius css)
ELEM = {
 'iphone': {'el-calendar-saturday':3,'el-toast-lead-saved':6,'el-today-welcome-row':None,
            'el-whatsapp-welcome-text':6,'el-whatsapp-sent-bubble':6,'el-receipt-status-before':6,
            'el-receipt-status-after':6},
 'mac': {'el-booking-bar-b':6,'el-airbnb-bar-c':6,'el-booking-badge-b':6,'el-airbnb-badge-c':6,
         'el-report-kpis':6, **{f'seq-income-chart-{i:02d}':6 for i in range(8)}},
}

def key_border(im, tol):
    a = np.asarray(im.convert('RGBA')).copy()
    rgb = a[..., :3].astype(int)
    h, w = rgb.shape[:2]
    alpha = np.full((h, w), 255, np.uint8)
    for cy, cx in [(0, 0), (0, w-1), (h-1, 0), (h-1, w-1)]:
        c = rgb[cy, cx]
        near = np.abs(rgb - c).max(-1) <= tol
        lab, n = ndimage.label(near)
        l = lab[cy, cx]
        if l:
            alpha[lab == l] = 0
    # soft 1px feather on the cut edge
    soft = ndimage.uniform_filter(alpha.astype(float), 3)
    alpha = np.minimum(alpha, soft.astype(np.uint8) + (alpha == 255) * 0).astype(np.uint8)
    a[..., 3] = alpha
    return Image.fromarray(a)

def round_mask(im, r):
    im = im.convert('RGBA')
    w, h = im.size
    m = Image.new('L', (w*4, h*4), 0)
    from PIL import ImageDraw
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w*4-1, h*4-1], r*4, fill=255)
    m = m.resize((w, h), Image.LANCZOS)
    im.putalpha(m)
    return im

man = json.load(open(f'{SRC}/manifest.json'))
RADIUS = {'el-calendar-saturday':12,'el-toast-lead-saved':16,'el-today-welcome-row':16,'el-whatsapp-welcome-text':14,
          'el-receipt-status-before':12,'el-receipt-status-after':12,'el-booking-bar-b':12,'el-airbnb-bar-c':12,
          'el-booking-badge-b':9,'el-airbnb-badge-c':9}

def round_mask_keep(im, r):
    if not r: return im.convert('RGBA')
    im = im.convert('RGBA'); w, h = im.size
    from PIL import ImageDraw, ImageChops
    m = Image.new('L', (w*4, h*4), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w*4-1, h*4-1], r*4, fill=255)
    m = m.resize((w, h), Image.LANCZOS)
    im.putalpha(ImageChops.multiply(im.getchannel('A'), m))
    return im

bbox = {v['file']: v.get('bbox_css') for v in man['files']}
out = {'bbox': {}}
# slot-empty frames: some were captured a moment later than their parent (other parts of the page moved).
# Take the parent frame and paste ONLY the element's bbox (+ a small margin for its shadow) from the slot-empty
# frame, so the screen behind a lifted element is identical to the parent except for the empty slot.
by_file = {v['file']: v for v in man['files']}
for dev, names in FULL.items():
    os.makedirs(f'{DST}/{dev}', exist_ok=True)
    for n in names:
        v = by_file[f'{dev}/{n}.png']
        if v['kind'] == 'slot-empty':
            el = by_file[v['element']]
            parent = Image.open(f"{SRC}/{el['parent']}").convert('RGB')
            slot = Image.open(f'{SRC}/{dev}/{n}.png').convert('RGB')
            b = el['bbox_css']; m = 10
            box = (max(0, round(b['x']*3) - m), max(0, round(b['y']*3) - m),
                   min(parent.size[0], round((b['x']+b['w'])*3) + m), min(parent.size[1], round((b['y']+b['h'])*3) + m))
            parent.paste(slot.crop(box), box)
            parent.save(f'{DST}/{dev}/{n}.png')
        else:
            shutil.copy(f'{SRC}/{dev}/{n}.png', f'{DST}/{dev}/{n}.png')
for dev, names in ELEM.items():
    for n, tol in names.items():
        im = Image.open(f'{SRC}/{dev}/{n}.png')
        im = key_border(im, tol) if tol is not None else im
        im = round_mask_keep(im, RADIUS.get(n, 0)*3)
        im.save(f'{DST}/{dev}/{n}.png')
        out['bbox'][f'{dev}/{n}'] = bbox[f'{dev}/{n}.png']

print('ok', len(out['bbox']))

# Mac full frames: 4536x2946 (@3x) -> 3024x1964 (@2x, the MacBook Pro 14" native panel) to keep decode memory sane.
for n in FULL['mac']:
    p = f'{DST}/mac/{n}.png'
    im = Image.open(p)
    if im.size[0] == 4536:
        im.convert('RGB').resize((3024, 1964), Image.LANCZOS).save(p, optimize=False)
print('mac downscaled')
with open(os.path.join(DST, 'bbox.js'), 'w') as f:
    f.write('export default ' + json.dumps(out['bbox']) + ';\n')
