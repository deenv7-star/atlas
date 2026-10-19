import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePlans } from '../hooks';
import { monthlyValue } from './kpis';
import { matches, sortRows, paginate, filtersFromParams, filtersToParams, DEFAULT_FILTERS, lastSeen } from './listModel';
import { countsOf } from './parts';

/** List state that lives in the URL (filters, sort, page) + the selection (in memory). */
export function useCustomerList(all = []) {
  const [sp, setSp] = useSearchParams();
  const { plans } = usePlans();
  const f = filtersFromParams(sp);
  const sort = { key: sp.get('sort') || 'created_at', dir: sp.get('dir') || 'desc' };
  const page = Math.max(1, Number(sp.get('page')) || 1);
  const [selected, setSelected] = useState([]);
  const write = (nf, extra = {}) => {
    const keep = {};
    for (const k of ['c', 'sort', 'dir', 'page']) if (sp.get(k)) keep[k] = sp.get(k);
    setSp(filtersToParams(nf, { ...keep, ...extra }), { replace: true });
  };
  const set = (patch) => { write({ ...f, ...patch }, { page: '' }); setSelected([]); };
  const reset = () => { write({ ...DEFAULT_FILTERS }, { page: '' }); setSelected([]); };
  const setSort = (key) => write(f, { sort: key, dir: sort.key === key && sort.dir === 'desc' ? 'asc' : 'desc', page: '' });
  const setPage = (n) => write(f, { page: n > 1 ? n : '' });
  const now = Date.now();
  const scoped = useMemo(() => all.filter((c) => matches(c, { ...f, status: 'all' }, now)), [all, sp]); // eslint-disable-line react-hooks/exhaustive-deps
  const rows = useMemo(() => sortRows(scoped.filter((c) => f.status === 'all' || c.status === f.status), sort, { mrr: (c) => (['active', 'past_due'].includes(c.status) ? monthlyValue(c, plans) : null), last_seen: lastSeen }), [scoped, sp, plans]); // eslint-disable-line react-hooks/exhaustive-deps
  const p = paginate(rows, page);
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const pageIds = p.rows.map((c) => c.org_id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const togglePage = () => setSelected((s) => (allOnPage ? s.filter((id) => !pageIds.includes(id)) : [...new Set([...s, ...pageIds])]));
  const openId = sp.get('c');
  const open = (id) => { const o = Object.fromEntries(sp.entries()); if (id) o.c = id; else delete o.c; setSp(o); };
  return { f, set, reset, sort, setSort, p, setPage, rows, counts: countsOf(scoped), selected, setSelected, toggle, togglePage, allOnPage, openId, open, plans };
}
