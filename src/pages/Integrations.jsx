import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import CalendarSetupWizard from '@/components/integrations/CalendarSetupWizard';
import MessagingSetupDialog from '@/components/integrations/MessagingSetupDialog';
import PaymentSetupDialog from '@/components/integrations/PaymentSetupDialog';
import AccountingSetupDialog from '@/components/integrations/AccountingSetupDialog';
import PMSSetupDialog from '@/components/integrations/PMSSetupDialog';
import { 
  Link2, Calendar, CreditCard, MessageSquare, Settings2, RefreshCw, Plus, ExternalLink, Trash2, AlertCircle, Clock, Zap, Info
} from 'lucide-react';

const CALENDAR_PROVIDERS = {
  GOOGLE: { name: 'Google Calendar', color: 'bg-blue-500', icon: '📅', infoUrl: 'https://support.google.com/calendar' },
  OUTLOOK: { name: 'Outlook', color: 'bg-cyan-600', icon: '📆', infoUrl: 'https://support.microsoft.com/en-us/outlook' },
  AIRBNB: { name: 'Airbnb', color: 'bg-[#FF5A5F]', icon: '🏠', infoUrl: 'https://www.airbnb.com/help' },
  BOOKING_COM: { name: 'Booking.com', color: 'bg-blue-700', icon: '🏨', infoUrl: 'https://www.booking.com/help' },
  ICAL: { name: 'iCal (כללי)', color: 'bg-gray-600', icon: '📋', infoUrl: 'https://en.wikipedia.org/wiki/ICalendar' }
};

const SYNC_STATUS = {
  ACTIVE: { label: 'פעיל', color: 'bg-green-500' },
  PAUSED: { label: 'מושהה', color: 'bg-yellow-500' },
  ERROR: { label: 'שגיאה', color: 'bg-red-500' }
};

const MESSAGING_PROVIDERS = {
  WHATSAPP: { name: 'WhatsApp Business', color: 'bg-[#25D366]', icon: '💬' },
  EMAIL_SMTP: { name: 'Email (SMTP)', color: 'bg-gray-600', icon: '📧' },
  SMS_TWILIO: { name: 'SMS (Twilio)', color: 'bg-[#F22F46]', icon: '📱' },
  SENDGRID: { name: 'SendGrid', color: 'bg-blue-500', icon: '📬' },
  TELEGRAM: { name: 'Telegram Bot', color: 'bg-[#0088cc]', icon: '✈️' }
};

const PAYMENT_PROVIDERS = {
  STRIPE: { name: 'Stripe', color: 'bg-[#635BFF]', icon: 'S' },
  PAYPAL: { name: 'PayPal', color: 'bg-[#003087]', icon: 'P' },
  BIT: { name: 'Bit', color: 'bg-green-600', icon: '💳' },
  TRANZILA: { name: 'Tranzila', color: 'bg-blue-600', icon: '💰' },
  MESHULAM: { name: 'Meshulam', color: 'bg-orange-600', icon: '🏦' },
  CARDCOM: { name: 'Cardcom', color: 'bg-purple-600', icon: '🔐' }
};

const ACCOUNTING_PROVIDERS = {
  MORNING: { name: 'Morning', color: 'bg-[#00A6ED]', icon: '☀️' },
  GREEN_INVOICE: { name: 'Green Invoice', color: 'bg-green-600', icon: '📊' },
  QUICKBOOKS: { name: 'QuickBooks', color: 'bg-[#2CA01C]', icon: '💼' },
  ZOHO_BOOKS: { name: 'Zoho Books', color: 'bg-orange-600', icon: '🧾' },
  XERO: { name: 'Xero', color: 'bg-blue-700', icon: '📈' },
  HASHAVSHEVET: { name: 'חשבשבת', color: 'bg-gray-700', icon: '🧮' }
};

const PMS_PROVIDERS = {
  GUESTY: { name: 'Guesty', color: 'bg-[#5B21B6]', icon: 'G' },
  HOSTAWAY: { name: 'Hostaway', color: 'bg-blue-600', icon: 'H' },
  LODGIFY: { name: 'Lodgify', color: 'bg-orange-600', icon: 'L' },
  CLOUDBEDS: { name: 'Cloudbeds', color: 'bg-green-600', icon: 'C' },
  OPERA: { name: 'Opera PMS', color: 'bg-red-600', icon: 'O' },
  MEWS: { name: 'Mews', color: 'bg-cyan-600', icon: 'M' },
  APALEO: { name: 'Apaleo', color: 'bg-indigo-600', icon: '🏨' },
  CHANNELMANAGER: { name: 'Channel Manager', color: 'bg-pink-600', icon: '🔗' }
};

export default function IntegrationsPage() {
  const [user, setUser] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [filterPropertyId, setFilterPropertyId] = useState('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showMessagingDialog, setShowMessagingDialog] = useState(false);
  const [selectedMessagingProvider, setSelectedMessagingProvider] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState(null);
  const [showAccountingDialog, setShowAccountingDialog] = useState(false);
  const [selectedAccountingProvider, setSelectedAccountingProvider] = useState(null);
  const [showPMSDialog, setShowPMSDialog] = useState(false);
  const [selectedPMSProvider, setSelectedPMSProvider] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    base44.auth.me()
      .then(u => { if (!cancelled) setUser(u); })
      .catch(err => console.error('Failed to fetch user in Integrations:', err));
    return () => { cancelled = true; };
  }, []);

  const orgId = user?.organization_id ?? user?.org_id ?? null;

  const { data: properties = [] } = useQuery({
    queryKey: ['properties', orgId],
    queryFn: () => base44.entities.Property.filter({ org_id: orgId }, '-created_at', 200),
    enabled: !!orgId,
  });

  const { data: calendarSyncs = [], isLoading } = useQuery({
    queryKey: ['calendar-syncs', orgId],
    queryFn: () => base44.entities.CalendarSync.filter({ org_id: orgId }, '-created_at', 200),
    enabled: !!orgId,
  });

  const { data: messagingIntegrations = [] } = useQuery({
    queryKey: ['messaging-integrations', orgId],
    queryFn: () => base44.entities.MessagingIntegration.filter({ org_id: orgId }, '-created_at', 200),
    enabled: !!orgId,
  });

  const { data: paymentGateways = [] } = useQuery({
    queryKey: ['payment-gateways', orgId],
    queryFn: () => base44.entities.PaymentGateway.filter({ org_id: orgId }, '-created_at', 200),
    enabled: !!orgId,
  });

  const { data: accountingIntegrations = [] } = useQuery({
    queryKey: ['accounting-integrations', orgId],
    queryFn: () => base44.entities.AccountingIntegration.filter({ org_id: orgId }, '-created_at', 200),
    enabled: !!orgId,
  });

  const { data: pmsIntegrations = [] } = useQuery({
    queryKey: ['pms-integrations', orgId],
    queryFn: () => base44.entities.PMSIntegration.filter({ org_id: orgId }, '-created_at', 200),
    enabled: !!orgId,
  });

  const createSyncMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarSync.create({
      ...data,
      org_id: orgId,
      property_id: selectedPropertyId,
      sync_status: 'ACTIVE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-syncs'] });
      setShowWizard(false);
      toast.success('יומן נוסף בהצלחה!');
    },
    onError: () => toast.error('שגיאה בהוספת היומן')
  });

  const deleteSyncMutation = useMutation({
    mutationFn: (id) => base44.entities.CalendarSync.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-syncs'] });
      setDeleteConfirmId(null);
      toast.success('סנכרון הוסר בהצלחה');
    },
    onError: () => toast.error('שגיאה בהסרת הסנכרון')
  });

  const toggleSyncMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.CalendarSync.update(id, { sync_status: status }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-syncs'] });
      toast.success(status === 'ACTIVE' ? 'סנכרון הופעל' : 'סנכרון הושהה');
    },
    onError: () => toast.error('שגיאה בעדכון הסנכרון')
  });

  const manualSyncMutation = useMutation({
    mutationFn: (id) => base44.entities.CalendarSync.update(id, { last_sync_at: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-syncs'] });
      toast.success('סנכרון הופעל כעת...');
    },
    onError: () => toast.error('שגיאה בסנכרון')
  });

  const createMessagingMutation = useMutation({
    mutationFn: (data) => base44.entities.MessagingIntegration.create({
      ...data,
      org_id: orgId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messaging-integrations'] });
      setShowMessagingDialog(false);
      setSelectedMessagingProvider(null);
      toast.success('אינטגרציה נוספה בהצלחה!');
    },
    onError: () => toast.error('שגיאה בהוספת האינטגרציה')
  });

  const deleteMessagingMutation = useMutation({
    mutationFn: (id) => base44.entities.MessagingIntegration.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messaging-integrations'] });
      toast.success('אינטגרציה הוסרה');
    },
    onError: () => toast.error('שגיאה בהסרת האינטגרציה')
  });

  const handleDeleteMessaging = (id) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את האינטגרציה?')) {
      deleteMessagingMutation.mutate(id);
    }
  };

  const handleConnectMessaging = (provider) => {
    setSelectedMessagingProvider(provider);
    setShowMessagingDialog(true);
  };

  const createPaymentMutation = useMutation({
    mutationFn: (data) => base44.entities.PaymentGateway.create({
      ...data,
      org_id: orgId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-gateways'] });
      setShowPaymentDialog(false);
      setSelectedPaymentProvider(null);
      toast.success('שער תשלומים נוסף בהצלחה!');
    },
    onError: () => toast.error('שגיאה בהוספת שער התשלומים')
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (id) => base44.entities.PaymentGateway.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-gateways'] });
      toast.success('שער תשלומים הוסר');
    },
    onError: () => toast.error('שגיאה בהסרת שער התשלומים')
  });

  const handleDeletePayment = (id) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את שער התשלומים?')) {
      deletePaymentMutation.mutate(id);
    }
  };

  const handleConnectPayment = (provider) => {
    setSelectedPaymentProvider(provider);
    setShowPaymentDialog(true);
  };

  const createAccountingMutation = useMutation({
    mutationFn: (data) => base44.entities.AccountingIntegration.create({ ...data, org_id: orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-integrations'] });
      setShowAccountingDialog(false);
      setSelectedAccountingProvider(null);
      toast.success('אינטגרציית חשבונאות נוספה!');
    },
    onError: () => toast.error('שגיאה בהוספת אינטגרציה')
  });

  const deleteAccountingMutation = useMutation({
    mutationFn: (id) => base44.entities.AccountingIntegration.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-integrations'] });
      toast.success('אינטגרציה הוסרה');
    },
    onError: () => toast.error('שגיאה')
  });

  const handleDeleteAccounting = (id) => {
    if (window.confirm('האם אתה בטוח?')) deleteAccountingMutation.mutate(id);
  };

  const handleConnectAccounting = (provider) => {
    setSelectedAccountingProvider(provider);
    setShowAccountingDialog(true);
  };

  const createPMSMutation = useMutation({
    mutationFn: (data) => base44.entities.PMSIntegration.create({ ...data, org_id: orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pms-integrations'] });
      setShowPMSDialog(false);
      setSelectedPMSProvider(null);
      toast.success('אינטגרציית PMS נוספה!');
    },
    onError: () => toast.error('שגיאה')
  });

  const deletePMSMutation = useMutation({
    mutationFn: (id) => base44.entities.PMSIntegration.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pms-integrations'] });
      toast.success('אינטגרציה הוסרה');
    },
    onError: () => toast.error('שגיאה')
  });

  const handleDeletePMS = (id) => {
    if (window.confirm('האם אתה בטוח?')) deletePMSMutation.mutate(id);
  };

  const handleConnectPMS = (provider) => {
    setSelectedPMSProvider(provider);
    setShowPMSDialog(true);
  };

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500">טוען...</div>;
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-indigo-50/80 to-violet-50/40 rounded-2xl border border-indigo-100/60 p-6 mb-2">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Link2 className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">מרכז אינטגרציות</h1>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              כאן מחברים את כל הכלים שלך ל-ATLAS — יומנים, תשלומים, הודעות, חשבונאות ומערכות ניהול.
              <br />ברגע שתחבר כלי, ATLAS ידע לסנכרן הזמנות, לשלוח הודעות ולנהל תשלומים אוטומטית.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white rounded-full px-3 py-1.5 border border-gray-200 text-gray-600">
                <Calendar className="w-3.5 h-3.5 text-blue-500" /> יומנים
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white rounded-full px-3 py-1.5 border border-gray-200 text-gray-600">
                <CreditCard className="w-3.5 h-3.5 text-green-500" /> תשלומים
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white rounded-full px-3 py-1.5 border border-gray-200 text-gray-600">
                <MessageSquare className="w-3.5 h-3.5 text-purple-500" /> הודעות
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white rounded-full px-3 py-1.5 border border-gray-200 text-gray-600">
                <Settings2 className="w-3.5 h-3.5 text-orange-500" /> חשבונאות
              </span>
            </div>
            <p className="text-indigo-500 text-xs mt-3">💡 טיפ: התחל מחיבור יומן — זה יאפשר סנכרון אוטומטי של הזמנות מ-Airbnb ו-Booking.com</p>
          </div>
        </div>
      </div>
      <Tabs defaultValue="calendars">
        <div className="overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6 snap-x snap-mandatory">
          <TabsList className="bg-gray-100 w-max sm:w-full inline-flex snap-center">
            <TabsTrigger value="calendars" className="flex items-center gap-2 whitespace-nowrap">
              <Calendar className="h-4 w-4" />
              יומנים
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2 whitespace-nowrap">
              <CreditCard className="h-4 w-4" />
              תשלומים
            </TabsTrigger>
            <TabsTrigger value="messaging" className="flex items-center gap-2 whitespace-nowrap">
              <MessageSquare className="h-4 w-4" />
              הודעות
            </TabsTrigger>
            <TabsTrigger value="pms" className="flex items-center gap-2 whitespace-nowrap">
              <Settings2 className="h-4 w-4" />
              מערכות PMS
            </TabsTrigger>
            <TabsTrigger value="accounting" className="flex items-center gap-2 whitespace-nowrap">
              <CreditCard className="h-4 w-4" />
              חשבונאות
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Calendars Tab */}
        <TabsContent value="calendars" className="mt-6 space-y-6">
          {/* Info Banner */}
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 flex gap-3">
            <Info className="h-5 w-5 text-cyan-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-cyan-900">
              <p className="font-medium mb-1">😌 סנכרוני יומנים אוטומטיים</p>
              <p>כשמחברים יומן, הוא מסונכרן אוטומטית כל 30 דקות. אפשר גם לסנכרן ידנית בכל רגע.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1">
              <h2 className="text-lg font-medium mb-3">סנכרון יומנים</h2>
              {calendarSyncs.length > 0 && (
                <Select value={filterPropertyId} onValueChange={setFilterPropertyId}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="סנן לפי נכס" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הנכסים</SelectItem>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button 
              className="bg-[#0A2540] w-full sm:w-auto"
              onClick={() => setShowWizard(true)}
            >
              <Plus className="h-4 w-4 ml-2" />
              הוסף יומן
            </Button>
          </div>

          <CalendarSetupWizard
            open={showWizard}
            onOpenChange={setShowWizard}
            onSelect={(data) => {
              createSyncMutation.mutate(data);
            }}
            properties={properties}
            selectedPropertyId={selectedPropertyId}
            onPropertyChange={setSelectedPropertyId}
          />

          {calendarSyncs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">אין יומנים מסונכרנים</p>
                <p className="text-sm text-gray-400">הוסף יומן כדי להתחיל</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {calendarSyncs
                .filter(sync => filterPropertyId === 'all' || sync.property_id === filterPropertyId)
                .map((sync) => {
                const provider = CALENDAR_PROVIDERS[sync.provider] || {};
                const status = SYNC_STATUS[sync.sync_status] || SYNC_STATUS.ACTIVE;
                const property = properties.find(p => p.id === sync.property_id);

                return (
                  <Card key={sync.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`w-10 h-10 flex-shrink-0 rounded-lg ${provider.color} flex items-center justify-center text-white text-lg`}>
                            {provider.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium flex items-center gap-2 flex-wrap">
                              <span className="truncate">{provider.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {sync.sync_direction === 'IMPORT' ? 'ייבוא' : sync.sync_direction === 'EXPORT' ? 'ייצוא' : 'דו-כיווני'}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                              {property?.name}
                            </div>
                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {sync.last_sync_at ? `סונכרן לפני ${Math.floor((new Date() - new Date(sync.last_sync_at)) / 60000)} דקות` : 'לא סונכרן עדיין'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${status.color}`} />
                            <span className="text-sm text-gray-500">{status.label}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="סנכרן עכשיו"
                              onClick={() => manualSyncMutation.mutate(sync.id)}
                              disabled={manualSyncMutation.isPending}
                            >
                              <RefreshCw className={`h-4 w-4 text-gray-400 ${manualSyncMutation.isPending ? 'animate-spin' : ''}`} />
                            </Button>
                            <a href={provider.infoUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" title="למידע נוסף">
                                <ExternalLink className="h-4 w-4 text-gray-400" />
                              </Button>
                            </a>
                            <Switch
                              checked={sync.sync_status === 'ACTIVE'}
                              onCheckedChange={(checked) => 
                                toggleSyncMutation.mutate({ id: sync.id, status: checked ? 'ACTIVE' : 'PAUSED' })
                              }
                            />
                            <Dialog open={deleteConfirmId === sync.id} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(sync.id)}>
                                  <Trash2 className="h-4 w-4 text-gray-400" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent dir="rtl">
                                <DialogHeader>
                                  <DialogTitle>מחיקת סנכרון</DialogTitle>
                                </DialogHeader>
                                <p className="text-gray-600">האם אתה בטוח שברצונך למחוק את הסנכרון של {provider.name}?</p>
                                <div className="flex gap-2 justify-end mt-4">
                                  <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>ביטול</Button>
                                  <Button className="bg-red-600 hover:bg-red-700" onClick={() => deleteSyncMutation.mutate(sync.id)}>
                                    מחוק
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                      {sync.error_message && (
                        <div className="mt-3 p-2 bg-red-50 rounded text-red-600 text-sm flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {sync.error_message}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="mt-6 space-y-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex gap-3">
            <Zap className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-purple-900">
              <p className="font-medium mb-1">💳 קבל תשלומים בקלות</p>
              <p>חבר Stripe, PayPal, Bit או כל שער תשלומים - קבל כסף ישירות מאורחים בכרטיס, Bit והעברה בנקאית.</p>
            </div>
          </div>

          {/* Connected Payment Gateways */}
          {paymentGateways.length > 0 && (
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-medium text-gray-700">שערי תשלומים מחוברים</h3>
              {paymentGateways.map(gateway => {
                const providerConfig = PAYMENT_PROVIDERS[gateway.provider] || {};
                return (
                  <Card key={gateway.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${providerConfig.color} flex items-center justify-center text-white font-bold`}>
                            {providerConfig.icon}
                          </div>
                          <div>
                            <div className="font-medium">{gateway.name}</div>
                            <div className="text-xs text-gray-500">{providerConfig.name} • {gateway.currency}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            gateway.status === 'ACTIVE' ? 'bg-green-500' : 
                            gateway.status === 'ERROR' ? 'bg-red-500' : 'bg-gray-400'
                          }`} />
                          <span className="text-sm text-gray-500">
                            {gateway.status === 'ACTIVE' ? 'פעיל' : 
                             gateway.status === 'ERROR' ? 'שגיאה' : 'לא פעיל'}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePayment(gateway.id)}
                          >
                            <Trash2 className="h-4 w-4 text-gray-400" />
                          </Button>
                        </div>
                      </div>
                      {gateway.error_message && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-red-600 text-xs flex items-center gap-2">
                          <AlertCircle className="h-3 w-3" />
                          {gateway.error_message}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow border-2 border-transparent hover:border-[#635BFF]">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#635BFF] flex items-center justify-center text-white font-bold">S</div>
                  Stripe
                </CardTitle>
                <CardDescription>כרטיס אשראי, Apple Pay, Google Pay ועוד</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => handleConnectPayment('STRIPE')}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  חבר עכשיו
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-2 border-transparent hover:border-[#003087]">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#003087] flex items-center justify-center text-white font-bold">P</div>
                  PayPal
                </CardTitle>
                <CardDescription>תשלומים דרך חשבון PayPal</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => handleConnectPayment('PAYPAL')}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  חבר עכשיו
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-2 border-transparent hover:border-green-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center text-white">💳</div>
                  Bit
                </CardTitle>
                <CardDescription>תשלומים מהירים בביט</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => handleConnectPayment('BIT')}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  חבר עכשיו
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">💰</div>
                  Tranzila
                </CardTitle>
                <CardDescription>עיבוד תשלומים ישראלי מוביל</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => handleConnectPayment('TRANZILA')}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  חבר עכשיו
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-2 border-transparent hover:border-orange-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center text-white">🏦</div>
                  Meshulam
                </CardTitle>
                <CardDescription>תשלומים מאובטחים ומהירים</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => handleConnectPayment('MESHULAM')}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  חבר עכשיו
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-2 border-transparent hover:border-purple-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white">🔐</div>
                  Cardcom
                </CardTitle>
                <CardDescription>שער תשלומים ישראלי מאובטח</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => handleConnectPayment('CARDCOM')}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  חבר עכשיו
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Messaging Tab */}
        <TabsContent value="messaging" className="mt-6 space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
            <Zap className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-900">
              <p className="font-medium mb-1">💬 שלח הודעות אוטומטיות</p>
              <p>חבר WhatsApp Business, SMTP, Twilio או SendGrid - שלח הודעות אוטומטיות לאורחים בזמנים הנכונים.</p>
            </div>
          </div>

          {/* Connected Integrations */}
          {messagingIntegrations.length > 0 && (
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-medium text-gray-700">אינטגרציות מחוברות</h3>
              {messagingIntegrations.map(integration => {
                const providerConfig = MESSAGING_PROVIDERS[integration.provider] || {};
                return (
                  <Card key={integration.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${providerConfig.color} flex items-center justify-center text-white text-lg`}>
                            {providerConfig.icon}
                          </div>
                          <div>
                            <div className="font-medium">{integration.name}</div>
                            <div className="text-xs text-gray-500">{providerConfig.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            integration.status === 'ACTIVE' ? 'bg-green-500' : 
                            integration.status === 'ERROR' ? 'bg-red-500' : 'bg-gray-400'
                          }`} />
                          <span className="text-sm text-gray-500">
                            {integration.status === 'ACTIVE' ? 'פעיל' : 
                             integration.status === 'ERROR' ? 'שגיאה' : 'לא פעיל'}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMessaging(integration.id)}
                          >
                            <Trash2 className="h-4 w-4 text-gray-400" />
                          </Button>
                        </div>
                      </div>
                      {integration.error_message && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-red-600 text-xs flex items-center gap-2">
                          <AlertCircle className="h-3 w-3" />
                          {integration.error_message}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow border-2 border-transparent hover:border-[#25D366]">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#25D366] flex items-center justify-center text-white">💬</div>
                  WhatsApp Business
                </CardTitle>
                <CardDescription>שלח הודעות אוטומטיות לאורחים דרך WhatsApp</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white"
                  onClick={() => handleConnectMessaging('WHATSAPP')}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  חבר עכשיו
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-2 border-transparent hover:border-gray-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-600 flex items-center justify-center text-white">📧</div>
                  Email (SMTP)
                </CardTitle>
                <CardDescription>שלח אימיילים אוטומטיים דרך SMTP</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => handleConnectMessaging('EMAIL_SMTP')}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  חבר עכשיו
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-2 border-transparent hover:border-[#F22F46]">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#F22F46] flex items-center justify-center text-white">📱</div>
                  SMS (Twilio)
                </CardTitle>
                <CardDescription>שלח הודעות SMS דרך Twilio</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => handleConnectMessaging('SMS_TWILIO')}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  חבר עכשיו
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white">📬</div>
                  SendGrid
                </CardTitle>
                <CardDescription>שירות דיוור מתקדם עם אנליטיקס</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => handleConnectMessaging('SENDGRID')}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  חבר עכשיו
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-2 border-transparent hover:border-[#0088cc]">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0088cc] flex items-center justify-center text-white">✈️</div>
                  Telegram Bot
                </CardTitle>
                <CardDescription>שלח הודעות דרך בוט Telegram</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => handleConnectMessaging('TELEGRAM')}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  חבר עכשיו
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Accounting Tab */}
        <TabsContent value="accounting" className="mt-6 space-y-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex gap-3">
            <Zap className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-900">
              <p className="font-medium mb-1">📊 ניהול פיננסי משולב</p>
              <p>חבר Morning, Green Invoice או כל מערכת חשבונאות - סנכרן חשבוניות וקבלות אוטומטית.</p>
            </div>
          </div>

          {accountingIntegrations.length > 0 && (
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-medium text-gray-700">מערכות חשבונאות מחוברות</h3>
              {accountingIntegrations.map(integration => {
                const providerConfig = ACCOUNTING_PROVIDERS[integration.provider] || {};
                return (
                  <Card key={integration.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${providerConfig.color} flex items-center justify-center text-white text-lg`}>{providerConfig.icon}</div>
                          <div>
                            <div className="font-medium">{integration.name}</div>
                            <div className="text-xs text-gray-500">{providerConfig.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${integration.status === 'ACTIVE' ? 'bg-green-500' : integration.status === 'ERROR' ? 'bg-red-500' : 'bg-gray-400'}`} />
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteAccounting(integration.id)}><Trash2 className="h-4 w-4 text-gray-400" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { provider: 'MORNING', title: 'Morning (מורנינג)', desc: 'חשבוניות וקבלות ישראליות' },
              { provider: 'GREEN_INVOICE', title: 'Green Invoice', desc: 'מערכת חשבוניות דיגיטלית' },
              { provider: 'QUICKBOOKS', title: 'QuickBooks', desc: 'תוכנת חשבונאות מקיפה' },
              { provider: 'ZOHO_BOOKS', title: 'Zoho Books', desc: 'ניהול פיננסי מקוון' },
              { provider: 'XERO', title: 'Xero', desc: 'חשבונאות מבוססת ענן' },
              { provider: 'HASHAVSHEVET', title: 'חשבשבת', desc: 'הנהלת חשבונות ישראלית' }
            ].map(({ provider, title, desc }) => {
              const config = ACCOUNTING_PROVIDERS[provider];
              return (
                <Card key={provider} className="hover:shadow-md transition-shadow border-2 border-transparent hover:border-gray-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center text-white text-lg`}>{config.icon}</div>
                      {title}
                    </CardTitle>
                    <CardDescription>{desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" onClick={() => handleConnectAccounting(provider)}>
                      <Plus className="h-4 w-4 ml-2" />
                      חבר עכשיו
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* PMS Tab */}
        <TabsContent value="pms" className="mt-6 space-y-6">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex gap-3">
            <Zap className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-indigo-900">
              <p className="font-medium mb-1">🏨 סנכרון עם מערכות PMS</p>
              <p>חבר Guesty, Hostaway, Cloudbeds או כל PMS - סנכרן הזמנות ואורחים אוטומטית.</p>
            </div>
          </div>

          {pmsIntegrations.length > 0 && (
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-medium text-gray-700">מערכות PMS מחוברות</h3>
              {pmsIntegrations.map(integration => {
                const providerConfig = PMS_PROVIDERS[integration.provider] || {};
                return (
                  <Card key={integration.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${providerConfig.color} flex items-center justify-center text-white font-bold`}>{providerConfig.icon}</div>
                          <div>
                            <div className="font-medium">{integration.name}</div>
                            <div className="text-xs text-gray-500">{providerConfig.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${integration.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <Button variant="ghost" size="icon" onClick={() => handleDeletePMS(integration.id)}><Trash2 className="h-4 w-4 text-gray-400" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { provider: 'GUESTY', title: 'Guesty', desc: 'PMS מלא ומתקדם' },
              { provider: 'HOSTAWAY', title: 'Hostaway', desc: 'ניהול מתקדם של נכסים' },
              { provider: 'LODGIFY', title: 'Lodgify', desc: 'ניהול ערוצי הפצה' },
              { provider: 'CLOUDBEDS', title: 'Cloudbeds', desc: 'פלטפורמת ניהול מלונות' },
              { provider: 'OPERA', title: 'Opera PMS', desc: 'מערכת ניהול מלונאית' },
              { provider: 'MEWS', title: 'Mews', desc: 'Cloud Hotel Management' },
              { provider: 'APALEO', title: 'Apaleo', desc: 'Open Hospitality Platform' },
              { provider: 'CHANNELMANAGER', title: 'Channel Manager', desc: 'ניהול ערוצי הפצה מרוכז' }
            ].map(({ provider, title, desc }) => {
              const config = PMS_PROVIDERS[provider];
              return (
                <Card key={provider} className="hover:shadow-md transition-shadow border-2 border-transparent hover:border-gray-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center text-white font-bold`}>{config.icon}</div>
                      {title}
                    </CardTitle>
                    <CardDescription>{desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" onClick={() => handleConnectPMS(provider)}>
                      <Plus className="h-4 w-4 ml-2" />
                      חבר עכשיו
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Messaging Setup Dialog */}
      <MessagingSetupDialog
        open={showMessagingDialog}
        onOpenChange={setShowMessagingDialog}
        provider={selectedMessagingProvider}
        onSave={(data) => createMessagingMutation.mutate(data)}
      />

      {/* Payment Setup Dialog */}
      <PaymentSetupDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        provider={selectedPaymentProvider}
        onSave={(data) => createPaymentMutation.mutate(data)}
      />

      {/* Accounting Setup Dialog */}
      <AccountingSetupDialog
        open={showAccountingDialog}
        onOpenChange={setShowAccountingDialog}
        provider={selectedAccountingProvider}
        onSave={(data) => createAccountingMutation.mutate(data)}
      />

      {/* PMS Setup Dialog */}
      <PMSSetupDialog
        open={showPMSDialog}
        onOpenChange={setShowPMSDialog}
        provider={selectedPMSProvider}
        onSave={(data) => createPMSMutation.mutate(data)}
      />
    </div>
  );
}