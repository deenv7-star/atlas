import React from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { createPageUrl } from '@/utils';
import { fmtMoney, fmtShort, ChannelDot, StatusPill, Avatar, ListRow, EmptyState } from '@/components/ds';
import { CalendarDays } from 'lucide-react';

export function greetingFor(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return 'לילה טוב';
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  if (h < 21) return 'ערב טוב';
  return 'לילה טוב';
}
export function firstName(user) {
  return (user?.full_name || '').trim().split(' ')[0] || '';
}
export const bookingUrl = (b) => (b?.id ? `${createPageUrl('BookingDetail')}/${b.id}` : createPageUrl('Bookings'));
export const leadUrl = (l) => (l?.id ? `${createPageUrl('LeadDetail')}/${l.id}` : createPageUrl('Leads'));

export function IncomeChart({ months, height = 220 }) {
  const data = months.map((m) => ({ name: m.label, total: m.total }));
  const hasData = data.some((d) => d.total > 0);
  if (!hasData) {
    return <p className="py-10 text-center text-[15px] text-ink-600">כשיתקבלו תשלומים, ההכנסות יוצגו כאן לפי חודש.</p>;
  }
  return (
    <div style={{ height }} dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="atlasIncomeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3E2BF1" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#3E2BF1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#E7E9F1" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#8C93AB', fontSize: 13, fontFamily: 'Heebo' }} reversed />
          <YAxis orientation="right" width={56} tickLine={false} axisLine={false} tick={{ fill: '#8C93AB', fontSize: 12, fontFamily: 'Heebo' }} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}K` : v)} />
          <Tooltip
            cursor={{ stroke: '#D7DBE8' }}
            formatter={(v) => [fmtMoney(v), 'הכנסות']}
            contentStyle={{ borderRadius: 12, border: '1px solid #E7E9F1', fontFamily: 'Heebo', direction: 'rtl', boxShadow: '0 8px 24px rgba(27,38,86,.1)' }}
          />
          <Area type="monotone" dataKey="total" stroke="#3E2BF1" strokeWidth={2.5} fill="url(#atlasIncomeFill)" dot={false} activeDot={{ r: 5, fill: '#3E2BF1', stroke: '#fff', strokeWidth: 2 }} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function UpcomingList({ items, propName, limit = 5, onEmptyAction }) {
  if (!items.length) {
    return (
      <EmptyState
        compact
        icon={CalendarDays}
        title="אין הגעות קרובות"
        description="הזמנה חדשה תופיע כאן ברגע שתישמר."
        actionLabel={onEmptyAction ? 'הזמנה חדשה' : undefined}
        onAction={onEmptyAction}
      />
    );
  }
  return (
    <ul className="-mx-2 space-y-0.5">
      {items.slice(0, limit).map((b) => (
        <li key={b.id}>
          <ListRow
            as={Link}
            to={bookingUrl(b)}
            leading={<Avatar name={b.guest_name} />}
            title={b.guest_name || 'אורח'}
            meta={
              <span className="inline-flex items-center gap-1.5">
                <ChannelDot source={b.booking_source} />
                {propName(b.property_id, b.property_name)} · {fmtShort(b.check_in_date)} · {b.nights || 1} לילות
              </span>
            }
            trailing={<StatusPill status={b.status} />}
          />
        </li>
      ))}
    </ul>
  );
}
