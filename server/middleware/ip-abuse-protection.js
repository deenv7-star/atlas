const failures = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 20;

function prune(now) {
  for (const [ip, data] of failures.entries()) {
    if (now - data.firstSeen > WINDOW_MS) {
      failures.delete(ip);
    }
  }
}

export function recordAuthFailure(ip) {
  const now = Date.now();
  prune(now);
  const current = failures.get(ip);
  if (!current) {
    failures.set(ip, { count: 1, firstSeen: now });
    return;
  }
  current.count += 1;
}

export function clearAuthFailure(ip) {
  failures.delete(ip);
}

export function ipAbuseProtection(req, res, next) {
  const now = Date.now();
  prune(now);
  const entry = failures.get(req.ip);
  if (entry && entry.count >= MAX_FAILURES) {
    return res.status(429).json({ error: 'Too many authentication failures from this IP' });
  }
  return next();
}
