# QA — iOS Face ID lock + notifications (04.11.2026, branch feat/ios-faceid-push)

Local demo build (`VITE_ALLOW_LOCAL_DEMO=true vite build` + prerender), Chromium headless shell, iPhone UA, he-IL,
Asia/Jerusalem. Native mode is simulated through **Capacitor's own bridge contract** (`window.Capacitor.PluginHeaders` +
`nativePromise` / `nativeCallback`), so the real plugin JS wrappers in the bundle run unchanged; only the native side
(Face ID result, permission, pending notifications, pause/resume events) is faked. Script: `native-sim.py`
(uses the shared stub in `work/a1104/common.py`). Screenshots: project `qa/ios-faceid-push/shots/` (390 and 320).

Result: **34/34 at 390, 34/34 at 320.** Overflow 0, taps < 44 px 0, axe serious/critical 0, console errors 0 on:
Face ID offer sheet, lock screen (cancelled + failed), Settings → אבטחה, notification pre-prompt, Settings → התראות.

Covered
- Offer shown once after sign-in; "כן" → one Face ID check → lock on for this account; never offered twice.
- Cold start locked, app `inert`; cancel → "נסו שוב" + "התנתקות"; failed face → "לא זיהינו אתכם. נסו שוב."; success → app usable.
- Background 4 min → privacy cover, then nothing (no prompt). Background 6 min → locked + Face ID asked.
- "התנתקות" from the lock → /login. Lock enabled by another account → not locked.
- Settings toggle: on/off, turning on asks Face ID first, a cancelled Face ID leaves it off with no error.
- Pre-prompt: not on first paint, not in the Face ID-offer session, shown on Today with upcoming arrivals; "הפעלת תזכורות" →
  iOS permission → reminders scheduled (all at 09:00 Asia/Jerusalem) + push registered; token kept locally and quiet without backend;
  a booking cancelled → its reminder removed on the next resume; not asked again; Settings card on, off cancels all.
- Web (not native): no lock / sheets, none of the plugin chunks requested.

Not testable here (real iPhone, see docs/ios-faceid-push.md §5): the actual Face ID / passcode sheet, the iOS permission dialog,
real backdrop blur (the headless shell does not paint backdrop-filter, so the screenshots show the glass without blur),
APNs token, delivery at 09:00, tap-to-open from a delivered notification.
