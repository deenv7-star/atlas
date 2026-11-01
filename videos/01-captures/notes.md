# 01-captures: how these screenshots were made

Every PNG here is a real frame of the real atlas UI: a local **production** build (`vite build`) in local demo mode
(no Supabase, no API; the app falls back to its own localStorage store, `src/api/client.js` LocalEntityCollection).
Nothing outside `videos/` was edited. All data manipulation happens at runtime in the browser.

## Run it

```bash
cd /home/user/atlas
npm ci                                   # only if node_modules is missing (lockfile untouched)
VITE_ALLOW_LOCAL_DEMO=true npx vite build --outDir videos/01-captures/build/dist --emptyOutDir
node videos/01-captures/capture.mjs                       # everything (~10 min)
node videos/01-captures/capture.mjs --only=whatsapp --devices=mac   # a subset; manifest.json is merged
python3 -I videos/01-captures/lib/contact_sheet.py         # rebuild contact.png from manifest.json
```

- `VITE_ALLOW_LOCAL_DEMO=true` is the app's own flag for local demo builds: it turns on demo portraits/unit photos
  (`src/lib/demoPeople.js`, `src/lib/stay/unitPhoto.js`). `build/` is git-ignored (`.gitignore` here).
- Playwright: `require('playwright')`, falling back to `/opt/node-tools/node_modules/playwright` (where it is installed here).
- `capture-log.txt` holds the log of the **last** run only (the final full run was followed by a `--only=lead` rerun).

## What the script does

- Serves `build/dist` through Playwright request interception under the origin **https://atlas-il.com** (no network
  request leaves the machine for it). Reason: the app builds guest links from `window.location.origin`; serving on
  127.0.0.1 put `http://127.0.0.1:4917/g/...` into the WhatsApp text. Now the text reads `https://atlas-il.com/g/...`.
- Seeds localStorage (`lib/seed.mjs`) with a fictional business "צימרי נוף הגליל" (3 units: בקתת האלון, סוויטת הגפן,
  צימר הזית), bookings, payments, expenses, receipts, leads and the 4 guest-journey automation rules (saved in exactly
  the shape `src/lib/real/journey.js ruleForStep` saves them). User is an active subscriber so no trial banner.
- Freezes the clock (`page.clock.setFixedTime`): Wed 4.11.2026 23:40 (calendar, lead, channels), Fri 6.11.2026 15:00
  (WhatsApp), Mon 30.11.2026 20:00 (finance). Locale he-IL, timezone Asia/Jerusalem, Chromium started with
  `LANG=he_IL.UTF-8` so native date/time inputs show Israeli format (07.11.2026, 16:00).
- Viewports: iPhone 393x852 (mobile, touch) and MacBook 1512x982, deviceScaleFactor 3
  (PNG = 1179x2556 and 4536x2946). Service workers blocked.
- Entrance animations are finished before each still; screenshots use `animations: 'disabled'`.
- Real flows are driven by clicks: the new lead is typed into the real form and saved; the WhatsApp welcome is opened
  from the Today board and "sent" with the real button (the `wa.me` tab is intercepted and closed; the app then logs
  it in message_logs exactly as it does for a user). Before/after states (channel bookings, receipt status, expenses)
  are separate seeded stores.
- Element crops (`el-*.png`) are cut from the same viewport frame as their parent full screenshot (`page.screenshot`
  with `clip` = the element's bounding box), so `bbox_css` in manifest.json maps 1:1 onto the parent
  (multiply by 3 for PNG pixels). `*-slot-empty.png` = the same frame with that element set to `visibility:hidden`
  at runtime (an empty slot of the exact size where it was).
- `seq-income-chart-00..07.png`: the real CSS bar-growth animation (`.v7-bar`, 425 ms) paused via the Web Animations
  API and stepped to 8 evenly spaced times.

## Runtime-only hiding (never in source)

- `.sp-launcher` (floating "עזרה" help button) hidden on every frame, so it does not cover content.
- Automations page: the demo-only card "ההודעות האוטומטיות יעבדו אחרי שתתחברו לחשבון. בהדגמה רק רואים איך זה נראה."
  is hidden (it appears only in local demo mode, never on a real account).
- **Payment link (rule 6):** no captured screen contains a payment-link button. Before every full frame the script scans
  the page text for payment-link wording (`קישור תשלום`, `לינק לתשלום`, `תשלום בלינק`, `payment link`) and records
  `payment_link_text_in_dom` in manifest.json: false on all 53 full frames. The only place the feature is mentioned in
  the app (Integrations > תשלומים: "קישור תשלום למקדמה (Grow / PayPlus)", marked coming soon) is never opened.
  Note: the receipt preview shows the standard document lines "סה״כ לתשלום" / "תאריך לתשלום" (amount/date due on
  the document) — that is not a payment link.

## Known quirks visible in frames

- iCal imports carry no guest name or price (that is how `supabase/functions/ical-sync` writes them), so the channel
  stays are labelled "הזמנה" in the calendar and "אורח" on the Today board. This is the honest look.
- For the month-end finance stage the two channel stays got a name and price (as if the owner filled them in on the
  booking), otherwise the monthly report would count ₪0 for those channels.
- The Hebrew year under the month title renders as digits ("5787") — that is how the app's Intl call renders in Chromium.
- `clipped_to_viewport: true` in the manifest marks 4 crops taller than the viewport (iPhone Today card, iPhone and Mac
  report expenses block, iPhone expense row): the crop holds only the visible part.

## Sources for real-world objects
None built here: this folder only contains screen captures. Device frames (iPhone, MacBook) are built in 03-scenes.
