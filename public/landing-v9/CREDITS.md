# Landing v9 imagery (Q / R / S) — all real, nothing generated

## Product (`ui/`)
Real ATLAS app v8 C screens (bento command center, PR #59), captured at 2x from a local demo build
(`VITE_ALLOW_LOCAL_DEMO=true`, seed "נופי הגליל") with a fixed clock (12:40, plus 08:12 for the "בוקר טוב"
greeting), Asia/Jerusalem, he-IL.
- `d-*.webp`: desktop 1440×900 → 2400×1500 (today, today8, calendar, bookings, messages, payments)
- `m-*.webp`: C mobile views at 390×797 (an 844pt phone minus its 47pt status bar) → 780×1594
  (today, today8, today2 = today scrolled, calendar, bookings, detail, thread, payments)
- `c-income / c-occ / c-photo.webp`: exact crops of the desktop Today capture (income card, occupancy ring,
  property photo tile).
Every name, booking and amount is demo data and is labelled as such on the page.

## Photos (`ph/`)
- `pool-xl / pool-m / u-pool.webp`: Pexels 14546304 "Swimming pool beside green trees"
  (Pexels License), lightly cooled. Same photo as the C home property tile, so Q's hero lands on it exactly.
- `u-cabin.webp` (Unsplash OLuyN6YyC-U), `u-tub.webp` (Unsplash 3KZ2zIcV0g8): Unsplash License, from the
  app's demo unit covers.
- `m-*.webp`, `n-*.webp`: Pexels (Pexels License), cool-graded, reused from landing v8: 3781569, 4908626,
  8844607, 9974645, 9462347, 3775085, 33769365, 8844606, 27087002, 864994, 7298460, 8969036.
- `f-*.webp` guest faces: Pexels portraits 2709388, 40115950, 32471560, 32747251, 1073097, 33323692,
  26574880, 36298150. Example guests inside example bookings, never testimonials.
