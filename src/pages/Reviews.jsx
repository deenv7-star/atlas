import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  Star, Send, Search, Calendar,
  CheckCircle, Clock, AlertCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { STALE_REFERENCE_MS } from '@/lib/queryStaleTimes';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'ממתין', color: 'bg-amber-100 text-amber-700', icon: Clock },
  { value: 'SENT', label: 'נשלח', color: 'bg-blue-100 text-blue-700', icon: Send },
  { value: 'REVIEWED', label: 'התקבל', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  { value: 'DECLINED', label: 'סירב', color: 'bg-red-100 text-red-600', icon: AlertCircle },
];

const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s]));

function StarRating({ rating, max = 5 }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(max)].map((_, i) => (
        <Star
          key={i}
          className={cn("w-3.5 h-3.5", i < rating ? "fill-amber-400 text-amber-400" : "text-gray-200")}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage({ user, selectedPropertyId, orgId }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', orgId, selectedPropertyId],
    queryFn: async () => {
      const filters = {};
      if (orgId) filters.org_id = orgId;
      if (selectedPropertyId) filters.property_id = selectedPropertyId;
      return base44.entities.ReviewRequest.filter(filters, '-created_date', 200);
    },
    enabled: !!orgId,
    staleTime: STALE_REFERENCE_MS,
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (id) => {
      return base44.entities.ReviewRequest.update(id, {
        status: 'SENT',
        sent_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast({ title: 'תזכורת נשלחה בהצלחה' });
    },
    onError: () => toast({ title: 'שגיאה בשליחת התזכורת', variant: 'destructive' }),
  });

  const filtered = useMemo(() => {
    return reviews.filter(r => {
      const matchSearch = !searchTerm ||
        (r.guest_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [reviews, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const withRating = reviews.filter(r => r.rating);
    const avg = withRating.length > 0
      ? (withRating.reduce((sum, r) => sum + (r.rating || 0), 0) / withRating.length)
      : 0;
    return {
      total: reviews.length,
      avg: avg.toFixed(1),
      reviewed: reviews.filter(r => r.status === 'REVIEWED').length,
      pending: reviews.filter(r => r.status === 'PENDING').length,
    };
  }, [reviews]);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto animate-fade-in" dir="rtl">
      <div className="bg-gradient-to-br from-indigo-50/80 to-white rounded-2xl border border-indigo-100/50 p-5 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Star className="w-5 h-5 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ביקורות אורחים</h1>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed mr-[3.25rem]">צפה בביקורות שהשאירו אורחים, עקוב אחר דירוגים ושפר את חוויית האירוח.</p>
        <p className="text-indigo-500 text-xs mt-1 mr-[3.25rem]">💡 טיפ: מענה מהיר לביקורות משפר את הדירוג שלך</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-2xl font-bold text-amber-500">{stats.avg}</span>
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <p className="text-xs text-gray-400">דירוג ממוצע</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-700 mb-1">{stats.total}</p>
            <p className="text-xs text-gray-400">סה"כ ביקורות</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600 mb-1">{stats.reviewed}</p>
            <p className="text-xs text-gray-400">ביקורות שהתקבלו</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600 mb-1">{stats.pending}</p>
            <p className="text-xs text-gray-400">ממתינות</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="חפש לפי שם אורח..."
            className="h-9 pr-9 text-sm"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Button
            size="sm"
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            className={cn("h-9 text-xs", statusFilter === 'all' && "bg-[#00D1C1] text-[#0B1220] hover:bg-[#00b8aa]")}
          >
            הכל
          </Button>
          {STATUS_OPTIONS.map(s => (
            <Button
              key={s.value}
              size="sm"
              variant={statusFilter === s.value ? 'default' : 'outline'}
              onClick={() => setStatusFilter(s.value)}
              className={cn("h-9 text-xs", statusFilter === s.value && "bg-[#00D1C1] text-[#0B1220] hover:bg-[#00b8aa]")}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : filtered.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                {searchTerm || statusFilter !== 'all' ? 'לא נמצאו תוצאות' : 'אין ביקורות עדיין'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((review) => {
            const statusInfo = STATUS_MAP[review.status] || STATUS_MAP.PENDING;
            const StatusIcon = statusInfo.icon;
            return (
              <Card key={review.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-amber-600">
                        {(review.guest_name || 'א')[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-gray-800">{review.guest_name || 'אורח'}</p>
                          {review.rating && <StarRating rating={review.rating} />}
                          <Badge className={`${statusInfo.color} text-[10px] py-0 px-1.5 border-0 flex items-center gap-0.5`}>
                            <StatusIcon className="w-2.5 h-2.5" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        {review.review_text && (
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">{review.review_text}</p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-1.5">
                          {review.check_out_date && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Calendar className="w-3 h-3" />
                              יציאה: {format(parseISO(review.check_out_date), 'dd/MM/yy')}
                            </span>
                          )}
                          {review.property_name && (
                            <span className="text-xs text-gray-400">{review.property_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex-shrink-0">
                      {review.status === 'PENDING' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1.5 whitespace-nowrap"
                          onClick={() => sendReminderMutation.mutate(review.id)}
                          disabled={sendReminderMutation.isPending}
                        >
                          <Send className="w-3 h-3" />
                          שלח בקשה
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}