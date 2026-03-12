import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, CalendarDays, Wallet, Star,
  ArrowUpLeft, ArrowDownRight, MessageSquare, Plus,
  ChevronLeft, TrendingUp, Zap, Settings,
  Clock, CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

const STATUS_COLORS = {
  NEW:        'bg-blue-100 text-blue-700',
  CONTACTED:  'bg-yellow-100 text-yellow-700',
  OFFER_SENT: 'bg-purple-100 text-purple-700',
  CONFIRMED:  'bg-emerald-100 text-emerald-700',
  REJECTED:   'bg-red-100 text-red-700',
  LOST:       'bg-gray-100 text-gray-500',
  APPROVED:   'bg-emerald-100 text-emerald-700',
  PENDING:    'bg-amber-100 text-amber-700',
  WAITLIST:   'bg-purple-100 text-purple-700',
  CANCELLED:  'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  NEW: 'חדש', CONTACTED: 'נוצר קשר', OFFER_SENT: 'הצעה נשלחה',
  CONFIRMED: 'מאושר', REJECTED: 'נדחה', LOST: 'אבוד',
  APPROVED: 'מאושר', PENDING: 'ממתין', WAITLIST: 'המתנה', CANCELLED: 'בוטל',
};

/* ── Stat Card ─────────────────────────────────────── */
function StatCard({ title, value, subtitle, icon: Icon, gradient, iconClass, trend, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80">
        <Skeleton className="h-3.5 w-20 mb-4" />
        <Skeleton className="h-9 w-24 mb-2" />
        <Skeleton className="h-3 w-28" />
      </div>
    );
  }
  return (
    <div className={cn(
      "rounded-2xl p-5 border border-white/60 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-default group",
      gradient
    )}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0", iconClass)}>
          <Icon className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">{value}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      {trend !== undefined && (
        <div className={cn("flex items-center gap-1 text-xs font-semibold mt-2", trend >= 0 ? "text-emerald-600" : "text-red-500")}>
          {trend >= 0
            ? <ArrowUpLeft className="w-3 h-3" />
            : <ArrowDownRight className="w-3 h-3" />}
          <span>{Math.abs(trend)}% מהחודש הקודם</span>
        </div>
      )}
    </div>
  );
}

/* ── Booking Row ───────────────────────────────────── */
function BookingRow({ booking }) {
  const dateStr = booking.check_in_date
    ? format(parseISO(booking.check_in_date), 'd MMM', { locale: he })
    : '';

  return (
    <Link
      to={createPageUrl('Bookings')}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
        <span className="text-[10px] font-semibold text-white/80 leading-none">
          {booking.check_in_date ? format(parseISO(booking.check_in_date), 'MMM', { locale: he }) : ''}
        </span>
        <span className="text-sm font-bold text-white leading-none">
          {booking.check_in_date ? format(parseISO(booking.check_in_date), 'd') : ''}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{booking.guest_name || 'אורח'}</p>
        <p className="text-xs text-gray-400 truncate">
          {booking.nights ? `${booking.nights} לילות` : ''}
          {booking.property_name ? ` · ${booking.property_name}` : ''}
        </p>
      </div>
      <span className={cn(
        "text-[11px] font-medium px-2 py-0.5 rounded-full border-0 flex-shrink-0",
        STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-600'
      )}>
        {STATUS_LABELS[booking.status] || booking.status}
      </span>
    </Link>
  );
}

/* ── Lead Row ──────────────────────────────────────── */
function LeadRow({ lead }) {
  const initials = (lead.full_name || lead.name || 'א')[0];
  return (
    <Link
      to={createPageUrl('Leads')}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
    >
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00D1C1]/30 to-blue-200/60 flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#00a89a]">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {lead.full_name || lead.name || 'ליד חדש'}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {lead.check_in_date ? `כניסה: ${format(parseISO(lead.check_in_date), 'dd/MM/yy')}` : ''}
          {lead.nights ? ` · ${lead.nights} לילות` : ''}
        </p>
      </div>
      <span className={cn(
        "text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0",
        STATUS_COLORS[lead.status] || 'bg-gray-100 text-gray-600'
      )}>
        {STATUS_LABELS[lead.status] || lead.status}
      </span>
    </Link>
  );
}

/* ── Section Card ──────────────────────────────────── */
function SectionCard({ title, icon: Icon, viewAllLink, children, loading, emptyIcon: EmptyIcon, emptyText, addLink }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#00D1C1]/10 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-[#00D1C1]" />
          </div>
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        </div>
        <Link to={viewAllLink}>
          <button className="flex items-center gap-0.5 text-xs font-medium text-[#00D1C1] hover:text-[#00b8aa] transition-colors">
            הכל
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </Link>
      </div>

      <div className="p-3">
        {loading ? (
          <div className="space-y-2 p-1">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
          </div>
        ) : React.Children.count(children) === 0 ? (
          <div className="py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <EmptyIcon className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400 mb-3">{emptyText}</p>
            {addLink && (
              <Link to={addLink}>
                <Button size="sm" variant="outline" className="text-xs h-7 rounded-lg">
                  <Plus className="w-3 h-3 ml-1" /> הוסף
                </Button>
              </Link>
            )}
          </div>
        ) : children}
      </div>
    </div>
  );
}

/* ── Quick Action ──────────────────────────────────── */
function QuickAction({ label, icon: Icon, page, iconClass }) {
  return (
    <Link to={createPageUrl(page)}>
      <div className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-[#00D1C1]/30 hover:shadow-sm transition-all duration-200 group cursor-pointer">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-110",
          iconClass
        )}>
          <Icon style={{ width: '18px', height: '18px' }} />
        </div>
        <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">{label}</span>
      </div>
    </Link>
  );
}

/* ── Main Dashboard ────────────────────────────────── */
export default function Dashboard({ user, selectedPropertyId }) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  const weekEnd   = endOfWeek(now,   { weekStartsOn: 0 });

  const qOpts = { staleTime: 2 * 60 * 1000, retry: 1 };

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['dashboard-bookings', selectedPropertyId],
    queryFn: () => base44.entities.Booking.list(selectedPropertyId ? { property_id: selectedPropertyId } : {}),
    ...qOpts,
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['dashboard-leads', selectedPropertyId],
    queryFn: () => base44.entities.Lead.list(selectedPropertyId ? { property_id: selectedPropertyId } : {}),
    ...qOpts,
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['dashboard-payments'],
    queryFn: () => base44.entities.Payment.list(),
    ...qOpts,
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['dashboard-reviews', selectedPropertyId],
    queryFn: () => base44.entities.ReviewRequest.list(selectedPropertyId ? { property_id: selectedPropertyId } : {}),
    ...qOpts,
  });

  const stats = useMemo(() => {
    const thisWeekBookings = bookings.filter(b => {
      try { return isWithinInterval(parseISO(b.check_in_date), { start: weekStart, end: weekEnd }); }
      catch { return false; }
    });
    const confirmedBookings = bookings.filter(b => ['CONFIRMED', 'APPROVED'].includes(b.status));
    const newLeads = leads.filter(l => l.status === 'NEW');
    const totalRevenue = payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const withRating = reviews.filter(r => r.rating);
    const avgRating = withRating.length > 0
      ? (withRating.reduce((sum, r) => sum + (r.rating || 0), 0) / withRating.length).toFixed(1)
      : null;
    return { thisWeekBookings, confirmedBookings, newLeads, totalRevenue, avgRating };
  }, [bookings, leads, payments, reviews, weekStart, weekEnd]);

  const upcomingBookings = bookings
    .filter(b => { try { return parseISO(b.check_in_date) >= now; } catch { return false; } })
    .sort((a, b) => { try { return parseISO(a.check_in_date) - parseISO(b.check_in_date); } catch { return 0; } })
    .slice(0, 5);

  const recentLeads = leads
    .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))
    .slice(0, 5);

  const userName = user?.full_name?.split(' ')[0] || 'שלום';
  const greeting = (() => {
    const h = now.getHours();
    if (h < 12) return 'בוקר טוב';
    if (h < 17) return 'צהריים טובים';
    if (h < 21) return 'ערב טוב';
    return 'לילה טוב';
  })();

  return (
    <div className="min-h-full p-4 md:p-6 space-y-5 max-w-7xl mx-auto animate-fade-in">

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B1220] via-[#0f1d35] to-[#0B1220] px-6 py-5 shadow-md">
        {/* decorative circles */}
        <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-[#00D1C1]/8 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 left-1/2 w-56 h-56 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[#00D1C1] text-sm font-medium mb-1 opacity-90">
              {format(now, "EEEE, d MMMM yyyy", { locale: he })}
            </p>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              {greeting}, {userName} 👋
            </h1>
            <p className="text-white/40 text-sm mt-1">הנה סיכום פעילות העסק שלך</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link to={createPageUrl('Leads')}>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-white/15 text-white/80 hover:bg-white/10 hover:text-white bg-transparent gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                ליד חדש
              </Button>
            </Link>
            <Link to={createPageUrl('Bookings')}>
              <Button
                size="sm"
                className="h-8 text-xs bg-[#00D1C1] hover:bg-[#00c4b5] text-[#0B1220] font-semibold gap-1.5 shadow-md shadow-[#00D1C1]/25"
              >
                <Plus className="w-3.5 h-3.5" />
                הזמנה חדשה
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="הזמנות השבוע"
          value={bookingsLoading ? '—' : stats.thisWeekBookings.length}
          subtitle={`${stats.confirmedBookings.length} מאושרות סה"כ`}
          icon={CalendarDays}
          gradient="bg-gradient-to-br from-blue-50 to-blue-100/60"
          iconClass="icon-blue"
          loading={bookingsLoading}
        />
        <StatCard
          title="לידים חדשים"
          value={leadsLoading ? '—' : stats.newLeads.length}
          subtitle={`${leads.length} לידים סה"כ`}
          icon={Users}
          gradient="bg-gradient-to-br from-violet-50 to-purple-100/60"
          iconClass="icon-purple"
          loading={leadsLoading}
        />
        <StatCard
          title="הכנסות"
          value={paymentsLoading ? '—' : `₪${stats.totalRevenue.toLocaleString('he-IL')}`}
          subtitle="סה״כ תשלומים שהתקבלו"
          icon={Wallet}
          gradient="bg-gradient-to-br from-teal-50 to-emerald-100/60"
          iconClass="icon-teal"
          loading={paymentsLoading}
        />
        <StatCard
          title="דירוג ממוצע"
          value={reviewsLoading ? '—' : (stats.avgRating ? `★ ${stats.avgRating}` : '—')}
          subtitle={`${reviews.length} ביקורות`}
          icon={Star}
          gradient="bg-gradient-to-br from-amber-50 to-yellow-100/60"
          iconClass="icon-amber"
          loading={reviewsLoading}
        />
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Upcoming Bookings */}
        <SectionCard
          title="הזמנות קרובות"
          icon={CalendarDays}
          viewAllLink={createPageUrl('Bookings')}
          loading={bookingsLoading}
          emptyIcon={CalendarDays}
          emptyText="אין הזמנות קרובות"
          addLink={createPageUrl('Bookings')}
        >
          {upcomingBookings.map(b => <BookingRow key={b.id} booking={b} />)}
        </SectionCard>

        {/* Recent Leads */}
        <SectionCard
          title="לידים אחרונים"
          icon={Users}
          viewAllLink={createPageUrl('Leads')}
          loading={leadsLoading}
          emptyIcon={Users}
          emptyText="אין לידים עדיין"
          addLink={createPageUrl('Leads')}
        >
          {recentLeads.map(l => <LeadRow key={l.id} lead={l} />)}
        </SectionCard>
      </div>

      {/* ── Quick Actions ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[#00D1C1]/10 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-[#00D1C1]" />
          </div>
          <h2 className="text-sm font-semibold text-gray-800">פעולות מהירות</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction label="ליד חדש"      icon={Users}         page="Leads"     iconClass="icon-purple" />
          <QuickAction label="הזמנה חדשה"  icon={CalendarDays}  page="Bookings"  iconClass="icon-blue" />
          <QuickAction label="הודעות"       icon={MessageSquare} page="Messages"  iconClass="icon-teal" />
          <QuickAction label="הגדרות"       icon={Settings}      page="Settings"  iconClass="icon-green" />
        </div>
      </div>

    </div>
  );
}
