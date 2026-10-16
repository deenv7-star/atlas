import React, { useState } from 'react';
import { PageHeader, SkelLine } from '@/components/ds';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Zap, Mail, MessageSquare, CreditCard, Sparkles, 
  FileText, Bell, ChevronRight, Trash2,
  Users, Calendar, CheckCircle, AlertTriangle
} from 'lucide-react';

const TRIGGERS = {
  LEAD_CREATED: { label: 'ליד חדש נוצר', icon: Users, color: 'bg-brand-500' },
  BOOKING_CREATED: { label: 'הזמנה נוצרה', icon: Calendar, color: 'bg-green-500' },
  BOOKING_CONFIRMED: { label: 'הזמנה אושרה', icon: CheckCircle, color: 'bg-emerald-500' },
  PAYMENT_RECEIVED: { label: 'תשלום התקבל', icon: CreditCard, color: 'bg-brand-500' },
  PAYMENT_OVERDUE: { label: 'תשלום באיחור', icon: AlertTriangle, color: 'bg-red-500' },
  CHECKIN_DAY: { label: 'יום כניסה', icon: Calendar, color: 'bg-brand-500' },
  CHECKOUT_DAY: { label: 'יום יציאה', icon: Calendar, color: 'bg-orange-500' },
  CLEANING_COMPLETED: { label: 'ניקיון הושלם', icon: Sparkles, color: 'bg-pink-500' },
  BOOKING_CANCELLED: { label: 'הזמנה בוטלה', icon: AlertTriangle, color: 'bg-gray-500' },
  REVIEW_RECEIVED: { label: 'ביקורת התקבלה', icon: MessageSquare, color: 'bg-yellow-500' }
};

const ACTIONS = {
  SEND_WHATSAPP: { label: 'שלח WhatsApp', icon: MessageSquare },
  SEND_EMAIL: { label: 'שלח אימייל', icon: Mail },
  CREATE_PAYMENT: { label: 'צור בקשת תשלום', icon: CreditCard },
  CREATE_CLEANING: { label: 'צור משימת ניקיון', icon: Sparkles },
  NOTIFY_OWNER: { label: 'התראה לבעלים', icon: Bell },
  NOTIFY_CLEANER: { label: 'התראה למנקה', icon: Bell },
  GENERATE_CONTRACT: { label: 'צור חוזה', icon: FileText },
  REQUEST_REVIEW: { label: 'בקש ביקורת', icon: MessageSquare },
  UPDATE_STATUS: { label: 'עדכן סטטוס', icon: CheckCircle }
};

const TEMPLATE_AUTOMATIONS = [
  {
    name: 'תזכורת תשלום מקדמה',
    description: 'שלח תזכורת אם תשלום מקדמה לא התקבל 48 שעות לפני כניסה',
    trigger: 'CHECKIN_DAY',
    timing_offset_hours: -48,
    conditions: [{ field: 'deposit_status', operator: 'equals', value: 'DUE' }],
    actions: [{ type: 'SEND_WHATSAPP', config: { template: 'payment_reminder' } }]
  },
  {
    name: 'הודעת אישור הזמנה',
    description: 'שלח אישור מיידי לאורח עם פרטי ההזמנה',
    trigger: 'BOOKING_CONFIRMED',
    timing_offset_hours: 0,
    actions: [{ type: 'SEND_WHATSAPP', config: { template: 'booking_confirmation' } }]
  },
  {
    name: 'יצירת משימת ניקיון',
    description: 'צור משימת ניקיון אוטומטית ביום יציאה',
    trigger: 'CHECKOUT_DAY',
    timing_offset_hours: 0,
    actions: [{ type: 'CREATE_CLEANING', config: {} }, { type: 'NOTIFY_CLEANER', config: {} }]
  },
  {
    name: 'בקשת ביקורת',
    description: 'שלח בקשת ביקורת 24 שעות לאחר יציאה',
    trigger: 'CHECKOUT_DAY',
    timing_offset_hours: 24,
    actions: [{ type: 'REQUEST_REVIEW', config: {} }]
  }
];

export default function AutomationsPage({ user, orgId }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    trigger: '',
    actions: [],
    timing_offset_hours: 0,
    is_active: true
  });
  const queryClient = useQueryClient();

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ['automations', orgId],
    queryFn: () =>
      orgId
        ? base44.entities.AutomationRule.filter({ org_id: orgId }, '-created_date', 200)
        : Promise.resolve([]),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      return base44.entities.AutomationRule.create({ ...payload, org_id: orgId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      setShowCreateDialog(false);
      setNewRule({ name: '', trigger: '', actions: [], timing_offset_hours: 0, is_active: true });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      return base44.entities.AutomationRule.update(id, { is_active });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automations'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AutomationRule.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automations'] }),
  });

  const handleCreateFromTemplate = (template) => {
    createMutation.mutate({
      ...template,
      is_active: true,
      execution_count: 0
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1200px] px-5 pt-6 md:px-10 md:pt-10" aria-busy="true" aria-label="טוען">
        <SkelLine className="h-8 w-40" /><SkelLine className="mt-3 h-4 w-72 max-w-full" />
        <div className="mt-6 grid gap-3 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <SkelLine key={i} className="h-24 rounded-[14px]" />)}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-8 px-5 pb-16 pt-6 md:px-10 md:pt-10" dir="rtl">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <PageHeader title="אוטומציות" subtitle="הודעות ומשימות שיוצאות לבד, בזמן הנכון." className="!mb-0" />
      <div className="flex shrink-0">
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-[18px] w-[18px]" strokeWidth={1.75} />
              אוטומציה חדשה
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle>יצירת אוטומציה חדשה</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>שם האוטומציה</Label>
                <Input 
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="לדוגמה: תזכורת תשלום"
                />
              </div>
              <div>
                <Label>טריגר</Label>
                <Select value={newRule.trigger} onValueChange={(v) => setNewRule({ ...newRule, trigger: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר טריגר" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRIGGERS).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>תזמון (שעות לפני/אחרי)</Label>
                <Input 
                  type="number"
                  value={newRule.timing_offset_hours}
                  onChange={(e) => setNewRule({ ...newRule, timing_offset_hours: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-ink-600 mt-1">שלילי = לפני, חיובי = אחרי</p>
              </div>
              <div>
                <Label>פעולות</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.entries(ACTIONS).map(([key, { label, icon: Icon }]) => (
                    <Button
                      key={key}
                      type="button"
                      variant={newRule.actions.some(a => a.type === key) ? 'default' : 'outline'}
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        const exists = newRule.actions.some(a => a.type === key);
                        setNewRule({
                          ...newRule,
                          actions: exists 
                            ? newRule.actions.filter(a => a.type !== key)
                            : [...newRule.actions, { type: key, config: {} }]
                        });
                      }}
                    >
                      <Icon className="h-4 w-4 ml-2" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              <Button 
                className="w-full "
                onClick={() => createMutation.mutate(newRule)}
                disabled={!newRule.name || !newRule.trigger || newRule.actions.length === 0}
              >
                צור אוטומציה
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {/* Template Suggestions */}
      {automations.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="ds-icon-square"><Zap className="h-5 w-5" strokeWidth={1.75} /></span>
              תבניות מוכנות
            </CardTitle>
            <CardDescription>בחרו תבנית והיא מתחילה לעבוד מיד.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {TEMPLATE_AUTOMATIONS.map((template, i) => (
                <button
                  key={i}
                  onClick={() => handleCreateFromTemplate(template)}
                  type="button"
                  className="press min-h-[72px] rounded-[12px] border border-line bg-white p-4 text-right transition-[background-color,border-color] duration-150 hover:border-brand-600 hover:bg-brand-50"
                >
                  <div className="text-[15px] font-bold text-navy-900">{template.name}</div>
                  <div className="text-sm text-ink-600 mt-1">{template.description}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Automations */}
      <div className="space-y-3">
        {automations.map((rule) => {
          const trigger = TRIGGERS[rule.trigger] || {};
          const TriggerIcon = trigger.icon || Zap;
          
          return (
            <Card key={rule.id} className={`transition-[background-color,border-color,color,box-shadow,transform] ${!rule.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg ${trigger.color || 'bg-gray-500'} flex items-center justify-center`}>
                      <TriggerIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {rule.name}
                        {rule.timing_offset_hours !== 0 && (
                          <Badge variant="outline" className="text-xs">
                            {rule.timing_offset_hours > 0 ? '+' : ''}{rule.timing_offset_hours} שעות
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-ink-600 flex items-center gap-2 mt-1">
                        <span>{trigger.label}</span>
                        <ChevronRight className="h-3 w-3" />
                        <span>{rule.actions?.map(a => ACTIONS[a.type]?.label).join(', ')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-ink-600">
                      {rule.execution_count || 0} הפעלות
                    </div>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, is_active: checked })}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteMutation.mutate(rule.id)}
                    >
                      <Trash2 className="h-4 w-4 text-ink-400" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}