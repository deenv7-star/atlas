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
  Brain,
  AlertTriangle,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion } from 'framer-motion';

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

  const { data: insights = [] } = useQuery({
    queryKey: ['insights', orgId],
    queryFn: () => orgId ? base44.entities.AIInsight.filter({ org_id: orgId, is_dismissed: false }, '-created_date', 5) : [],
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

  const criticalInsights = insights.filter(i => i.severity === 'CRITICAL');
  const isLoading = leadsLoading || bookingsLoading || paymentsLoading || cleaningLoading;

  return (
    <div className="space-y-6">
      {/* Command Center Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1220]">שלום, {user?.full_name?.split(' ')[0] || 'משתמש'} 👋</h1>
          <p className="text-gray-500">{format(today, 'EEEE, d בMMMM yyyy', { locale: he })}</p>
        </div>
        <Link to={createPageUrl('Bookings')}>
          <Button className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl gap-2">
            <Plus className="h-4 w-4" />
            הזמנה חדשה
          </Button>
        </Link>
      </div>

      {/* Alert Banner */}
      {(criticalInsights.length > 0 || overduePayments.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-red-800">דרושה תשומת לב</p>
              <p className="text-sm text-red-600">
                {overduePayments.length > 0 && `${overduePayments.length} תשלומים באיחור`}
                {overduePayments.length > 0 && criticalInsights.length > 0 && ' • '}
                {criticalInsights.length > 0 && `${criticalInsights.length} התראות קריטיות`}
              </p>
            </div>
            <Link to={createPageUrl('Insights')}>
              <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
                צפה בפרטים
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Today's Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'כניסות היום', value: todayCheckins.length, icon: ArrowDownRight, color: 'text-green-600 bg-green-50', link: 'Bookings' },
          { label: 'יציאות היום', value: todayCheckouts.length, icon: ArrowUpLeft, color: 'text-orange-600 bg-orange-50', link: 'Bookings' },
          { label: 'ניקיונות ממתינים', value: pendingCleaning.length, icon: Sparkles, color: 'text-cyan-600 bg-cyan-50', link: 'Cleaning' },
          { label: 'תשלומים באיחור', value: overduePayments.length, icon: AlertCircle, color: overduePayments.length > 0 ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50', link: 'Payments' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link to={createPageUrl(stat.link)}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-all rounded-2xl cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-[#0B1220]">{stat.value}</p>
                    </div>
                    <div className={`p-2 rounded-xl ${stat.color}`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Revenue & Occupancy */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">ביצועים חודשיים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-500">הכנסות החודש</span>
                    <span className="font-bold text-lg text-[#0B1220]">₪{paidThisMonth.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-500">יתרות פתוחות</span>
                    <span className="font-bold text-lg text-orange-600">₪{openBalances.toLocaleString()}</span>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">תפוסה</span>
                    <span className="font-bold text-lg text-[#0B1220]">{occupancyRate}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-[#00D1C1] rounded-full" style={{ width: `${occupancyRate}%` }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights Preview */}
          <Card className="border-0 shadow-sm rounded-2xl bg-gradient-to-br from-[#0A2540] to-[#0B1220] text-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Brain className="h-5 w-5 text-[#00D1C1]" />
                  תובנות AI
                </CardTitle>
                <Link to={createPageUrl('Insights')}>
                  <Button variant="ghost" size="sm" className="text-[#00D1C1] hover:text-white hover:bg-white/10">
                    עוד <ChevronRight className="h-4 w-4 mr-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {insights.length > 0 ? (
                <div className="space-y-2">
                  {insights.slice(0, 3).map((insight, i) => (
                    <div key={insight.id || i} className="p-2 bg-white/10 rounded-lg">
                      <p className="text-sm text-white/90">{insight.title}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/60 text-center py-4">
                  לחץ על "עדכן תובנות" בדף התובנות
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Check-ins/Check-outs */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4 text-green-500" />
                כניסות קרובות
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                </div>
              ) : upcomingCheckins.length > 0 ? (
                <div className="space-y-2">
                  {upcomingCheckins.slice(0, 5).map(booking => (
                    <Link key={booking.id} to={`${createPageUrl('Bookings')}?id=${booking.id}`}>
                      <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                        <div>
                          <p className="font-medium text-sm">{booking.guest_name}</p>
                          <p className="text-xs text-gray-500">
                            {format(parseISO(booking.checkin_date), 'EEEE, d/M', { locale: he })}
                          </p>
                        </div>
                        <Badge className={statusColors[booking.status]}>
                          {statusLabels[booking.status]}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">אין כניסות ב-7 הימים הקרובים</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ArrowUpLeft className="h-4 w-4 text-orange-500" />
                יציאות קרובות
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                </div>
              ) : upcomingCheckouts.length > 0 ? (
                <div className="space-y-2">
                  {upcomingCheckouts.slice(0, 5).map(booking => (
                    <Link key={booking.id} to={`${createPageUrl('Bookings')}?id=${booking.id}`}>
                      <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                        <div>
                          <p className="font-medium text-sm">{booking.guest_name}</p>
                          <p className="text-xs text-gray-500">
                            {format(parseISO(booking.checkout_date), 'EEEE, d/M', { locale: he })}
                          </p>
                        </div>
                        <Badge className={statusColors[booking.status]}>
                          {statusLabels[booking.status]}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">אין יציאות ב-7 הימים הקרובים</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tasks & Leads */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#00D1C1]" />
                  משימות ניקיון
                </CardTitle>
                <Link to={createPageUrl('Cleaning')}>
                  <Button variant="ghost" size="sm" className="text-[#00D1C1]">צפה בכל</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                </div>
              ) : pendingCleaning.length > 0 ? (
                <div className="space-y-2">
                  {pendingCleaning.slice(0, 4).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          task.status === 'DONE' ? 'bg-green-500' :
                          task.status === 'IN_PROGRESS' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className="font-medium text-sm">{task.assigned_to_name || 'לא הוקצה'}</p>
                          <p className="text-xs text-gray-500">
                            {task.scheduled_for && format(parseISO(task.scheduled_for), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                      <Badge className={statusColors[task.status]}>
                        {statusLabels[task.status]}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">אין משימות ממתינות</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  לידים חדשים
                </CardTitle>
                <Link to={createPageUrl('Leads')}>
                  <Button variant="ghost" size="sm" className="text-[#00D1C1]">צפה בכל</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {leads.filter(l => l.status === 'NEW').slice(0, 4).map(lead => (
                    <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-sm">{lead.name}</p>
                        <p className="text-xs text-gray-500">{lead.phone}</p>
                      </div>
                      <Badge className={statusColors.NEW}>חדש</Badge>
                    </div>
                  ))}
                  {leads.filter(l => l.status === 'NEW').length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">אין לידים חדשים</p>
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