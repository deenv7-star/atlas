"""Extract stills at 2 fps (t = 0.25, 0.75, ... 23.75) from a render and build a labelled contact sheet.
Usage: python3 -I tools/frames.py out/atlas-v1-silent.mp4 out/frames out/contact-sheet-v1.png"""
import subprocess, sys, os
from PIL import Image, ImageDraw, ImageFont
src, outdir, sheet = sys.argv[1:4]
os.makedirs(outdir, exist_ok=True)
times = [0.25 + 0.5 * i for i in range(48)]
paths = []
for t in times:
    p = os.path.join(outdir, f'frame-{t:05.2f}s.png')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', src, '-frames:v', '1', p], check=True)
    paths.append((t, p))
cols, tw = 8, 270
th = int(tw * 1920 / 1080)
lab = 34
S = Image.new('RGB', (cols * (tw + 8) + 8, 6 * (th + lab + 8) + 8), (40, 42, 52))
d = ImageDraw.Draw(S)
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
except Exception:
    font = ImageFont.load_default()
for i, (t, p) in enumerate(paths):
    im = Image.open(p).convert('RGB').resize((tw, th), Image.LANCZOS)
    x = 8 + (i % cols) * (tw + 8); y = 8 + (i // cols) * (th + lab + 8)
    d.text((x + 4, y + 4), f't={t:.2f}s', fill=(255, 255, 255), font=font)
    S.paste(im, (x, y + lab))
S.save(sheet)
print('ok', len(paths))
