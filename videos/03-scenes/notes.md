# 03-scenes: how the film is built

HyperFrames project, 1080x1920, 60 fps, 24.0 s. One root composition (`index.html`) with:
- `#bg`: #F7F8FB/white ground + two indigo (#3E2BF1) radial halos bleeding from the top-right corner, drifting continuously.
- `#stage`: a Three.js canvas (`stage.js`), every frame a pure function of t (GSAP clock tween + `hf-seek`).
- `#w1..#w5`: word wheels (Heebo 300, RTL). Centre item sharp, neighbours blurred/dimmed/tilted (rotateX), one indigo
  keyword per line (as marked in STORYBOARD.md) with a scale + glow "breathe" when it reaches the centre.
- `#endcard`: `assets/logo/atlas-logo.svg` (copied file, not redrawn) + "atlas-il.com".

Assets: `python3 -I tools/prep_assets.py` copies the needed captures from `01-captures` into `assets/cap/`.
- Element crops: only background pixels connected to the crop border (the parent card/page colour) are made
  transparent (flood fill from the corners, tolerance 3-6/255) + the UI's own corner radius. UI pixels untouched.
- Slot-empty frames: several `*-slot-empty.png` were captured a moment after their parent (other parts of the page had
  moved, e.g. the receipts heading, the composer sheet). The prep script pastes only the element's bbox (+10 px @3x)
  from the slot-empty frame onto the parent frame, so the swap shows only the empty slot.
- Mac full frames downscaled 4536x2946 -> 3024x1964 (= the MacBook Pro 14" native panel) to save memory.
- `assets/cap/bbox.js`: bbox_css from manifest.json for every crop used.

## Devices (built in Three.js, mm units)
Sources (Apple pages could not be fetched from this sandbox, apple.com is blocked; figures cross-checked via search results):
- iPhone 16 Pro: 149.6 x 71.5 x 8.25 mm (Apple tech specs https://support.apple.com/en-us/121031 ,
  https://en.wikipedia.org/wiki/IPhone_16_Pro ). Titanium frame with contoured (bevelled) edges, Action button +
  volume up/down on the left, side button and flush sapphire Camera Control on the right
  (https://www.androidauthority.com/apple-iphone-16-3368121/). Captures are 393x852 pt; display corner radius ~55 pt,
  Dynamic Island 126x37 pt, 11 pt below the top (iOS layout values commonly used in iOS design kits).
  Bezel solved from the body and the 393:852 display ratio: 2.31 mm per side (titanium rim + black border).
- MacBook Pro 14": 31.26 x 22.12 x 1.55 cm, 14.2" Liquid Retina XDR 3024x1964 at 254 ppi
  (https://www.apple.com/uk/macbook-pro/specs , https://theapplewiki.com/wiki/MacBook_Pro_(14-inch,_Nov_2024)).
  Panel 302.5 x 196.4 mm from the diagonal + ratio; black glass bezel ~5 mm sides, chin ~18 mm; notch ~31 x 6.4 mm with
  camera; aluminium lid and base, hinge cylinder, black keys in a dark well, Force Touch trackpad, lid open 108 deg.
- Screen compositing: a real browser viewport has no status bar, so the iPhone screen = iOS status bar (54 pt,
  RTL-mirrored: time on the right ear, signal/wifi/battery on the left) + the capture scaled uniformly by 0.937 below
  it (edge columns continue into the 12 pt side margins). The Dynamic Island never covers UI.
  Mac screen = macOS menu bar zone (37 pt, light, notch in the middle, clock + battery on the left in RTL) + the
  capture at 1:1 below it; the bottom 37 pt of the page fall below the panel. For the channel frames the page is
  shifted 14 pt more so the timeline legend ("מקור ההזמנה" sample badges) is never framed (claims.md 4b).
- Lighting: RoomEnvironment through PMREM (studio reflections), soft key from top-left, cool rim from back-right,
  hemisphere fill; NeutralToneMapping; screens unlit (toneMapped=false) so captured UI keeps exact colours.
  Additive clear-coat sheen layer over each display; blurred contact shadows (navy) under each device;
  floor reflection = the world mirrored about y=0 rendered first, faded by distance from the device (custom blend
  that only reduces alpha, so it never paints colour onto the background).

## Real-world objects
- iOS lock screen (scene 3, 23:40): date line + large clock, flashlight/camera buttons, home indicator; wallpaper is a
  navy->indigo gradient (palette only).
- Notification banner: iOS form (rounded ~24 pt material card, 361 pt wide, avatar left of the text in RTL = right
  side, bold title, body line, time top-left). Sender avatar with the initial "נ", title "נועה", body "פנוי בשבת?",
  time "23:40". No WhatsApp logo and no chat-app glyph.
- Tap: indigo touch dot + expanding ring on "שליחה בוואטסאפ" (one tap, opens WhatsApp; nothing claims auto-send).

## Scene map (capture files)
1 0-3.8 word wheel: וואטסאפ, Booking, Airbnb, טלפון, מחברת -> logo file (breathes at 3.05).
2 3.8-5.0 logo rolls up, "אתם מארחים. atlas מסדר." (מסדר indigo), rolls out before the 5.0 cut.
3 5.0-6.0 iPhone lock screen + banner. 6.0 `iphone/calendar-full` -> Saturday cell `el-calendar-saturday` lifts
  (`calendar-slot-empty`). 7.5 `lead-saved-toast` -> toast `el-toast-lead-saved` lifts. Text "שבת פנויה." / "הליד נשמר."
4 8.5-12.0 MacBook: `mac/channels-b-booking-no-booking-bar` -> Booking bar `el-booking-bar-b` flies in and lands
  in סוויטת הגפן (9.5) -> `channels-b-booking`; `channels-c-both-no-airbnb-bar` -> Airbnb bar `el-airbnb-bar-c` lands
  in צימר הזית (10.5) -> `channels-c-both`. Badge: during the flight the badge area is covered by the bar's own
  colour (unlit); on landing the cover fades and the real badge crop (`el-*-badge-*`) pops = "lights up".
  (The Mac `*-no-*-badge` frames in 01-captures are missing the whole bar, so they could not be used.)
5 12.0-16.0 "שישי, 15:00." big, then iPhone: `today-message-ready-full` (welcome row lifts), `whatsapp-composer-full`
  (prepared text lifts), tap on שליחה בוואטסאפ at 14.0 ("לחיצה אחת." at 14.4), `whatsapp-sent-toast`, `messages-welcome-sent` (sent bubble lifts).
6 16.0-20.0 MacBook `today-income-chart-slot-empty` + chart card lifted with the real 8-step bar growth
  (`seq-income-chart-00..07`); 17.5 `report-full` -> KPI row (הכנסות/הוצאות/נטו) `el-report-kpis` lifts;
  18.5 iPhone `receipts-before` -> status chip "טיוטה" lifts, flips to "נשלח" (`el-receipt-status-after`) and lands
  -> `receipts-after`. Phone exits 19.95-20.6.
7 20.4-24 logo + atlas-il.com in, out 22.95-23.5; last ~0.5 s only background + drifting halo.

## Fonts
Heebo 300 is not in public/fonts (only 400/500/700/800). Heebo 300 woff2 (hebrew + latin subsets) taken from the
official `@fontsource/heebo@5.3.0` npm package (OFL, licence in assets/fonts/HEEBO-LICENSE). 400/500 copied from
public/fonts for the iOS/macOS system text on the device screens.

## Render
`hyperframes render --quality looks --crf 16 --fps 60 -o out/atlas-v1-silent.mp4` (H.264 High, yuv420p, 1080x1920,
60 fps, 1440 frames, 24.000 s, ~6.8 Mb/s; software WebGL, ~16 min). Stills: `python3 -I tools/frames.py
out/atlas-v1-silent.mp4 out/frames out/contact-sheet-v1.png` (48 frames at t = 0.25 + 0.5 n).
`hyperframes check`: ok (warnings only: single-file structure, silent film, two short-read lines whose timing is fixed
by the storyboard).
