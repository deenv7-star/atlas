import React, { useState } from 'react';
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
  FileText, Bell, ChevronRight, Play, Pause, Copy, Trash2,
  Users, Calendar, CheckCircle, AlertTriangle
} from 'lucide-react';

const TRIGGERS = {
  LEAD_CREATED: { label: 'ליד חדש נוצר', icon: Users, color: 'bg-blue-500' },
  BOOKING_CREATED: { label: 'הזמנה נוצרה', icon: Calendar, color: 'bg-green-500' },
  BOOKING_CONFIRMED: { label: 'הזמנה אושרה', icon: CheckCircle, color: 'bg-emerald-500' },
  PAYMENT_RECEIVED: { label: 'תשלום התקבל', icon: CreditCard, color: 'bg-violet-500' },
  PAYMENT_OVERDUE: { label: 'תשלום באיחור', icon: AlertTriangle, color: 'bg-red-500' },
  CHECKIN_DAY: { label: 'יום כניסה', icon: Calendar, color: 'bg-cyan-500' },
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

export default function AutomationsPage() {
  const [user, setUser] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    trigger: '',
    actions: [],
    timing_offset_hours: 0,
    is_active: true
  });
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ['automations', user?.org_id],
    queryFn: () => base44.entities.AutomationRule.filter({ org_id: user?.org_id }),
    enabled: !!user?.org_id
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AutomationRule.create({ ...data, org_id: user?.org_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      setShowCreateDialog(false);
      setNewRule({ name: '', trigger: '', actions: [], timing_offset_hours: 0, is_active: true });
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.AutomationRule.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automations'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AutomationRule.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automations'] })
  });

  const handleCreateFromTemplate = (template) => {
    createMutation.mutate({
      ...template,
      is_active: true,
      execution_count: 0
    });
  };

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500">טוען...</div>;
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">אוטומציות</h1>
          <p className="text-gray-500 mt-1">הגדר חוקים אוטומטיים לניהול הנכסים</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#0A2540] hover:bg-[#0A2540]/90">
              <Plus className="h-4 w-4 ml-2" />
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
                <p className="text-xs text-gray-500 mt-1">שלילי = לפני, חיובי = אחרי</p>
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
                className="w-full bg-[#0A2540]"
                onClick={() => createMutation.mutate(newRule)}
                disabled={!newRule.name || !newRule.trigger || newRule.actions.length === 0}
              >
                צור אוטומציה
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Template Suggestions */}
      {automations.length === 0 && (
        <Card className="border-dashed border-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#00D4AA]" />
              תבניות מוכנות
            </CardTitle>
            <CardDescription>התחל עם אוטומציות מומלצות</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {TEMPLATE_AUTOMATIONS.map((template, i) => (
                <button
                  key={i}
                  onClick={() => handleCreateFromTemplate(template)}
                  className="p-4 border rounded-lg text-right hover:border-[#00D4AA] hover:bg-[#00D4AA]/5 transition-all"
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{template.description}</div>
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
            <Card key={rule.id} className={`transition-all ${!rule.is_active ? 'opacity-60' : ''}`}>
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
                      <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                        <span>{trigger.label}</span>
                        <ChevronRight className="h-3 w-3" />
                        <span>{rule.actions?.map(a => ACTIONS[a.type]?.label).join(', ')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-500">
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
                      <Trash2 className="h-4 w-4 text-gray-400" />
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