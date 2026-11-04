# atlas iOS — ready for a Codemagic TestFlight build (branch `feat/ios-prep`)

Status 02.11.2026 ~23:30 IST: branch merged with main (320430f), web build + `npx cap sync ios` + 128 unit tests pass locally.
Not merged to main. Draft PR #177.

## What the workflow uses
- Workflow: `atlas_ios_testflight` (codemagic.yaml), manual start only.
- App Store Connect integration: **`HakIs_ASC_API`** — the same Codemagic "Developer Portal" integration as HaKis
  (copied from deenv7-star/hakis codemagic.yaml). It is the team's App Store Connect API key, so it works for any app in the same Apple team.
- Bundle id `com.atlas-il.app`, automatic signing (`distribution_type: app_store`), Internal TestFlight only
  (`testFlightInternalTestingOnly`, `submit_to_testflight: false` — same as HaKis; external review would 422).
- Node 22 (Capacitor 8 CLI requires it; the earlier draft had 20, which would have failed `cap sync`), Xcode latest, mac_mini_m2.
- Web build vars set directly in the yaml (public values, same as atlas-il.com):
  `VITE_SUPABASE_URL=https://romvmqbcinurscwdsskx.supabase.co`, `VITE_SUPABASE_ANON_KEY` (anon JWT, verified identical to the key in the live atlas-il.com bundle), `VITE_APP_ID`, `VITE_APP_BASE_URL`.
  No variable group needed. `VITE_API_URL` intentionally NOT set (setting it switches the client to the REST backend).
- Build number = latest TestFlight build + 1 (app id looked up by bundle id; or set `APP_STORE_APPLE_ID` in the yaml).

## What Deen must do once in Apple (5 minutes, before the first build)
1. **Register the App ID** (if Codemagic does not create it): developer.apple.com → Certificates, IDs & Profiles → Identifiers → + → App IDs → App →
   Bundle ID (Explicit) `com.atlas-il.app`, description "atlas". No extra capabilities needed for this round.
2. **Create the App Store Connect app record**: appstoreconnect.apple.com → Apps → + → New App → iOS, Name "atlas" (if taken: "atlas ניהול צימרים" or similar),
   Primary language Hebrew, Bundle ID `com.atlas-il.app`, SKU `atlas-ios`, Full access. Without this record the upload step fails
   (the "Set build number" step stops early with a clear message).
3. In Codemagic, make sure the atlas repo is added as an app: Codemagic → Applications → Add application → GitHub → `deenv7-star/atlas`
   → project type "codemagic.yaml". (If the Codemagic GitHub App only has access to selected repos, add `atlas` there.)
   The integration `HakIs_ASC_API` lives in Team settings → Integrations → Developer Portal; if HaKis is a personal-account app and atlas is added to the same account, it is visible automatically.

## Start the build
1. Codemagic → Applications → **atlas** → **Start new build**.
2. Branch: **`feat/ios-prep`**. Workflow: **atlas iOS -> Internal TestFlight**. Start.
3. ~15–25 min. When it is green, the build appears in App Store Connect → atlas → TestFlight after Apple processing (~5–15 min).
4. TestFlight → Internal Testing → create a group (e.g. "Internal"), add yourself (and Noa) → install via the TestFlight app on the iPhone.
   (Export compliance is pre-answered: `ITSAppUsesNonExemptEncryption = false`.)

## What is in this app build
- Opens on **/login** (never the marketing landing / pricing); a saved session goes straight to /dashboard (Today). Logout / any link to "/" or /pricing also lands on /login.
- **Google / Apple buttons hidden in the app** (email + password works in the WebView). The system-browser flow
  (@capacitor/browser + appUrlOpen + exchangeCodeForSession, redirect `com.atlasil.app://auth-callback`) is the next round.
- Email confirm / password-reset links and guest links (WhatsApp, guest-service) use **https://atlas-il.com**, never capacitor://localhost.
- App icon = Deen's script "a" on indigo (public/icons/icon-1024x1024.png, unchanged); launch / splash solid #1B2656.
- No service worker in the app.

## Known limits for this round
- Billing checkout/portal call `/api/billing/*` relative — not reachable from the app; and in-app purchase rules mean billing should stay web-only anyway.
- Apple review (not needed for internal TestFlight) will require Sign in with Apple if Google sign-in is shown — relevant when the social flow is added.
