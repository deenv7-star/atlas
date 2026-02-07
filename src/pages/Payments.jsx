import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Wallet,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { he } from 'date-fns/locale';

const statusColors = {
  DUE: 'bg-orange-100 text-orange-700 border-orange-200',
  PAID: 'bg-green-100 text-green-700 border-green-200',
  REFUNDED: 'bg-gray-100 text-gray-700 border-gray-200'
};

const statusLabels = {
  DUE: 'לתשלום',
  PAID: 'שולם',
  REFUNDED: 'הוחזר'
};

const typeLabels = {
  DEPOSIT: 'מקדמה',
  BALANCE: 'יתרה',
  FULL: 'תשלום מלא',
  OTHER: 'אחר'
};

const methodLabels = {
  CASH: 'מזומן',
  TRANSFER: 'העברה',
  CARD: 'כרטיס',
  OTHER: 'אחר'
};

export default function Payments({ user, selectedPropertyId, orgId }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  // Fetch payments
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', orgId],
    queryFn: () => orgId ? base44.entities.Payment.filter({ org_id: orgId }, '-created_date') : [],
    enabled: !!orgId
  });

  // Fetch bookings for reference
  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', orgId],
    queryFn: () => orgId ? base44.entities.Booking.filter({ org_id: orgId }) : [],
    enabled: !!orgId
  });

  // Mark as paid mutation
  const markPaidMutation = useMutation({
    mutationFn: (paymentId) => base44.entities.Payment.update(paymentId, { 
      status: 'PAID',
      paid_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    }
  });

  // Calculate statistics
  const totalDue = payments
    .filter(p => p.status === 'DUE')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const paidThisMonth = payments
    .filter(p => p.status === 'PAID' && p.paid_at)
    .filter(p => {
      const paidDate = parseISO(p.paid_at);
      return isWithinInterval(paidDate, { start: monthStart, end: monthEnd });
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalPaid = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Filter payments
  const filteredPayments = payments.filter(p => {
    if (statusFilter === 'all') return true;
    return p.status === statusFilter;
  });

  // Get booking for a payment
  const getBooking = (bookingId) => bookings.find(b => b.id === bookingId);

  const stats = [
    { 
      title: 'נגבה החודש', 
      value: `₪${paidThisMonth.toLocaleString()}`, 
      icon: TrendingUp, 
      color: 'bg-green-500',
      bgColor: 'bg-green-50'
    },
    { 
      title: 'יתרות פתוחות', 
      value: `₪${totalDue.toLocaleString()}`, 
      icon: AlertCircle, 
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50'
    },
    { 
      title: 'סה"כ נגבה', 
      value: `₪${totalPaid.toLocaleString()}`, 
      icon: Wallet, 
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1220]">תשלומים</h1>
          <p className="text-gray-500">מעקב תשלומים ויתרות</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-5">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-[#0B1220]">{stat.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color.replace('bg-', 'text-')}`} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Header */}
      <Card className="border-0 shadow-sm rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">היסטוריית תשלומים</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] rounded-xl">
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Desktop: Payments Table */}
      <Card className="border-0 shadow-sm rounded-2xl hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-right">הזמנה</TableHead>
                <TableHead className="text-right">סוג</TableHead>
                <TableHead className="text-right">סכום</TableHead>
                <TableHead className="text-right">אמצעי</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">תאריך</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    אין תשלומים
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map(payment => {
                  const booking = getBooking(payment.booking_id);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking?.guest_name || '-'}</p>
                          {booking?.checkin_date && (
                            <p className="text-xs text-gray-500">
                              {format(parseISO(booking.checkin_date), 'd/M/yy')}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{typeLabels[payment.type]}</TableCell>
                      <TableCell className="font-semibold">₪{payment.amount?.toLocaleString()}</TableCell>
                      <TableCell>{methodLabels[payment.method]}</TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[payment.status]} border flex items-center gap-1 w-fit`}>
                          {payment.status === 'PAID' && <CheckCircle2 className="h-3 w-3" />}
                          {payment.status === 'DUE' && <Clock className="h-3 w-3" />}
                          {payment.status === 'REFUNDED' && <RefreshCw className="h-3 w-3" />}
                          {statusLabels[payment.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {payment.status === 'PAID' && payment.paid_at
                          ? format(parseISO(payment.paid_at), 'd/M/yy', { locale: he })
                          : payment.due_date
                            ? format(parseISO(payment.due_date), 'd/M/yy', { locale: he })
                            : '-'}
                      </TableCell>
                      <TableCell>
                        {payment.status === 'DUE' && (
                          <Button 
                            size="sm"
                            variant="outline"
                            className="rounded-lg text-xs"
                            onClick={() => markPaidMutation.mutate(payment.id)}
                            disabled={markPaidMutation.isPending}
                          >
                            סמן שולם
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              </TableBody>
              </Table>
              </CardContent>
              </Card>

              {/* Mobile: Payments Cards */}
              <div className="md:hidden space-y-3">
              {isLoading ? (
              [...Array(5)].map((_, i) => (
              <Card key={i} className="border-0 shadow-sm rounded-2xl">
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-6 w-24 mb-3" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </CardContent>
              </Card>
              ))
              ) : filteredPayments.length === 0 ? (
              <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-8 text-center text-gray-500">
                אין תשלומים
              </CardContent>
              </Card>
              ) : (
              filteredPayments.map(payment => {
              const booking = getBooking(payment.booking_id);
              return (
                <Card key={payment.id} className="border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#0B1220] mb-0.5">{booking?.guest_name || '-'}</h3>
                        {booking?.checkin_date && (
                          <p className="text-xs text-gray-500">
                            {format(parseISO(booking.checkin_date), 'd/M/yy')}
                          </p>
                        )}
                      </div>
                      <Badge className={`${statusColors[payment.status]} border flex items-center gap-1`}>
                        {payment.status === 'PAID' && <CheckCircle2 className="h-3 w-3" />}
                        {payment.status === 'DUE' && <Clock className="h-3 w-3" />}
                        {payment.status === 'REFUNDED' && <RefreshCw className="h-3 w-3" />}
                        {statusLabels[payment.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-[#0B1220]">₪{payment.amount?.toLocaleString()}</span>
                      <span className="text-sm text-gray-600">{typeLabels[payment.type]}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{methodLabels[payment.method]}</span>
                      <span>
                        {payment.status === 'PAID' && payment.paid_at
                          ? format(parseISO(payment.paid_at), 'd/M/yy', { locale: he })
                          : payment.due_date
                            ? format(parseISO(payment.due_date), 'd/M/yy', { locale: he })
                            : '-'}
                      </span>
                    </div>
                    {payment.status === 'DUE' && (
                      <Button 
                        size="sm"
                        className="w-full mt-3 bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl"
                        onClick={() => markPaidMutation.mutate(payment.id)}
                        disabled={markPaidMutation.isPending}
                      >
                        סמן שולם
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
              })
              )}
              </div>
              </div>
  );
}