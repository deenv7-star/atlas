import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { askConfirm } from '@/components/common/confirmDialog';
import FinanceTabs from '@/components/app/FinanceTabs';
import { PageHeader, EmptyState, SkelRows, fmtMoney, fmtShort } from '@/components/ds';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Plus, Send, Eye, Pencil, Trash2,
  Search, Clock, CheckCircle2, XCircle, AlertCircle
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
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';

const statusConfig = {
  DRAFT: { label: 'טיוטה', color: 'bg-neutral-100 text-ink-600', icon: Clock },
  SENT: { label: 'נשלח', color: 'bg-brand-100 text-brand-700', icon: Send },
  PAID: { label: 'שולם', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  OVERDUE: { label: 'באיחור', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  CANCELLED: { label: 'בוטל', color: 'bg-neutral-100 text-ink-600', icon: XCircle }
};

const typeConfig = {
  // record-only (COPY-044): what the owner issued elsewhere. RECEIPT / TAX_INVOICE are legacy values, shown
  // only on old rows and never offered for new ones.
  INVOICE: 'מסמך מהתוכנה שלכם',
  RECEIPT: 'מסמך תשלום (מהתוכנה שלכם)',
  TAX_INVOICE: 'מסמך מס (מהתוכנה שלכם)',
  PROFORMA: 'חשבון עסקה'
};

function normalizeInvoiceForUi(row) {
  if (!row) return row;
  let items = row.items;
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }
  if (!Array.isArray(items)) items = [];
  return {
    ...row,
    type: row.type || 'INVOICE',
    items,
    customer_name: row.customer_name || row.guest_name,
    customer_email: row.customer_email || row.guest_email,
    customer_phone: row.customer_phone,
    customer_address: row.customer_address,
    customer_tax_id: row.customer_tax_id
  };
}

function invoiceToPayload(formData, orgId) {
  return {
    org_id: orgId,
    booking_id: formData.booking_id || null,
    invoice_number: formData.invoice_number,
    type: formData.type,
    guest_name: formData.guest_name,
    guest_email: formData.guest_email,
    customer_name: formData.customer_name || formData.guest_name,
    customer_email: formData.customer_email || formData.guest_email,
    customer_phone: formData.customer_phone || '',
    customer_address: formData.customer_address || '',
    customer_tax_id: formData.customer_tax_id || '',
    issue_date: formData.issue_date,
    due_date: formData.due_date,
    amount: formData.subtotal,
    subtotal: formData.subtotal,
    tax_rate: formData.tax_rate,
    tax_amount: formData.tax_amount,
    total_amount: formData.total_amount,
    currency: formData.currency || 'ILS',
    status: formData.status,
    items: formData.items,
    notes: formData.notes || ''
  };
}

export default function InvoicesPage({ orgId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);

  const queryClient = useQueryClient();

  const { data: rawInvoices = [], isLoading } = useQuery({
    queryKey: ['invoices', orgId],
    queryFn: async () => {
      const rows = await base44.entities.Invoice.filter({ org_id: orgId }, '-created_at', 500);
      return (rows || []).map(normalizeInvoiceForUi);
    },
    enabled: !!orgId
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', orgId],
    queryFn: () => base44.entities.Booking.filter({ org_id: orgId }, '-created_at', 300),
    enabled: !!orgId
  });

  // audit 05.11 UX-3: 'מסמך תשלום' on a booking lands here with ?booking=<id> and opens the form for that booking
  const [searchParams, setSearchParams] = useSearchParams();
  const bookingParam = searchParams.get('booking');
  const [prefillBookingId, setPrefillBookingId] = useState(null);
  const prefillDone = useRef(false);
  useEffect(() => {
    if (!bookingParam || prefillDone.current || !bookings.some((b) => b.id === bookingParam)) return;
    prefillDone.current = true;
    setEditingInvoice(null);
    setPrefillBookingId(bookingParam);
    setShowCreateDialog(true);
    const next = new URLSearchParams(searchParams); next.delete('booking');
    setSearchParams(next, { replace: true });
  }, [bookingParam, bookings, searchParams, setSearchParams]);

  const createMutation = useMutation({
    mutationFn: async (payload) => base44.entities.Invoice.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowCreateDialog(false); setPrefillBookingId(null);
      setEditingInvoice(null);
      atlasToastApi.success('המסמך נרשם');
    },
    onError: () => atlasToastApi.error('לא הצלחנו לשמור את המסמך. נסו שוב.')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data: payload }) => base44.entities.Invoice.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowCreateDialog(false); setPrefillBookingId(null);
      setEditingInvoice(null);
      atlasToastApi.success('המסמך עודכן');
    },
    onError: () => atlasToastApi.error('לא הצלחנו לעדכן את המסמך. נסו שוב.')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Invoice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      atlasToastApi.success('הרישום נמחק');
    },
    onError: () => atlasToastApi.error('לא הצלחנו למחוק את הרישום. נסו שוב.')
  });

  // COPY-044 (01.11.2026): no "send to guest" mail. This screen only records documents the owner issued in
  // their own bookkeeping software; atlas never sends a document that looks like a tax invoice or receipt.

  const handleSave = (data) => {
    const payload = invoiceToPayload(data, orgId);
    if (editingInvoice) {
      updateMutation.mutate({ id: editingInvoice.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(normalizeInvoiceForUi(invoice));
    setShowCreateDialog(true);
  };

  const handlePreview = (invoice) => {
    setPreviewInvoice(normalizeInvoiceForUi(invoice));
    setShowPreviewDialog(true);
  };

  const filteredInvoices = rawInvoices.filter((inv) => {
    const matchesSearch = inv.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || inv.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-8 px-5 pb-16 pt-6 md:px-10 md:pt-10" dir="rtl">
      <FinanceTabs className="!mb-0" />
      <PageHeader
        title="מסמכי תשלום"
        subtitle="את המסמך מפיקים בתוכנה שלכם (למשל חשבונית ירוקה). כאן רושמים את המספר שלו, כדי שהדוח לרואה החשבון יהיה שלם."
        className="!mb-0"
        actions={
          <Button onClick={() => { setEditingInvoice(null); setShowCreateDialog(true); }}>
            <Plus className="h-[18px] w-[18px]" strokeWidth={1.75} />
            רישום מסמך
          </Button>
        }
      />

      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <Input
              aria-label="חיפוש מסמך"
              placeholder="חיפוש לפי שם או מספר..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-full pr-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger aria-label="סינון לפי מצב">
              <SelectValue placeholder="מצב" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">כל המצבים</SelectItem>
              {Object.entries(statusConfig).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger aria-label="סינון לפי סוג מסמך">
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

        {isLoading ? (
          <div className="mt-5"><SkelRows rows={4} avatar={false} /></div>
        ) : filteredInvoices.length === 0 ? (
          <EmptyState
            compact
            icon={FileText}
            title={rawInvoices.length === 0 ? 'עוד לא נרשמו מסמכים' : 'אין מסמכים שמתאימים'}
            description={rawInvoices.length === 0 ? 'הפקתם מסמך על תשלום? רשמו כאן את המספר שלו, והוא יופיע ליד התשלום ובדוח החודשי.' : 'נסו חיפוש או סינון אחר.'}
            action={rawInvoices.length === 0 ? (
              <Button onClick={() => { setEditingInvoice(null); setShowCreateDialog(true); }}>
                <Plus className="h-[18px] w-[18px]" strokeWidth={1.75} />
                רישום מסמך
              </Button>
            ) : null}
          />
        ) : (
        <>
        <ul className="mt-4 divide-y divide-line md:hidden">
          {filteredInvoices.map((invoice) => (
            <li key={invoice.id}>
              <button type="button" onClick={() => handlePreview(invoice)} className="flex min-h-[64px] w-full items-center justify-between gap-3 py-3 text-right">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold text-navy-900">{invoice.guest_name || 'לקוח'}</p>
                  <p className="truncate text-[13px] text-ink-400">{typeConfig[invoice.type] || 'מסמך'} · {invoice.invoice_number}{invoice.issue_date ? ` · ${fmtShort(invoice.issue_date)}` : ''}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="tabular text-[15px] font-bold text-navy-900">{fmtMoney(invoice.total_amount || 0)}</span>
                  <span className={cn('inline-flex h-6 items-center rounded-full px-2.5 text-[13px] font-medium', statusConfig[invoice.status]?.color)}>{statusConfig[invoice.status]?.label}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>מספר</TableHead>
                <TableHead>סוג</TableHead>
                <TableHead>לקוח</TableHead>
                <TableHead>תאריך</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead>מצב</TableHead>
                <TableHead className="text-left">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(
                filteredInvoices.map((invoice) => {
                  const StatusIcon = statusConfig[invoice.status]?.icon || Clock;
                  const issueDate = invoice.issue_date
                    ? format(new Date(invoice.issue_date), 'dd/MM/yyyy')
                    : '—';
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">{invoice.invoice_number}</TableCell>
                      <TableCell>{typeConfig[invoice.type] || 'מסמך'}</TableCell>
                      <TableCell>{invoice.guest_name}</TableCell>
                      <TableCell>{issueDate}</TableCell>
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
                            size="icon"
                            variant="ghost"
                            aria-label="תצוגה מקדימה"
                            onClick={() => handlePreview(invoice)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="עריכה"
                            onClick={() => handleEdit(invoice)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="מחיקה"
                            onClick={() => {
                              askConfirm({ title: 'למחוק את הרישום?', description: 'רק הרישום כאן יימחק. המסמך בתוכנת החשבונות שלכם נשאר.' })
                                .then((ok) => { if (ok) deleteMutation.mutate(invoice.id); });
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
        </>
        )}
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={(o) => { setShowCreateDialog(o); if (!o) setPrefillBookingId(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInvoice ? 'עריכת רישום' : 'רישום מסמך'}
            </DialogTitle>
          </DialogHeader>
          <InvoiceForm
            invoice={editingInvoice}
            initialBookingId={editingInvoice ? null : prefillBookingId}
            bookings={bookings}
            orgId={orgId}
            onSave={handleSave}
            onCancel={() => {
              setShowCreateDialog(false); setPrefillBookingId(null);
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
