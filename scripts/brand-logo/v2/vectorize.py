"""Contours -> pieces (exact H/V lines + G1 cubic Beziers). Tuned on Deen's v2 wordmark (IoU 0.9976 at err=0.5)
and script-a icon (IoU 0.9950 at err=0.6, lines disabled).
Rules: lines only when axis-aligned (<2 deg) and >= minLine px; line ends trimmed back until the data sits within
trimTol of the line (so curves leave lines tangentially, no notches); tiny curve between two perpendicular lines ->
sharp corner (line intersection); H/V coordinates clustered across glyphs (snap_eps); cornerless loops start at their
topmost point with a horizontal tangent; collinear consecutive H/V merged."""
import numpy as np
from fitlib import resample, dline, corners, fit


def lsq_line(P):
    c = P.mean(0); _, _, vt = np.linalg.svd(P - c); d = vt[0]
    return c, d / np.linalg.norm(d)


def _dtan(Q):
    m = min(len(Q), 14)
    if m >= 5:
        seg = Q[:m]; sp = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(seg, axis=0), axis=1))])
        cx = np.polyfit(sp, seg[:, 0], 2); cy = np.polyfit(sp, seg[:, 1], 2); v = np.array([cx[1], cy[1]])
    else: v = Q[-1] - Q[0]
    return v / np.linalg.norm(v)


def pieces_for(p, step, cornerK, cornerAng, minLine, lineTol, trimTol=0.08):
    n = len(p)
    cs, _ = corners(p, cornerK, cornerAng)
    if cs:
        sh = cs[0]; p = np.roll(p, -sh, 0); cs = [(c - sh) % n for c in cs]
    else:
        sh = int(np.argmin(p[:, 1])); p = np.roll(p, -sh, 0)
    bounds = cs + [n] if cs else [0, n]
    runs = []
    for a, b in zip(bounds[:-1], bounds[1:]):
        i = a; cur = a
        while i < b:
            j = i + int(minLine / step)
            if j <= b:
                idx = np.arange(i, j + 1) % n
                if dline(p[idx], p[i % n], p[j % n]).max() < lineTol:
                    while j + 1 <= b:
                        idx = np.arange(i, j + 2) % n
                        if dline(p[idx], p[i % n], p[(j + 1) % n]).max() < lineTol: j += 1
                        else: break
                    idx = np.arange(i, j + 1) % n; c0, d = lsq_line(p[idx])
                    def dv(k): q = p[k % n] - c0; return abs(q[0] * d[1] - q[1] * d[0])
                    i2, j2 = i, j
                    while i2 < j2 - 4 and dv(i2) > trimTol: i2 += 1
                    while j2 > i2 + 4 and dv(j2) > trimTol: j2 -= 1
                    if (j2 - i2) * step < minLine * 0.6: i += 1; continue
                    if i2 > cur: runs.append([cur, i2, 'C'])
                    runs.append([i2, j2, 'L']); cur = j2; i = j2; continue
            i += 1
        if cur < b: runs.append([cur, b, 'C'])
    return p, set(c % n for c in cs), runs


def vectorize(contours_px, step=0.5, cornerK=6, cornerAng=np.radians(32), minLine=22, lineTol=0.3, err=0.5,
              axis_deg=2.0, snap_eps=1.0, corner_merge=6.0):
    shapes = []
    for c in contours_px:
        p = resample(c, step); n = len(p)
        p, cs, runs = pieces_for(p, step, cornerK, cornerAng, minLine, lineTol)
        for r in runs:
            if r[2] == 'L':
                idx = np.arange(r[0], r[1] + 1) % n; c0, d = lsq_line(p[idx])
                ang = np.degrees(np.arctan2(abs(d[1]), abs(d[0])))
                axis = 'H' if ang < axis_deg else ('V' if ang > 90 - axis_deg else None)
                if axis is None: r[2] = 'C'
                else: r.append({'c': c0, 'd': d, 'axis': axis})
        mr = []
        for r in runs:
            if mr and r[2] == 'C' and mr[-1][2] == 'C': mr[-1][1] = r[1]
            else: mr.append(r)
        if len(mr) > 1 and mr[0][2] == 'C' and mr[-1][2] == 'C' and mr[-1][1] % n == mr[0][0] % n:
            mr[0][0] = mr[-1][0] - n if mr[-1][0] > mr[0][0] else mr[-1][0]; mr.pop()
        runs = mr
        changed = True
        while changed:
            changed = False; m = len(runs)
            for k in range(m):
                r = runs[k]
                if r[2] == 'C' and runs[k - 1][2] == 'L' and runs[(k + 1) % m][2] == 'L' and (r[1] - r[0]) * step < corner_merge:
                    if abs(np.dot(runs[k - 1][3]['d'], runs[(k + 1) % m][3]['d'])) < 0.5:
                        runs[k - 1][1] = r[1]; runs.pop(k); changed = True; break
        shapes.append({'p': p, 'n': n, 'cs': cs, 'runs': runs})
    for ax, k in (('H', 1), ('V', 0)):
        vals = sorted([(r[3]['c'][k], r) for s in shapes for r in s['runs'] if r[2] == 'L' and r[3]['axis'] == ax], key=lambda v: v[0])
        groups = []
        for v in vals:
            if groups and v[0] - groups[-1][-1][0] < snap_eps: groups[-1].append(v)
            else: groups.append([v])
        for g in groups:
            mval = np.mean([v[0] for v in g])
            for v in g:
                L = v[1][3]; L['c'] = L['c'].copy(); L['c'][k] = mval; L['d'] = np.array([1., 0.]) if ax == 'H' else np.array([0., 1.])
    out = []
    for s in shapes:
        p, n, cs, runs = s['p'], s['n'], s['cs'], s['runs']; m = len(runs)
        def proj(L, x): return L['c'] + np.dot(x - L['c'], L['d']) * L['d']
        def isect(L1, L2):
            A = np.array([L1['d'], -L2['d']]).T
            if abs(np.linalg.det(A)) < 1e-6: return None
            t = np.linalg.solve(A, L2['c'] - L1['c']); return L1['c'] + t[0] * L1['d']
        J = []
        for k in range(m):
            r1 = runs[k]; r2 = runs[(k + 1) % m]; pt = p[r1[1] % n]
            if r1[2] == 'L' and r2[2] == 'L':
                x = isect(r1[3], r2[3]); pt = x if x is not None else pt
            elif r1[2] == 'L': pt = proj(r1[3], pt)
            elif r2[2] == 'L': pt = proj(r2[3], pt)
            J.append(pt)
        segs = []
        for k in range(m):
            r = runs[k]; a = J[k - 1]; b = J[k]
            if r[2] == 'L': segs.append(('L', a, b)); continue
            idx = np.arange(r[0], r[1] + 1) % n; P = p[idx].copy(); P[0] = a; P[-1] = b
            prev = runs[k - 1]; nxt = runs[(k + 1) % m]
            corner_a = (r[0] % n) in cs; corner_b = (r[1] % n) in cs
            loop = (m == 1)
            if loop:
                t1 = np.array([1., 0.]) if P[3][0] > P[0][0] else np.array([-1., 0.]); t2 = -t1
            else:
                if prev[2] == 'L' and not corner_a:
                    d = prev[3]['d']; t1 = d if np.dot(d, P[min(len(P) - 1, 4)] - P[0]) > 0 else -d
                else: t1 = _dtan(P)
                if nxt[2] == 'L' and not corner_b:
                    d = nxt[3]['d']; t2 = d if np.dot(d, P[max(0, len(P) - 5)] - P[-1]) > 0 else -d
                else: t2 = _dtan(P[::-1])
            if len(P) < 3: segs.append(('L', a, b)); continue
            for cb in fit(P, t1, t2, err): segs.append(('B',) + tuple(cb))
        out.append(segs)
    return out


def to_d(shapes, ox=0, oy=0, sc=1.0, prec=2):
    def f(v):
        s = ('%.*f' % (prec, v)).rstrip('0').rstrip('.'); return '0' if s in ('-0', '') else s
    d = []
    for segs in shapes:
        a = segs[0][1]; d.append('M%s %s' % (f((a[0] - ox) * sc), f((a[1] - oy) * sc)))
        for s in segs:
            if s[0] == 'L':
                a, b = s[1], s[2]
                if abs(a[0] - b[0]) < 0.05:
                    if d[-1][0] == 'V': d.pop()
                    d.append('V' + f((b[1] - oy) * sc))
                elif abs(a[1] - b[1]) < 0.05:
                    if d[-1][0] == 'H': d.pop()
                    d.append('H' + f((b[0] - ox) * sc))
                else: d.append('L%s %s' % (f((b[0] - ox) * sc), f((b[1] - oy) * sc)))
            else:
                _, a, c1, c2, b = s
                d.append('C' + ' '.join('%s %s' % (f((q[0] - ox) * sc), f((q[1] - oy) * sc)) for q in (c1, c2, b)))
        d.append('Z')
    return ''.join(d)
