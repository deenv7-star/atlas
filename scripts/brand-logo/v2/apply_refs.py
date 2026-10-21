"""Cache-bust every logo/icon reference for logo v2 (run from repo root, once, after export_v2.py)."""
p = 'index.html'; s = open(p).read()
for f in ['/icons/icon-180x180.png', '/icons/icon-167x167.png', '/icons/icon-152x152.png', '/icons/icon-120x120.png',
          '/favicon-32x32.png', '/favicon-16x16.png', '/favicon.svg', '/favicon.ico', '/apple-touch-icon.png', '/manifest.json']:
    s = s.replace(f'href="{f}"', f'href="{f}?v=2"')
s = s.replace('og-image.png?v=6', 'og-image.png?v=7'); open(p, 'w').write(s)
p = 'scripts/prerender.mjs'; s = open(p).read(); open(p, 'w').write(s.replace('og-image.png?v=6', 'og-image.png?v=7'))
p = 'src/site/seo.js'; s = open(p).read()
open(p, 'w').write(s.replace("logo: `${SITE_ORIGIN}/icons/icon-512x512.png`", "logo: `${SITE_ORIGIN}/icons/icon-512x512.png?v=2`"))
p = 'src/components/app/IOSInstallBanner.jsx'; s = open(p).read()
open(p, 'w').write(s.replace('src="/apple-touch-icon.png"', 'src="/apple-touch-icon.png?v=2"'))
p = 'src/Layout.jsx'; s = open(p).read()
open(p, 'w').write(s.replace("link.href = '/favicon.svg';", "link.href = '/favicon.svg?v=2';"))
print('refs cache-busted')
