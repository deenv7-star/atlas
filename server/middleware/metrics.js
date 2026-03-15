const state = {
  startedAt: Date.now(),
  totalRequests: 0,
  statusCounts: new Map()
};

export function collectMetrics(req, res, next) {
  state.totalRequests += 1;

  res.on('finish', () => {
    const code = String(res.statusCode);
    state.statusCounts.set(code, (state.statusCounts.get(code) || 0) + 1);
  });

  next();
}

export function renderPrometheusMetrics() {
  const uptimeSeconds = Math.floor((Date.now() - state.startedAt) / 1000);
  const lines = [
    '# HELP atlas_http_requests_total Total HTTP requests processed',
    '# TYPE atlas_http_requests_total counter',
    `atlas_http_requests_total ${state.totalRequests}`,
    '# HELP atlas_uptime_seconds Service uptime in seconds',
    '# TYPE atlas_uptime_seconds gauge',
    `atlas_uptime_seconds ${uptimeSeconds}`,
    '# HELP atlas_http_responses_total Responses by status code',
    '# TYPE atlas_http_responses_total counter'
  ];

  for (const [status, count] of state.statusCounts.entries()) {
    lines.push(`atlas_http_responses_total{status="${status}"} ${count}`);
  }

  return lines.join('\n') + '\n';
}
