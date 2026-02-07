import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Link2, Calendar, CreditCard, MessageSquare, Settings2,
  Check, X, RefreshCw, Plus, ExternalLink, Trash2, AlertCircle
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

export default function IntegrationsPage() {
  const [user, setUser] = useState(null);
  const [showAddCalendar, setShowAddCalendar] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [filterPropertyId, setFilterPropertyId] = useState('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [newSync, setNewSync] = useState({
    provider: '',
    sync_direction: 'IMPORT',
    ical_url: ''
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: properties = [] } = useQuery({
    queryKey: ['properties', user?.org_id],
    queryFn: () => base44.entities.Property.filter({ org_id: user?.org_id }),
    enabled: !!user?.org_id
  });

  const { data: calendarSyncs = [], isLoading } = useQuery({
    queryKey: ['calendar-syncs', user?.org_id],
    queryFn: () => base44.entities.CalendarSync.filter({ org_id: user?.org_id }),
    enabled: !!user?.org_id
  });

  const createSyncMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarSync.create({
      ...data,
      org_id: user?.org_id,
      property_id: selectedPropertyId,
      sync_status: 'ACTIVE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-syncs'] });
      setShowAddCalendar(false);
      setNewSync({ provider: '', sync_direction: 'IMPORT', ical_url: '' });
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

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500">טוען...</div>;
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">אינטגרציות</h1>
        <p className="text-gray-500 mt-1">חבר את הכלים שלך ל-ATLAS</p>
      </div>

      <Tabs defaultValue="calendars">
        <ScrollArea className="w-full">
          <TabsList className="bg-gray-100 w-max sm:w-full">
            <TabsTrigger value="calendars" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              יומנים
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              תשלומים
            </TabsTrigger>
            <TabsTrigger value="messaging" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              הודעות
            </TabsTrigger>
            <TabsTrigger value="pms" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              מערכות PMS
            </TabsTrigger>
            <TabsTrigger value="accounting" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              חשבונאות
            </TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* Calendars Tab */}
        <TabsContent value="calendars" className="mt-6 space-y-6">
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
            <Dialog open={showAddCalendar} onOpenChange={setShowAddCalendar}>
              <DialogTrigger asChild>
                <Button className="bg-[#0A2540] w-full sm:w-auto">
                  <Plus className="h-4 w-4 ml-2" />
                  הוסף יומן
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle>הוספת סנכרון יומן</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>נכס</Label>
                    <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר נכס" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>ספק</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {Object.entries(CALENDAR_PROVIDERS).map(([key, { name, icon }]) => (
                        <button
                          key={key}
                          onClick={() => setNewSync({ ...newSync, provider: key })}
                          className={`p-3 border rounded-lg text-right transition-all ${
                            newSync.provider === key ? 'border-[#00D4AA] bg-[#00D4AA]/10' : 'hover:border-gray-300'
                          }`}
                        >
                          <span className="text-xl ml-2">{icon}</span>
                          <span className="text-sm">{name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>כיוון סנכרון</Label>
                    <Select value={newSync.sync_direction} onValueChange={(v) => setNewSync({ ...newSync, sync_direction: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IMPORT">ייבוא בלבד</SelectItem>
                        <SelectItem value="EXPORT">ייצוא בלבד</SelectItem>
                        <SelectItem value="BIDIRECTIONAL">דו-כיווני</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(newSync.provider === 'ICAL' || newSync.provider === 'AIRBNB' || newSync.provider === 'BOOKING_COM') && (
                    <div>
                      <Label>כתובת iCal</Label>
                      <Input 
                        value={newSync.ical_url}
                        onChange={(e) => setNewSync({ ...newSync, ical_url: e.target.value })}
                        placeholder="https://..."
                        dir="ltr"
                      />
                    </div>
                  )}
                  <Button 
                    className="w-full bg-[#0A2540]"
                    onClick={() => createSyncMutation.mutate(newSync)}
                    disabled={!selectedPropertyId || !newSync.provider}
                  >
                    הוסף סנכרון
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

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
                            <div className="text-sm text-gray-500 truncate">
                              {property?.name} • עדכון אחרון: {sync.last_sync_at ? new Date(sync.last_sync_at).toLocaleDateString('he-IL') : 'לא סונכרן עדיין'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${status.color}`} />
                            <span className="text-sm text-gray-500">{status.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#635BFF] flex items-center justify-center text-white font-bold">S</div>
                  Stripe
                </CardTitle>
                <CardDescription>קבל תשלומים בכרטיס אשראי, Apple Pay ו-Google Pay</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#003087] flex items-center justify-center text-white font-bold">P</div>
                  PayPal
                </CardTitle>
                <CardDescription>קבל תשלומים דרך חשבון PayPal</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center text-white">💳</div>
                  Bit
                </CardTitle>
                <CardDescription>קבל תשלומים דרך Bit</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">💰</div>
                  Tranzila
                </CardTitle>
                <CardDescription>עיבוד תשלומים ישראלי</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center text-white">🏦</div>
                  Meshulam
                </CardTitle>
                <CardDescription>תשלומים מאובטחים</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white">🔐</div>
                  Cardcom
                </CardTitle>
                <CardDescription>שער תשלומים ישראלי</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Messaging Tab */}
        <TabsContent value="messaging" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#25D366] flex items-center justify-center text-white">💬</div>
                  WhatsApp Business
                </CardTitle>
                <CardDescription>שלח הודעות אוטומטיות לאורחים</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-600 flex items-center justify-center text-white">📧</div>
                  Email (SMTP)
                </CardTitle>
                <CardDescription>שלח אימיילים אוטומטיים</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0088cc] flex items-center justify-center text-white">✈️</div>
                  Telegram
                </CardTitle>
                <CardDescription>שלח הודעות דרך Telegram Bot</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#F89800] flex items-center justify-center text-white">📱</div>
                  SMS (Twilio)
                </CardTitle>
                <CardDescription>שלח הודעות SMS</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white">📬</div>
                  SendGrid
                </CardTitle>
                <CardDescription>שירות דיוור מתקדם</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#5865F2] flex items-center justify-center text-white">🎮</div>
                  Discord
                </CardTitle>
                <CardDescription>התראות ב-Discord</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Accounting Tab */}
        <TabsContent value="accounting" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#00A6ED] flex items-center justify-center text-white">☀️</div>
                  Morning (מורנינג)
                </CardTitle>
                <CardDescription>מערכת לניהול חשבוניות וקבלות ישראלית</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center text-white">📊</div>
                  Green Invoice
                </CardTitle>
                <CardDescription>מערכת חשבוניות דיגיטלית</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white">💼</div>
                  QuickBooks
                </CardTitle>
                <CardDescription>תוכנת חשבונאות מקיפה</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center text-white">🧾</div>
                  Zoho Books
                </CardTitle>
                <CardDescription>ניהול פיננסי מקוון</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center text-white">📈</div>
                  Xero
                </CardTitle>
                <CardDescription>חשבונאות מבוססת ענן</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-white">🧮</div>
                  HashavShevet (חשבשבת)
                </CardTitle>
                <CardDescription>תוכנת הנהלת חשבונות ישראלית</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PMS Tab */}
        <TabsContent value="pms" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#5B21B6] flex items-center justify-center text-white font-bold">G</div>
                  Guesty
                </CardTitle>
                <CardDescription>סנכרון עם Guesty PMS</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">H</div>
                  Hostaway
                </CardTitle>
                <CardDescription>אינטגרציה עם Hostaway</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold">L</div>
                  Lodgify
                </CardTitle>
                <CardDescription>ניהול ערוצי הפצה</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold">C</div>
                  Cloudbeds
                </CardTitle>
                <CardDescription>פלטפורמת ניהול מלונות</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold">O</div>
                  Opera PMS
                </CardTitle>
                <CardDescription>מערכת ניהול מלונאית</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-600 flex items-center justify-center text-white font-bold">M</div>
                  Mews
                </CardTitle>
                <CardDescription>Cloud Hotel Management</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white">🏨</div>
                  Apaleo
                </CardTitle>
                <CardDescription>Open Hospitality Platform</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-pink-600 flex items-center justify-center text-white">🔗</div>
                  Channel Manager
                </CardTitle>
                <CardDescription>ניהול ערוצי הפצה מרוכז</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white">⚡</div>
                  Zapier
                </CardTitle>
                <CardDescription>חיבור ל-5000+ אפליקציות</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Link2 className="h-4 w-4 ml-2" />
                  בקרוב
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}