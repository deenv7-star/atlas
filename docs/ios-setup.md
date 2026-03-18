# ATLAS — iOS App Setup

## Requirements

| Tool | Version | Notes |
|---|---|---|
| macOS | 13+ (Ventura) | חובה ל-Xcode |
| Xcode | 15+ | מה-App Store |
| Node.js | 18+ | `node -v` |
| CocoaPods | 1.13+ | `sudo gem install cocoapods` |
| Apple Developer Account | - | developer.apple.com |

---

## Setup — First Time

### 1. Generate app icons
```bash
npm install sharp       # only once
npm run generate:icons  # creates public/icons/
```

> **Note:** הוסף ידנית את תמונות ה-splash ל-`public/splash/` (ראה גדלים ב-`index.html`)

### 2. Build & initialize iOS project
```bash
npm run ios:init
# = npm run build + npx cap add ios
```

זה יוצר תיקיית `ios/` עם פרויקט Xcode.

### 3. Install CocoaPods dependencies
```bash
cd ios/App
pod install
cd ../..
```

### 4. Open in Xcode
```bash
npm run ios:open
# = npx cap open ios
```

---

## Development Workflow

### Sync changes to iOS (after code changes):
```bash
npm run ios:sync
# = npm run build + npx cap sync ios
```

### Run on simulator:
```bash
npm run ios:run
```

Or from Xcode — choose a simulator and press ▶

---

## Xcode Configuration

In Xcode, set the following (Target → Signing & Capabilities):

| Setting | Value |
|---|---|
| Bundle Identifier | `co.il.atlas-app` |
| Display Name | `ATLAS` |
| Version | `1.0.0` |
| Team | your Apple Developer Team |

### Required Capabilities:
- **Push Notifications** — for future notifications
- **Background Modes** — Background fetch (for calendar sync)

---

## App Store Submission

1. Archive in Xcode: **Product → Archive**
2. Upload via **Xcode Organizer → Distribute App**
3. Fill in App Store Connect metadata (Hebrew description)

### App Store metadata (Hebrew):
- **שם האפליקציה:** ATLAS — ניהול נכסי אירוח
- **כותרת משנה:** הזמנות, תשלומים וצוות במקום אחד
- **קטגוריה:** Business / Travel

---

## Troubleshooting

**`pod install` fails:**
```bash
sudo arch -x86_64 gem install ffi
arch -x86_64 pod install
```

**Build fails — signing error:**
Xcode → Preferences → Accounts → add Apple ID

**White screen on launch:**
- Check that `npm run build` completed successfully
- Verify `capacitor.config.json` → `webDir: "dist"`

**Safe area / notch issues:**
CSS already configured with `viewport-fit=cover`. Use CSS variables:
```css
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
```

---

## Project Structure After Init

```
atlas/
├── ios/                    ← Xcode project (auto-generated)
│   ├── App/
│   │   ├── App/           ← Swift source
│   │   ├── Podfile
│   │   └── App.xcworkspace
├── dist/                  ← Built web app (synced to iOS)
├── capacitor.config.json  ← Capacitor configuration
└── public/
    ├── icons/             ← App icons (generated)
    └── splash/            ← Splash screens (add manually)
```
