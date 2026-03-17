import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, CalendarDays, Wallet, Star,
  ArrowUpLeft, ArrowDownRight, MessageSquare, Plus,
  ChevronLeft, TrendingUp, Zap, Settings,
  Clock, CheckCircle2, Link2, Building2, CreditCard,
  Sparkles, Lock, Crown, ArrowUpRight, Activity,
  Home, Bell, BarChart2, Target, Gift,
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
    queryFn: async () => {
      let q = supabase.from('bookings').select('*');
      if (selectedPropertyId) q = q.eq('property_id', selectedPropertyId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    ...qOpts,
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['dashboard-leads', selectedPropertyId],
    queryFn: async () => {
      let q = supabase.from('leads').select('*');
      if (selectedPropertyId) q = q.eq('property_id', selectedPropertyId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    ...qOpts,
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['dashboard-payments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    ...qOpts,
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['dashboard-reviews', selectedPropertyId],
    queryFn: async () => {
      let q = supabase.from('review_requests').select('*');
      if (selectedPropertyId) q = q.eq('property_id', selectedPropertyId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    ...qOpts,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['dashboard-properties'],
    queryFn: async () => {
      const { data, error } = await supabase.from('properties').select('*');
      if (error) throw error;
      return data ?? [];
    },
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
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-6 py-5 shadow-md">
        <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 left-1/2 w-56 h-56 rounded-full bg-violet-400/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-indigo-200 text-sm font-medium mb-1">
              {format(now, "EEEE, d MMMM yyyy", { locale: he })}
            </p>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              {greeting}, {userName} 👋
            </h1>
            <p className="text-white/50 text-sm mt-1">הנה סיכום פעילות העסק שלך</p>
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
                className="h-8 text-xs bg-white hover:bg-gray-50 text-indigo-700 font-semibold gap-1.5 shadow-md"
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

      {/* ── Getting Started Progress ── */}
      {(() => {
        const steps = [
          { key: 'property', label: 'הוסף נכס ראשון', desc: 'הכנס את פרטי המתחם, כתובת ותמונות', icon: Home, link: 'Settings', done: properties.length > 0 },
          { key: 'integration', label: 'חבר יומן או ערוץ הזמנות', desc: 'סנכרן Airbnb, Booking.com או Google Calendar', icon: Link2, link: 'Integrations', done: false },
          { key: 'payment', label: 'הגדר שער תשלומים', desc: 'חבר Stripe, PayPal או שער מקומי', icon: CreditCard, link: 'Integrations', done: false },
          { key: 'booking', label: 'צור הזמנה ראשונה', desc: 'הוסף הזמנה ידנית או חכה לסנכרון', icon: CalendarDays, link: 'Bookings', done: bookings.length > 0 },
        ];
        const doneCount = steps.filter(s => s.done).length;
        const pct = Math.round((doneCount / steps.length) * 100);
        if (pct === 100) return null;
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Target className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-800">התחלה מהירה</h2>
                </div>
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{doneCount}/{steps.length} הושלמו</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {steps.map((step) => (
                <Link key={step.key} to={createPageUrl(step.link)} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                    step.done ? "bg-emerald-100" : "bg-gray-100"
                  )}>
                    {step.done
                      ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" style={{ width: 18, height: 18 }} />
                      : <step.icon className="w-4 h-4 text-gray-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold", step.done ? "text-gray-400 line-through" : "text-gray-800")}>{step.label}</p>
                    <p className="text-xs text-gray-400">{step.desc}</p>
                  </div>
                  {!step.done && <ArrowUpRight className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
                </Link>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── Insights & Activity Row ── */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Occupancy Gauge */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">שיעור תפוסה</h3>
          </div>
          {(() => {
            const occupancy = properties.length > 0 && bookings.length > 0
              ? Math.min(100, Math.round((bookings.filter(b => b.status === 'APPROVED' || b.status === 'CONFIRMED').length / Math.max(properties.length * 4, 1)) * 100))
              : 0;
            return (
              <div className="flex flex-col items-center">
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#F3F4F6" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="url(#gauge-grad)" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${occupancy * 2.64} 264`}
                      style={{ transition: 'stroke-dasharray 1s ease' }}
                    />
                    <defs><linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#059669" /></linearGradient></defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{occupancy}%</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">מתוך {properties.length} נכסים</p>
              </div>
            );
          })()}
        </div>

        {/* Revenue Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-violet-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">מגמת הכנסות</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-gray-900">₪{stats.totalRevenue.toLocaleString('he-IL')}</p>
              <p className="text-xs text-gray-400 mt-0.5">סה״כ הכנסות</p>
            </div>
            <div className="flex items-end gap-1.5 h-16">
              {[25, 40, 35, 55, 65, 50, 80, 70, 90, 85, 95, 100].map((h, i) => (
                <div key={i} className="flex-1 rounded-t" style={{
                  height: `${h}%`,
                  background: `linear-gradient(180deg, ${i >= 10 ? '#8B5CF6' : '#C4B5FD'} 0%, ${i >= 10 ? '#7C3AED' : '#A78BFA'} 100%)`,
                  opacity: 0.4 + (i * 0.05),
                  transition: 'height 0.8s ease',
                }} />
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center">12 חודשים אחרונים</p>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">פעילות אחרונה</h3>
          </div>
          {bookings.length === 0 && leads.length === 0 ? (
            <div className="text-center py-6">
              <Activity className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">אין פעילות עדיין</p>
              <p className="text-xs text-gray-300">התחל להוסיף הזמנות ולידים</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...bookings.slice(0, 2).map(b => ({
                type: 'booking',
                icon: CalendarDays,
                color: 'text-blue-600 bg-blue-50',
                text: `הזמנה ${b.status === 'APPROVED' ? 'אושרה' : 'נוספה'} — ${b.guest_name || 'אורח'}`,
                time: b.created_at || b.check_in_date,
              })), ...leads.slice(0, 2).map(l => ({
                type: 'lead',
                icon: Users,
                color: 'text-violet-600 bg-violet-50',
                text: `ליד חדש — ${l.full_name || l.name || 'ללא שם'}`,
                time: l.created_at,
              }))].sort((a, b) => (b.time || '').localeCompare(a.time || '')).slice(0, 4).map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", item.color)}>
                    <item.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 truncate">{item.text}</p>
                    <p className="text-xs text-gray-400">{item.time ? format(parseISO(item.time), 'd MMM, HH:mm', { locale: he }) : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Premium Features Teaser ── */}
      <div className="bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/60 rounded-2xl border border-indigo-100/60 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-sm">
            <Crown className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">שדרג את החוויה שלך</h2>
            <p className="text-xs text-gray-500">גלה את כל מה ש-ATLAS יכול לעשות עבורך</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Sparkles, label: 'ניקיון אוטומטי', desc: 'משימות ניקיון נוצרות לבד', link: 'Cleaning', color: 'from-emerald-400 to-teal-500' },
            { icon: Link2, label: 'אינטגרציות', desc: 'חבר Airbnb, Booking ועוד', link: 'Integrations', color: 'from-blue-400 to-indigo-500' },
            { icon: MessageSquare, label: 'הודעות אוטומטיות', desc: 'WhatsApp, SMS, מייל', link: 'Automations', color: 'from-violet-400 to-purple-500' },
            { icon: BarChart2, label: 'דוחות מתקדמים', desc: 'הכנסות, תפוסה, מגמות', link: 'Invoices', color: 'from-amber-400 to-orange-500' },
          ].map((feat, i) => (
            <Link key={i} to={createPageUrl(feat.link)} className="group">
              <div className="bg-white rounded-xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-md transition-all duration-200 h-full">
                <div className={cn("w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform", feat.color)}>
                  <feat.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-0.5">{feat.label}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{feat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Pro Upgrade Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 via-indigo-900 to-violet-900 p-6">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">14 ימי ניסיון חינם</h3>
              <p className="text-sm text-white/60">כל התכונות פתוחות — ללא כרטיס אשראי. נסה עכשיו וראה את ההבדל.</p>
            </div>
          </div>
          <Link to={createPageUrl('Subscription')}>
            <Button className="bg-white hover:bg-gray-50 text-indigo-700 font-semibold shadow-lg px-6 h-10 flex-shrink-0">
              שדרג עכשיו
              <ArrowUpRight className="w-4 h-4 mr-1.5" />
            </Button>
          </Link>
        </div>
      </div>

    </div>
  );
}
