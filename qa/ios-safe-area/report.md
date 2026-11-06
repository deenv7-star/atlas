# fix/ios-safe-area: QA report (06.11.2026)

Deen's screenshot (iPhone with Dynamic Island, build from main): a navy band behind the status bar with a thin white strip under it, and the floating tab bar sitting high above a grey band at the bottom.

## Root cause
Both came from the native WebView config, not from the page CSS.

- **Top:** `capacitor.config.json` had `plugins.StatusBar.overlaysWebView: false` with `backgroundColor: #1B2656`. The `@capacitor/status-bar` 8 plugin then moves the WKWebView down by the status-bar height (54pt) and paints a navy view behind the status bar. That is the navy band. The iPhone's top safe area is 59pt, and `ios.contentInset: "automatic"` covered the extra 5pt with a native scroll inset, which showed the native background as the white strip. Info.plist also forced `UIStatusBarStyleLightContent` (white text).
- **Bottom:** `ios.contentInset: "automatic"` made WKWebView inset its content by the 34pt home-indicator area, and the CSS also adds `env(safe-area-inset-bottom)` (34px) under the tab bar. The safe area was counted twice: the tab bar stood about 44pt above the WebView's visible bottom, with a 34pt strip of native `#F7F8FB` under that.

## Fix
| file | change |
|---|---|
| `capacitor.config.json` | `ios.contentInset` `automatic` → `never`. `StatusBar`: `overlaysWebView: true`, `style: "Light"` (dark text on the light background), `backgroundColor` `#F7F8FB` (unused while overlaying; it is a fallback in place of navy). |
| `ios/App/App/Info.plist` | `UIStatusBarStyle` → `UIStatusBarStyleDarkContent` |
| `src/ui-direction/y/y2.css` | `.y2-tab` bottom padding changed from `12px + env()` to `10px + env()`, so the bar sits 10px above the home-indicator area |
| `src/components/common/AppFallback.jsx` | skeleton tab bar `12px` → `10px` (matches) |
| `src/components/app/AuthShell.jsx` | the header was a fixed `h-16` with safe-area top padding. At a 59px inset, the login/register logo was pushed up under the Dynamic Island. Height is now `calc(4rem + env(safe-area-inset-top))` |
| `tests/unit/ios-safe-area.test.mjs` | new regression guard on the config, the plist, and the tab bar's single inset |

The WebView now runs edge to edge. The shell already pads `env(safe-area-inset-top)` (`.safe-top`), and the Today photo and canvas are `position: fixed; inset: 0`, so the sky continues under the status bar. The main scroll padding (`132px + env`, y2.css) and the assistant dock (`84px + env`) were already single-counted and needed no change. `src/components/app/shell/v7.jsx` is not the live shell (the app uses `ui-direction/y`), so it was left alone. No service worker, migrations, secrets or edge functions were touched.

## QA
- Production build: `VITE_ALLOW_LOCAL_DEMO=true vite build` + prerender + CSP check (ok). Playwright chromium `--no-proxy-server`, demo seed, native iOS UA plus the Capacitor bridge stub.
- Safe areas: Chromium has none, so every `env(safe-area-inset-*)` in the served CSS (plus inline-style strings in JS) was rewritten to top 59 / bottom 34, the iPhone 15/16 Pro values. The before shot is a harness that reproduces the old native geometry: navy 54pt band, WebView pushed below it, 5pt / 34pt automatic content inset, plus the CSS env bottom 34 again.
- Measured at 390×844:

| | before | after |
|---|---|---|
| status-bar band | navy plus a 5pt strip | none: photo/canvas from y=0 |
| shell top padding | 0 (navy band instead) | 59px |
| header pill top | 10px below the band | 69px (10px below the island zone) |
| tab bar bottom to screen edge | 46px inside the WebView + 34pt grey band = 80pt | **44px** (34 safe area + 10) |

- Results: Today, calendar and login at 390, 375 and 320, plus desktop 1440. Horizontal overflow 0, off-screen 0, taps under 44px 0, console errors 0. The desktop layout is unchanged (no tab bar, env = 0).
- Overlap sweep at 390 with insets: nothing in the status-bar zone (<59px) and no fixed control in the home-indicator zone on /login, /register, /reset-password, /onboarding, /settings, /bookings, /leads, /payments, /cleaning, /guests, /monthly-report and /automations. /login, /register and /reset-password failed before the AuthShell fix.
- Unit tests: 345/345 pass, including the 3 new ones.

Screenshots: `before-390.png`, `after-390.png` (device frame), `after-today-390/375/320/1440.png`, `after-calendar-390.png`, `after-login-390.png`. Data: `data.json`.

Confirming this needs a real device: a new TestFlight build, since the native config only reaches the app through `cap sync` on Codemagic.
