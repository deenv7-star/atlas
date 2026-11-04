# iOS app: Google, Apple and Face ID sign-in (2026-11-03)

## Google / Apple (web-redirect flow in SFSafariViewController)
- Buttons are back in the app on /login and /register (same component and design as the web).
- Tap → a separate PKCE Supabase client (in-memory storage) calls `signInWithOAuth({ redirectTo: 'com.atlas-il.app://auth-callback', skipBrowserRedirect: true })` → `@capacitor/browser` opens the URL.
- Supabase redirects to `com.atlas-il.app://auth-callback?code=…` → iOS opens the app → `@capacitor/app` `appUrlOpen` → Browser closes → `exchangeCodeForSession(code)` → tokens handed to the main client (`setSession`) → in-app `/auth/callback` (same finish as the web: profile fill, consent, onboarding for a new account, else /dashboard).
- Cancel ("Done" in Safari, or `error=access_denied`) → Hebrew message under the buttons, no navigation.
- URL scheme `com.atlas-il.app` added to Info.plist (the old `com.atlasil.app` is kept).
- Supabase `uri_allow_list` + `com.atlas-il.app://auth-callback`, `com.atlas-il.app://**` (additive; backup + rollback in the agent workspace `work/backup/2026-11-03-ios-auth/`).
- Apple runs through the Supabase web flow (Services ID com.atlasil.web), so Apple shows its web sign-in sheet, not the native Face ID Apple sheet, and does not send the name (the finish step asks once). Native Sign in with Apple needs the "Sign in with Apple" capability on the App ID com.atlas-il.app + entitlement + a native plugin: not done.

## Face ID (@capgo/capacitor-native-biometric 8.9.1, SPM)
- After a sign-in in the app, once: sheet "להיכנס בפעם הבאה עם Face ID?" (NativeAuthHost). Yes → refresh token stored in a Keychain item protected by the current biometry set (`kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly`, `biometryCurrentSet`).
- Supabase rotates refresh tokens: the Keychain copy is rewritten on every SIGNED_IN / TOKEN_REFRESHED while Face ID is on.
- Login screen (no session): primary "כניסה עם Face ID" → Face ID prompt → `refreshSession({ refresh_token })` → /dashboard. A revoked/expired token clears the saved sign-in and asks for email + password.
- Sign-out and account deletion clear it. Settings → אבטחה has an on/off switch (app only).
- `NSFaceIDUsageDescription`: "atlas משתמש ב-Face ID כדי להכניס אתכם במהירות ובאבטחה."

## Web
- Unchanged: /login and /register at 390px are pixel-identical before/after (same Supabase env as Codemagic). All native code is lazy-loaded behind `isNativeApp()`.

## Test on the device (TestFlight)
1. Log out → login → "המשיכו עם Google" → pick account → back in the app on Today (or onboarding for a new account).
2. Same with Apple.
3. After a sign-in the Face ID sheet appears once → "כן, להפעיל Face ID".
4. Settings → אבטחה shows the switch on.
5. Face ID login button appears when the app has no session (e.g. session expired / storage cleared). Note: logout clears Face ID by design (logout revokes the token on the server).
