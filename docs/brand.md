# ATLAS brand system (single source of truth — landing + app + guest pages)

Owner rule (Deen, 16.10.2026): one unified language, one unified branding, one color system across EVERYTHING.

## Colors (CSS variables, same names everywhere) — EasyList palette, chosen by Deen 16.10.2026 13:43
- --brand-700 #2A1AC9 (pressed)
- --brand-600 #3E2BF1 PRIMARY electric indigo (buttons, links, active nav, logo mark, focus ring)
- --brand-500 #5545F0 (hover)
- --brand-100 #E4E1FD / --brand-50 #F1EFFE (tinted icon squares, selected rows, active nav bg)
- --navy-900 #1B2656 (headings, primary text, dark sections, sidebar title); --ink-600 #4A5578 secondary text; --ink-400 #8C93AB meta only
- --surface #FFFFFF / --canvas #F7F8FB (cool off-white page bg) / --line #E7E9F1
- --accent-amber #F8B040 (highlights, calendar events/"today", badges — sparingly)
- Status: success #22B07D, warning #E59A1F, danger #EF5B5B, info = brand-600
- Charts: income #7ED6A0-ish green #4CC38A, expenses #EF6B6B, profit brand-600
- Channels (calendar/badges, identical everywhere): Booking.com #1B2656 navy, Airbnb #EF5B5B, ישיר/direct #3E2BF1, אחר #8C93AB
- Dark sections: #1B2656 navy with indigo accents. Cards white, soft large-radius, airy. No glow orbs, no decorative gradients, no pastel gradient KPI cards.

## Type
- Heebo everywhere (self-hosted), weights 400/500/700/800. Numbers tabular-nums.
- Scale: 13 meta / 15 body (16 on mobile) / 18 lead / 22 h3 / 28 h2 / 40-56 h1 (landing). Line-height 1.5 body, 1.15 headings.

## Shape & depth
- Radius: 10 inputs/buttons, 14 cards, 20 sheets/modals, full for pills.
- Shadow: 0 1px 2px rgba(20,23,26,.06), 0 4px 16px rgba(20,23,26,.06). Borders --line 1px.
- Spacing 4-pt scale: 4 8 12 16 24 32 48 64.
- Icons: lucide, 1.75 stroke, 20px; inside a 36px tinted square (--brand-50) when used as a card icon. No emoji.
- Motion: 150-220ms, ease-out cubic-bezier(.2,.8,.2,1); press scale .98; respect prefers-reduced-motion.

## Logo
- Source of truth: Deen's final logo, docs/brand/atlas-logo-deen-source.svg (single compound path). Used exactly: the path data is unchanged; only the fill colour, the viewBox (padding trimmed) and the title ("atlas") differ. Never redraw, trace or re-letter it.
- Version B: indigo #3E2BF1 wordmark; symbol = white orb "a" on a navy #1B2656 tile (favicon, app icon).
- The symbol (app icon / favicon / avatar) is the orb "a" alone: the first two subpaths of the same compound path (arm + orb), split out with no new curves. Component: `BrandMark`; wordmark: `BrandWordmark` (same file).
- White on navy/indigo when inverted. Colours only #1B2656, #3E2BF1, white.
- Files: public/atlas-logo.svg (+ -navy / -indigo / -white), atlas-mark.svg, atlas-mark-white.svg, favicon.svg/.ico/16/32, apple-touch-icon.png, icons/icon-*.png, icons/maskable-192/512.png (mark inside the 80% safe zone), public/brand/icons/<colourway>/.
- Rebuild: `python3 scripts/brand-logo/export_final.py B .` (cairosvg + pillow), then OG: `OG_ONLY=1 CHROME=... node scripts/site-assets/gen-covers.mjs` and copy public/og/og-default.png to public/og-image.png.
- Heebo remains the interface/body typeface; never set the logo in a font.

## Voice (Hebrew)
- Speak to the owner in plural "אתם" (landing) / imperative short verbs in app buttons ("הוסיפו הזמנה" → app buttons use infinitive-free short form: "הזמנה חדשה", "שמירה", "שליחה בוואטסאפ").
- Warm, simple, concrete; no jargon, no hype, no exclamation spam, no em-dashes.
- Glossary (use exactly): הזמנה, אורח, ליד, נכס, יחידה, לוח שנה, תשלום, מקדמה, יתרה, ניקיון, הכנסות, הוצאות, הודעות, אוטומציות, ערוצים (Booking.com / Airbnb / ישיר).
- Dates: "יום ו׳, 16 באוק׳"; money: "‏₪1,250" (no decimals unless needed).
- Empty states: one sentence why + one primary action.


