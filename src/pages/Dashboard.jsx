import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  CalendarDays,
  Wallet,
  AlertCircle,
  ArrowUpLeft,
  ArrowDownRight,
  Sparkles,
  Plus,
  AlertTriangle,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
// Removed framer-motion for performance

const statusColors = {
  NEW: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-yellow-100 text-yellow-700',
  OFFER_SENT: 'bg-purple-100 text-purple-700',
  WON: 'bg-green-100 text-green-700',
  LOST: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CHECKED_IN: 'bg-cyan-100 text-cyan-700',
  OPEN: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  DONE: 'bg-green-100 text-green-700'
};

const statusLabels = {
  NEW: 'חדש',
  CONTACTED: 'נוצר קשר',
  OFFER_SENT: 'הצעה נשלחה',
  WON: 'נצח',
  LOST: 'הפסיד',
  PENDING: 'ממתין',
  CONFIRMED: 'מאושר',
  CHECKED_IN: 'בנכס',
  OPEN: 'פתוח',
  IN_PROGRESS: 'בתהליך',
  DONE: 'הושלם'
};

export default function Dashboard({ user, selectedPropertyId, orgId }) {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const next7Days = addDays(today, 7);

  // Fetch all data
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['leads', orgId, selectedPropertyId],
    queryFn: () => orgId ? base44.entities.Lead.filter(
      selectedPropertyId 
        ? { org_id: orgId, property_id: selectedPropertyId }
        : { org_id: orgId },
      '-created_date'
    ) : [],
    enabled: !!orgId
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', orgId, selectedPropertyId],
    queryFn: () => orgId ? base44.entities.Booking.filter(
      selectedPropertyId 
        ? { org_id: orgId, property_id: selectedPropertyId }
        : { org_id: orgId },
      '-created_date'
    ) : [],
    enabled: !!orgId
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', orgId],
    queryFn: () => orgId ? base44.entities.Payment.filter({ org_id: orgId }) : [],
    enabled: !!orgId
  });

  const { data: cleaningTasks = [], isLoading: cleaningLoading } = useQuery({
    queryKey: ['cleaningTasks', orgId, selectedPropertyId],
    queryFn: () => orgId ? base44.entities.CleaningTask.filter(
      selectedPropertyId 
        ? { org_id: orgId, property_id: selectedPropertyId }
        : { org_id: orgId },
      'scheduled_for'
    ) : [],
    enabled: !!orgId
  });



  // Calculate metrics
  const todayCheckins = bookings.filter(b => b.checkin_date === todayStr && b.status !== 'CANCELLED');
  const todayCheckouts = bookings.filter(b => b.checkout_date === todayStr && b.status !== 'CANCELLED');
  const overduePayments = payments.filter(p => p.status === 'DUE' && p.due_date && p.due_date < todayStr);
  const pendingCleaning = cleaningTasks.filter(t => t.status !== 'DONE' && t.scheduled_for?.split('T')[0] <= todayStr);

  const paidThisMonth = payments
    .filter(p => p.status === 'PAID' && p.paid_at)
    .filter(p => {
      const paidDate = parseISO(p.paid_at);
      return isWithinInterval(paidDate, { start: monthStart, end: monthEnd });
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const openBalances = payments
    .filter(p => p.status === 'DUE')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const occupancyRate = bookings.length > 0 
    ? Math.round((bookings.filter(b => b.status === 'CHECKED_IN' || b.status === 'CONFIRMED').length / bookings.length) * 100)
    : 0;

  const upcomingCheckins = bookings.filter(b => {
    if (!b.checkin_date) return false;
    const checkinDate = parseISO(b.checkin_date);
    return checkinDate >= today && checkinDate <= next7Days && b.status !== 'CANCELLED';
  });

  const upcomingCheckouts = bookings.filter(b => {
    if (!b.checkout_date) return false;
    const checkoutDate = parseISO(b.checkout_date);
    return checkoutDate >= today && checkoutDate <= next7Days && b.status !== 'CANCELLED';
  });

  const isLoading = leadsLoading || bookingsLoading || paymentsLoading || cleaningLoading;

  return (
    <div className="space-y-6 pb-6">
      {/* Command Center Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-l from-[#0B1220] to-[#1a2744] bg-clip-text text-transparent">
            שלום, {user?.full_name?.split(' ')[0] || 'משתמש'}
          </h1>
          <p className="text-gray-500 mt-1 font-medium">{format(today, 'EEEE, d בMMMM yyyy', { locale: he })}</p>
        </div>
        <Link to={createPageUrl('Bookings')} className="w-full sm:w-auto">
          <Button className="bg-gradient-to-l from-[#0B1220] to-[#1a2744] hover:opacity-90 text-white rounded-xl gap-2 w-full sm:w-auto h-11 shadow-lg hover:shadow-xl transition-all duration-200">
            <Plus className="h-4 w-4" />
            הזמנה חדשה
          </Button>
        </Link>
      </div>

      {/* Alert Banner */}
      {overduePayments.length > 0 && (
        <div className="relative overflow-hidden bg-white border border-red-100 rounded-2xl p-5 shadow-md hover:shadow-lg transition-all duration-200">
          <div className="absolute inset-0 bg-gradient-to-l from-red-50 via-red-25 to-transparent opacity-60" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-[#0B1220]">דרושה תשומת לב</p>
              <p className="text-sm text-gray-600 mt-0.5">
                {overduePayments.length} תשלומים באיחור
              </p>
            </div>
            <Link to={createPageUrl('Payments')}>
              <Button size="sm" className="bg-gradient-to-l from-red-600 to-rose-700 hover:opacity-90 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                צפה בפרטים
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Today's Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          [1, 2, 3, 4].map(i => (
            <Card key={i} className="relative overflow-hidden border-0 bg-white shadow-md rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <Skeleton className="w-14 h-14 rounded-xl" />
                </div>
                <Skeleton className="h-10 w-20 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))
        ) : (
          [
            { label: 'כניסות היום', value: todayCheckins.length, icon: ArrowDownRight, gradient: 'from-green-500 to-emerald-600', link: 'Bookings' },
            { label: 'יציאות היום', value: todayCheckouts.length, icon: ArrowUpLeft, gradient: 'from-orange-500 to-amber-600', link: 'Bookings' },
            { label: 'ניקיונות ממתינים', value: pendingCleaning.length, icon: Sparkles, gradient: 'from-cyan-500 to-blue-600', link: 'Cleaning' },
            { label: 'תשלומים באיחור', value: overduePayments.length, icon: AlertCircle, gradient: overduePayments.length > 0 ? 'from-red-500 to-rose-600' : 'from-gray-400 to-gray-500', link: 'Payments' }
          ].map((stat, i) => (
            <Link key={i} to={createPageUrl(stat.link)}>
              <Card className="relative overflow-hidden border-0 bg-white shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 rounded-2xl cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                      <stat.icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl md:text-4xl font-bold bg-gradient-to-l from-[#0B1220] to-[#1a2744] bg-clip-text text-transparent mb-1">{stat.value}</p>
                  <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                </CardContent>
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-l ${stat.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300`} />
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left Column - Revenue & Occupancy */}
        <div className="space-y-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-2xl overflow-hidden bg-gradient-to-br from-white via-gray-50 to-white">
            <CardHeader className="pb-4 p-6 border-b border-gray-100">
              <CardTitle className="font-bold flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-md">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                ביצועים חודשיים
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {isLoading ? (
                <div className="space-y-6">
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">הכנסות החודש</span>
                      <span className="text-2xl md:text-3xl font-bold bg-gradient-to-l from-green-600 to-emerald-600 bg-clip-text text-transparent">₪{paidThisMonth.toLocaleString()}</span>
                    </div>
                    <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
                      <div
                        style={{ width: `${Math.min(100, Math.round((paidThisMonth / Math.max(paidThisMonth + openBalances, 1)) * 100))}%` }}
                        className="h-full bg-gradient-to-l from-green-500 to-emerald-600 rounded-full shadow-sm transition-all duration-700"
                      />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">יתרות פתוחות</span>
                      <span className="text-xl md:text-2xl font-bold bg-gradient-to-l from-orange-600 to-amber-600 bg-clip-text text-transparent">₪{openBalances.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">תפוסה</span>
                      <span className="text-2xl md:text-3xl font-bold bg-gradient-to-l from-cyan-600 to-blue-600 bg-clip-text text-transparent">{occupancyRate}%</span>
                    </div>
                    <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
                      <div 
                        style={{ width: `${occupancyRate}%` }}
                        className="h-full bg-gradient-to-l from-[#00D1C1] to-[#00B8A9] rounded-full shadow-sm transition-all duration-700"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            </Card>
        </div>

        {/* Middle Column - Check-ins/Check-outs */}
        <div className="space-y-4 md:space-y-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl md:rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 p-4 md:p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-white border-b border-green-100">
              <CardTitle className="text-sm md:text-base font-bold flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-md">
                  <ArrowDownRight className="h-3.5 w-3.5 text-white" />
                </div>
                כניסות קרובות
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 p-4 md:p-6">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 md:h-12 w-full rounded-lg md:rounded-xl" />)}
                </div>
              ) : upcomingCheckins.length > 0 ? (
                <div className="space-y-2">
                  {upcomingCheckins.slice(0, 5).map(booking => (
                    <Link key={booking.id} to={`${createPageUrl('Bookings')}?id=${booking.id}`}>
                      <div className="flex items-center justify-between p-2.5 md:p-3 bg-gray-50 hover:bg-gray-100 rounded-lg md:rounded-xl transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-xs md:text-sm truncate">{booking.guest_name}</p>
                          <p className="text-[10px] md:text-xs text-gray-500">
                            {format(parseISO(booking.checkin_date), 'EEEE, d/M', { locale: he })}
                          </p>
                        </div>
                        <Badge className={`${statusColors[booking.status]} text-[10px] md:text-xs whitespace-nowrap ml-2`}>
                          {statusLabels[booking.status]}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs md:text-sm text-gray-500 text-center py-3 md:py-4">אין כניסות ב-7 הימים הקרובים</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl md:rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 p-4 md:p-6 bg-gradient-to-br from-orange-50 via-amber-50 to-white border-b border-orange-100">
              <CardTitle className="text-sm md:text-base font-bold flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 shadow-md">
                  <ArrowUpLeft className="h-3.5 w-3.5 text-white" />
                </div>
                יציאות קרובות
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 p-4 md:p-6">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 md:h-12 w-full rounded-lg md:rounded-xl" />)}
                </div>
              ) : upcomingCheckouts.length > 0 ? (
                <div className="space-y-2">
                  {upcomingCheckouts.slice(0, 5).map(booking => (
                    <Link key={booking.id} to={`${createPageUrl('Bookings')}?id=${booking.id}`}>
                      <div className="flex items-center justify-between p-2.5 md:p-3 bg-gray-50 hover:bg-gray-100 rounded-lg md:rounded-xl transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-xs md:text-sm truncate">{booking.guest_name}</p>
                          <p className="text-[10px] md:text-xs text-gray-500">
                            {format(parseISO(booking.checkout_date), 'EEEE, d/M', { locale: he })}
                          </p>
                        </div>
                        <Badge className={`${statusColors[booking.status]} text-[10px] md:text-xs whitespace-nowrap ml-2`}>
                          {statusLabels[booking.status]}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs md:text-sm text-gray-500 text-center py-3 md:py-4">אין יציאות ב-7 הימים הקרובים</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tasks & Leads */}
        <div className="space-y-4 md:space-y-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl md:rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 p-4 md:p-6 bg-gradient-to-br from-cyan-50 via-blue-50 to-white border-b border-cyan-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm md:text-base font-bold flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  משימות ניקיון
                </CardTitle>
                <Link to={createPageUrl('Cleaning')}>
                  <Button variant="ghost" size="sm" className="text-[#00D1C1] text-xs md:text-sm">צפה בכל</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0 p-4 md:p-6">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => <Skeleton key={i} className="h-12 md:h-14 w-full rounded-lg md:rounded-xl" />)}
                </div>
              ) : pendingCleaning.length > 0 ? (
                <div className="space-y-2">
                  {pendingCleaning.slice(0, 4).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-2.5 md:p-3 bg-gray-50 rounded-lg md:rounded-xl">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full flex-shrink-0 ${
                          task.status === 'DONE' ? 'bg-green-500' :
                          task.status === 'IN_PROGRESS' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-xs md:text-sm truncate">{task.assigned_to_name || 'לא הוקצה'}</p>
                          <p className="text-[10px] md:text-xs text-gray-500">
                            {task.scheduled_for && format(parseISO(task.scheduled_for), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${statusColors[task.status]} text-[10px] md:text-xs whitespace-nowrap ml-2`}>
                        {statusLabels[task.status]}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs md:text-sm text-gray-500 text-center py-3 md:py-4">אין משימות ממתינות</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl md:rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 p-4 md:p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-white border-b border-blue-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm md:text-base font-bold flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                    <Users className="h-3.5 w-3.5 text-white" />
                  </div>
                  לידים חדשים
                </CardTitle>
                <Link to={createPageUrl('Leads')}>
                  <Button variant="ghost" size="sm" className="text-[#00D1C1] text-xs md:text-sm">צפה בכל</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0 p-4 md:p-6">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-9 md:h-10 w-full rounded-lg md:rounded-xl" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {leads.filter(l => l.status === 'NEW').slice(0, 4).map(lead => (
                    <div key={lead.id} className="flex items-center justify-between p-2.5 md:p-3 bg-gray-50 rounded-lg md:rounded-xl">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs md:text-sm truncate">{lead.name}</p>
                        <p className="text-[10px] md:text-xs text-gray-500 truncate">{lead.phone}</p>
                      </div>
                      <Badge className={`${statusColors.NEW} text-[10px] md:text-xs whitespace-nowrap ml-2`}>חדש</Badge>
                    </div>
                  ))}
                  {leads.filter(l => l.status === 'NEW').length === 0 && (
                    <p className="text-xs md:text-sm text-gray-500 text-center py-3 md:py-4">אין לידים חדשים</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}