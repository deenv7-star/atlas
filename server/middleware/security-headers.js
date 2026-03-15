export function securityHeaders(req, res, next) {
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('x-xss-protection', '0');
  res.setHeader('permissions-policy', 'geolocation=(), microphone=(), camera=()');
  if (req.secure) {
    res.setHeader('strict-transport-security', 'max-age=31536000; includeSubDomains');
  }
  next();
}
