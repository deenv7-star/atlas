export function securityHeaders(req, res, next) {
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('x-xss-protection', '0');
  res.setHeader('permissions-policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader(
    'content-security-policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://ui-avatars.com https://lottie.host",
      "connect-src 'self' https://api.stripe.com https://fonts.googleapis.com wss:",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ')
  );
  if (req.secure) {
    res.setHeader('strict-transport-security', 'max-age=31536000; includeSubDomains');
  }
  next();
}
