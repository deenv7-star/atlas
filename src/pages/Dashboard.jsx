import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LiquidGlassCard } from '@/components/ui/LiquidGlass';
import { ShimmerButton } from '@/components/ui/AnimatedButton';
import {
  Users, CalendarDays, CalendarRange, Wallet, Star,
  ArrowUpLeft, ArrowDownRight, MessageSquare, Plus,
  ChevronLeft, TrendingUp, Zap, Settings,
  CheckCircle2, Link2, CreditCard,
  ArrowUpRight, Activity,
  Home, BarChart2, Target, Gift, FileText,
  AlertCircle, Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO, isSameDay } from 'date-fns';
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

const dashStaggerParent = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const dashItem = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 120, damping: 24, mass: 0.85 },
  },
};

/* ── Stat Card ─────────────────────────────────────── */
const TINT_MAP = {
  'icon-blue':   'blue',
  'icon-purple': 'purple',
  'icon-teal':   'teal',
  'icon-amber':  'neutral',
  'icon-green':  'teal',
  'icon-rose':   'neutral',
};
function StatCard({ title, value, subtitle, icon: Icon, gradient, iconClass, trend, loading }) {
  const tint = TINT_MAP[iconClass] || 'neutral';
  if (loading) {
    return (
      <div className="rounded-2xl p-5 bg-white/60 border border-gray-100/60" style={{ backdropFilter: 'blur(12px)' }}>
        <Skeleton className="h-3.5 w-20 mb-4" />
        <Skeleton className="h-9 w-24 mb-2" />
        <Skeleton className="h-3 w-28" />
      </div>
    );
  }
  return (
    <motion.div whileHover={{ y: -2, scale: 1.01 }} transition={{ type: 'spring', stiffness: 350, damping: 22 }}>
      <LiquidGlassCard tint={tint} size="sm" className="h-full" shimmer={false}>
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 leading-snug">{title}</p>
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", iconClass)}>
            <Icon style={{ width: '16px', height: '16px' }} />
          </div>
        </div>
        <p className="text-3xl font-bold text-zinc-900 mb-1 tracking-tight atlas-tabular">{value}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        {trend !== undefined && (
          <div className={cn("flex items-center gap-1 text-xs font-semibold mt-2", trend >= 0 ? "text-emerald-600" : "text-red-500")}>
            {trend >= 0
              ? <ArrowUpLeft className="w-3 h-3" />
              : <ArrowDownRight className="w-3 h-3" />}
            <span>{Math.abs(trend)}% מהחודש הקודם</span>
          </div>
        )}
      </LiquidGlassCard>
    </motion.div>
  );
}

/* ── Booking Row ───────────────────────────────────── */
function BookingRow({ booking }) {
  const dateStr = booking.check_in_date
    ? format(parseISO(booking.check_in_date), 'd MMM', { locale: he })
    : '';

  const detailUrl = booking?.id ? `${createPageUrl('BookingDetail')}/${booking.id}` : createPageUrl('Bookings');
  return (
    <Link
      to={detailUrl}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50/90 transition-[background-color,transform] duration-200 atlas-ease-out-trans active:scale-[0.99] group"
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
  const detailUrl = lead?.id ? `${createPageUrl('LeadDetail')}/${lead.id}` : createPageUrl('Leads');
  return (
    <Link
      to={detailUrl}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50/90 transition-[background-color,transform] duration-200 atlas-ease-out-trans active:scale-[0.99] group"
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
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
      }}
    >
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(0,209,193,0.12)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)' }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: '#00D1C1' }} />
          </div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">{title}</h2>
        </div>
        <Link
          to={viewAllLink}
          className="inline-flex items-center gap-0.5 text-xs font-medium text-teal-600 hover:text-teal-700 rounded-md py-1.5 ps-1 pe-1 -me-1 transition-colors duration-200 atlas-ease-out-trans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/35 focus-visible:ring-offset-2"
        >
          הכל
          <ChevronLeft className="w-3.5 h-3.5 shrink-0" aria-hidden strokeWidth={2} />
        </Link>
      </div>

      <div className="p-3">
        {loading ? (
          <div className="space-y-2 p-1">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
          </div>
        ) : React.Children.count(children) === 0 ? (
          <div className="py-10 text-center px-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/80 flex items-center justify-center mx-auto mb-3 ring-1 ring-gray-100/80">
              <EmptyIcon className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500 mb-1.5 font-medium">{emptyText}</p>
            <p className="text-xs text-gray-400 leading-relaxed max-w-[220px] mx-auto">כשהנתונים יגיעו — הם יופיעו כאן מיד, בלי לחפש.</p>
            {addLink && (
              <Button asChild size="sm" variant="outline" className="text-xs min-h-[44px] h-11 rounded-lg px-4 touch-manipulation">
                <Link to={addLink}>
                  <Plus className="w-3 h-3 ms-1 shrink-0" strokeWidth={2} aria-hidden />
                  הוסף
                </Link>
              </Button>
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
      <motion.div
        whileHover={{
          y: -3,
          scale: 1.03,
          boxShadow: '0 8px 24px rgba(0,209,193,0.15), 0 2px 8px rgba(0,0,0,0.06)',
        }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="flex flex-col items-center gap-2.5 p-4 rounded-2xl cursor-pointer group"
        style={{
          background: 'rgba(255,255,255,0.75)',
          border: '1px solid rgba(0,0,0,0.07)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
          iconClass
        )}>
          <Icon style={{ width: '18px', height: '18px' }} />
        </div>
        <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">{label}</span>
      </motion.div>
    </Link>
  );
}

/* ── Main Dashboard ────────────────────────────────── */
export default function Dashboard({ user, selectedPropertyId }) {
  const reduceMotion = useReducedMotion();
  const kpiParentVariants = reduceMotion
    ? { hidden: {}, show: { transition: { staggerChildren: 0 } } }
    : dashStaggerParent;
  const kpiItemVariants = reduceMotion
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0, transition: { duration: 0 } } }
    : dashItem;
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  const weekEnd   = endOfWeek(now,   { weekStartsOn: 0 });

  const qOpts = { staleTime: 2 * 60 * 1000, retry: 1 };

  const filters = useMemo(() => (selectedPropertyId ? { property_id: selectedPropertyId } : {}), [selectedPropertyId]);

  const { data: bookings = [], isLoading: bookingsLoading, isError: bookingsError } = useQuery({
    queryKey: ['dashboard-bookings', selectedPropertyId],
    queryFn: () => base44.entities.Booking.filter(filters, '-created_at', 100),
    ...qOpts,
  });

  const { data: leads = [], isLoading: leadsLoading, isError: leadsError } = useQuery({
    queryKey: ['dashboard-leads', selectedPropertyId],
    queryFn: () => base44.entities.Lead.filter(filters, '-created_at', 100),
    ...qOpts,
  });

  const { data: payments = [], isLoading: paymentsLoading, isError: paymentsError } = useQuery({
    queryKey: ['dashboard-payments'],
    queryFn: () => base44.entities.Payment.filter({}, '-created_at', 50),
    ...qOpts,
  });

  const { data: reviews = [], isLoading: reviewsLoading, isError: reviewsError } = useQuery({
    queryKey: ['dashboard-reviews', selectedPropertyId],
    queryFn: () => base44.entities.ReviewRequest.filter(filters, '-created_at', 50),
    ...qOpts,
  });

  const { data: properties = [], isError: propertiesError } = useQuery({
    queryKey: ['dashboard-properties'],
    queryFn: () => base44.entities.Property.list(),
    ...qOpts,
  });

  const dataFetchError =
    bookingsError || leadsError || paymentsError || reviewsError || propertiesError;

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

  const todayCheckIns = bookings.filter(b => {
    try { return isSameDay(parseISO(b.check_in_date), now); } catch { return false; }
  });
  const todayCheckOuts = bookings.filter(b => {
    try {
      if (!b.check_out_date) {
        const nights = b.nights || 1;
        const checkOut = new Date(parseISO(b.check_in_date));
        checkOut.setDate(checkOut.getDate() + nights);
        return isSameDay(checkOut, now);
      }
      return isSameDay(parseISO(b.check_out_date), now);
    } catch { return false; }
  });

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

  const delightLine = useMemo(() => {
    const lines = [
      'הזמנות, לידים ותשלומים — במבט אחד.',
      'מנהלים את הנכס בלי לרדוף אחרי טבלאות.',
      'מה שחשוב להיום: לוח, הזמנות ותזרים.',
      'פחות רעש, יותר שליטה על התפעול.',
    ];
    const d = new Date();
    return lines[(d.getDate() + d.getMonth()) % lines.length];
  }, []);

  return (
    <div className="min-h-full p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">

      {dataFetchError && (
        <Alert className="border-amber-200 bg-amber-50/90 text-amber-950 [&>svg]:absolute [&>svg]:text-amber-700">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>בעיה בטעינת נתונים</AlertTitle>
          <AlertDescription>
            חלק מהמידע מהשרת לא נטען. בדקו חיבור לאינטרנט ורעננו את הדף. אם זה נמשך — פנו לתמיכה.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Hero Banner (light — aligned with atlas-page-hero & app shell) ── */}
      <div
        className="relative overflow-hidden rounded-2xl border border-teal-200/40 bg-gradient-to-br from-white via-zinc-50/80 to-teal-50/30 p-6 md:p-8 md:pr-10"
        style={{ boxShadow: '0 2px 24px rgba(15, 23, 42, 0.05)' }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full opacity-[0.12] blur-3xl bg-teal-400" />
          <div className="absolute -bottom-14 -left-10 w-48 h-48 rounded-full opacity-[0.08] blur-3xl bg-slate-400" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22, mass: 0.9 }}
          className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6 lg:gap-10"
        >
          <div className="max-w-xl lg:max-w-[min(36rem,52%)]">
            <p className="text-sm font-semibold mb-2 text-teal-700 tabular-nums">
              {format(now, "EEEE, d MMMM yyyy", { locale: he })}
            </p>
            <h1 className="text-2xl md:text-[1.65rem] font-extrabold text-zinc-900 tracking-tight leading-snug flex flex-wrap items-center gap-2">
              <span>{greeting}, {userName}</span>
              <Sparkles className="w-5 h-5 text-teal-600 opacity-80 shrink-0" aria-hidden strokeWidth={2} />
            </h1>
            <p className="text-sm mt-3 leading-relaxed text-zinc-600 max-w-[65ch]">
              {delightLine}
            </p>
            <p className="text-xs mt-3 font-medium text-zinc-500 max-w-[65ch]">
              סיכום מהיר לניהול יומיומי — הזמנות, לידים וכספים.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 flex-wrap lg:pt-1 lg:mr-auto">
            <Link to={createPageUrl('Leads')}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="min-h-[44px] h-11 text-xs gap-1.5 px-4 rounded-xl font-semibold flex items-center touch-manipulation border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-gray-600" />
                ליד חדש
              </motion.button>
            </Link>
            <Link to={createPageUrl('Bookings')}>
              <ShimmerButton
                className="min-h-[44px] h-11 text-xs gap-1.5 px-4 flex items-center rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, #00D1C1 0%, #00a89a 100%)',
                  color: '#0B1220',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(0,209,193,0.28)',
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                הזמנה חדשה
              </ShimmerButton>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ── Today Section (mobile-first) ── */}
      {(todayCheckIns.length > 0 || todayCheckOuts.length > 0) && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-50">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-sm font-bold text-gray-800">היום</h2>
            <span className="text-xs text-gray-400 font-medium">
              {format(now, 'EEEE, d MMMM', { locale: he })}
            </span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-x-reverse divide-gray-100">
            <div className="p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  ↓ כניסות
                </span>
                <span className="text-xs font-bold text-gray-700">{todayCheckIns.length}</span>
              </div>
              {todayCheckIns.length === 0 ? (
                <p className="text-xs text-gray-400">אין כניסות היום</p>
              ) : (
                <div className="space-y-2">
                  {todayCheckIns.map(b => (
                    <Link key={b.id} to={b.id ? `${createPageUrl('BookingDetail')}/${b.id}` : createPageUrl('Bookings')} className="block">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 flex-shrink-0">
                          {(b.guest_name || 'א')[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{b.guest_name || 'אורח'}</p>
                          {b.nights && <p className="text-[10px] text-gray-400">{b.nights} לילות</p>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  ↑ יציאות
                </span>
                <span className="text-xs font-bold text-gray-700">{todayCheckOuts.length}</span>
              </div>
              {todayCheckOuts.length === 0 ? (
                <p className="text-xs text-gray-400">אין יציאות היום</p>
              ) : (
                <div className="space-y-2">
                  {todayCheckOuts.map(b => (
                    <Link key={b.id} to={b.id ? `${createPageUrl('BookingDetail')}/${b.id}` : createPageUrl('Bookings')} className="block">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                          {(b.guest_name || 'א')[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{b.guest_name || 'אורח'}</p>
                          {b.nights && <p className="text-[10px] text-gray-400">{b.nights} לילות</p>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Stats Grid (staggered entrance) ── */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        variants={kpiParentVariants}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
      >
        <motion.div variants={kpiItemVariants} className="min-w-0">
          <StatCard
            title="הזמנות השבוע"
            value={bookingsLoading ? '—' : stats.thisWeekBookings.length}
            subtitle={`${stats.confirmedBookings.length} מאושרות סה"כ`}
            icon={CalendarDays}
            gradient="bg-gradient-to-br from-blue-50 to-blue-100/60"
            iconClass="icon-blue"
            loading={bookingsLoading}
          />
        </motion.div>
        <motion.div variants={kpiItemVariants} className="min-w-0">
          <StatCard
            title="לידים חדשים"
            value={leadsLoading ? '—' : stats.newLeads.length}
            subtitle={`${leads.length} לידים סה"כ`}
            icon={Users}
            gradient="bg-gradient-to-br from-violet-50 to-purple-100/60"
            iconClass="icon-purple"
            loading={leadsLoading}
          />
        </motion.div>
        <motion.div variants={kpiItemVariants} className="min-w-0">
          <StatCard
            title="הכנסות"
            value={paymentsLoading ? '—' : (stats.totalRevenue > 0 ? `₪${stats.totalRevenue.toLocaleString('he-IL')}` : 'התחל לגבות')}
            subtitle={stats.totalRevenue > 0 ? 'סה״כ תשלומים שהתקבלו' : 'הוסף הזמנות ותשלומים'}
            icon={Wallet}
            gradient="bg-gradient-to-br from-teal-50 to-emerald-100/60"
            iconClass="icon-teal"
            loading={paymentsLoading}
          />
        </motion.div>
        <motion.div variants={kpiItemVariants} className="min-w-0">
          <StatCard
            title="דירוג ממוצע"
            value={reviewsLoading ? '—' : (stats.avgRating ? `★ ${stats.avgRating}` : '—')}
            subtitle={`${reviews.length} ביקורות`}
            icon={Star}
            gradient="bg-gradient-to-br from-amber-50 to-yellow-100/60"
            iconClass="icon-amber"
            loading={reviewsLoading}
          />
        </motion.div>
      </motion.div>

      {/* ── Main Content Grid ── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Upcoming Bookings */}
        <SectionCard
          title="הזמנות קרובות"
          icon={CalendarDays}
          viewAllLink={createPageUrl('Bookings')}
          loading={bookingsLoading}
          emptyIcon={CalendarDays}
          emptyText="אין עדיין הזמנות קרובות"
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
          emptyText="עדיין אין לידים — רגע אחד ומתחילים"
          addLink={createPageUrl('Leads')}
        >
          {recentLeads.map(l => <LeadRow key={l.id} lead={l} />)}
        </SectionCard>
      </div>

      {/* ── Quick Actions ── */}
      <div className="rounded-2xl p-5 md:p-6" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.95)' }}>
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,209,193,0.12)' }}>
              <Zap className="w-3.5 h-3.5" style={{ color: '#00D1C1' }} />
            </div>
            <h2 className="text-base font-bold text-gray-900 tracking-tight">מה נעשה עכשיו?</h2>
          </div>
          <p className="text-xs text-gray-500 mr-9 leading-relaxed">הזמנות, יומן, לידים, תשלומים והגדרות — מה שרוב המארחים צריכים כל יום.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <QuickAction label="הזמנות"     icon={CalendarDays}  page="Bookings"      iconClass="icon-blue" />
          <QuickAction label="יומן"       icon={CalendarRange} page="MultiCalendar" iconClass="icon-teal" />
          <QuickAction label="לידים"      icon={Users}         page="Leads"         iconClass="icon-purple" />
          <QuickAction label="הודעות"     icon={MessageSquare} page="Messages"      iconClass="icon-green" />
          <QuickAction label="תשלומים"    icon={Wallet}        page="Payments"      iconClass="icon-amber" />
          <QuickAction label="הגדרות"     icon={Settings}      page="Settings"      iconClass="icon-rose" />
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
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,209,193,0.12)' }}>
                    <Target className="w-3.5 h-3.5" style={{ color: '#00D1C1' }} />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-800">התחלה מהירה</h2>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: '#00a89a', background: 'rgba(0,209,193,0.10)' }}>{doneCount}/{steps.length} הושלמו</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)' }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ type: 'spring', stiffness: 90, damping: 22, mass: 0.9 }}
                  style={{
                    width: `${pct}%`,
                    transformOrigin: 'right center',
                    background: 'linear-gradient(90deg, #00D1C1 0%, #00a89a 100%)',
                  }}
                />
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

      {/* ── Insights & Activity — asymmetric columns (variance ~6) ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Occupancy Gauge */}
        <div className="md:col-span-5 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
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
                    <span className="text-2xl font-bold text-zinc-900 atlas-tabular">{occupancy}%</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">מתוך {properties.length} נכסים</p>
              </div>
            );
          })()}
        </div>

        {/* Revenue Summary */}
        <div className="md:col-span-4 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-violet-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">מגמת הכנסות</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-zinc-900 atlas-tabular">
                {stats.totalRevenue > 0 ? `₪${stats.totalRevenue.toLocaleString('he-IL')}` : 'אין עדיין'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {stats.totalRevenue > 0 ? 'סה״כ הכנסות' : 'הוסף הזמנות ותשלומים'}
              </p>
            </div>
            <div className="flex items-end gap-1.5 h-16">
              {[25, 40, 35, 55, 65, 50, 80, 70, 90, 85, 95, 100].map((h, i) => (
                <div key={i} className="flex-1 rounded-t" style={{
                  height: `${h}%`,
                  background: `linear-gradient(180deg, ${i >= 10 ? '#8B5CF6' : '#C4B5FD'} 0%, ${i >= 10 ? '#7C3AED' : '#A78BFA'} 100%)`,
                  opacity: 0.4 + (i * 0.05),
                  transition: 'height 0.85s cubic-bezier(0.16, 1, 0.3, 1)',
                }} />
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center">12 חודשים אחרונים</p>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="md:col-span-3 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">פעילות אחרונה</h3>
          </div>
          {bookings.length === 0 && leads.length === 0 ? (
            <div className="text-center py-6 px-2">
              <Activity className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-500">עדיין שקט פה</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">ברגע שתוסיף הזמנה או ליד — נרקום לך ציר זמן ברור.</p>
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

      {/* ── Quick links (operational focus) ── */}
      <div className="rounded-2xl p-6 md:p-7" style={{ background: 'linear-gradient(135deg, rgba(0,209,193,0.06) 0%, rgba(255,255,255,0.96) 48%, rgba(79,70,229,0.05) 100%)', border: '1px solid rgba(0,209,193,0.14)', boxShadow: '0 4px 28px rgba(0,209,193,0.06)' }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00D1C1] to-[#00a89a] flex items-center justify-center shadow-md shadow-teal-500/20">
            <Zap className="w-4.5 h-4.5 text-[#0B1220]" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-bold text-gray-900 tracking-tight">מעבר מהיר</h2>
            <p className="text-xs md:text-sm text-gray-500 leading-relaxed">כלים מרכזיים לניהול שוטף — לוח, תזרים ומסמכים.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: CalendarRange, label: 'יומן', desc: 'לוח הזמנות וזמינות', link: 'MultiCalendar', color: 'from-cyan-400 to-teal-500' },
            { icon: Wallet, label: 'תשלומים', desc: 'תזרים וגבייה', link: 'Payments', color: 'from-amber-400 to-orange-500' },
            { icon: Link2, label: 'אינטגרציות', desc: 'Airbnb, Booking, יומנים', link: 'Integrations', color: 'from-blue-400 to-indigo-500' },
            { icon: FileText, label: 'חשבוניות', desc: 'חשבוניות ומסמכים', link: 'Invoices', color: 'from-violet-400 to-purple-500' },
          ].map((feat, i) => (
            <Link key={i} to={createPageUrl(feat.link)} className="group">
              <motion.div whileHover={{ y: -2, scale: 1.02 }} transition={{ type: 'spring', stiffness: 350, damping: 22 }} className="rounded-xl p-4 h-full cursor-pointer" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', backdropFilter: 'blur(12px)' }}>
                <div className={cn("w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform", feat.color)}>
                  <feat.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-0.5">{feat.label}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{feat.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Pro Upgrade Banner ── */}
      <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/90 via-white to-teal-50/40 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm" style={{ boxShadow: 'var(--atlas-shadow-card, 0 4px 24px rgba(15,23,42,0.06))' }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20 flex-shrink-0">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">14 ימי ניסיון חינם</h3>
            <p className="text-sm text-gray-600">כל התכונות פתוחות — ללא כרטיס אשראי. נסה עכשיו וראה את ההבדל.</p>
          </div>
        </div>
        <Link to={createPageUrl('Subscription')}>
          <ShimmerButton
            className="flex items-center gap-1.5 px-6 h-10 flex-shrink-0 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #00D1C1 0%, #00a89a 100%)',
              color: '#0B1220',
              fontWeight: 700,
              fontSize: '14px',
              boxShadow: '0 4px 14px rgba(0,209,193,0.28)',
            }}
          >
            שדרג עכשיו
            <ArrowUpRight className="w-4 h-4" />
          </ShimmerButton>
        </Link>
      </div>

    </div>
  );
}
