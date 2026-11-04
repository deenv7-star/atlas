// A tiny in-memory stand-in for the supabase-js query builder, enough for the brain tools.
// Supports: from().select(cols).eq/neq/gt/gte/lt/lte/in().order(col,{ascending}).limit(n), awaited.
// `org` simulates RLS: rows of other orgs are invisible, like Postgres policies would make them.
export function fakeDb(tables, { org = 'org-a', userId = 'user-a', log = [] } = {}) {
  const visible = (t) => (tables[t] || []).filter((r) => (t === 'profiles' ? r.id === userId : !('org_id' in r) || r.org_id === org));
  return {
    log,
    from(t) {
      let rows = visible(t).map((r) => ({ ...r }));
      const q = {
        select(cols) { q.cols = cols; return q; },
        eq(c, v) { rows = rows.filter((r) => r[c] === v); return q; },
        neq(c, v) { rows = rows.filter((r) => r[c] !== v); return q; },
        gt(c, v) { rows = rows.filter((r) => r[c] != null && r[c] > v); return q; },
        gte(c, v) { rows = rows.filter((r) => r[c] != null && r[c] >= v); return q; },
        lt(c, v) { rows = rows.filter((r) => r[c] != null && r[c] < v); return q; },
        lte(c, v) { rows = rows.filter((r) => r[c] != null && r[c] <= v); return q; },
        in(c, vs) { rows = rows.filter((r) => vs.includes(r[c])); return q; },
        order(c, o = {}) { const asc = o.ascending !== false; rows.sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (asc ? 1 : -1)); return q; },
        limit(n) { rows = rows.slice(0, n); return q; },
        then(res, rej) {
          log.push(t);
          const cols = String(q.cols || '*');
          const pick = cols === '*' ? rows : rows.map((r) => {
            const o = {};
            for (const raw of cols.split(/,(?![^(]*\))/).map((s) => s.trim())) {
              const rel = raw.match(/^(\w+)\((.*)\)$/);
              if (rel) { o[rel[1]] = (tables[rel[1]] || []).find((x) => x.id === r.organization_id) || null; continue; }
              o[raw] = r[raw];
            }
            return o;
          });
          return Promise.resolve({ data: pick, error: null }).then(res, rej);
        },
      };
      return q;
    },
  };
}
