# 02-audio: notes (PLACEHOLDER)

**Status: everything here is a synthesized PLACEHOLDER, to be replaced by an ElevenLabs instrumental.**
No ElevenLabs API key was present in the environment (`env | grep -i eleven` returned nothing). No paid service,
no downloaded sample and no third-party audio was used: every sound is generated from oscillators and noise
in `build.py` (numpy 2.5 / scipy 1.18). License: original work for this project.

When a key is available: generate an instrumental with ElevenLabs music (120 BPM, 24 s, D major / B minor,
lift at 5.0, breath 11.5–12.0, resolve at 20.0), save it over `music.wav` (48 kHz stereo, 24.000 s), and re-run `mix.sh`.
`sfx.wav` and `cues.json` stay as they are.

## Files
| File | What |
|---|---|
| `music.wav` | Music stem, 48 kHz stereo float32, 24.000 s, peak -3 dBFS |
| `sfx.wav` | All SFX placed per `cues.json`, 48 kHz stereo float32, 24.000 s, peak -4 dBFS |
| `cues.json` | Cue list `{t, sfx, gain_db, align, note}`; `align: onset` = sound starts at t, `peak` = loudest point of the whoosh lands at t |
| `mix.wav` | Final mix, 48 kHz stereo 24-bit PCM, 24.000 s |
| `mix.m4a` | Final mix, AAC 256 kb/s, 48 kHz stereo |
| `build.py` | Regenerates music.wav, sfx.wav, cues.json (`python3 build.py`, ~10 s) |
| `mix.sh` | Ducking + loudness + exports (`bash mix.sh`) |

## Measured (ffmpeg -i mix.wav -af ebur128=peak=true -f null -)
```
Integrated loudness:  I: -14.0 LUFS   (threshold -24.0 LUFS)
Loudness range:       LRA: 2.1 LU     (low -15.0, high -12.9 LUFS)
True peak:            Peak: -2.5 dBFS
```
mix.m4a (AAC 256k): I -14.1 LUFS, true peak -2.4 dBFS.
Loudnorm ran two-pass in **linear** mode (no dynamic pumping); see "Mix chain" below.

## Music (placeholder), 120 BPM, D major
Beat grid: kick on every beat from t=0.000 (beat = 0.5 s, bar = 2 s).
Progression (one chord per bar): Dmaj9 | Bm9 | Gmaj7 | Asus→A | Dmaj9 | Bm9 | Gmaj7 | A | Bm9 | G→Asus | **Dadd9 (20.0, held to end)**.
- **Pad**: each chord tone (one octave up) as 3 detuned additive saws (-8 / 0 / +7 cents, spread L/C/R), ADSR per chord
  with 0.8 s overlapping release, through a time-varying 2-pole Butterworth lowpass (block-wise, state carried).
  Filter automation tells the story: 700 Hz intro → opens to 2.6 kHz into 5.0 → 2–2.3 kHz verse →
  closes to 320 Hz at 11.75 (breath) → reopens at 12.0 → 3.4–4.2 kHz at 20.0 → closes in the tail.
- **Sub bass**: sine + 2nd harmonic on chord roots, quiet in the intro, full from 3.8, muted 11.5–12.0, long decay from 20.0.
- **Kick / sub pulse**: pitch-swept sine (112→42 Hz, ~0.4 s) + tiny highpassed click. Quieter before 3.8; muted
  11.5–12.0; at 20.0 a bigger hit + a 2.2 s low boom; then only 21.0 and 22.0; nothing after 22.
- **Sidechain**: pad/bass/pluck ducked ~4–5 dB on each kick, 70 ms recovery curve (pumping, Apple-keynote feel).
- **Hats**: band-passed noise bursts on offbeats (beat + 0.25 s) from 1.25 s; ghost 16ths 12–19.5 s; none in the breath.
- **Pluck arpeggio** from 5.0 (the lift): sine + short 2nd harmonic, 8th notes on chord tones,
  dotted-8th ping-pong delay (0.375 s, 4 repeats, 0.38 feedback).
- **Transitions**: noise riser 4.0→5.0 (lift), reversed-swell noise 11.55→12.0 (filtered breath before Friday),
  small swell 15.6→16.0, bigger swell 19.25→20.0 into the resolve.
- **Resolve bells** at 20.0: additive bell (D5 F#5 A5 D6, inharmonic 2.76× / 5.4× partials) strummed 60 ms apart.
- **Space**: convolution reverb with synthetic stereo IRs (decaying lowpassed noise, 2.6 s main / 1.0 s hats).
- **Ends**: 10 ms fade-in at 0 (no click, still on the beat), natural decay, cos² fade over the last 0.6 s.

## SFX (all synthesized; one per hit and click)
| Name | How it was made |
|---|---|
| `tick` / `tick_lo` | 2.6 kHz sine blip (1.5× partial), 7 ms decay, + 4 kHz+ noise grain. Chart ticks rise in pitch (0.80→1.22×) |
| `whoosh_in` / `whoosh_lift` | Highpassed noise through a lowpass that follows the envelope (300 Hz → 4.8/3.8 kHz), pan sweeps L→R; aligned at peak |
| `whoosh_exit` | Same, fast attack and longer tail, pan R→L; starts at the cue |
| `land` | Pitch-dropping sine thump (115→55 Hz) + lowpassed noise puff |
| `click` | 1.7 kHz sine tick + band-passed noise transient + 180 Hz body |
| `ping` | Original two-note soft bell, D6 then A6 85 ms later (sine + 2× + 3.01× partials). Generic; not modeled on WhatsApp/iOS sounds |
| `success` | Two-note bell A5→D6, quieter and shorter |
| `sent` | Short 0.32 s highpassed-noise swoosh with rising filter, pans to the right |
| `cut_hit` | Short sub thump (98→48 Hz) + bandlimited air burst |
| `shimmer` / `shimmer_small` | Six high D-major sines with tremolo, staggered entries, slight upward glide, air noise, 1.8 s bright reverb |
| `tail` | Soft D4 + A4 tone with a noise breath, 0.9 s decay |
All SFX get a short shared room (0.9 s IR, 12 % wet) so they sit in the music's space. Gains per cue are in `cues.json`.

## Cue list (also in cues.json)
0.5–3.0 ticks (6) · 3.5 land + small shimmer · 3.8 whoosh_in (peak) · 5.0 ping · 6.0 cut_hit · 6.5 whoosh_lift (peak) ·
7.5 click · 7.75 success · 8.5 cut_hit · 9.0 whoosh_lift (peak) · 9.5 land + tick_lo · 10.0 whoosh_lift (peak) ·
10.5 land + tick_lo · 11.5 whoosh_exit · 12.0 cut_hit · 13.0 whoosh_lift (peak) · 14.0 click · 14.25 sent ·
15.5 whoosh_exit · 16.0 cut_hit · 16.5–17.375 eight rising ticks (every 0.125) · 18.5 click · 18.75 sent ·
19.5 whoosh_exit · 20.0 cut_hit + shimmer · 21.0 tick · 23.0 whoosh_exit · 23.5 tail.

## Mix chain (mix.sh, ffmpeg 6.1)
1. SFX -1 dB → `sidechaincompress` on music keyed by SFX (threshold 0.08, ratio 2, attack 8 ms, release 220 ms, RMS).
   Measured music gain reduction 30–130 ms after each cue: median **-3.1 dB**, range -0.2 to -6.1 dB.
2. `amix` (no normalize) → safety `alimiter`.
3. Static gain toward -14 LUFS, then `alimiter` (4× oversampled at 192 kHz, -2.5 dBFS ceiling) so loudnorm can stay linear.
4. `loudnorm` two-pass (I=-14, TP=-1.5, LRA=11, `linear=true`) → reported `normalization_type: linear`.
5. Exact static trim (-0.2 dB) to land on -14.0 LUFS, write 24-bit WAV; AAC 256k from that.
