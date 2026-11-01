"""Contact sheet of every capture listed in manifest.json -> contact.png.  Run: python3 -I lib/contact_sheet.py"""
import json, os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = json.load(open(os.path.join(HERE, 'manifest.json')))['files']
order = {'full': 0, 'slot-empty': 1, 'element': 2, 'sequence-frame': 3}
files.sort(key=lambda m: (m['device'], m['file']))

CELL_W, THUMB_H, LABEL_H, PAD, COLS = 300, 300, 34, 14, 10
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 11)
    head = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
except OSError:
    font = head = ImageFont.load_default()

sections = []
for dev in ('iphone', 'mac'):
    sections.append((dev, [m for m in files if m['device'] == dev]))

rows_total = sum((len(items) + COLS - 1) // COLS for _, items in sections)
W = COLS * (CELL_W + PAD) + PAD
H = rows_total * (THUMB_H + LABEL_H + PAD) + len(sections) * 50 + PAD
sheet = Image.new('RGB', (W, H), (247, 248, 251))
d = ImageDraw.Draw(sheet)
y = PAD
for dev, items in sections:
    d.text((PAD, y + 10), f'{dev}  ({len(items)} files, deviceScaleFactor 3)', fill=(27, 38, 86), font=head)
    y += 50
    for i, m in enumerate(items):
        c, r = i % COLS, i // COLS
        x0 = PAD + c * (CELL_W + PAD)
        y0 = y + r * (THUMB_H + LABEL_H + PAD)
        im = Image.open(os.path.join(HERE, m['file'])).convert('RGB')
        im.thumbnail((CELL_W, THUMB_H))
        bg = {'full': (255, 255, 255), 'slot-empty': (255, 236, 236), 'element': (233, 230, 254), 'sequence-frame': (230, 246, 236)}[m['kind']]
        d.rectangle([x0, y0, x0 + CELL_W, y0 + THUMB_H], fill=bg)
        sheet.paste(im, (x0 + (CELL_W - im.width) // 2, y0 + (THUMB_H - im.height) // 2))
        name = os.path.basename(m['file'])
        d.text((x0, y0 + THUMB_H + 3), name[:46], fill=(27, 38, 86), font=font)
        d.text((x0, y0 + THUMB_H + 17), m['kind'], fill=(62, 43, 241), font=font)
    y += ((len(items) + COLS - 1) // COLS) * (THUMB_H + LABEL_H + PAD)
sheet.save(os.path.join(HERE, 'contact.png'), optimize=True)
print('contact.png', sheet.size)
