# Logo v2 tooling (21.10.2026)

Deen approved replacing the live logo with his NEW wordmark (squared geometric lowercase "atlas", black on white, his
upload A4B4FCDC-10A4-498F-8E9D-45B346ED7A56-48533fe93d07.png) and NEW app icon (white single-stroke script "a" on
indigo, upload A0A632DD-35FC-4BF0-92A0-E51AC0C1FF96-1af3d8ebee54.png). Faithful vectorisation only, no redraw.

Pipeline (all from repo root):
1. `pip install scikit-image scipy cairosvg pillow numpy`
2. `python3 scripts/brand-logo/v2/trace.py <wordmark.png> <icon.png> --qa qa-dir` -> scripts/brand-logo/geom-v2.json
   (fails if wordmark overlay < 98%). First run on his PNGs: wordmark IoU 0.9976, 66 nodes (34 C + 32 exact H/V);
   icon IoU 0.9950, 31 C. The old brand/logo-script-v1/mark.svg only overlaps his new PNG at IoU ~0.79, so the icon is
   traced from his PNG, not reused.
3. `python3 scripts/brand-logo/export_v2.py .` -> public logos, favicons (16/32/48 + svg + ico), apple-touch 180,
   icons/icon-*, maskable 192/512, public/brand/icons/<colourway>, BrandWordmark.jsx, manifest ?v=2.
4. `python3 scripts/brand-logo/v2/apply_refs.py` -> ?v=2 on favicon/apple-touch/manifest links, og-image ?v=7,
   JSON-LD logo ?v=2, IOSInstallBanner, Layout favicon.
5. OG: `OG_ONLY=1 CHROME=<headless_shell> PLAYWRIGHT_CORE=<playwright-core> node scripts/site-assets/gen-covers.mjs`,
   then `cp public/og/og-default.png public/og-image.png`.
6. docs/brand.md: replace the Logo section with v2.

Colours: wordmark navy #1B2656 on light, white on navy/indigo; icon bg brand indigo #3E2BF1 (his PNG is #3E21FC-ish).
