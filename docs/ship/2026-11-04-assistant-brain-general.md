# SHIP: assistant brain general (branch fix/assistant-brain-general, off fix/voice-reliability 35f8a43)

NOT DEPLOYED. Needs Deen's OK. Edge functions only: no migration, no secret change, no app build.

## Why
On TestFlight build 16 (ai-chat v10, voice-session v9) Deen asked by voice "אילו מסעדות יש סביב הכנרת?" and got no useful answer.
Prod logs 04.11.2026 23:19–23:21 IST (user 0d40b44e, session 3eccfa62): voice-session start 23:19:04, ai-chat tool calls only
`get_day_overview` (23:19:12) and `find_bookings` (23:19:27); nothing for the restaurant question. That slice then died with
ws 1006 at 23:20:39 while she was speaking (age 94 s), and the app started a new slice at 23:20:41.
Root cause: the brain had no way to know anything live/local (no search tool at all), and the shared prompt told it
"general question: short answer, without pretending to have live internet data" plus "facts only from tools", so the
realtime model either hedged or refused. It was not an ai-chat failure; ai-chat was never asked.

## What changed
- `_shared/brain/world.js` (new): `search_web` engine. One OpenAI Responses API call with the built-in `web_search` tool,
  same `OPENAI_API_KEY` + `BRAIN_MODEL` (gpt-6-luna), `reasoning.effort` = `BRAIN_SEARCH_REASONING` or `none` (3–7 s; `low` ~7 s),
  `store:false`. Answer comes back as 2–4 short plain Hebrew sentences (markdown, links and URLs stripped), max 700 chars, plus source
  hostnames. Location = `organizations.address`, else the first `properties.address` (read with the owner's JWT, RLS). Only the
  question + area are sent, never business data. 15 s timeout, 10 searches/min per user per isolate; every failure returns `{error, say}`.
- `_shared/brain/tools.js`: new read tool `search_web {query, near?}` in TOOL_DEFS, so text chat and voice (realtimeTools → app →
  ai-chat `{op:'tool'}`) both get it. Not a write tool.
- `_shared/brain/prompt.js`: she is a general smart assistant too. General knowledge answered directly (no refusal, no handoff);
  anything place/time-dependent (restaurants, attractions, weather, driving times, events, hours, news) → `search_web` first, no invented
  places; "באזור"/no place = around the property. Business facts still only from tools; confirm-before-write unchanged; new explicit line:
  no invoices/receipts; iOS NATIVE_RULE unchanged (no plan prices / external purchase). Owner addressed in plural also in suggestions.
  Voice KB digest 3600 → 2900 chars to keep the voice prompt < 9000 (search_help still has the full KB).
- `ai-chat/index.ts` (v7): passes `world` (key, model, effort, abort signal) in the tool ctx for both the text loop and `{op:'tool'}`.
- `voice-session/core.js`: voice = `enR7mijIG1cHGbbpygXW` ("אירה", Deen's pick 23:27); model eleven_realtime_v1_max, language 'he' unchanged.
- `persona.js` / `loop.js`: status line for search_web ("מחפשת מידע עדכני"); build 16 shows its generic "רגע, בודקת" until a new build.
- Tests: `supabase/tests/brain.test.mjs` +10 (tool wiring, Responses request shape, no business data sent, area fallback, failures/rate
  limit, speakable text, prompt rules text/voice/iOS, 4 brain scenarios: Kinneret restaurants, weather tomorrow, general fact, own bookings).
  `supabase/tests/brain_live.mjs`: live eval against real OpenAI (not in npm test).

## Why only an edge deploy
The app forwards ANY tool name the realtime model calls to ai-chat (`runVoiceTool`, no whitelist) and the realtime session's
instructions/tools/voice come from voice-session at every start. So build 16 gets the new brain, the search tool and the Ira voice
as soon as both functions are deployed.

## Deploy (after OK)
```
supabase functions deploy ai-chat --project-ref romvmqbcinurscwdsskx
supabase functions deploy voice-session --project-ref romvmqbcinurscwdsskx
```
Both must go: voice-session bundles the prompt + tool list, ai-chat runs the tool. Order: ai-chat first (a voice session that offers
search_web before ai-chat knows it would get `unknown_tool`, and she would say she could not check).
Smoke: text "אילו מסעדות יש סביב הכנרת?" → logs `{"fn":"ai-chat","event":"answer","tools":["search_web"]}`; voice same question.

## Cost
Each search = one Responses call with web_search (~5–9k input tokens of search context + OpenAI's per-search tool fee). Only when
the owner asks a world question. Capped at 10/min per user.

## Rollback (functions only)
Prod before this: ai-chat v10, voice-session v9 (ezbr sha prefixes efeb52aec625 / 117b9602b795).
Backups: `work/backup/2026-11-04-brain-general/ai-chat-prod.eszip`, `voice-session-prod.eszip` (downloaded bodies, sha256 7a4b380f… / c51ec1e8…),
and the source they were deployed from: `work/backup/2026-11-04-brain-general/src-35f8a43/` (= fix/voice-reliability 35f8a43).
```
git -C work/voice-fix checkout 35f8a43   # or use src-35f8a43/
supabase functions deploy ai-chat --project-ref romvmqbcinurscwdsskx
supabase functions deploy voice-session --project-ref romvmqbcinurscwdsskx
```
Rolling back also returns the voice to Danit (s0T0DT6EAPeX57MQpn3I). To keep Ira but drop search: revert only prompt.js/tools.js.

## Known / not fixed here
- The live eval runs the brain on gpt-6-luna. In voice the realtime model is ElevenLabs eleven_realtime_v1_max; it receives the same
  prompt + tool, but its tool-calling on these questions is verified only after deploy (could not test without the app key).
- It sometimes searches for stable facts too (e.g. Hermon height) — correct answer, ~6 s slower.
- Occasional singular "רוצה" in a closing suggestion despite the plural rule (1 of 5 live answers).
- Separate reliability issue seen in the same logs: ws 1006 mid-answer at ~94 s (client reported ws_error while speaking).
