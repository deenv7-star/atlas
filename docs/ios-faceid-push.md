# iOS app: Face ID lock + notifications (branch `feat/ios-faceid-push`, 04.11.2026)

Everything here runs **only in the iOS app** (`isNativeApp()`); atlas-il.com is unchanged and never loads the plugins
(they are imported lazily inside native-only components).

## 1. Face ID app lock

| | |
|---|---|
| Plugin | `@capgo/capacitor-native-biometric` **8.9.1** (already in the app for the login-screen Face ID; Capacitor ≥8 peer; SPM) |
| Offer | Once, after the first sign-in, on an app screen: sheet **"לפתוח את atlas עם Face ID?"** → "כן, להפעיל Face ID" / "לא עכשיו". Accepting runs one real Face ID check (this is also when iOS shows its Face ID permission with the `NSFaceIDUsageDescription` text). |
| When it locks | Cold start, and coming back after **more than 5 minutes** in the background (`@capacitor/app` `pause` / `resume`). Under 5 minutes: no prompt. |
| Privacy cover | On `pause` the app is covered by the same blurred glass at once, so the iOS app switcher snapshot shows no guest data. Removed on return (or turns into the lock after 5 minutes). |
| Lock screen | Blurred navy glass over the app, the living glow face, "ברוכים השבים", Face ID asked automatically. Passcode fallback is iOS's own (`useFallback: true` → `LAPolicy.deviceOwnerAuthentication`). On cancel / failure: **"נסו שוב"** and **"התנתקות"**. The app behind is `inert` (no taps, no VoiceOver). |
| Settings | הגדרות → אבטחה → **"פתיחה עם Face ID"** (בכל פתיחה, ואחרי 5 דקות ברקע). Turning it on asks Face ID first; off needs nothing. |
| Account | The lock belongs to the account that turned it on (`atlas.applock.v1 = { enabled, userId, offered }` in localStorage). Another account signed in on the same phone is never locked out by it. |
| Info.plist | `NSFaceIDUsageDescription` = "Face ID פותח את atlas רק לכם, בלי להקליד סיסמה." |

### What the lock is (and is not) — security note
- **The Supabase session stays exactly where Supabase keeps it** (its own storage, as without the lock). The lock does not
  move, copy, encrypt or wrap the session; it only gates the UI. Turning it on/off never signs anyone out.
- It protects against someone who picks up an unlocked phone and opens atlas. It is not a defence against a jailbroken
  device or someone with the device passcode (iOS falls back to the passcode by design).
- The same switch also turns on the existing login-screen "כניסה עם Face ID" (a Keychain copy of the refresh token,
  `src/lib/auth/biometric.js`, biometry-protected, removed on sign-out). That part pre-dates this branch; it is best effort
  here and never blocks the lock. One switch = one idea for the owner: "atlas opens with Face ID".
- Sign-out from the lock screen = the normal sign-out (Keychain copy removed, push token forgotten, reminders cancelled).

Code: `src/lib/nativeApp/appLockCore.js` (pure, `tests/unit/appLock.test.mjs`), `src/lib/nativeApp/appLock.js`,
`src/components/nativeApp/AppLockHost.jsx` + `appLock.css`, `src/components/auth/NativeAuthHost.jsx` (offer),
`src/components/settings/BiometricSetting.jsx` (toggle), `src/App.jsx` (cold-start cover decided before first render).

## 2. Notifications

| | |
|---|---|
| Plugins | `@capacitor/push-notifications` **8.1.3**, `@capacitor/local-notifications` **8.3.1** (both peer `@capacitor/core >=8`) |
| Pre-prompt | Never on first launch. Shown once the moment is right: signed in, on Today / bookings / calendar, at least one upcoming arrival, no other one-time sheet this session (the Face ID offer), not asked in the last 7 days, at most 3 times. Sheet: **"להזכיר לכם על אורחים שמגיעים?"** / "ב-9:00 בבוקר של יום ההגעה. אפשר לכבות בהגדרות." → "הפעלת תזכורות" (then the iOS dialog) / "לא עכשיו". |
| Check-in reminder (works now, no server) | Local notification at **09:00 Asia/Jerusalem** on each arrival day (IST/IDT handled, independent of the phone's time zone). One per day: "הגעה היום: נועה לוי" / "הזית, כניסה מ-15:00", or "3 הגעות היום" / names. Cancelled / waitlist / blocked ("חסום…") bookings are skipped. Recomputed on every app open and every return to the app, **diffed** against what iOS holds: unchanged = kept, moved/renamed = cancelled + rescheduled, cancelled booking = removed. Max 40 pending (iOS limit 64). Tap → the booking (`/booking/:id`) or Today. |
| Settings | הגדרות → התראות → **"תזכורת בבוקר של הגעה"** on/off (off cancels all). If iOS notifications are off: says to turn them on in iPhone Settings → atlas. |
| Push (client) | After permission: `PushNotifications.register()` → APNs token → `rpc('register_device_token')`. **The table / RPC does not exist yet**: the error is recognised (PGRST202 / 42P01 / PGRST205), nothing is shown, the token is kept locally and retried on the next open. Sign-out calls `unregister_device_token` (best effort). Tap on a push → `data.path` (in-app paths only). |
| Native | `AppDelegate.swift` forwards `didRegisterForRemoteNotificationsWithDeviceToken` / `didFail…` to Capacitor. `App.entitlements`: `aps-environment = development` (Xcode's default; the App Store/TestFlight export re-signs with the distribution profile's `production`). `project.pbxproj`: `SystemCapabilities → com.apple.Push enabled`. `capacitor.config.json`: `PushNotifications.presentationOptions = badge, sound, alert` (banner while the app is open). |

Code: `src/lib/nativeApp/notifyCore.js` (pure, `tests/unit/notify.test.mjs`), `src/lib/nativeApp/notify.js`,
`src/components/nativeApp/NotifyHost.jsx`, `src/components/settings/NativeNotifySetting.jsx`, sign-out hook in `src/api/client.js`.

## 3. Server side — PREPARED, NOT APPLIED (needs Deen's OK)

### (a) Migration `supabase/migrations/029_device_tokens.sql` (+ rollback `supabase/checks/029_rollback.sql`)
- `public.device_tokens` (user_id → auth.users cascade, org_id → organizations cascade, token unique + hex check,
  environment production|sandbox, last_sent_at, disabled_at, last_error).
- RLS on: owners can **select / delete their own** rows; no direct insert/update from the app.
- `register_device_token(p_token, p_environment, p_app_version)` SECURITY DEFINER, `search_path` fixed: upserts by token and
  **moves** a phone to the calling owner + `current_org_id()` (a shared phone changing accounts works despite RLS).
- `unregister_device_token(p_token)` deletes only the caller's row.
- Explicit grants (Supabase stopped auto-granting new tables 30.10.2026): authenticated select/delete + execute; anon nothing.
- Additive only; the app works with or without it.

### (b) Edge function `supabase/functions/send-push/index.ts` (written, **not deployed**)
- APNs HTTP/2 with **token auth** (ES256 JWT from the .p8 via WebCrypto, cached 50 min), `apns-topic com.atlas-il.app`,
  `apns-push-type alert`, 24 h expiry, `thread-id` per event.
- Server-only: header `x-atlas-push: <ATLAS_PUSH_SECRET>` (plus the usual service-role `Authorization` for the gateway).
  An owner JWT is refused, so the app can never push to other users.
- Body `{ user_ids? | org_id?, event, title, body, path?, badge? }`; events whitelisted (below).
- 410 / BadDeviceToken / Unregistered → token disabled; a production BadDeviceToken is retried once on sandbox (Xcode builds) and the row corrected.
- Secrets to set at deploy: `APNS_KEY_ID`, `APNS_TEAM_ID=RLBJU5DAPA`, `APNS_PRIVATE_KEY` (.p8 text), `APNS_BUNDLE_ID=com.atlas-il.app`, `ATLAS_PUSH_SECRET`.

### (c) APNs auth key (.p8) — not created; exact steps for Deen
1. developer.apple.com → Account → **Certificates, Identifiers & Profiles → Keys → +**.
2. Key name "atlas APNs", tick **Apple Push Notifications service (APNs)** → Configure → Environment **Sandbox & Production**,
   Key restriction **Team Scoped (All Topics)** → Save → Continue → **Register**.
3. **Download** `AuthKey_XXXXXXXXXX.p8` (only downloadable once) and note the **Key ID** (10 chars). Team ID is `RLBJU5DAPA`.
4. Do not email/commit it. Send it to Hark through the secure vault form ("Hark Secured Login" / API key) — Hark then sets
   the Supabase function secrets. One key works for every app in the team (also הכיס later).

### (d) Which events trigger a push — proposal, Deen to choose
| Event | Trigger (server) | Example text | Default |
|---|---|---|---|
| `lead_new` | insert into `leads` (site form / WhatsApp link) | "פנייה חדשה: דנה שמש" / "זוג, סוף השבוע הבא" | on |
| `booking_new` | insert into `bookings` from Booking/Airbnb sync or the direct-booking page (not ones the owner typed) | "הזמנה חדשה: 12–14.11, הזית" | on |
| `payment_received` | `payments` row becomes PAID (Stripe/Bit/PayBox webhook) | "התקבל תשלום: ₪1,200 מנועה לוי" | on |
| `checkin_today` | pg_cron 09:00 IL | "2 הגעות היום" | **off** while the local reminder covers it (avoid doubles); on only if Deen wants it on every phone of the org / web too |
Wiring (later, after approval): Database Webhooks or `pg_net` triggers → `send-push` with the secret. Quiet hours / Shabbat
(like automation-runner) to decide.

## 4. Codemagic signing and the push entitlement
- `codemagic.yaml` uses **automatic signing** (`ios_signing: distribution_type app_store`, integration `HakIs_ASC_API`), which
  fetches/creates the App Store profile for `com.atlas-il.app` at build start.
- A provisioning profile only contains `aps-environment` when the **App ID has the Push Notifications capability**. Codemagic's
  `fetch-signing-files` does not turn capabilities on. If the App ID lacks Push, the next build fails at signing
  ("Provisioning profile … doesn't include the aps-environment entitlement").
- **Needs approval before doing (not done):**
  1. Enable Push Notifications on the App ID: developer.apple.com → Identifiers → `com.atlas-il.app` → tick **Push Notifications** → Save
     (no certificate needed with token auth). Or via the same API key:
     `app-store-connect bundle-ids list --bundle-id-identifier com.atlas-il.app --strict-match-identifier --platform IOS --json` → id,
     then `app-store-connect bundle-ids enable-capabilities <ID> --capability "Push Notifications"`.
     (Check **Sign In with Apple** on the same screen too: `App.entitlements` already has `com.apple.developer.applesignin` since 03.11.)
  2. Apple marks the existing App Store profile **Invalid**. The next Codemagic build should create a fresh one (it only uses valid
     profiles); if it still picks the old one, delete it in Profiles and start the build again.
  3. Then start `atlas_ios_testflight` on this branch.

## 5. Real-iPhone test checklist (TestFlight)
Face ID
- [ ] Fresh install → sign in → after ~1 s the sheet "לפתוח את atlas עם Face ID?" appears once; "כן" → iOS asks the Face ID permission (Hebrew text) → Face ID → sheet closes.
- [ ] Kill the app → open → blurred lock with the face → Face ID → in. Cancel → "נסו שוב" / "התנתקות" both work.
- [ ] Wrong face twice → iOS offers the passcode → passcode → in.
- [ ] Home for 1 min → back: no prompt. App switcher shows the blurred cover, not guest data.
- [ ] Home for 6 min → back: lock + Face ID.
- [ ] Settings → אבטחה → switch off → kill/open: no lock. On again → Face ID asked.
- [ ] "התנתקות" from the lock → /login; sign in with password → works; the lock comes back on the next cold start.
- [ ] Face ID turned off in iPhone Settings → atlas: lock falls back to the passcode.
Notifications
- [ ] First launch: no notification question. After the Face ID offer session, next open on Today with an upcoming arrival → Hebrew sheet → "הפעלת תזכורות" → iOS dialog → Allow.
- [ ] Booking arriving tomorrow → a notification at **09:00** (to test now: create a booking for tomorrow, set the phone clock to 08:59 tomorrow).
- [ ] Move that booking to another day / cancel it → open the app → the reminder moves / disappears (Settings → Notifications on the iPhone shows nothing pending for the old day).
- [ ] Tap the reminder → opens that booking.
- [ ] Settings → התראות → "תזכורת בבוקר של הגעה" off → no reminders; iOS notifications off → the card says so.
- [ ] Push: Xcode console / Safari Web Inspector shows the APNs token after Allow (no error toast while migration 029 is not applied).
- [ ] After (a)–(c) are approved and applied: `send-push` test with `event=lead_new` to Deen's user id → banner on the lock screen and inside the app.
