# Rules check v1 (atlas-v1.mp4, 24.0s, 1080x1920, 60fps, AAC)
Frame refs are the 2 fps frames in 03-scenes/out/frames (t=0.25..23.75), sheet: review/contact-sheet-v1.png

| Rule | Status | Notes / frames |
|---|---|---|
| 9:16 1080x1920 60fps, 23-25s | ✅ | ffprobe: h264 1080x1920 60/1, 24.000s |
| HyperFrames + GSAP + Three.js | ✅ | 03-scenes/index.html + stage.js |
| Real UI only, no invented UI | ✅ with note | All screens from 01-captures. Added: iOS status bar, lock-screen notification banner (real-world object), and a flat patch hiding the badge during flight (scene 4). |
| Logo from the file | ✅ | public/atlas-logo.svg copied, not redrawn (3.25–3.75, 20.25–22.75) |
| Lift + empty slot | ✅ | Saturday cell 6.75–7.25, booking cards 9.25–10.75, message row 13.25, chart/KPI 16.25–17.75, receipt chip 18.25–18.75 |
| Hard cuts on beats | ✅ | 5.0, 6.0, 8.5, 12.0, 16.0, 20.0 |
| Colors: only #3E2BF1/#1B2656/#F7F8FB/white | ✅ | outside the captures |
| Light text, one sentence, word wheel, one indigo keyword | ⚠️ | Four lines have no indigo keyword: הליד נשמר / שישי, 15:00 / לחיצה אחת / סוף החודש |
| No text y<200 or y>1540 | ✅ | Scene 4 headline at ~y1440 |
| Nothing overlaps | ✅ | Scene 4 headline ~95px below the Mac; scene 6 gap fixed |
| Everything exits in motion, nothing frozen, clean ending | ✅ | 23.75 background + halo only |
| Every claim has a backing screen | ✅ | per claims.md; wording kept honest: "ready, one tap", not "sent automatically" |
| No payment link | ✅ | 53/53 captures scanned clean |
| No voiceover, 120BPM, effect for every hit | ✅ | 44 cues, synced to cues.json |
| ElevenLabs music | ❌ | Placeholder synthesized locally: no API key |
| -14 LUFS | ✅ | measured -14.1 LUFS integrated, TP -2.4 dBTP |
| References | ❌ | refs/ not provided: stage 1 not done |
