import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  FileText, Plus, Download, Send, Eye, Pencil, Trash2,
  Search, Filter, CheckCircle2, Clock, XCircle, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import InvoicePreview from '@/components/invoices/InvoicePreview';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusConfig = {
  DRAFT: { label: 'טיוטה', color: 'bg-gray-100 text-gray-700', icon: Clock },
  SENT: { label: 'נשלח', color: 'bg-blue-100 text-blue-700', icon: Send },
  PAID: { label: 'שולם', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  OVERDUE: { label: 'באיחור', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  CANCELLED: { label: 'בוטל', color: 'bg-gray-100 text-gray-700', icon: XCircle }
};

const typeConfig = {
  INVOICE: 'חשבונית',
  RECEIPT: 'קבלה',
  TAX_INVOICE: 'חשבונית מס',
  PROFORMA: 'חשבונית עסקה'
};

export default function InvoicesPage({ orgId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);

  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', orgId],
    queryFn: () => base44.entities.Invoice.filter({ org_id: orgId }, '-created_date'),
    enabled: !!orgId,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', orgId],
    queryFn: () => base44.entities.Booking.filter({ org_id: orgId }),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      setShowCreateDialog(false);
      setEditingInvoice(null);
      toast.success('החשבונית נשמרה בהצלחה');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      setShowCreateDialog(false);
      setEditingInvoice(null);
      toast.success('החשבונית עודכנה בהצלחה');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Invoice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      toast.success('החשבונית נמחקה');
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (invoice) => {
      await base44.integrations.Core.SendEmail({
        to: invoice.guest_email,
        subject: `חשבונית ${invoice.invoice_number} - ${invoice.guest_name}`,
        body: `שלום ${invoice.guest_name},\n\nמצורפת חשבונית מספר ${invoice.invoice_number} על סך ${invoice.total_amount} ${invoice.currency}.\n\nתודה רבה!`
      });
      return base44.entities.Invoice.update(invoice.id, { status: 'SENT' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      toast.success('החשבונית נשלחה בהצלחה');
    },
  });

  const handleSave = (data) => {
    if (editingInvoice) {
      updateMutation.mutate({ id: editingInvoice.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setShowCreateDialog(true);
  };

  const handlePreview = (invoice) => {
    setPreviewInvoice(invoice);
    setShowPreviewDialog(true);
  };

  const handleSendEmail = (invoice) => {
    if (!invoice.guest_email) {
      toast.error('אין כתובת אימייל ללקוח');
      return;
    }
    sendEmailMutation.mutate(invoice);
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || inv.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1220]">חשבוניות וקבלות</h1>
          <p className="text-sm text-gray-500 mt-1">צור והנפק חשבוניות וקבלות למע"מ. ניתן להתממשק למערכות חשבונאות כמו Priority, Monday ו-QuickBooks דרך עמוד האינטגרציות.</p>
        </div>
        <Button
          onClick={() => {
            setEditingInvoice(null);
            setShowCreateDialog(true);
          }}
          className="bg-[#00D1C1] hover:bg-[#00D1C1]/90 text-white w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 ml-2" />
          חשבונית חדשה
        </Button>
      </motion.div>

      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="חיפוש לפי שם או מספר..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">כל הסטטוסים</SelectItem>
              {Object.entries(statusConfig).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="סוג מסמך" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">כל הסוגים</SelectItem>
              {Object.entries(typeConfig).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>מספר</TableHead>
                <TableHead>סוג</TableHead>
                <TableHead>לקוח</TableHead>
                <TableHead>תאריך</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead className="text-left">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-gray-400">טוען...</div>
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-gray-400">אין חשבוניות</div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => {
                  const StatusIcon = statusConfig[invoice.status]?.icon || Clock;
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">{invoice.invoice_number}</TableCell>
                      <TableCell>{typeConfig[invoice.type]}</TableCell>
                      <TableCell>{invoice.guest_name}</TableCell>
                      <TableCell>{format(new Date(invoice.issue_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-semibold">₪{invoice.total_amount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={statusConfig[invoice.status]?.color}>
                          <StatusIcon className="w-3 h-3 ml-1" />
                          {statusConfig[invoice.status]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePreview(invoice)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(invoice)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSendEmail(invoice)}
                            disabled={!invoice.guest_email}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm('למחוק את החשבונית?')) {
                                deleteMutation.mutate(invoice.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInvoice ? 'עריכת חשבונית' : 'חשבונית חדשה'}
            </DialogTitle>
          </DialogHeader>
          <InvoiceForm
            invoice={editingInvoice}
            bookings={bookings}
            orgId={orgId}
            onSave={handleSave}
            onCancel={() => {
              setShowCreateDialog(false);
              setEditingInvoice(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>תצוגה מקדימה</DialogTitle>
          </DialogHeader>
          {previewInvoice && <InvoicePreview invoice={previewInvoice} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}