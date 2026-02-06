import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, Lightbulb, AlertTriangle, TrendingUp, BarChart3,
  Calendar, CreditCard, Sparkles, RefreshCw, Check, X,
  ChevronRight, Loader2
} from 'lucide-react';

const INSIGHT_TYPES = {
  DAILY_SUMMARY: { label: 'סיכום יומי', icon: Calendar, color: 'text-blue-600 bg-blue-50' },
  RISK_ALERT: { label: 'התראת סיכון', icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
  OPPORTUNITY: { label: 'הזדמנות', icon: Lightbulb, color: 'text-yellow-600 bg-yellow-50' },
  PATTERN: { label: 'תובנה', icon: BarChart3, color: 'text-purple-600 bg-purple-50' },
  PERFORMANCE: { label: 'ביצועים', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
  PRICING: { label: 'המלצת מחיר', icon: CreditCard, color: 'text-cyan-600 bg-cyan-50' }
};

const SEVERITY_STYLES = {
  INFO: 'border-gray-200',
  WARNING: 'border-yellow-300 bg-yellow-50/30',
  CRITICAL: 'border-red-300 bg-red-50/30'
};

export default function InsightsPage() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: insights = [], isLoading } = useQuery({
    queryKey: ['insights', user?.org_id],
    queryFn: () => base44.entities.AIInsight.filter({ org_id: user?.org_id, is_dismissed: false }, '-created_date', 50),
    enabled: !!user?.org_id
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings-insights', user?.org_id],
    queryFn: () => base44.entities.Booking.filter({ org_id: user?.org_id }),
    enabled: !!user?.org_id
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments-insights', user?.org_id],
    queryFn: () => base44.entities.Payment.filter({ org_id: user?.org_id }),
    enabled: !!user?.org_id
  });

  const { data: cleaningTasks = [] } = useQuery({
    queryKey: ['cleaning-insights', user?.org_id],
    queryFn: () => base44.entities.CleaningTask.filter({ org_id: user?.org_id }),
    enabled: !!user?.org_id
  });

  const dismissMutation = useMutation({
    mutationFn: (id) => base44.entities.AIInsight.update(id, { is_dismissed: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insights'] })
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.AIInsight.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insights'] })
  });

  const generateInsights = async () => {
    if (!user?.org_id) return;
    setIsGenerating(true);

    const today = new Date().toISOString().split('T')[0];
    const todayCheckins = bookings.filter(b => b.checkin_date === today);
    const todayCheckouts = bookings.filter(b => b.checkout_date === today);
    const overduePayments = payments.filter(p => p.status === 'DUE' && p.due_date && p.due_date < today);
    const pendingCleaning = cleaningTasks.filter(t => t.status !== 'DONE' && t.scheduled_for?.split('T')[0] <= today);

    const newInsights = [];

    // Daily Summary
    newInsights.push({
      org_id: user.org_id,
      type: 'DAILY_SUMMARY',
      severity: 'INFO',
      title: 'סיכום יומי',
      content: `היום יש לך ${todayCheckins.length} כניסות, ${todayCheckouts.length} יציאות, ${overduePayments.length} תשלומים באיחור, ו-${pendingCleaning.length} משימות ניקיון פתוחות.`
    });

    // Risk Alerts
    const upcomingWithoutDeposit = bookings.filter(b => {
      const checkinDate = new Date(b.checkin_date);
      const daysUntil = Math.ceil((checkinDate - new Date()) / (1000 * 60 * 60 * 24));
      const bookingPayments = payments.filter(p => p.booking_id === b.id && p.status === 'PAID');
      return daysUntil <= 3 && daysUntil >= 0 && bookingPayments.length === 0 && b.status !== 'CANCELLED';
    });

    upcomingWithoutDeposit.forEach(b => {
      newInsights.push({
        org_id: user.org_id,
        type: 'RISK_ALERT',
        severity: 'CRITICAL',
        title: `הזמנה ללא מקדמה`,
        content: `ההזמנה של ${b.guest_name} מתחילה בעוד פחות מ-3 ימים וטרם התקבלה מקדמה.`,
        related_entity_type: 'Booking',
        related_entity_id: b.id
      });
    });

    // Opportunity - Empty weekends
    const nextWeekend = new Date();
    nextWeekend.setDate(nextWeekend.getDate() + (6 - nextWeekend.getDay()));
    const weekendStr = nextWeekend.toISOString().split('T')[0];
    const hasWeekendBooking = bookings.some(b => {
      return b.checkin_date <= weekendStr && b.checkout_date > weekendStr && b.status !== 'CANCELLED';
    });

    if (!hasWeekendBooking && bookings.length > 0) {
      newInsights.push({
        org_id: user.org_id,
        type: 'OPPORTUNITY',
        severity: 'INFO',
        title: 'סוף שבוע פנוי',
        content: 'סוף השבוע הקרוב פנוי. שקול להציע הנחה או לפרסם בערוצים נוספים.'
      });
    }

    // Create insights
    for (const insight of newInsights) {
      await base44.entities.AIInsight.create(insight);
    }

    queryClient.invalidateQueries({ queryKey: ['insights'] });
    setIsGenerating(false);
  };

  const filteredInsights = activeTab === 'all' 
    ? insights 
    : insights.filter(i => i.type === activeTab);

  const unreadCount = insights.filter(i => !i.is_read).length;

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500">טוען...</div>;
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A2540] to-[#00D4AA] flex items-center justify-center">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">תובנות AI</h1>
            <p className="text-gray-500">המוח העסקי שלך</p>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-red-500">{unreadCount} חדשות</Badge>
          )}
        </div>
        <Button 
          onClick={generateInsights}
          disabled={isGenerating}
          className="bg-[#0A2540] hover:bg-[#0A2540]/90"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 ml-2" />
          )}
          עדכן תובנות
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'התראות קריטיות', value: insights.filter(i => i.severity === 'CRITICAL').length, color: 'text-red-600' },
          { label: 'הזדמנויות', value: insights.filter(i => i.type === 'OPPORTUNITY').length, color: 'text-yellow-600' },
          { label: 'תובנות ביצועים', value: insights.filter(i => i.type === 'PERFORMANCE').length, color: 'text-green-600' },
          { label: 'המלצות מחיר', value: insights.filter(i => i.type === 'PRICING').length, color: 'text-cyan-600' }
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="all">הכל</TabsTrigger>
          {Object.entries(INSIGHT_TYPES).map(([key, { label }]) => (
            <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-3">
          {filteredInsights.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-gray-500">
                <Brain className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>אין תובנות כרגע</p>
                <p className="text-sm">לחץ על "עדכן תובנות" כדי לקבל ניתוח חדש</p>
              </CardContent>
            </Card>
          ) : (
            filteredInsights.map((insight) => {
              const type = INSIGHT_TYPES[insight.type] || {};
              const Icon = type.icon || Lightbulb;

              return (
                <Card 
                  key={insight.id} 
                  className={`transition-all ${SEVERITY_STYLES[insight.severity]} ${!insight.is_read ? 'ring-2 ring-[#00D4AA]' : ''}`}
                  onClick={() => !insight.is_read && markReadMutation.mutate(insight.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${type.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{insight.title}</span>
                          {insight.severity === 'CRITICAL' && (
                            <Badge variant="destructive" className="text-xs">דחוף</Badge>
                          )}
                          {!insight.is_read && (
                            <Badge className="bg-[#00D4AA] text-xs">חדש</Badge>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1">{insight.content}</p>
                        {insight.related_entity_id && (
                          <Button variant="link" className="p-0 h-auto text-[#00D4AA] mt-2">
                            צפה בפרטים <ChevronRight className="h-4 w-4 mr-1" />
                          </Button>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissMutation.mutate(insight.id);
                        }}
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}