#!/usr/bin/env bash
# PLACEHOLDER mix: music.wav + sfx.wav -> mix.wav / mix.m4a at -14 LUFS, TP <= -1 dBTP.
# Music is side-chain ducked by the SFX stem (median ~3 dB at cue hits, max ~6 dB on the loudest), then gain-staged + two-pass linear loudnorm.
set -euo pipefail
cd "$(dirname "$0")"
TMP="${TMPDIR:-/tmp}/atlas-audio-mix"; mkdir -p "$TMP"

DUCK="sidechaincompress=threshold=0.08:ratio=2:attack=8:release=220:knee=4:makeup=1:detection=rms:link=maximum"
PRE="[0:a]volume=0dB[m];[1:a]volume=-1dB,asplit=2[s1][sc];[m][sc]${DUCK}[md];[md][s1]amix=inputs=2:normalize=0,alimiter=limit=0.7:attack=3:release=60:level=disabled[out]"

# premix (float, 48k)
ffmpeg -y -v error -i music.wav -i sfx.wav -filter_complex "$PRE" -map "[out]" -c:a pcm_f32le -ar 48000 "$TMP/premix.wav"

# gain-stage to ~-14 LUFS and brickwall at -2.5 dBFS so loudnorm can stay LINEAR (no dynamic pumping)
I0=$(ffmpeg -nostats -i "$TMP/premix.wav" -af ebur128 -f null - 2>&1 | sed -n '/Summary/,$p' | awk '/ I:/{print $2; exit}')
GAIN=$(python3 -c "print(round(-13.8-($I0),2))")
ffmpeg -y -v error -i "$TMP/premix.wav" -af "volume=${GAIN}dB,aresample=192000,alimiter=limit=0.75:attack=2:release=80:level=disabled:asc=1,aresample=48000" -c:a pcm_f32le "$TMP/premix2.wav"
mv "$TMP/premix2.wav" "$TMP/premix.wav"

# loudnorm pass 1
J=$(ffmpeg -v info -nostats -i "$TMP/premix.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g(){ echo "$J" | python3 -c "import sys,json;print(json.load(sys.stdin)['$1'])"; }
LN="loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true:print_format=json"

# loudnorm pass 2 -> 48k 24-bit wav
ffmpeg -y -v info -nostats -i "$TMP/premix.wav" -af "$LN,aresample=48000" -c:a pcm_f32le -ar 48000 -t 24 "$TMP/ln.wav" 2>&1 | sed -n '/^{/,/^}/p' > "$TMP/pass2.json"
cat "$TMP/pass2.json" | grep -E 'normalization_type|output_i|output_tp'

# loudnorm's linear mode lands ~0.15 LU hot on this short clip: exact static trim to -14.0 (gain only)
I1=$(ffmpeg -nostats -i "$TMP/ln.wav" -af ebur128 -f null - 2>&1 | sed -n '/Summary/,$p' | awk '/ I:/{print $2; exit}')
TRIM=$(python3 -c "print(round(-14.0-($I1),2))"); echo "trim ${TRIM} dB"
ffmpeg -y -v error -i "$TMP/ln.wav" -af "volume=${TRIM}dB" -c:a pcm_s24le -ar 48000 mix.wav

# AAC 256k
ffmpeg -y -v error -i mix.wav -c:a aac -b:a 256k -ar 48000 mix.m4a

# verify
ffmpeg -nostats -i mix.wav -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary/,$p'
ffmpeg -nostats -i mix.m4a -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary/,$p' | grep -E 'I:|Peak:'
