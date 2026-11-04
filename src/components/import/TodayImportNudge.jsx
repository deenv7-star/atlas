/**
 * Today, empty state: "עוד לא חיברתם מתחם". Shown only when the business has no unit yet (properties is empty).
 * Lives above the Today board without touching it (Today tiles are another branch's files).
 */
import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ImportEntryCard from './EntryCard';

export default function TodayImportNudge({ orgId }) {
  const [show, setShow] = useState(() => { try { return new URLSearchParams(window.location.search).get('import_nudge') === '1'; } catch { return false; } });
  useEffect(() => {
    if (show) return undefined;
    let alive = true;
    base44.entities.Property.list({}, { limit: 1, select: 'id' })
      .then((r) => { if (alive && Array.isArray(r) && r.length === 0) setShow(true); })
      .catch(() => { /* unknown: stay quiet */ });
    return () => { alive = false; };
  }, [orgId, show]);
  if (!show) return null;
  return (
    <div style={{ padding: '12px 16px 0', maxWidth: 760, marginInline: 'auto', position: 'relative', zIndex: 2 }}>
      <ImportEntryCard where="today" />
    </div>
  );
}
