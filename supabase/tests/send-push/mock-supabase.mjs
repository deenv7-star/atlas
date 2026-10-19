// Tiny in-memory stand-in for the parts of supabase-js that send-push uses (from / select / eq / is / maybeSingle /
// update / delete, auth.getUser). Tables live on globalThis.__db so the test can seed and inspect them.
const db = () => globalThis.__db;
class Q {
  constructor(t) { this.t = t; this.f = []; this.op = 'select'; this.patch = null; }
  select() { return this; }
  eq(c, v) { this.f.push((r) => r[c] === v); return this; }
  is(c, v) { this.f.push((r) => (r[c] ?? null) === v); return this; }
  update(p) { this.op = 'update'; this.patch = p; return this; }
  delete() { this.op = 'delete'; return this; }
  rows() { return (db()[this.t] || []).filter((r) => this.f.every((fn) => fn(r))); }
  run() {
    const rows = this.rows();
    if (this.op === 'update') rows.forEach((r) => Object.assign(r, this.patch));
    if (this.op === 'delete') db()[this.t] = (db()[this.t] || []).filter((r) => !rows.includes(r));
    (globalThis.__writes ||= []).push({ t: this.t, op: this.op, n: rows.length, patch: this.patch });
    return { data: this.op === 'select' ? rows.map((r) => ({ ...r })) : null, error: null };
  }
  maybeSingle() { const r = this.run(); return Promise.resolve({ data: r.data?.[0] || null, error: null }); }
  then(res, rej) { return Promise.resolve(this.run()).then(res, rej); }
}
export function createClient(_url, key, opts = {}) {
  const auth = (opts.global?.headers?.Authorization || '').replace('Bearer ', '');
  return {
    from: (t) => new Q(t),
    auth: { getUser: async () => ({ data: { user: globalThis.__jwtUsers?.[auth] || null } }) },
  };
}
