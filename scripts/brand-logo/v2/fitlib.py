"""Faithful vectoriser helpers: subpixel contours, corner detection, Schneider cubic-Bezier fitting."""
import numpy as np
from skimage import measure
from scipy.ndimage import gaussian_filter
TW = 10  # half-window (samples) for smooth tangent estimates at split points


def contours(gray, up=4, sigma=1.2, level=127.5):
    """gray: uint8, ink DARK. Bicubic upsample + light blur, marching squares -> (x,y) in source px (pixel-centre)."""
    from PIL import Image
    im = Image.fromarray(gray).resize((gray.shape[1] * up, gray.shape[0] * up), Image.BICUBIC)
    a = gaussian_filter(np.array(im).astype(float), sigma)
    out = []
    for c in measure.find_contours(a, level):
        p = np.stack([c[:, 1], c[:, 0]], 1) / up + (0.5 / up - 0.5)
        if len(p) >= 20: out.append(p)
    return out


def resample(p, step):
    if np.allclose(p[0], p[-1]): p = p[:-1]
    q = np.vstack([p, p[:1]]); seg = np.linalg.norm(np.diff(q, axis=0), axis=1); L = np.concatenate([[0], np.cumsum(seg)])
    n = max(int(L[-1] / step), 12); t = np.linspace(0, L[-1], n, endpoint=False)
    return np.stack([np.interp(t, L, q[:, 0]), np.interp(t, L, q[:, 1])], 1)


def dline(P, a, b):
    d = b - a; n = np.linalg.norm(d)
    return np.abs(d[0] * (P[:, 1] - a[1]) - d[1] * (P[:, 0] - a[0])) / n


def corners(p, k, ang):
    n = len(p); idx = np.arange(n)
    v1 = p - p[(idx - k) % n]; v2 = p[(idx + k) % n] - p
    a1 = np.arctan2(v1[:, 1], v1[:, 0]); a2 = np.arctan2(v2[:, 1], v2[:, 0])
    t = np.abs((a2 - a1 + np.pi) % (2 * np.pi) - np.pi)
    c = []
    for i in range(n):
        if t[i] > ang and t[i] == max(t[(i + j) % n] for j in range(-k, k + 1)):
            if not c or i - c[-1] > k: c.append(i)
    return c, t


def bez(ctrl, t):
    t = t[:, None]; mt = 1 - t
    return mt ** 3 * ctrl[0] + 3 * mt ** 2 * t * ctrl[1] + 3 * mt * t ** 2 * ctrl[2] + t ** 3 * ctrl[3]


def bezd(ctrl, t):
    t = t[:, None]; mt = 1 - t
    return 3 * mt ** 2 * (ctrl[1] - ctrl[0]) + 6 * mt * t * (ctrl[2] - ctrl[1]) + 3 * t ** 2 * (ctrl[3] - ctrl[2])


def bezdd(ctrl, t):
    t = t[:, None]
    return 6 * (1 - t) * (ctrl[2] - 2 * ctrl[1] + ctrl[0]) + 6 * t * (ctrl[3] - 2 * ctrl[2] + ctrl[1])


def chord_param(P):
    d = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]); return d / d[-1]


def gen(P, u, t1, t2):
    a, b = P[0], P[-1]
    A1 = t1[None, :] * (3 * (1 - u) ** 2 * u)[:, None]; A2 = t2[None, :] * (3 * (1 - u) * u ** 2)[:, None]
    C = np.array([[np.sum(A1 * A1), np.sum(A1 * A2)], [np.sum(A1 * A2), np.sum(A2 * A2)]])
    tmp = P - bez(np.array([a, a, b, b]), u)
    X = np.array([np.sum(A1 * tmp), np.sum(A2 * tmp)])
    det = C[0, 0] * C[1, 1] - C[0, 1] ** 2; seg = np.linalg.norm(b - a)
    if abs(det) > 1e-12:
        al1 = (X[0] * C[1, 1] - X[1] * C[0, 1]) / det; al2 = (C[0, 0] * X[1] - C[0, 1] * X[0]) / det
    else: al1 = al2 = seg / 3
    if al1 < 1e-6 * seg or al2 < 1e-6 * seg: al1 = al2 = seg / 3
    return np.array([a, a + t1 * al1, b + t2 * al2, b])


def reparam(ctrl, P, u):
    d = bez(ctrl, u) - P; d1 = bezd(ctrl, u); d2 = bezdd(ctrl, u)
    num = np.sum(d * d1, 1); den = np.sum(d1 * d1, 1) + np.sum(d * d2, 1)
    return np.clip(u - np.where(np.abs(den) > 1e-12, num / den, 0), 0, 1)


def maxerr(ctrl, P, u):
    e = np.linalg.norm(bez(ctrl, u) - P, axis=1); i = int(np.argmax(e)); return e[i], i


def fit(P, t1, t2, err):
    if len(P) == 2:
        d = np.linalg.norm(P[1] - P[0]) / 3; return [np.array([P[0], P[0] + t1 * d, P[1] + t2 * d, P[1]])]
    u = chord_param(P); c = gen(P, u, t1, t2); e, i = maxerr(c, P, u)
    if e < err: return [c]
    if e < err * 6:
        for _ in range(30):
            u = reparam(c, P, u); c = gen(P, u, t1, t2); e, i = maxerr(c, P, u)
            if e < err: return [c]
    i = max(2, min(len(P) - 3, i)); lo = max(0, i - TW); hi = min(len(P) - 1, i + TW)
    seg = P[lo:hi + 1]; sp = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(seg, axis=0), axis=1))]); sp -= sp[i - lo]
    if len(seg) >= 5:
        cx = np.polyfit(sp, seg[:, 0], 2); cy = np.polyfit(sp, seg[:, 1], 2); tc = -np.array([cx[1], cy[1]])
    else: tc = P[i - 1] - P[i + 1]
    tc /= np.linalg.norm(tc)
    return fit(P[:i + 1], t1, tc, err) + fit(P[i:], -tc, t2, err)
