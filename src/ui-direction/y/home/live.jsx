/**
 * Today "לוח חי" (today/wow-v2, 05.11.2026): the day as a line in the greeting card. Each departure/arrival is a face on
 * the line at its hour, what already happened fades with a check, and the now-dot moves (re-read every 30s).
 * Hebrew reads right to left, so the morning is on the right. Reduced motion: drawn at once, no pulse.
 */
import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { FaceStack } from '../ui';
import { cn } from '@/lib/utils';

export function useNow(ms = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}
const toMin = (s) => { const [h, mm] = String(s || '').split(':').map(Number); return Number.isFinite(h) ? h * 60 + (mm || 0) : null; };
const hhmm = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** events: [{ t: '11:00', name, dir: 'in'|'out' }] */
export function DayLine({ events = [] }) {
  const now = useNow();
  const groups = [];
  events.forEach((e) => { const m = toMin(e.t); if (m == null) return; const g = groups.find((x) => x.m === m); if (g) g.items.push(e); else groups.push({ m, t: e.t, items: [e] }); });
  if (!groups.length) return null;
  groups.sort((a, b) => a.m - b.m);
  // two hours closer than 75 min share one stop (15:00 and 16:00 drew on top of each other at 390)
  for (let i = groups.length - 1; i > 0; i -= 1) {
    if (groups[i].m - groups[i - 1].m < 75) {
      const g = groups[i - 1]; g.items.push(...groups[i].items); g.last = groups[i].last || groups[i].t; g.mEnd = groups[i].mEnd || groups[i].m; groups.splice(i, 1);
    }
  }
  groups.forEach((g) => { if (g.last) g.t = `${parseInt(g.t, 10)}–${parseInt(g.last, 10)}`; });
  const nowM = now.getHours() * 60 + now.getMinutes();
  const start = Math.min(8 * 60, Math.floor((groups[0].m - 60) / 60) * 60);
  const end = Math.max(22 * 60, Math.ceil((groups[groups.length - 1].m + 60) / 60) * 60);
  const pct = (m) => Math.max(0, Math.min(100, ((m - start) / (end - start)) * 100));
  const inDay = nowM >= start && nowM <= end;
  const label = `היום: ${groups.map((g) => `${g.t} ${g.items.map((i) => (i.dir === 'in' ? 'הגעה' : 'יציאה')).join(' ו')}`).join(', ')}. עכשיו ${hhmm(now)}.`;
  return (
    <div className="lv-line" role="img" aria-label={label}>
      <i className="lv-fill" style={{ '--p': `${inDay ? pct(nowM) : nowM > end ? 100 : 0}%` }} />
      {groups.map((g, i) => (
        <span key={g.m} className={cn('lv-ev', (g.mEnd || g.m) <= nowM && 'is-done')} style={{ insetInlineStart: `${pct(g.m)}%`, '--i': i }}>
          <span className="lv-dot">{(g.mEnd || g.m) <= nowM ? <i className="lv-ck"><Check strokeWidth={3} /></i> : null}<FaceStack names={g.items.map((x) => x.name || '')} size={24} max={2} /></span>
          <span className="lv-t" dir="ltr">{g.t}</span>
        </span>
      ))}
      {inDay ? <span className="lv-now" style={{ insetInlineStart: `${pct(nowM)}%` }}><span dir="ltr">{hhmm(now)}</span></span> : null}
    </div>
  );
}
