import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
  Eye,
  Upload
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import ReactQuill from 'react-quill';

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
  SENT: 'bg-blue-100 text-blue-700 border-blue-200',
  SIGNED: 'bg-green-100 text-green-700 border-green-200'
};

const statusLabels = {
  DRAFT: 'טיוטה',
  SENT: 'נשלח',
  SIGNED: 'נחתם'
};

export default function Contracts({ user, selectedPropertyId, orgId }) {
  const [activeTab, setActiveTab] = useState('contracts');
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const queryClient = useQueryClient();

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: ''
  });

  const [newContract, setNewContract] = useState({
    booking_id: '',
    template_id: ''
  });

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['contractTemplates', orgId],
    queryFn: () => orgId ? base44.entities.ContractTemplate.filter({ org_id: orgId }) : [],
    enabled: !!orgId
  });

  // Fetch contract instances
  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ['contractInstances', orgId],
    queryFn: () => orgId ? base44.entities.ContractInstance.filter({ org_id: orgId }, '-created_date') : [],
    enabled: !!orgId
  });

  // Fetch bookings
  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', orgId],
    queryFn: () => orgId ? base44.entities.Booking.filter({ org_id: orgId }, '-created_date', 50) : [],
    enabled: !!orgId
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.ContractTemplate.create({
      ...data,
      org_id: orgId,
      property_id: selectedPropertyId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractTemplates'] });
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContractTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractTemplates'] });
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.ContractTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractTemplates'] });
    }
  });

  // Create contract instance mutation
  const createContractMutation = useMutation({
    mutationFn: async (data) => {
      const template = templates.find(t => t.id === data.template_id);
      const booking = bookings.find(b => b.id === data.booking_id);
      
      // Replace placeholders in template
      let body = template?.content || '';
      if (booking) {
        body = body
          .replace(/\{guest_name\}/g, booking.guest_name || '')
          .replace(/\{checkin_date\}/g, booking.check_in_date ? format(parseISO(booking.check_in_date), 'd/M/yyyy') : '')
          .replace(/\{checkout_date\}/g, booking.check_out_date ? format(parseISO(booking.check_out_date), 'd/M/yyyy') : '')
          .replace(/\{total_amount\}/g, booking.total_price?.toLocaleString() || '')
          .replace(/\{guests_count\}/g, booking.adults?.toString() || '');
      }
      
      return base44.entities.ContractInstance.create({
        org_id: orgId,
        booking_id: data.booking_id,
        template_id: data.template_id,
        status: 'DRAFT',
        content: body
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractInstances'] });
      setIsSendDialogOpen(false);
      setNewContract({ booking_id: '', template_id: '' });
    }
  });

  // Update contract status mutation
  const updateContractMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContractInstance.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractInstances'] });
    }
  });

  const resetTemplateForm = () => {
    setNewTemplate({ name: '', content: '' });
    setEditingTemplate(null);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setNewTemplate({
      name: template.name,
      content: template.content
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

  const getBooking = (bookingId) => bookings.find(b => b.id === bookingId);

  const defaultContractContent = `
<h2 style="text-align: center;">חוזה שכירות לטווח קצר</h2>
<p><strong>בין:</strong> בעל הנכס (להלן: "המשכיר")</p>
<p><strong>לבין:</strong> {guest_name} (להלן: "השוכר")</p>
<hr />
<h3>פרטי השכירות:</h3>
<ul>
  <li>תאריך כניסה: {checkin_date}</li>
  <li>תאריך יציאה: {checkout_date}</li>
  <li>מספר אורחים: {guests_count}</li>
  <li>סכום כולל: ₪{total_amount}</li>
</ul>
<h3>תנאים כלליים:</h3>
<ol>
  <li>השוכר מתחייב לשמור על הנכס בצורה נאותה.</li>
  <li>אסור לעשן בנכס.</li>
  <li>שעת צ'ק-אין: 15:00, שעת צ'ק-אאוט: 11:00</li>
</ol>
<p style="margin-top: 40px;">חתימת השוכר: _________________</p>
<p>תאריך: _________________</p>
`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1220]">חוזים</h1>
          <p className="text-gray-500">צור תבניות חוזה מותאמות אישית, ייבא חוזים קיימים, ושלח לאורחים לחתימה דיגיטלית. אפשר להוסיף משתנים דינמיים שמתמלאים אוטומטית.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="contracts" className="rounded-lg gap-2">
            <FileText className="h-4 w-4" />
            חוזים
          </TabsTrigger>
          <TabsTrigger value="templates" className="rounded-lg gap-2">
            <Edit className="h-4 w-4" />
            תבניות
          </TabsTrigger>
        </TabsList>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button 
              onClick={() => setIsSendDialogOpen(true)}
              className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl gap-2"
            >
              <Plus className="h-4 w-4" />
              צור חוזה
            </Button>
          </div>

          {/* Desktop: Contracts Table */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-right">הזמנה</TableHead>
                  <TableHead className="text-right">תבנית</TableHead>
                  <TableHead className="text-right">סטטוס</TableHead>
                  <TableHead className="text-right">נוצר</TableHead>
                  <TableHead className="w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contractsLoading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-24"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-32"></div></TableCell>
                      <TableCell><div className="h-6 bg-gray-200 rounded w-16"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-20"></div></TableCell>
                      <TableCell><div className="h-8 bg-gray-200 rounded w-24"></div></TableCell>
                    </TableRow>
                  ))
                ) : contracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                      אין חוזים עדיין
                    </TableCell>
                  </TableRow>
                ) : (
                  contracts.map(contract => {
                    const booking = getBooking(contract.booking_id);
                    const template = templates.find(t => t.id === contract.template_id);
                    return (
                      <TableRow key={contract.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{booking?.guest_name || '-'}</p>
                            {booking?.checkin_date && (
                              <p className="text-xs text-gray-500">
                                {format(parseISO(booking.check_in_date), 'd/M/yy')}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{template?.name || '-'}</TableCell>
                        <TableCell>
                          <Badge className={`${statusColors[contract.status]} border flex items-center gap-1 w-fit`}>
                            {contract.status === 'SIGNED' && <CheckCircle2 className="h-3 w-3" />}
                            {contract.status === 'SENT' && <Send className="h-3 w-3" />}
                            {contract.status === 'DRAFT' && <Clock className="h-3 w-3" />}
                            {statusLabels[contract.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {format(parseISO(contract.created_date), 'd/M/yy', { locale: he })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="rounded-lg"
                              onClick={() => {
                                setSelectedContract(contract);
                                setIsPreviewOpen(true);
                              }}
                            >
                              <Eye className="h-3 w-3 ml-1" />
                              צפה
                            </Button>
                            {contract.status === 'DRAFT' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="rounded-lg"
                                onClick={() => updateContractMutation.mutate({ id: contract.id, data: { status: 'SENT' } })}
                              >
                                <Send className="h-3 w-3 ml-1" />
                                שלח
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

                {/* Mobile: Contracts Cards */}
                <div className="md:hidden space-y-3">
                {contractsLoading ? (
                [...Array(3)].map((_, i) => (
                  <Card key={i} className="border-0 shadow-sm rounded-2xl">
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24 mb-3" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </CardContent>
                  </Card>
                ))
                ) : contracts.length === 0 ? (
                <Card className="border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-8 text-center text-gray-500">
                    אין חוזים עדיין
                  </CardContent>
                </Card>
                ) : (
                contracts.map(contract => {
                  const booking = getBooking(contract.booking_id);
                  const template = templates.find(t => t.id === contract.template_id);
                  return (
                    <Card key={contract.id} className="border-0 shadow-sm rounded-2xl">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-[#0B1220] mb-0.5">{booking?.guest_name || '-'}</h3>
                            {booking?.checkin_date && (
                              <p className="text-xs text-gray-500">
                                {format(parseISO(booking.check_in_date), 'd/M/yy')}
                              </p>
                            )}
                          </div>
                          <Badge className={`${statusColors[contract.status]} border flex items-center gap-1`}>
                            {contract.status === 'SIGNED' && <CheckCircle2 className="h-3 w-3" />}
                            {contract.status === 'SENT' && <Send className="h-3 w-3" />}
                            {contract.status === 'DRAFT' && <Clock className="h-3 w-3" />}
                            {statusLabels[contract.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{template?.name || '-'}</p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 rounded-xl"
                            onClick={() => {
                              setSelectedContract(contract);
                              setIsPreviewOpen(true);
                            }}
                          >
                            <Eye className="h-3 w-3 ml-1" />
                            צפה
                          </Button>
                          {contract.status === 'DRAFT' && (
                            <Button 
                              size="sm" 
                              className="flex-1 bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl"
                              onClick={() => updateContractMutation.mutate({ id: contract.id, data: { status: 'SENT' } })}
                            >
                              <Send className="h-3 w-3 ml-1" />
                              שלח
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
                )}
                </div>
                </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <div className="flex justify-end gap-3 mb-4">
            <input
              type="file"
              id="import-contract"
              accept=".docx,.pdf,.txt"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                try {
                  const { file_url } = await base44.integrations.Core.UploadFile({ file });
                  const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
                    file_url,
                    json_schema: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        content: { type: "string" }
                      }
                    }
                  });
                  
                  if (extracted.status === 'success' && extracted.output) {
                    setNewTemplate({
                      name: extracted.output.name || file.name,
                      content: extracted.output.content || ''
                    });
                    setIsTemplateDialogOpen(true);
                  }
                } catch (error) {
                  alert('שגיאה בייבוא הקובץ');
                }
              }}
            />
            <Button 
              variant="outline"
              onClick={() => document.getElementById('import-contract').click()}
              className="rounded-xl gap-2"
            >
              <Upload className="h-4 w-4" />
              ייבא מקובץ
            </Button>
            <Button 
              onClick={() => {
                resetTemplateForm();
                setNewTemplate({ ...newTemplate, content: defaultContractContent });
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
                אין תבניות חוזה עדיין. צור תבנית ראשונה!
              </div>
            ) : (
              templates.map(template => (
                <Card key={template.id} className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-[#00D1C1]" />
                        <h3 className="font-semibold text-[#0B1220]">{template.name}</h3>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
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
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'ערוך תבנית' : 'תבנית חוזה חדשה'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>שם התבנית</Label>
              <Input 
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                className="mt-1 rounded-xl"
                placeholder="לדוגמה: חוזה שכירות סטנדרטי"
              />
            </div>
            <div>
              <Label>תוכן החוזה</Label>
              <p className="text-xs text-gray-500 mb-2">
                משתנים: {'{guest_name}'}, {'{checkin_date}'}, {'{checkout_date}'}, {'{total_amount}'}, {'{guests_count}'}
              </p>
              <ReactQuill 
                value={newTemplate.content}
                onChange={(value) => setNewTemplate({ ...newTemplate, content: value })}
                className="mt-1 rounded-xl"
                style={{ direction: 'rtl' }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)} className="rounded-xl">
              ביטול
            </Button>
            <Button 
              onClick={handleSaveTemplate}
              disabled={!newTemplate.name || !newTemplate.content || createTemplateMutation.isPending || updateTemplateMutation.isPending}
              className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl"
            >
              {(createTemplateMutation.isPending || updateTemplateMutation.isPending) ? 'שומר...' : 'שמור'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Contract Dialog */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>צור חוזה</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>הזמנה</Label>
              <Select 
                value={newContract.booking_id} 
                onValueChange={(value) => setNewContract({ ...newContract, booking_id: value })}
              >
                <SelectTrigger className="mt-1 rounded-xl">
                  <SelectValue placeholder="בחר הזמנה" />
                </SelectTrigger>
                <SelectContent>
                  {bookings.map(booking => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {booking.guest_name} - {booking.check_in_date && format(parseISO(booking.check_in_date), 'd/M')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>תבנית חוזה</Label>
              <Select 
                value={newContract.template_id} 
                onValueChange={(value) => setNewContract({ ...newContract, template_id: value })}
              >
                <SelectTrigger className="mt-1 rounded-xl">
                  <SelectValue placeholder="בחר תבנית" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendDialogOpen(false)} className="rounded-xl">
              ביטול
            </Button>
            <Button 
              onClick={() => createContractMutation.mutate(newContract)}
              disabled={!newContract.booking_id || !newContract.template_id || createContractMutation.isPending}
              className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl"
            >
              {createContractMutation.isPending ? 'יוצר...' : 'צור חוזה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>תצוגה מקדימה</DialogTitle>
          </DialogHeader>
          
          {selectedContract && (
            <div 
              className="prose prose-sm max-w-none p-4 bg-white border rounded-xl" 
              dir="rtl"
              dangerouslySetInnerHTML={{ __html: selectedContract.content }}
            />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)} className="rounded-xl">
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}