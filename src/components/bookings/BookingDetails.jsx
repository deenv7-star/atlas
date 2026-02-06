import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Phone,
  Mail,
  Calendar,
  Users,
  Wallet,
  MessageSquare,
  Sparkles,
  FileText,
  Star,
  Plus,
  CheckCircle2,
  Circle,
  Clock
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  CONFIRMED: 'bg-green-100 text-green-700 border-green-200',
  CHECKED_IN: 'bg-blue-100 text-blue-700 border-blue-200',
  CHECKED_OUT: 'bg-gray-100 text-gray-700 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200'
};

const statusLabels = {
  PENDING: 'ממתין',
  CONFIRMED: 'מאושר',
  CHECKED_IN: 'צ׳ק-אין',
  CHECKED_OUT: 'צ׳ק-אאוט',
  CANCELLED: 'מבוטל'
};

const paymentStatusColors = {
  DUE: 'bg-orange-100 text-orange-700',
  PAID: 'bg-green-100 text-green-700',
  REFUNDED: 'bg-gray-100 text-gray-700'
};

const paymentStatusLabels = {
  DUE: 'לתשלום',
  PAID: 'שולם',
  REFUNDED: 'הוחזר'
};

export default function BookingDetails({ booking, onClose, orgId }) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    type: 'DEPOSIT',
    amount: 0,
    method: 'TRANSFER',
    due_date: '',
    status: 'DUE'
  });
  const queryClient = useQueryClient();

  // Fetch payments for this booking
  const { data: payments = [] } = useQuery({
    queryKey: ['payments', booking.id],
    queryFn: () => base44.entities.Payment.filter({ booking_id: booking.id }),
    enabled: !!booking.id
  });

  // Fetch messages for this booking
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', booking.id],
    queryFn: () => base44.entities.MessageLog.filter({ booking_id: booking.id }),
    enabled: !!booking.id
  });

  // Fetch cleaning tasks for this booking
  const { data: cleaningTasks = [] } = useQuery({
    queryKey: ['cleaningTasks', booking.id],
    queryFn: () => base44.entities.CleaningTask.filter({ booking_id: booking.id }),
    enabled: !!booking.id
  });

  // Fetch contracts for this booking
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', booking.id],
    queryFn: () => base44.entities.ContractInstance.filter({ booking_id: booking.id }),
    enabled: !!booking.id
  });

  // Update booking mutation
  const updateBookingMutation = useMutation({
    mutationFn: (data) => base44.entities.Booking.update(booking.id, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['bookings'] });
      await queryClient.cancelQueries({ queryKey: ['booking', booking.id] });
      
      const previousBookings = queryClient.getQueryData(['bookings']);
      const previousBooking = queryClient.getQueryData(['booking', booking.id]);
      
      // Optimistically update booking in list
      queryClient.setQueryData(['bookings'], (old) =>
        old?.map(b => b.id === booking.id ? { ...b, ...data } : b)
      );
      
      // Optimistically update single booking
      queryClient.setQueryData(['booking', booking.id], (old) => ({ ...old, ...data }));
      
      return { previousBookings, previousBooking };
    },
    onError: (err, data, context) => {
      queryClient.setQueryData(['bookings'], context.previousBookings);
      queryClient.setQueryData(['booking', booking.id], context.previousBooking);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', booking.id] });
    }
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: (data) => base44.entities.Payment.create({
      ...data,
      org_id: orgId,
      booking_id: booking.id
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', booking.id] });
      setIsPaymentDialogOpen(false);
      setNewPayment({
        type: 'DEPOSIT',
        amount: 0,
        method: 'TRANSFER',
        due_date: '',
        status: 'DUE'
      });
    }
  });

  // Mark payment as paid
  const markPaidMutation = useMutation({
    mutationFn: (paymentId) => base44.entities.Payment.update(paymentId, { 
      status: 'PAID',
      paid_at: new Date().toISOString()
    }),
    onMutate: async (paymentId) => {
      await queryClient.cancelQueries({ queryKey: ['payments', booking.id] });
      
      const previousPayments = queryClient.getQueryData(['payments', booking.id]);
      
      // Optimistically update payment status
      queryClient.setQueryData(['payments', booking.id], (old) =>
        old?.map(p => p.id === paymentId ? { ...p, status: 'PAID', paid_at: new Date().toISOString() } : p)
      );
      
      return { previousPayments };
    },
    onError: (err, paymentId, context) => {
      queryClient.setQueryData(['payments', booking.id], context.previousPayments);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', booking.id] });
    }
  });

  const nights = booking.checkin_date && booking.checkout_date 
    ? differenceInDays(parseISO(booking.checkout_date), parseISO(booking.checkin_date))
    : 0;

  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalDue = payments.filter(p => p.status === 'DUE').reduce((sum, p) => sum + (p.amount || 0), 0);

  const timelineItems = [
    { 
      label: 'ליד', 
      done: !!booking.lead_id, 
      icon: Users 
    },
    { 
      label: 'הזמנה', 
      done: true, 
      icon: Calendar 
    },
    { 
      label: 'תשלומים', 
      done: payments.some(p => p.status === 'PAID'), 
      icon: Wallet 
    },
    { 
      label: 'הודעות', 
      done: messages.length > 0, 
      icon: MessageSquare 
    },
    { 
      label: 'ניקיון', 
      done: cleaningTasks.some(t => t.status === 'DONE'), 
      icon: Sparkles 
    },
    { 
      label: 'חוזה', 
      done: contracts.some(c => c.status === 'SIGNED'), 
      icon: FileText 
    }
  ];

  return (
    <>
      <Sheet open={true} onOpenChange={onClose}>
        <SheetContent side="left" className="w-full sm:w-[600px] overflow-y-auto p-0">
          <SheetHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-right">פרטי הזמנה</SheetTitle>
              <Badge className={`${statusColors[booking.status]} border`}>
                {statusLabels[booking.status]}
              </Badge>
            </div>
          </SheetHeader>
          
          <div className="p-6 space-y-6">
            {/* Guest Info */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#00D1C1]/10 rounded-xl flex items-center justify-center">
                  <span className="text-xl font-bold text-[#00D1C1]">
                    {booking.guest_name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-lg">{booking.guest_name}</p>
                  <p className="text-sm text-gray-500">{booking.guests_count} אורחים</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span dir="ltr">{booking.phone}</span>
                </div>
                {booking.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{booking.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dates & Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">תאריכים</p>
                <p className="font-medium">
                  {booking.checkin_date && format(parseISO(booking.checkin_date), 'd/M/yyyy')} - {booking.checkout_date && format(parseISO(booking.checkout_date), 'd/M/yyyy')}
                </p>
                <p className="text-sm text-gray-500">{nights} לילות</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">סכום כולל</p>
                <p className="font-semibold text-xl">₪{booking.total_amount?.toLocaleString() || 0}</p>
              </div>
            </div>

            {/* Status Change */}
            <div className="space-y-2">
              <Label>שנה סטטוס</Label>
              <Select 
                value={booking.status} 
                onValueChange={(value) => updateBookingMutation.mutate({ status: value })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <h3 className="font-semibold">ציר זמן</h3>
              <div className="flex items-center justify-between">
                {timelineItems.map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      item.done ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {item.done ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <item.icon className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payments Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">תשלומים</h3>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="rounded-lg gap-1"
                  onClick={() => setIsPaymentDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  הוסף
                </Button>
              </div>
              
              {/* Payment Summary */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-green-600">שולם</p>
                  <p className="font-semibold text-green-700">₪{totalPaid.toLocaleString()}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-orange-600">נותר לתשלום</p>
                  <p className="font-semibold text-orange-700">₪{totalDue.toLocaleString()}</p>
                </div>
              </div>

              {/* Payment List */}
              {payments.length > 0 ? (
                <div className="space-y-2">
                  {payments.map(payment => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-sm">
                          {payment.type === 'DEPOSIT' ? 'מקדמה' : payment.type === 'BALANCE' ? 'יתרה' : payment.type === 'FULL' ? 'תשלום מלא' : 'אחר'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payment.method === 'CASH' ? 'מזומן' : payment.method === 'TRANSFER' ? 'העברה' : payment.method === 'CARD' ? 'כרטיס' : 'אחר'}
                          {payment.due_date && ` • יעד: ${format(parseISO(payment.due_date), 'd/M')}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">₪{payment.amount?.toLocaleString()}</span>
                        {payment.status === 'DUE' ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="rounded-lg text-xs"
                            onClick={() => markPaidMutation.mutate(payment.id)}
                          >
                            סמן שולם
                          </Button>
                        ) : (
                          <Badge className={paymentStatusColors[payment.status]}>
                            {paymentStatusLabels[payment.status]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">אין תשלומים עדיין</p>
              )}
            </div>

            {/* Notes */}
            {booking.notes && (
              <div className="space-y-2">
                <h3 className="font-semibold">הערות</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{booking.notes}</p>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>הוסף תשלום</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>סוג תשלום</Label>
              <Select 
                value={newPayment.type} 
                onValueChange={(value) => setNewPayment({ ...newPayment, type: value })}
              >
                <SelectTrigger className="mt-1 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEPOSIT">מקדמה</SelectItem>
                  <SelectItem value="BALANCE">יתרה</SelectItem>
                  <SelectItem value="FULL">תשלום מלא</SelectItem>
                  <SelectItem value="OTHER">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>סכום (₪)</Label>
              <Input 
                type="number"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) || 0 })}
                className="mt-1 rounded-xl"
                min={0}
              />
            </div>
            <div>
              <Label>אמצעי תשלום</Label>
              <Select 
                value={newPayment.method} 
                onValueChange={(value) => setNewPayment({ ...newPayment, method: value })}
              >
                <SelectTrigger className="mt-1 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">מזומן</SelectItem>
                  <SelectItem value="TRANSFER">העברה בנקאית</SelectItem>
                  <SelectItem value="CARD">כרטיס אשראי</SelectItem>
                  <SelectItem value="OTHER">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>תאריך יעד</Label>
              <Input 
                type="date"
                value={newPayment.due_date}
                onChange={(e) => setNewPayment({ ...newPayment, due_date: e.target.value })}
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <Label>סטטוס</Label>
              <Select 
                value={newPayment.status} 
                onValueChange={(value) => setNewPayment({ ...newPayment, status: value })}
              >
                <SelectTrigger className="mt-1 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DUE">לתשלום</SelectItem>
                  <SelectItem value="PAID">שולם</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)} className="rounded-xl">
              ביטול
            </Button>
            <Button 
              onClick={() => createPaymentMutation.mutate(newPayment)}
              disabled={newPayment.amount <= 0 || createPaymentMutation.isPending}
              className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl"
            >
              {createPaymentMutation.isPending ? 'שומר...' : 'הוסף תשלום'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}