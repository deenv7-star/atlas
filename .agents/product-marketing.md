# Product Marketing Context · atlas

**Document version:** v1
**Last updated:** 11.11.2026
**Built from:** the live landing (atlas-il.com, main 0ee07fb9), src/components/landing/v8, src/config/pricing.js, src/config/growth.js, src/components/landing/v5/content.js (FAQ, checked against the support KB), src/features/early (/early founders offer), brand/voice-v1/voice-guide.md, the project request tracker and Deen's decisions. Every claim below is either in the code or a decision Deen made; anything else is marked *unverified*.

## Product Overview
**One-liner:** אתם מארחים. atlas מסדר.
**What it does:** A Hebrew, right-to-left management system for owners of zimmers (צימרים), villas and small vacation complexes in Israel. Dates booked on Booking.com and Airbnb land on one calendar with the direct bookings, about every 15 minutes (pg_cron `*/15`, migration 015). atlas prepares every guest WhatsApp message in Hebrew; the owner taps, their own WhatsApp opens with the text ready, and the owner sends it. Deposits and balances are recorded and tracked, and a monthly report goes to the accountant.
**Product category (the shelf):** מערכת ניהול לצימרים / תוכנה לניהול צימרים ומתחמי נופש (what owners and Google call it; Channel Manager / PMS are the English shelf names, never used on the page).
**Product type:** B2B SaaS, web app (browser on desktop and phone, add to home screen; iOS app in TestFlight).
**Business model and pricing:** Monthly subscription by number of complexes, every plan has every capability. מתחיל ₪399 (1 complex), מקצועי ₪699 (up to 5, recommended), עסקי ₪999 (unlimited). Annual paid upfront: ₪319 / ₪559 / ₪799 a month. עוסק פטור: the price is final, no VAT. 14 days free, everything open, no credit card, nothing is charged automatically at the end.
**Founders offer (Deen, 08.11.2026):** the first 50 get (1) personal setup by Deen (calendars connected, units set, message texts ready), (2) founders price = the annual monthly price (₪319 / ₪559 / ₪799) on monthly billing, locked while the subscription stays active, (3) 14 days free. After 50, back to the regular price. Lives on /early today (noindex). There is no real remaining-spots counter yet (migration 039 not applied), so the page may say "50 מקומות" but never "נשארו X".
**Second, separate offer:** atlas צמיחה (campaigns + a landing page / site for the complex), ₪749 a month including the whole management system, ₪599 for 20 founders until 31.12.2026, locked 24 months. "בקרוב", sold only after a WhatsApp call.

## Target Audience
**Target companies:** Israeli zimmer / villa / small vacation-complex owners, 1 to ~10 units, mostly north (Galilee, Golan) and family-run. Secondary: owners of several complexes, small management companies.
**Decision-makers:** the owner (often the husband-and-wife couple who also clean and host), 40 to 65, not technical, runs the business from the phone.
**Primary use case:** stop double bookings and the daily juggling between Booking, Airbnb, WhatsApp, a paper diary and Excel.
**Jobs to be done:**
- "Make sure I never sell the same night twice."
- "Let me answer and welcome guests without typing the same message 20 times."
- "Tell me who still owes me money, and give the accountant something clean at month end."
**Use cases:** Friday check-in rush (who arrives, which unit is clean); a new Booking reservation while the guest's cousin is asking on WhatsApp for the same weekend; chasing a ₪1,240 balance without embarrassment; month-end report.

## Personas
| Persona | Cares about | Challenge | Value we promise |
|---|---|---|---|
| The owner-host (user + decision maker + payer) | full weekends, no mistakes, time with guests, not looking stupid with tech | 3 calendars, WhatsApp chaos, no system, fears a complicated setup | one calendar, messages ready, money tracked; a person sets it up with them and answers 24/7 |
| The partner who does the money | deposits, balances, the accountant | money scattered between bank, Bit, cash, notebooks | every deposit and balance in one list, monthly report |
| Multi-complex manager | many units, staff, cleaning | coordination at scale | same system, plan by number of complexes |

## Problems & Pain Points
**Core problem:** the season is managed across Booking, Airbnb, WhatsApp, a notebook and memory. One missed update = a double booking on a holiday weekend.
**Why alternatives fall short:**
- Paper diary / Excel: no link to the channels, manual every time.
- Generic international channel managers / PMS: English, built for hotels, priced in dollars, no WhatsApp-first flow, no Hebrew support.
- Only the Booking / Airbnb extranets: each sees only itself.
**What it costs them:** a double booking (refund, a bad review, a ruined weekend), hours a week typing the same messages, balances forgotten.
**Emotional tension:** fear of the double booking, the feeling of being behind, embarrassment chasing guests for money, fear that "a system" will be complicated.

## Competitive Landscape
**Direct:** international channel managers / PMS (English, hotel-oriented, per-unit pricing, support in English). *Named competitors and their current prices are not verified here; do not name them on the page.*
**Secondary:** Israeli zimmer listing sites with their own booking tools (marketing first, management second). *Unverified detail.*
**Indirect:** notebook, Excel, Google Calendar by hand, WhatsApp Business quick replies.

## Differentiation
**Key differentiators (all verified in code):**
- Hebrew, RTL, built for zimmers: units, deposits, Shabbat (atlas doesn't suggest sending on Shabbat and holidays).
- One calendar for Booking.com, Airbnb and direct bookings, updated about every 15 minutes, with a warning before you save a booking on taken nights (BookingOverlapGuard).
- Guest WhatsApp prepared in Hebrew; opens in the owner's own WhatsApp; the owner sends.
- Direct booking page of your own, no commission.
- Price by number of complexes, not per unit; every capability in every plan.
- A real person on WhatsApp, 24/7 (Deen's decision 01.11.2026; no response-time promise).
- Founders: personal setup by Deen.
**Why customers choose us:** it speaks their language, it is set up for them, and it removes the double-booking fear.

## Objections
| Objection | Response (true today) |
|---|---|
| "It's complicated, I'm not technical" | One question at a time, in plain Hebrew. Founders get a personal setup; a person answers on WhatsApp 24/7. |
| "Will it really stop double bookings?" | Booking and Airbnb dates come in by themselves about every 15 minutes, and atlas warns before you save on taken nights. Honest limit: channels don't update each other instantly, so glance at the calendar before confirming. |
| "Does it send messages to my guests by itself?" | No. atlas prepares the text with the guest's name; you tap and send from your own WhatsApp. |
| "Receipts / invoices?" | atlas does not issue them; you record the payment and document number, and download a monthly report. |
| "What happens after 14 days?" | Nothing is charged automatically. You continue only if you pick a plan. Cancel with one WhatsApp message. |
| "Price" | From ₪319 a month on annual billing; founders get that price on monthly billing, locked. |
**Anti-persona:** hotels with front desks and revenue managers; owners who need automatic invoices or auto-sent messages today; anyone who wants a guest-facing marketplace.

## Switching Dynamics
**Push:** a double booking that already happened, a holiday weekend chaos, typing the same arrival instructions again.
**Pull:** one calendar, ready messages, money visible, someone sets it up for them.
**Habit:** "the notebook works", WhatsApp quick replies, Excel.
**Anxiety:** losing data, a complicated setup, being charged by surprise, a system that sends something wrong to a guest.

## Customer Language
**How they describe the problem (from Deen and the support KB, paraphrased in their words):** "דאבל בוקינג", "שבת מלאה", "יום החלפה", "לרדוף אחרי יתרות", "לעדכן את בוקינג", "אני לא איש של מחשבים".
**How they describe us:** not yet verified; there are no customer quotes on file.
**Words to use:** צימר, יחידה, מתחם, הזמנה, אורחים, לוח (שנה), מקדמה, יתרה, ניקיון, כניסה/יציאה, Booking, Airbnb, וואטסאפ, בלחיצה, מוכן, לבד.
**Words to avoid:** דשבורד, פיצ'ר, סנכרון (in marketing copy), משתמש, נכס, פתרון, חוויה, "הכל במקום אחד" (belongs to competitors), ATLAS in capitals, a Hebrew letter glued to atlas.
**Banned claims:** "נשלח" for anything atlas does (it never sends), "אפס", "בשנייה", "ראשונה בישראל", receipts, push, wake word, "replaces the owner", Waze, instant sync.
**Glossary:**
| Term | Meaning |
|---|---|
| מתחם | one complex (the unit of pricing) |
| יחידה | one zimmer / room / cabin inside a complex |
| ערוץ | Booking.com, Airbnb, direct |
| דף הזמנה ישירה | the owner's own booking page, no commission |

## Brand Voice
| Attribute | Means | Doesn't mean | Example line |
|---|---|---|---|
| מסדרים | say what is already done | selling capabilities | "בוקר טוב. הכל כבר כאן." |
| ברורים | short sentence, known word, real number | jargon, English | "14 יום חינם. בלי כרטיס אשראי." |
| חמים | know a host's life | childish, "וואו!", emoji | "הלוח מסודר. אפשר לארח." |
| אמינים | the truth, including limits | promising what isn't there | "בשבת ובחג atlas לא מציע לשלוח." |
**Voice:** "השכן המקצועי". Address "אתם" (plural), imperative plural in CTAs, never "/ת". atlas speaks of itself in the third person masculine; "אנחנו" only for people (support, about, legal).
**Tone by context:** support: a person, first name, one step; launch: confident, no hype; errors: what happened + what to do, no blame; sales: concrete gain in host words; social: same voice, a bit lighter.
**Terms we own:** "אתם מארחים. atlas מסדר.", "לארח בכיף, לנהל בקול".
**Never use (and why):** see banned claims; they are either false today or legal risk.

## Proof Points
**Metrics:** none yet (no paying customers). Never invent counts, ratings or savings.
**Customers / testimonials:** none. A testimonial slot exists (src/config/testimonials.js) and stays hidden until a real, consented quote exists.
**Value themes:**
| Theme | Proof |
|---|---|
| no double bookings | 15-min iCal import + overlap warning (code) |
| messages ready | guest-journey queue, one tap via wa.me (code) |
| money visible | payments, balances, monthly report (code) |
| not alone | personal setup for founders, 24/7 human WhatsApp (Deen's decision) |
| no risk | 14 days, no card, no auto charge, cancel by one message (terms + code) |

## Goals
**Business goal:** first 50 paying owners (founders) before the season, then self-serve growth.
**Conversion action:** primary = start the 14-day trial (/register) or, during the teaser period, save a founders spot (/early). Secondary = a WhatsApp question to a person.
**Current metrics:** not measured on the page (no analytics scripts by design; the cookie banner says "בלי מעקב"). Paid traffic: none confirmed.

## Learnings
- 11.11.2026: marketingskills v1 audit (qa/marketingskills-v1/report.md). Biggest gaps: the hero never says צימר or who it's for, one hero notification says "נשלח", the founders offer is missing from the landing, the "בקרוב" growth section sits before pricing.

## Changelog
- v1, 11.11.2026: first draft from the codebase, Deen's decisions and the voice guide.
