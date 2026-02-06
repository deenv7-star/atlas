import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Star,
  Send,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

const statusColors = {
  NOT_SENT: 'bg-gray-100 text-gray-700 border-gray-200',
  SENT: 'bg-blue-100 text-blue-700 border-blue-200',
  RECEIVED: 'bg-green-100 text-green-700 border-green-200'
};

const statusLabels = {
  NOT_SENT: 'לא נשלח',
  SENT: 'נשלח',
  RECEIVED: 'התקבל'
};

const platformLabels = {
  GOOGLE: 'Google',
  AIRBNB: 'Airbnb',
  BOOKING: 'Booking.com',
  FACEBOOK: 'Facebook',
  OTHER: 'אחר'
};

const platformIcons = {
  GOOGLE: '🔍',
  AIRBNB: '🏠',
  BOOKING: '🅱️',
  FACEBOOK: '📘',
  OTHER: '⭐'
};

export default function Reviews({ user, selectedPropertyId, orgId }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  const [newRequest, setNewRequest] = useState({
    booking_id: '',
    platform: 'GOOGLE',
    review_url: '',
    notes: ''
  });

  // Fetch review requests
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviewRequests', orgId],
    queryFn: () => orgId ? base44.entities.ReviewRequest.filter({ org_id: orgId }, '-created_date') : [],
    enabled: !!orgId
  });

  // Fetch bookings for reference
  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', orgId],
    queryFn: () => orgId ? base44.entities.Booking.filter({ org_id: orgId }, '-checkout_date', 50) : [],
    enabled: !!orgId
  });

  // Create review request mutation
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ReviewRequest.create({
      ...data,
      org_id: orgId,
      status: 'NOT_SENT'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviewRequests'] });
      setIsCreateOpen(false);
      setNewRequest({
        booking_id: '',
        platform: 'GOOGLE',
        review_url: '',
        notes: ''
      });
    }
  });

  // Update status mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ReviewRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviewRequests'] });
    }
  });

  const getBooking = (bookingId) => bookings.find(b => b.id === bookingId);

  // Stats
  const sentCount = reviews.filter(r => r.status === 'SENT').length;
  const receivedCount = reviews.filter(r => r.status === 'RECEIVED').length;
  const pendingCount = reviews.filter(r => r.status === 'NOT_SENT').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1220]">ביקורות</h1>
          <p className="text-gray-500">מעקב בקשות ביקורת מאורחים</p>
        </div>
        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl gap-2"
        >
          <Plus className="h-4 w-4" />
          בקשה חדשה
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">ממתינות לשליחה</p>
                <p className="text-2xl font-bold text-[#0B1220]">{pendingCount}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50">
                <Clock className="h-5 w-5 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">נשלחו</p>
                <p className="text-2xl font-bold text-[#0B1220]">{sentCount}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50">
                <Send className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">התקבלו</p>
                <p className="text-2xl font-bold text-[#0B1220]">{receivedCount}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-green-50">
                <Star className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Table */}
      <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-right">הזמנה</TableHead>
              <TableHead className="text-right">פלטפורמה</TableHead>
              <TableHead className="text-right">סטטוס</TableHead>
              <TableHead className="text-right">נוצר</TableHead>
              <TableHead className="w-32"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 bg-gray-200 rounded w-24"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded w-20"></div></TableCell>
                  <TableCell><div className="h-6 bg-gray-200 rounded w-16"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded w-20"></div></TableCell>
                  <TableCell><div className="h-8 bg-gray-200 rounded w-24"></div></TableCell>
                </TableRow>
              ))
            ) : reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                  אין בקשות ביקורת עדיין
                </TableCell>
              </TableRow>
            ) : (
              reviews.map(review => {
                const booking = getBooking(review.booking_id);
                return (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking?.guest_name || '-'}</p>
                        {booking?.checkout_date && (
                          <p className="text-xs text-gray-500">
                            יציאה: {format(parseISO(booking.checkout_date), 'd/M/yy')}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        {platformIcons[review.platform]}
                        {platformLabels[review.platform]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[review.status]} border flex items-center gap-1 w-fit`}>
                        {review.status === 'RECEIVED' && <CheckCircle2 className="h-3 w-3" />}
                        {review.status === 'SENT' && <Send className="h-3 w-3" />}
                        {review.status === 'NOT_SENT' && <Clock className="h-3 w-3" />}
                        {statusLabels[review.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {format(parseISO(review.created_date), 'd/M/yy', { locale: he })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {review.status === 'NOT_SENT' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="rounded-lg text-xs"
                            onClick={() => updateMutation.mutate({ 
                              id: review.id, 
                              data: { status: 'SENT', sent_at: new Date().toISOString() } 
                            })}
                          >
                            <Send className="h-3 w-3 ml-1" />
                            שלח
                          </Button>
                        )}
                        {review.status === 'SENT' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="rounded-lg text-xs"
                            onClick={() => updateMutation.mutate({ id: review.id, data: { status: 'RECEIVED' } })}
                          >
                            <Star className="h-3 w-3 ml-1" />
                            התקבל
                          </Button>
                        )}
                        {review.review_url && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="rounded-lg"
                            onClick={() => window.open(review.review_url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Review Request Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>בקשת ביקורת חדשה</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>הזמנה</Label>
              <Select 
                value={newRequest.booking_id} 
                onValueChange={(value) => setNewRequest({ ...newRequest, booking_id: value })}
              >
                <SelectTrigger className="mt-1 rounded-xl">
                  <SelectValue placeholder="בחר הזמנה" />
                </SelectTrigger>
                <SelectContent>
                  {bookings
                    .filter(b => b.status === 'CHECKED_OUT')
                    .map(booking => (
                      <SelectItem key={booking.id} value={booking.id}>
                        {booking.guest_name} - {booking.checkout_date && format(parseISO(booking.checkout_date), 'd/M')}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>פלטפורמה</Label>
              <Select 
                value={newRequest.platform} 
                onValueChange={(value) => setNewRequest({ ...newRequest, platform: value })}
              >
                <SelectTrigger className="mt-1 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(platformLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {platformIcons[key]} {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>קישור לביקורת (אופציונלי)</Label>
              <Input 
                value={newRequest.review_url}
                onChange={(e) => setNewRequest({ ...newRequest, review_url: e.target.value })}
                className="mt-1 rounded-xl"
                placeholder="https://..."
                dir="ltr"
              />
            </div>
            <div>
              <Label>הערות</Label>
              <Textarea 
                value={newRequest.notes}
                onChange={(e) => setNewRequest({ ...newRequest, notes: e.target.value })}
                className="mt-1 rounded-xl"
                rows={3}
                placeholder="הערות נוספות..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl">
              ביטול
            </Button>
            <Button 
              onClick={() => createMutation.mutate(newRequest)}
              disabled={!newRequest.booking_id || createMutation.isPending}
              className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl"
            >
              {createMutation.isPending ? 'שומר...' : 'צור בקשה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}