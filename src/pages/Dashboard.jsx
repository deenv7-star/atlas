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
  Plus
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
  OPEN: 'פתוח',
  IN_PROGRESS: 'בתהליך',
  DONE: 'הושלם'
};

export default function Dashboard({ user, selectedPropertyId, orgId }) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const next7Days = addDays(today, 7);

  // Fetch leads
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

  // Fetch bookings
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

  // Fetch payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', orgId],
    queryFn: () => orgId ? base44.entities.Payment.filter({ org_id: orgId }) : [],
    enabled: !!orgId
  });

  // Fetch cleaning tasks
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

  // Calculate KPIs
  const newLeadsThisWeek = leads.filter(l => {
    const createdDate = parseISO(l.created_date);
    return isWithinInterval(createdDate, { start: weekStart, end: weekEnd });
  }).length;

  const bookingsThisMonth = bookings.filter(b => {
    const createdDate = parseISO(b.created_date);
    return isWithinInterval(createdDate, { start: monthStart, end: monthEnd });
  }).length;

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

  // Upcoming check-ins/check-outs
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

  // Today's cleaning tasks
  const todaysTasks = cleaningTasks.filter(t => {
    if (!t.scheduled_for) return false;
    const scheduledDate = parseISO(t.scheduled_for);
    return format(scheduledDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  });

  // Lead pipeline counts
  const leadPipeline = {
    NEW: leads.filter(l => l.status === 'NEW').length,
    CONTACTED: leads.filter(l => l.status === 'CONTACTED').length,
    OFFER_SENT: leads.filter(l => l.status === 'OFFER_SENT').length,
    WON: leads.filter(l => l.status === 'WON').length,
    LOST: leads.filter(l => l.status === 'LOST').length
  };

  const kpis = [
    { title: 'לידים חדשים השבוע', value: newLeadsThisWeek, icon: Users, color: 'bg-blue-500' },
    { title: 'הזמנות החודש', value: bookingsThisMonth, icon: CalendarDays, color: 'bg-purple-500' },
    { title: 'נגבה החודש', value: `₪${paidThisMonth.toLocaleString()}`, icon: Wallet, color: 'bg-green-500' },
    { title: 'יתרות פתוחות', value: `₪${openBalances.toLocaleString()}`, icon: AlertCircle, color: 'bg-orange-500' }
  ];

  const isLoading = leadsLoading || bookingsLoading || paymentsLoading || cleaningLoading;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1220]">שלום, {user?.full_name?.split(' ')[0] || 'משתמש'} 👋</h1>
          <p className="text-gray-500">הנה הסיכום של היום</p>
        </div>
        <Link to={createPageUrl('Bookings')}>
          <Button className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl gap-2">
            <Plus className="h-4 w-4" />
            הזמנה חדשה
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
              <CardContent className="p-5">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{kpi.title}</p>
                      <p className="text-2xl font-bold text-[#0B1220]">{kpi.value}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${kpi.color} bg-opacity-10`}>
                      <kpi.icon className={`h-5 w-5 ${kpi.color.replace('bg-', 'text-')}`} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Check-ins/Check-outs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Check-ins */}
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

            {/* Check-outs */}
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

          {/* Cleaning Tasks Today */}
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#00D1C1]" />
                  משימות ניקיון היום
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
              ) : todaysTasks.length > 0 ? (
                <div className="space-y-2">
                  {todaysTasks.map(task => (
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
                <p className="text-sm text-gray-500 text-center py-4">אין משימות ניקיון להיום</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lead Pipeline */}
        <Card className="border-0 shadow-sm rounded-2xl h-fit">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">צינור לידים</CardTitle>
              <Link to={createPageUrl('Leads')}>
                <Button variant="ghost" size="sm" className="text-[#00D1C1]">צפה בכל</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(leadPipeline).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        status === 'NEW' ? 'bg-blue-500' :
                        status === 'CONTACTED' ? 'bg-yellow-500' :
                        status === 'OFFER_SENT' ? 'bg-purple-500' :
                        status === 'WON' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <span className="text-sm">{statusLabels[status]}</span>
                    </div>
                    <span className="font-semibold text-[#0B1220]">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}