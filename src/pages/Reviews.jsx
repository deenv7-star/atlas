import React, { useState, useMemo } from 'react';
import { PageHeader, StatTile, SegmentedControl, EmptyState } from '@/components/ds';
import { CheckCircle2, Clock3 } from 'lucide-react';
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
  { value: 'SENT', label: 'נשלח', color: 'bg-brand-100 text-brand-700', icon: Send },
  { value: 'REVIEWED', label: 'התקבל', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  { value: 'DECLINED', label: 'לא כתבו', color: 'bg-red-100 text-red-600', icon: AlertCircle },
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
      toast({ title: 'התזכורת נשלחה' });
    },
    onError: () => toast({ title: 'התזכורת לא נשלחה. נסו שוב.', variant: 'destructive' }),
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
    <div className="mx-auto w-full max-w-[1200px] space-y-8 px-5 pb-16 pt-6 md:px-10 md:pt-10" dir="rtl">
      <PageHeader title="ביקורות" subtitle="מה האורחים כתבו, ולמי עוד כדאי לשלוח בקשה." className="!mb-0" />

      <div className="stat-row">
        <StatTile label="דירוג ממוצע" value={stats.avg} icon={Star} tone="amber" />
        <StatTile label="התקבלו" value={stats.reviewed} icon={CheckCircle2} tone="success" />
        <StatTile label="ממתינות" value={stats.pending} icon={Clock3} tone="amber" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-400" strokeWidth={1.75} aria-hidden />
          <Input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="חיפוש לפי שם אורח"
            aria-label="חיפוש ביקורת"
            className="rounded-full pr-10"
          />
        </div>
        <SegmentedControl
          ariaLabel="סינון לפי סטטוס"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[{ value: 'all', label: 'הכל' }, ...STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))]}
        />
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              compact
              icon={Star}
              title={searchTerm || statusFilter !== 'all' ? 'אין ביקורות שמתאימות' : 'אין עדיין ביקורות'}
              description={searchTerm || statusFilter !== 'all' ? 'נסו חיפוש או סינון אחר.' : 'אחרי כל יציאה אפשר לשלוח לאורח בקשה לביקורת, זה לוקח לו דקה.'}
            />
          </Card>
        ) : (
          filtered.map((review) => {
            const statusInfo = STATUS_MAP[review.status] || STATUS_MAP.PENDING;
            const StatusIcon = statusInfo.icon;
            return (
              <Card key={review.id} className="border-0 shadow-sm hover:shadow-md transition-[background-color,border-color,color,box-shadow,transform] duration-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-amber-600">
                        {(review.guest_name || 'א')[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-navy-900">{review.guest_name || 'אורח'}</p>
                          {review.rating && <StarRating rating={review.rating} />}
                          <Badge className={`${statusInfo.color} text-[12px] py-0 px-1.5 border-0 flex items-center gap-0.5`}>
                            <StatusIcon className="w-2.5 h-2.5" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        {review.review_text && (
                          <p className="text-sm text-ink-600 mt-1 leading-relaxed">{review.review_text}</p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-1.5">
                          {review.check_out_date && (
                            <span className="flex items-center gap-1 text-xs text-ink-400">
                              <Calendar className="w-3 h-3" />
                              יציאה: {format(parseISO(review.check_out_date), 'dd/MM/yy')}
                            </span>
                          )}
                          {review.property_name && (
                            <span className="text-xs text-ink-400">{review.property_name}</span>
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
                          className="gap-1.5 whitespace-nowrap"
                          onClick={() => sendReminderMutation.mutate(review.id)}
                          disabled={sendReminderMutation.isPending}
                        >
                          <Send className="h-4 w-4 -scale-x-100" strokeWidth={1.75} />
                          בקשת ביקורת
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