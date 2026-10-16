# Landing screenshots (real app captures)

The landing page shows real ATLAS screens, not mockups. All of them live in
`public/landing/screens/` and are referenced only from `src/components/landing/v2/content.js`
(`SCREENS`, `CROPS`, `CROPS_MOBILE`, `MOBILE_CLEANING`). To refresh them after the app redesign:

1. Run the app in local demo mode: `VITE_ALLOW_LOCAL_DEMO=true npx vite --port 5173`
2. `node scripts/landing-screens/cap.mjs 1440 900 raw/d /calendar "/dashboard||dashboard2|300" "/bookings||bookings2|330" /leads /payments "/messages|משפחת לוי" /cleaning`
3. `node scripts/landing-screens/cap.mjs 390 844 raw/m "/dashboard||dashboard2|420" "/calendar||calendar2|240" /bookings /leads /payments "/messages|משפחת לוי" "/cleaning||cleaning|260"`
   (route spec: `path|text to click|output name|scrollY`)
4. Convert to webp with the same file names:
   - desktop: resize to 1760 wide, `public/landing/screens/desktop/<name>.webp`
   - mobile: 780 wide, `public/landing/screens/mobile/<name>.webp`
   - crops: re-crop the same regions (calendar grid, calendar toolbar, tables, chat, KPIs) into `crops/` and `crops-m/`

`seed.mjs` holds the demo complex "נופי הגליל" (4 units, 18 bookings across the current month,
7 leads, payments, WhatsApp/SMS messages, cleaning tasks, reviews). Times are written for Asia/Jerusalem.
