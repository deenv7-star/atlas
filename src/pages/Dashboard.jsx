import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, CalendarDays, Wallet,
  ArrowUpLeft, ArrowDownRight, MessageSquare, Plus,
  Star, ChevronRight, Settings,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

const statusColors = {
  NEW: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-yellow-100 text-yellow-700',
  OFFER_SENT: 'bg-purple-100 text-purple-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  LOST: 'bg-gray-100 text-gray-600',
  APPROVED: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  WAITLIST: 'bg-purple-100 text-purple-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const statusLabels = {
  NEW: 'חדש',
  CONTACTED: 'נוצר קשר',
  OFFER_SENT: 'הצעה נשלחה',
  CONFIRMED: 'מאושר',
  REJECTED: 'נדחה',
  LOST: 'אבוד',
  APPROVED: 'מאושר',
  PENDING: 'ממתין',
  WAITLIST: 'רשימת המתנה',
  CANCELLED: 'בוטל',
};

function StatCard({ title, value, icon: Icon, trend, color, loading, subtitle }) {
  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group cursor-default">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <div className={color + " w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-800 mb-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        {trend !== undefined && (
          <div className={cn("flex items-center gap-1 text-xs font-medium mt-1", trend >= 0 ? "text-emerald-600" : "text-red-500")}>
            {trend >= 0 ? <ArrowUpLeft className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{Math.abs(trend)}% מהחודש הקודם</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard({ user, selectedPropertyId, orgId }) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

  const queryOptions = { staleTime: 2 * 60 * 1000, retry: 1 };

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['dashboard-bookings', selectedPropertyId],
    queryFn: () => base44.entities.Booking.list(selectedPropertyId ? { property_id: selectedPropertyId } : {}),
    ...queryOptions,
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['dashboard-leads', selectedPropertyId],
    queryFn: () => base44.entities.Lead.list(selectedPropertyId ? { property_id: selectedPropertyId } : {}),
    ...queryOptions,
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['dashboard-payments'],
    queryFn: () => base44.entities.Payment.list(),
    ...queryOptions,
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['dashboard-reviews', selectedPropertyId],
    queryFn: () => base44.entities.ReviewRequest.list(selectedPropertyId ? { property_id: selectedPropertyId } : {}),
    ...queryOptions,
  });

  const stats = useMemo(() => {
    const thisWeekBookings = bookings.filter(b => {
      try {
        const checkIn = parseISO(b.check_in_date);
        return isWithinInterval(checkIn, { start: weekStart, end: weekEnd });
      } catch { return false; }
    });

    const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');
    const newLeads = leads.filter(l => l.status === 'NEW');
    const totalRevenue = payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : null;

    return { thisWeekBookings, confirmedBookings, newLeads, totalRevenue, avgRating };
  }, [bookings, leads, payments, reviews, weekStart, weekEnd]);

  const isLoading = bookingsLoading || leadsLoading || paymentsLoading;

  const upcomingBookings = bookings
    .filter(b => {
      try { return parseISO(b.check_in_date) >= now; } catch { return false; }
    })
    .sort((a, b) => {
      try { return parseISO(a.check_in_date) - parseISO(b.check_in_date); } catch { return 0; }
    })
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
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            {greeting}, {userName} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(now, "EEEE, d MMMM yyyy", { locale: he })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl('Leads')}>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8">
              <Plus className="w-3.5 h-3.5" />
              ליד חדש
            </Button>
          </Link>
          <Link to={createPageUrl('Bookings')}>
            <Button size="sm" className="gap-1.5 text-xs h-8 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold">
              <Plus className="w-3.5 h-3.5" />
              הזמנה חדשה
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="הזמנות השבוע"
          value={isLoading ? '-' : stats.thisWeekBookings.length}
          icon={CalendarDays}
          color="bg-blue-50 text-blue-600"
          loading={bookingsLoading}
          subtitle={`${stats.confirmedBookings.length} מאושרות סה"כ`}
        />
        <StatCard
          title="לידים חדשים"
          value={isLoading ? '-' : stats.newLeads.length}
          icon={Users}
          color="bg-purple-50 text-purple-600"
          loading={leadsLoading}
          subtitle={`${leads.length} לידים סה"כ`}
        />
        <StatCard
          title='הכנסות'
          value={isLoading ? '-' : `₪${stats.totalRevenue.toLocaleString()}`}
          icon={Wallet}
          color="bg-emerald-50 text-emerald-600"
          loading={paymentsLoading}
          subtitle="סה״כ תשלומים שהתקבלו"
        />
        <StatCard
          title="דירוג ממוצע"
          value={isLoading ? '-' : (stats.avgRating ? `⭐ ${stats.avgRating}` : 'אין עדיין')}
          icon={Star}
          color="bg-amber-50 text-amber-600"
          loading={reviewsLoading}
          subtitle={`${reviews.length} ביקורות`}
        />
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-5">
        {/* Upcoming Bookings */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#00D1C1]" />
              הזמנות קרובות
            </CardTitle>
            <Link to={createPageUrl('Bookings')}>
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-[#00D1C1] hover:text-[#00b8aa]">
                הכל
                <ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {bookingsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">אין הזמנות קרובות</p>
                <Link to={createPageUrl('Bookings')}>
                  <Button size="sm" variant="outline" className="mt-3 text-xs h-7">
                    <Plus className="w-3 h-3 ml-1" /> הוסף הזמנה
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingBookings.map((booking) => (
                  <Link
                    key={booking.id}
                    to={createPageUrl('Bookings')}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-semibold text-blue-600 leading-none">
                        {booking.check_in_date ? format(parseISO(booking.check_in_date), 'MMM', { locale: he }) : ''}
                      </span>
                      <span className="text-sm font-bold text-blue-700 leading-none">
                        {booking.check_in_date ? format(parseISO(booking.check_in_date), 'd') : ''}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {booking.guest_name || 'אורח'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {booking.nights ? `${booking.nights} לילות` : ''}
                        {booking.property_name ? ` · ${booking.property_name}` : ''}
                      </p>
                    </div>
                    <Badge className={`${statusColors[booking.status] || 'bg-gray-100 text-gray-600'} text-[10px] py-0 px-1.5 border-0`}>
                      {statusLabels[booking.status] || booking.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00D1C1]" />
              לידים אחרונים
            </CardTitle>
            <Link to={createPageUrl('Leads')}>
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-[#00D1C1] hover:text-[#00b8aa]">
                הכל
                <ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {leadsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
              </div>
            ) : recentLeads.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">אין לידים עדיין</p>
                <Link to={createPageUrl('Leads')}>
                  <Button size="sm" variant="outline" className="mt-3 text-xs h-7">
                    <Plus className="w-3 h-3 ml-1" /> הוסף ליד
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    to={createPageUrl('Leads')}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00D1C1]/20 to-blue-100 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-[#00D1C1]">
                      {(lead.full_name || lead.name || 'א')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {lead.full_name || lead.name || 'ליד חדש'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {lead.check_in_date ? `כניסה: ${format(parseISO(lead.check_in_date), 'dd/MM/yy')}` : ''}
                        {lead.nights ? ` · ${lead.nights} לילות` : ''}
                      </p>
                    </div>
                    <Badge className={`${statusColors[lead.status] || 'bg-gray-100 text-gray-600'} text-[10px] py-0 px-1.5 border-0`}>
                      {statusLabels[lead.status] || lead.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">פעולות מהירות</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'ליד חדש', icon: Users, page: 'Leads', color: 'text-purple-600 bg-purple-50' },
              { label: 'הזמנה חדשה', icon: CalendarDays, page: 'Bookings', color: 'text-blue-600 bg-blue-50' },
              { label: 'הודעות', icon: MessageSquare, page: 'Messages', color: 'text-teal-600 bg-teal-50' },
              { label: 'הגדרות', icon: Settings, page: 'Settings', color: 'text-emerald-600 bg-emerald-50' },
            ].map(({ label, icon: Icon, page, color }) => (
              <Link key={page} to={createPageUrl(page)}>
                <button className="w-full flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-[#00D1C1]/30 hover:bg-[#00D1C1]/3 transition-all duration-200 group">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-xs font-medium text-gray-600 group-hover:text-gray-800">{label}</span>
                </button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}