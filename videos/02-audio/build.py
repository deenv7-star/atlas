#!/usr/bin/env python3
"""
PLACEHOLDER audio for the atlas launch video (24.0s, 120 BPM, 48 kHz stereo).
Everything is synthesized from scratch (numpy/scipy) - no samples, no paid services.
To be replaced by an ElevenLabs instrumental (120 BPM, 24s) when an API key exists.

Outputs (in this folder):
  music.wav  - placeholder music stem
  sfx.wav    - all SFX placed per cues.json
  cues.json  - the cue list {t, sfx, gain_db, align}
Mixing/loudness is done by mix.sh (ffmpeg).
"""
import json, os
import numpy as np
from scipy import signal
from scipy.io import wavfile

OUT = os.path.dirname(os.path.abspath(__file__))
SR = 48000
DUR = 24.0
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(7)


def t_arr(sec):
    return np.arange(int(sec * SR)) / SR


def db(x):
    return 10 ** (x / 20)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def adsr(n, a, d, s, r, sustain_len=None):
    """Sample-domain ADSR. a,d,r in seconds; s level 0..1. Total length n."""
    env = np.zeros(n)
    A, D, R = int(a * SR), int(d * SR), int(r * SR)
    S = n - A - D - R if sustain_len is None else int(sustain_len * SR)
    S = max(S, 0)
    i = 0
    seg = np.linspace(0, 1, max(A, 1), endpoint=False); env[i:i + len(seg)] = seg[:n - i]; i += len(seg)
    if i < n:
        seg = np.linspace(1, s, max(D, 1), endpoint=False); k = min(len(seg), n - i); env[i:i + k] = seg[:k]; i += k
    if i < n:
        k = min(S, n - i); env[i:i + k] = s; i += k
    if i < n:
        seg = s * np.exp(-np.linspace(0, 6, max(R, 1))); k = min(len(seg), n - i); env[i:i + k] = seg[:k]
    return env


def saw(freq, n, phase=0.0):
    # band-limited-ish saw via polyBLEP-free additive approx: sum of harmonics up to 12k
    t = np.arange(n) / SR
    out = np.zeros(n)
    kmax = int(min(40, 12000 / freq))
    for k in range(1, kmax + 1):
        out += ((-1) ** (k + 1)) * np.sin(2 * np.pi * k * freq * t + k * phase) / k
    return out * (2 / np.pi)


def lp_tv(x, cutoffs, block=256, order=2):
    """Time-varying lowpass: Butterworth per block with state carry. cutoffs: per-sample array."""
    y = np.zeros_like(x)
    zi = np.zeros(order)
    for s in range(0, len(x), block):
        fc = float(np.clip(cutoffs[min(s + block // 2, len(x) - 1)], 30, SR * 0.45))
        b, a = signal.butter(order, fc / (SR / 2), 'low')
        y[s:s + block], zi = signal.lfilter(b, a, x[s:s + block], zi=zi)
    return y


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band', output='sos')
    return signal.sosfilt(sos, x)


def hp(x, fc, order=2):
    sos = signal.butter(order, fc / (SR / 2), 'high', output='sos')
    return signal.sosfilt(sos, x)


def lp(x, fc, order=2):
    sos = signal.butter(order, fc / (SR / 2), 'low', output='sos')
    return signal.sosfilt(sos, x)


def make_ir(sec=2.4, predelay=0.012, bright=6000, seed=1):
    r = np.random.default_rng(seed)
    n = int(sec * SR)
    t = np.arange(n) / SR
    ir = np.zeros((n, 2))
    for c in range(2):
        noise = r.standard_normal(n)
        noise = lp(noise, bright)
        ir[:, c] = noise * np.exp(-t * 6.9 / sec)  # -60 dB at sec
    pd = int(predelay * SR)
    ir = np.vstack([np.zeros((pd, 2)), ir])
    return ir / np.sqrt(np.sum(ir ** 2, axis=0))


def reverb(x_st, ir, wet=0.25):
    out = np.zeros_like(x_st)
    for c in range(2):
        out[:, c] = signal.fftconvolve(x_st[:, c], ir[:, c])[:len(x_st)]
    return x_st * (1 - wet) + out * wet


def place(buf, snd, t, gain=1.0, hit=0):
    """Add stereo snd into buf so that sample `hit` of snd lands at time t."""
    s = int(round(t * SR)) - hit
    a0 = max(s, 0)
    b0 = a0 - s
    k = min(len(snd) - b0, len(buf) - a0)
    if k > 0:
        buf[a0:a0 + k] += snd[b0:b0 + k] * gain


def pan(mono, p=0.0):
    """p in -1..1 (constant power)."""
    th = (p + 1) * np.pi / 4
    return np.stack([mono * np.cos(th), mono * np.sin(th)], axis=1) * np.sqrt(2)


# ----------------------------------------------------------------------------- MUSIC
# Key: D major. Chords every 2 s (one bar of 4 beats).
CH = {
    'Dmaj9':  [50, 57, 61, 64, 66],      # D A C# E F#
    'Bm9':    [47, 54, 61, 62, 66],      # B F# C# D F#
    'Gmaj7':  [43, 54, 59, 62, 66],      # G F# B D F#
    'Asus':   [45, 52, 59, 62, 64],      # A E B D E
    'A':      [45, 52, 57, 61, 64],      # A E A C# E
    'Dadd9':  [38, 50, 57, 62, 64, 66, 69],
}
BASS = {'Dmaj9': 38, 'Bm9': 35, 'Gmaj7': 31, 'Asus': 33, 'A': 33, 'Dadd9': 26}
PROG = [  # (start, end, chord)
    (0, 2, 'Dmaj9'), (2, 4, 'Bm9'), (4, 5, 'Gmaj7'), (5, 6, 'Gmaj7'), (6, 7, 'Asus'), (7, 8, 'A'),
    (8, 10, 'Dmaj9'), (10, 12, 'Bm9'), (12, 14, 'Gmaj7'), (14, 16, 'A'),
    (16, 18, 'Bm9'), (18, 19, 'Gmaj7'), (19, 20, 'Asus'), (20, 24, 'Dadd9'),
]


def chord_at(t):
    for s, e, c in PROG:
        if s <= t < e:
            return c
    return 'Dadd9'


def build_music():
    pad = np.zeros((N, 2))
    # Pad: 3 detuned saws per note, per-chord ADSR, stereo spread by detune.
    for s, e, c in PROG:
        ln = (e - s) + 0.9  # overlap release into next chord
        if e >= 24:
            ln = 24 - s
        n = int(ln * SR)
        rel = 0.8 if e < 24 else 2.6
        env = adsr(n, 0.12 if s not in (20,) else 0.02, 0.4, 0.75, rel, sustain_len=max(0, (e - s) - 0.52))
        notes = CH[c]
        for i, m in enumerate(notes):
            f = midi(m + 12)
            for j, cents in enumerate((-8, 0, 7)):
                ff = f * 2 ** (cents / 1200)
                v = saw(ff, n, phase=rng.uniform(0, 6.28))
                p = (-0.6, 0.0, 0.6)[j] * (0.5 + 0.1 * i)
                pad[int(s * SR):int(s * SR) + n] += pan(v * env * 0.05, p)[:N - int(s * SR)]
    # Filter automation for the pad (the "story" of the track).
    tt = np.arange(N) / SR
    cut = np.interp(tt,
                    [0, 3.5, 4.0, 4.95, 5.0, 8, 11.3, 11.75, 12.0, 12.05, 16, 19.9, 20.0, 22, 24],
                    [700, 900, 1100, 2600, 1800, 2000, 2300, 320, 900, 2200, 2400, 3400, 4200, 2200, 900])
    for c in range(2):
        pad[:, c] = lp_tv(pad[:, c], cut)
    # Pad gain automation (breath dip at 11.5-12).
    g = np.interp(tt, [0, 0.4, 11.4, 11.85, 12.0, 24], [0.6, 1.0, 1.0, 0.55, 1.0, 1.0])
    pad *= g[:, None]

    # Sub bass (sine + a touch of 2nd harmonic), half notes on chord roots.
    bass = np.zeros(N)
    for s, e, c in PROG:
        if s < 3.8 and s != 0:
            pass
        f = midi(BASS[c] + 12) if c != 'Dadd9' else midi(BASS[c] + 12)
        n = int(((e - s) if e < 24 else 3.5) * SR)
        tb = np.arange(n) / SR
        env = adsr(n, 0.01, 0.25, 0.7, 0.25 if e < 24 else 1.8)
        v = np.sin(2 * np.pi * f * tb) + 0.18 * np.sin(4 * np.pi * f * tb)
        a = int(s * SR); k = min(n, N - a)
        bass[a:a + k] += (v * env)[:k] * 0.22
    bass *= np.interp(tt, [0, 3.7, 3.8, 11.45, 11.55, 11.95, 12.0, 24], [0.35, 0.5, 1, 1, 0.1, 0.1, 1, 1])

    # Kick: soft sub pulse on every beat. Mute during breath 11.5-12, sparse after 20.
    kick = np.zeros(N)
    kn = int(0.42 * SR)
    tk = np.arange(kn) / SR
    fk = 42 + 70 * np.exp(-tk * 28)
    ph = 2 * np.pi * np.cumsum(fk) / SR
    ksnd = np.sin(ph) * np.exp(-tk * 9) * (1 - np.exp(-tk * 900))
    click = hp(rng.standard_normal(kn), 1500) * np.exp(-tk * 260) * 0.06
    ksnd = ksnd + click
    beats = np.arange(0, 24, BEAT)
    kick_times = []
    for b in beats:
        if 11.5 <= b < 12.0:
            continue
        if b >= 20.0 and b not in (20.0, 21.0, 22.0):
            continue
        if b > 22.0:
            continue
        kick_times.append(b)
    for b in kick_times:
        gk = 0.55 if b < 3.8 else (0.9 if b != 20.0 else 1.25)
        if b >= 20.5:
            gk = 0.5
        a = int(b * SR); k = min(kn, N - a)
        kick[a:a + k] += ksnd[:k] * gk * 0.5
    # Big low boom on the logo resolve (20.0).
    bn = int(2.2 * SR); tb = np.arange(bn) / SR
    boom = np.sin(2 * np.pi * np.cumsum(36 + 30 * np.exp(-tb * 6)) / SR) * np.exp(-tb * 2.2) * (1 - np.exp(-tb * 400))
    kick[int(20 * SR):int(20 * SR) + bn] += boom[:N - int(20 * SR)] * 0.35

    # Sidechain ducking envelope from kick times (pad+bass+pluck dip ~5 dB, 180 ms recovery).
    sc = np.ones(N)
    for b in kick_times:
        a = int(b * SR); L = int(0.3 * SR); k = min(L, N - a)
        tl = np.arange(k) / SR
        sc[a:a + k] = np.minimum(sc[a:a + k], 1 - 0.45 * np.exp(-tl * 14) * np.clip(tl * 400, 0, 1) - 0.0)
    # Hats: crisp offbeats (beat + 0.25), light 16ths shimmer in busy sections.
    hats = np.zeros((N, 2))
    hn = int(0.09 * SR); th = np.arange(hn) / SR
    for b in beats:
        tt0 = b + 0.25
        if tt0 < 1.0 or 11.5 <= tt0 < 12.0 or tt0 > 21.5:
            continue
        noise = hp(bp(rng.standard_normal(hn), 6000, 15000), 7000)
        e = np.exp(-th * (55 if tt0 < 5 else 45))
        lvl = 0.06 if tt0 < 5 else 0.09
        if tt0 > 20:
            lvl = 0.045
        place(hats, pan(noise * e * lvl, 0.25), tt0)
        # ghost 16ths from 12 to 20
        if 12.0 <= b < 19.5:
            for off, pp in ((0.125, -0.35), (0.375, 0.35)):
                e2 = np.exp(-th * 90)
                n2 = hp(rng.standard_normal(hn), 9000)
                place(hats, pan(n2 * e2 * 0.025, pp), b + off)

    # Pluck arpeggio (from 5.0): sine+tri, fast decay, eighth notes over chord tones.
    pl = np.zeros((N, 2))
    pn = int(0.6 * SR); tp = np.arange(pn) / SR
    pattern = [0, 2, 1, 3, 2, 4, 3, 1]
    for step, t0 in enumerate(np.arange(5.0, 20.0, 0.25)):
        if 11.5 <= t0 < 12.0:
            continue
        c = chord_at(t0)
        notes = sorted(CH[c])[1:]
        m = notes[pattern[step % 8] % len(notes)] + 12
        f = midi(m)
        tone = np.sin(2 * np.pi * f * tp) + 0.25 * np.sin(2 * np.pi * 2 * f * tp) * np.exp(-tp * 20)
        env = np.exp(-tp * 9) * (1 - np.exp(-tp * 600))
        lvl = 0.05 if t0 < 12 else 0.06
        place(pl, pan(tone * env * lvl, 0.35 * np.sin(step * 0.9)), t0)
    pl[:, 0] = lp(pl[:, 0], 5000); pl[:, 1] = lp(pl[:, 1], 5000)
    # Dotted-eighth ping-pong delay on plucks.
    d = int(0.375 * SR)
    dl = pl.copy()
    for k in range(1, 5):
        sh = d * k
        g = 0.38 ** k
        src = pl[:-sh] * g
        if k % 2:
            dl[sh:, 0] += src[:, 1]; dl[sh:, 1] += src[:, 0]
        else:
            dl[sh:] += src
    pl = dl

    # Resolve bells at 20.0 (soft additive bell, D major triad up high).
    bells = np.zeros((N, 2))
    bn2 = int(3.5 * SR); tb2 = np.arange(bn2) / SR
    for i, m in enumerate((74, 78, 81, 86)):
        f = midi(m)
        tone = (np.sin(2 * np.pi * f * tb2) + 0.3 * np.sin(2 * np.pi * 2.76 * f * tb2) * np.exp(-tb2 * 4)
                + 0.12 * np.sin(2 * np.pi * 5.4 * f * tb2) * np.exp(-tb2 * 8))
        env = np.exp(-tb2 * 1.6) * (1 - np.exp(-tb2 * 300))
        place(bells, pan(tone * env * 0.035, (-0.5, -0.15, 0.15, 0.5)[i]), 20.0 + i * 0.06)

    # Lift riser 4.0 -> 5.0 (filtered noise sweep) and reverse swell 11.6 -> 12.0.
    fx = np.zeros((N, 2))
    rn = int(1.0 * SR); tr = np.arange(rn) / SR
    nz = rng.standard_normal(rn)
    cutr = 400 + 5000 * (tr / tr[-1]) ** 2
    riser = lp_tv(nz, cutr) * (tr / tr[-1]) ** 2 * 0.07
    place(fx, pan(riser, 0), 4.0)
    sn = int(0.45 * SR); ts = np.arange(sn) / SR
    nz2 = lp_tv(rng.standard_normal(sn), 300 + 3000 * (ts / ts[-1]) ** 3)
    place(fx, pan(nz2 * (ts / ts[-1]) ** 3 * 0.06, 0), 11.55)
    # 15.5 -> 16 small swell into the month-end section, 19.4 -> 20 bigger into the resolve.
    for st, ln, lv in ((15.6, 0.4, 0.035), (19.25, 0.75, 0.07)):
        n3 = int(ln * SR); t3 = np.arange(n3) / SR
        s3 = lp_tv(rng.standard_normal(n3), 500 + 6000 * (t3 / t3[-1]) ** 2) * (t3 / t3[-1]) ** 2.5 * lv
        place(fx, pan(s3, 0), st)

    # Assemble with sidechain on tonal parts.
    tonal = pad + pan(bass, 0) + pl
    tonal *= sc[:, None]
    ir = make_ir(2.6, bright=5000, seed=3)
    tonal = reverb(tonal, ir, wet=0.28)
    bells = reverb(bells, ir, wet=0.45)
    hats = reverb(hats, make_ir(1.0, bright=9000, seed=5), wet=0.15)
    fx = reverb(fx, ir, wet=0.3)
    mix = tonal + bells + hats + fx + pan(kick, 0)
    # gentle high-shelf tame + DC/sub-rumble cleanup
    for c in range(2):
        mix[:, c] = hp(mix[:, c], 28)
    # Fade in 10 ms (start exactly on beat but no click), fade out last 0.6 s.
    fi = int(0.01 * SR)
    mix[:fi] *= np.linspace(0, 1, fi)[:, None]
    fo = int(0.6 * SR)
    mix[-fo:] *= (np.cos(np.linspace(0, np.pi / 2, fo)) ** 2)[:, None]
    return mix


# ----------------------------------------------------------------------------- SFX
def sfx_tick(pitch=1.0):
    n = int(0.06 * SR); t = np.arange(n) / SR
    f = 2600 * pitch
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 140) * (1 - np.exp(-t * 4000))
    s += 0.4 * np.sin(2 * np.pi * f * 1.5 * t) * np.exp(-t * 220)
    s += hp(rng.standard_normal(n), 4000) * np.exp(-t * 600) * 0.15
    return pan(s * 0.5, 0), 0


def sfx_whoosh(length=0.55, direction='in', hi=4500):
    n = int(length * SR); t = np.arange(n) / SR
    x = t / t[-1]
    peak = 0.62 if direction == 'in' else 0.35
    env = np.where(x < peak, (x / peak) ** 2.2, ((1 - x) / (1 - peak)) ** 1.6)
    nz = rng.standard_normal(n)
    cut = 300 + hi * env
    s = lp_tv(hp(nz, 150), cut) * env
    # stereo motion
    p = np.linspace(-0.6, 0.6, n) if direction == 'in' else np.linspace(0.3, -0.7, n)
    th = (p + 1) * np.pi / 4
    st = np.stack([s * np.cos(th), s * np.sin(th)], axis=1) * np.sqrt(2) * 0.55
    return st, int(peak * n)  # hit point = loudest moment


def sfx_land():
    n = int(0.28 * SR); t = np.arange(n) / SR
    f = 55 + 60 * np.exp(-t * 35)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18) * (1 - np.exp(-t * 2000))
    s += lp(rng.standard_normal(n), 900) * np.exp(-t * 60) * 0.25
    return pan(s * 0.55, 0), 0


def sfx_click():
    n = int(0.05 * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * 1700 * t) * np.exp(-t * 300)
    s += bp(rng.standard_normal(n), 2000, 9000) * np.exp(-t * 900) * 0.6
    s += np.sin(2 * np.pi * 180 * t) * np.exp(-t * 120) * 0.35  # body
    return pan(s * 0.5, 0), 0


def bell(f, n, decay=5.0):
    t = np.arange(n) / SR
    return ((np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2.0 * f * t) * np.exp(-t * 6)
             + 0.1 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t * 12))
            * np.exp(-t * decay) * (1 - np.exp(-t * 1500)))


def sfx_ping():
    # Generic two-note soft bell (D6 -> A6), original design, not any OS sound.
    n = int(0.9 * SR)
    s = bell(midi(86), n, 5.5)
    s2 = np.zeros(n); off = int(0.085 * SR)
    s2[off:] = bell(midi(93), n - off, 5.0) * 0.8
    return pan((s + s2) * 0.28, 0.1), 0


def sfx_success():
    n = int(0.7 * SR)
    s = bell(midi(81), n, 7.0)
    s2 = np.zeros(n); off = int(0.07 * SR)
    s2[off:] = bell(midi(86), n - off, 6.5)
    return pan((s + s2) * 0.18, -0.05), 0


def sfx_sent():
    n = int(0.32 * SR); t = np.arange(n) / SR
    x = t / t[-1]
    env = np.sin(np.pi * x) ** 1.5
    s = lp_tv(hp(rng.standard_normal(n), 1200), 1500 + 7000 * x) * env
    p = np.linspace(-0.2, 0.7, n); th = (p + 1) * np.pi / 4
    return np.stack([s * np.cos(th), s * np.sin(th)], 1) * np.sqrt(2) * 0.45, 0


def sfx_cut():
    n = int(0.35 * SR); t = np.arange(n) / SR
    f = 48 + 50 * np.exp(-t * 40)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 12) * (1 - np.exp(-t * 3000))
    s += lp(hp(rng.standard_normal(n), 400), 3000) * np.exp(-t * 45) * 0.3
    return pan(s * 0.55, 0), 0


def sfx_shimmer(length=1.6, size=1.0):
    n = int(length * SR); t = np.arange(n) / SR
    st = np.zeros((n, 2))
    notes = [86, 90, 93, 98, 102, 105]  # D A F# up high (D major)
    for i, m in enumerate(notes):
        f = midi(m) * (1 + 0.004 * t)  # tiny upward glide
        a = rng.uniform(0, 0.12) * size
        ph = 2 * np.pi * np.cumsum(f) / SR
        trem = 0.7 + 0.3 * np.sin(2 * np.pi * rng.uniform(5, 9) * t + rng.uniform(0, 6))
        env = np.clip((t - a) / 0.05, 0, 1) * np.exp(-np.clip(t - a, 0, None) * (2.2 + i * 0.4) / size)
        st += pan(np.sin(ph) * trem * env * 0.06, rng.uniform(-0.8, 0.8))
    air = lp_tv(hp(rng.standard_normal(n), 6000), 9000 + 0 * t) * np.exp(-t * 3) * 0.03
    st += pan(air, 0)
    st = reverb(st, make_ir(1.8, bright=10000, seed=11), wet=0.45)
    return st, 0


def sfx_tail():
    n = int(0.9 * SR); t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * midi(62) * t) + 0.5 * np.sin(2 * np.pi * midi(69) * t)) \
        * np.minimum(t / 0.08, 1) * np.exp(-t * 4.5)
    s += lp(rng.standard_normal(n), 2500) * np.minimum(t / 0.1, 1) * np.exp(-t * 6) * 0.08
    return pan(s * 0.12, 0), 0


SFX = {
    'tick': lambda: sfx_tick(1.0),
    'tick_lo': lambda: sfx_tick(0.85),
    'whoosh_in': lambda: sfx_whoosh(0.55, 'in'),
    'whoosh_lift': lambda: sfx_whoosh(0.5, 'in', hi=3500),
    'whoosh_exit': lambda: sfx_whoosh(0.5, 'out'),
    'land': sfx_land,
    'click': sfx_click,
    'ping': sfx_ping,
    'success': sfx_success,
    'sent': sfx_sent,
    'cut_hit': sfx_cut,
    'shimmer_small': lambda: sfx_shimmer(1.0, 0.6),
    'shimmer': lambda: sfx_shimmer(2.2, 1.3),
    'tail': sfx_tail,
}

# align: "onset" = sound starts at t; "peak" = loudest point of whoosh lands at t
CUES = []
def cue(t, sfx, gain_db, align='onset', note=''):
    CUES.append({'t': round(t, 3), 'sfx': sfx, 'gain_db': gain_db, 'align': align, 'note': note})

for i, t in enumerate([0.5, 1.0, 1.5, 2.0, 2.5, 3.0]):
    cue(t, 'tick', -6.0 + i * 0.4, note='word wheel step')
cue(3.5, 'land', -4.0, note='wheel lands on logo')
cue(3.5, 'shimmer_small', -8.0, note='logo land sparkle')
cue(3.8, 'whoosh_in', -4.0, 'peak', 'cut whoosh-in')
cue(5.0, 'ping', -3.0, note='23:40 notification')
cue(6.0, 'cut_hit', -4.0, note='cut to calendar')
cue(6.5, 'whoosh_lift', -5.0, 'peak', 'Saturday cell lift')
cue(7.5, 'click', -3.0, note='save lead')
cue(7.75, 'success', -4.0, note='lead saved')
cue(8.5, 'cut_hit', -4.0, note='cut to MacBook')
cue(9.0, 'whoosh_lift', -5.0, 'peak', 'Booking card flies')
cue(9.5, 'land', -5.0, note='Booking card lands')
cue(9.5, 'tick_lo', -9.0, note='Booking badge on')
cue(10.0, 'whoosh_lift', -5.0, 'peak', 'Airbnb card flies')
cue(10.5, 'land', -5.0, note='Airbnb card lands')
cue(10.5, 'tick_lo', -9.0, note='Airbnb badge on')
cue(11.5, 'whoosh_exit', -5.0, note='exit')
cue(12.0, 'cut_hit', -3.0, note='Friday 15:00 clock')
cue(13.0, 'whoosh_lift', -5.0, 'peak', 'message row lift')
cue(14.0, 'click', -2.0, note='tap send')
cue(14.25, 'sent', -5.0, note='message sent')
cue(15.5, 'whoosh_exit', -5.0, note='exit')
cue(16.0, 'cut_hit', -4.0, note='month end')
for i in range(8):
    cue(16.5 + i * 0.125, 'tick', -11.0 + i * 0.5, note=f'chart bar {i}')
CUES[-8:] = [dict(c, pitch=round(0.8 + i * 0.06, 2)) for i, c in enumerate(CUES[-8:])]
cue(18.5, 'click', -3.0, note='send receipt')
cue(18.75, 'sent', -5.0, note='receipt sent')
cue(19.5, 'whoosh_exit', -5.0, note='exit')
cue(20.0, 'cut_hit', -3.0, note='logo hit')
cue(20.0, 'shimmer', -5.0, note='logo resolve')
cue(21.0, 'tick', -7.0, note='URL in')
cue(23.0, 'whoosh_exit', -6.0, note='everything exits')
cue(23.5, 'tail', -6.0, note='final soft tail')


def build_sfx():
    buf = np.zeros((N, 2))
    for c in CUES:
        if 'pitch' in c:
            snd, hit = sfx_tick(c['pitch'])
        else:
            snd, hit = SFX[c['sfx']]()
        if c['align'] == 'onset':
            hit = 0
        place(buf, snd, c['t'], db(c['gain_db']), hit)
    # short room so SFX sit in the same space as the music
    buf = reverb(buf, make_ir(0.9, bright=7000, seed=21), wet=0.12)
    fo = int(0.3 * SR)
    buf[-fo:] *= np.linspace(1, 0, fo)[:, None]
    return buf


def write(name, x, peak_db=-3.0):
    x = x / max(np.max(np.abs(x)), 1e-9) * db(peak_db)
    assert len(x) == N
    wavfile.write(os.path.join(OUT, name), SR, x.astype(np.float32))


if __name__ == '__main__':
    music = build_music()
    sfx = build_sfx()
    # Keep the relative balance: normalise music to -3 dBFS peak, sfx to -4 dBFS peak.
    write('music.wav', music, -3.0)
    write('sfx.wav', sfx, -4.0)
    with open(os.path.join(OUT, 'cues.json'), 'w') as f:
        json.dump({'placeholder': True, 'bpm': 120, 'duration': DUR, 'sample_rate': SR,
                   'align_help': 'onset: sound starts at t; peak: loudest point lands at t',
                   'cues': CUES}, f, indent=1, ensure_ascii=False)
    print('ok', len(CUES), 'cues')
