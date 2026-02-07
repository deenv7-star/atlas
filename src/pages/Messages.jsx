import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  FileText, 
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  MessageSquare
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

const triggerLabels = {
  MANUAL: 'ידני',
  BEFORE_CHECKIN_24H: '24 שעות לפני צ׳ק-אין',
  CHECKIN_DAY: 'יום הצ׳ק-אין',
  AFTER_CHECKOUT_2H: 'שעתיים אחרי צ׳ק-אאוט',
  REVIEW_REQUEST_24H: 'בקשת ביקורת 24 שעות'
};

const channelLabels = {
  WHATSAPP: 'וואטסאפ',
  SMS: 'SMS',
  EMAIL: 'אימייל'
};

const channelIcons = {
  WHATSAPP: '💬',
  SMS: '📱',
  EMAIL: '📧'
};

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700'
};

const statusLabels = {
  DRAFT: 'טיוטה',
  SENT: 'נשלח',
  FAILED: 'נכשל'
};

export default function Messages({ user, selectedPropertyId, orgId, properties }) {
  const [activeTab, setActiveTab] = useState('templates');
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedBookingForMessage, setSelectedBookingForMessage] = useState(null);
  const queryClient = useQueryClient();

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    trigger: 'MANUAL',
    channel: 'WHATSAPP',
    subject: '',
    body_text: ''
  });

  const [newMessage, setNewMessage] = useState({
    booking_id: '',
    template_id: '',
    channel: 'WHATSAPP',
    to_contact: '',
    body_text: ''
  });

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['messageTemplates', orgId],
    queryFn: () => orgId ? base44.entities.MessageTemplate.filter({ org_id: orgId }) : [],
    enabled: !!orgId
  });

  // Fetch message logs
  const { data: messageLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['messageLogs', orgId],
    queryFn: () => orgId ? base44.entities.MessageLog.filter({ org_id: orgId }, '-created_date') : [],
    enabled: !!orgId
  });

  // Fetch bookings for sending messages
  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', orgId],
    queryFn: () => orgId ? base44.entities.Booking.filter({ org_id: orgId }, '-created_date', 50) : [],
    enabled: !!orgId
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.MessageTemplate.create({
      ...data,
      org_id: orgId,
      property_id: selectedPropertyId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageTemplates'] });
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MessageTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageTemplates'] });
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.MessageTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageTemplates'] });
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.MessageLog.create({
      ...data,
      org_id: orgId,
      status: 'SENT',
      sent_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageLogs'] });
      setIsSendDialogOpen(false);
      resetMessageForm();
    }
  });

  const resetTemplateForm = () => {
    setNewTemplate({
      name: '',
      trigger: 'MANUAL',
      channel: 'WHATSAPP',
      subject: '',
      body_text: ''
    });
    setEditingTemplate(null);
  };

  const resetMessageForm = () => {
    setNewMessage({
      booking_id: '',
      template_id: '',
      channel: 'WHATSAPP',
      to_contact: '',
      body_text: ''
    });
    setSelectedBookingForMessage(null);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setNewTemplate({
      name: template.name,
      trigger: template.trigger,
      channel: template.channel,
      subject: template.subject || '',
      body_text: template.body_text
    });
    setIsTemplateDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data: newTemplate });
    } else {
      createTemplateMutation.mutate(newTemplate);
    }
  };

  const handleBookingSelect = (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    setSelectedBookingForMessage(booking);
    setNewMessage({
      ...newMessage,
      booking_id: bookingId,
      to_contact: booking?.phone || ''
    });
  };

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    setNewMessage({
      ...newMessage,
      template_id: templateId,
      channel: template?.channel || 'WHATSAPP',
      body_text: template?.body_text || ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1220]">הודעות</h1>
          <p className="text-gray-500">ניהול תבניות ושליחת הודעות לאורחים</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="templates" className="rounded-lg gap-2">
            <FileText className="h-4 w-4" />
            תבניות
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg gap-2">
            <MessageSquare className="h-4 w-4" />
            היסטוריה
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button 
              onClick={() => {
                resetTemplateForm();
                setIsTemplateDialogOpen(true);
              }}
              className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl gap-2"
            >
              <Plus className="h-4 w-4" />
              תבנית חדשה
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templatesLoading ? (
              [...Array(3)].map((_, i) => (
                <Card key={i} className="border-0 shadow-sm rounded-2xl animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))
            ) : templates.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                אין תבניות עדיין. צור תבנית ראשונה!
              </div>
            ) : (
              templates.map(template => (
                <Card key={template.id} className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-[#0B1220]">{template.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg">{channelIcons[template.channel]}</span>
                          <span className="text-sm text-gray-500">{channelLabels[template.channel]}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {triggerLabels[template.trigger]}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">{template.body_text}</p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-lg flex-1"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="h-3 w-3 ml-1" />
                        ערוך
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-lg text-red-600 hover:bg-red-50"
                        onClick={() => deleteTemplateMutation.mutate(template.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <h3 className="font-semibold text-[#0B1220] mb-2">💬 שליחת הודעות</h3>
            <p className="text-sm text-gray-600 mb-3">שלח הודעות לאורחים קיימים במערכת או צור תבניות הודעות אוטומטיות שישלחו בזמנים מוגדרים (לפני כניסה, אחרי יציאה וכו').</p>
          </div>
          <div className="flex justify-end gap-3 mb-4">
            <Button 
              variant="outline"
              onClick={() => {
                const contact = prompt('הזן מספר טלפון או אימייל:');
                if (!contact) return;
                setNewMessage({
                  booking_id: '',
                  template_id: '',
                  channel: contact.includes('@') ? 'EMAIL' : 'WHATSAPP',
                  to_contact: contact,
                  body_text: ''
                });
                setIsSendDialogOpen(true);
              }}
              className="rounded-xl gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              שלח לאיש קשר
            </Button>
            <Button 
              onClick={() => {
                resetMessageForm();
                setIsSendDialogOpen(true);
              }}
              className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl gap-2"
            >
              <Send className="h-4 w-4" />
              שלח להזמנה
            </Button>
          </div>

          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-right">נמען</TableHead>
                  <TableHead className="text-right">ערוץ</TableHead>
                  <TableHead className="text-right">תוכן</TableHead>
                  <TableHead className="text-right">סטטוס</TableHead>
                  <TableHead className="text-right">נשלח</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-24"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-16"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-48"></div></TableCell>
                      <TableCell><div className="h-6 bg-gray-200 rounded w-16"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-20"></div></TableCell>
                    </TableRow>
                  ))
                ) : messageLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                      אין הודעות עדיין
                    </TableCell>
                  </TableRow>
                ) : (
                  messageLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell dir="ltr" className="text-left">{log.to_contact}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          {channelIcons[log.channel]}
                          {channelLabels[log.channel]}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{log.body_text}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[log.status]}>
                          {log.status === 'SENT' && <CheckCircle2 className="h-3 w-3 ml-1" />}
                          {log.status === 'FAILED' && <XCircle className="h-3 w-3 ml-1" />}
                          {log.status === 'DRAFT' && <Clock className="h-3 w-3 ml-1" />}
                          {statusLabels[log.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {log.sent_at ? format(parseISO(log.sent_at), 'd/M HH:mm', { locale: he }) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'ערוך תבנית' : 'תבנית חדשה'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>שם התבנית</Label>
              <Input 
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                className="mt-1 rounded-xl"
                placeholder="לדוגמה: הודעת אישור הזמנה"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>טריגר</Label>
                <Select 
                  value={newTemplate.trigger} 
                  onValueChange={(value) => setNewTemplate({ ...newTemplate, trigger: value })}
                >
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(triggerLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ערוץ</Label>
                <Select 
                  value={newTemplate.channel} 
                  onValueChange={(value) => setNewTemplate({ ...newTemplate, channel: value })}
                >
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(channelLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {channelIcons[key]} {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {newTemplate.channel === 'EMAIL' && (
              <div>
                <Label>נושא</Label>
                <Input 
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  className="mt-1 rounded-xl"
                  placeholder="נושא האימייל"
                />
              </div>
            )}
            <div>
              <Label>תוכן ההודעה</Label>
              <Textarea 
                value={newTemplate.body_text}
                onChange={(e) => setNewTemplate({ ...newTemplate, body_text: e.target.value })}
                className="mt-1 rounded-xl"
                rows={5}
                placeholder="שלום {guest_name}, ההזמנה שלך אושרה..."
              />
              <p className="text-xs text-gray-500 mt-1">
                משתנים: {'{guest_name}'}, {'{checkin_date}'}, {'{checkout_date}'}, {'{property_name}'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)} className="rounded-xl">
              ביטול
            </Button>
            <Button 
              onClick={handleSaveTemplate}
              disabled={!newTemplate.name || !newTemplate.body_text || createTemplateMutation.isPending || updateTemplateMutation.isPending}
              className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl"
            >
              {(createTemplateMutation.isPending || updateTemplateMutation.isPending) ? 'שומר...' : 'שמור'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>שלח הודעה</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>הזמנה</Label>
              <Select 
                value={newMessage.booking_id} 
                onValueChange={handleBookingSelect}
              >
                <SelectTrigger className="mt-1 rounded-xl">
                  <SelectValue placeholder="בחר הזמנה" />
                </SelectTrigger>
                <SelectContent>
                  {bookings.map(booking => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {booking.guest_name} - {booking.checkin_date && format(parseISO(booking.checkin_date), 'd/M')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>תבנית (אופציונלי)</Label>
              <Select 
                value={newMessage.template_id} 
                onValueChange={handleTemplateSelect}
              >
                <SelectTrigger className="mt-1 rounded-xl">
                  <SelectValue placeholder="בחר תבנית" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>ללא תבנית</SelectItem>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>ערוץ</Label>
                <Select 
                  value={newMessage.channel} 
                  onValueChange={(value) => setNewMessage({ ...newMessage, channel: value })}
                >
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(channelLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {channelIcons[key]} {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>נמען</Label>
                <Input 
                  value={newMessage.to_contact}
                  onChange={(e) => setNewMessage({ ...newMessage, to_contact: e.target.value })}
                  className="mt-1 rounded-xl"
                  placeholder="050-000-0000"
                  dir="ltr"
                />
              </div>
            </div>
            <div>
              <Label>תוכן ההודעה</Label>
              <Textarea 
                value={newMessage.body_text}
                onChange={(e) => setNewMessage({ ...newMessage, body_text: e.target.value })}
                className="mt-1 rounded-xl"
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendDialogOpen(false)} className="rounded-xl">
              ביטול
            </Button>
            <Button 
              onClick={() => sendMessageMutation.mutate(newMessage)}
              disabled={!newMessage.booking_id || !newMessage.to_contact || !newMessage.body_text || sendMessageMutation.isPending}
              className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl gap-2"
            >
              <Send className="h-4 w-4" />
              {sendMessageMutation.isPending ? 'שולח...' : 'שלח'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}