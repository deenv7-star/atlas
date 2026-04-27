import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead, useProperties } from '@/data/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  Users, Plus, Search,
  Download,
} from 'lucide-react';
import { exportToCSV, LEAD_COLUMNS } from '@/lib/csvExport';
import { GuestsTable } from '@/components/tables/GuestsTable';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GuestForm } from '@/components/forms/GuestForm';
import { emptyGuestFormValues } from '@/components/forms/atlasFormSchemas';

const STATUS_OPTIONS = [
  { value: 'NEW',        label: 'חדש',          color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'CONTACTED',  label: 'נוצר קשר',     color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'OFFER_SENT', label: 'הצעה נשלחה',   color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'CONFIRMED',  label: 'מאושר',         color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'REJECTED',   label: 'נדחה',          color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'LOST',       label: 'לא רלוונטי',   color: 'bg-gray-100 text-gray-500 border-gray-200' },
];
const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s]));

function leadEntityToGuestFormValues(lead) {
  if (!lead) return { ...emptyGuestFormValues };
  return {
    ...emptyGuestFormValues,
    full_name: lead.full_name || lead.name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    property_id: lead.property_id || '',
    check_in_date: lead.check_in_date || '',
    check_out_date: lead.check_out_date || '',
    adults: lead.adults || 2,
    children: lead.children || 0,
    status: lead.status || 'NEW',
    source: lead.source || '',
    notes: lead.notes || '',
    budget: lead.budget != null && lead.budget !== '' ? String(lead.budget) : '',
  };
}

export default function LeadsPage({ user, selectedPropertyId }) {
  const { toast } = useToast();
  const filters = useMemo(() => (selectedPropertyId ? { property_id: selectedPropertyId } : {}), [selectedPropertyId]);

  const [searchTerm, setSearchTerm]   = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDialog, setShowDialog]   = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const guestDialogInterceptRef = useRef(null);

  useEffect(() => {
    if (!showDialog) guestDialogInterceptRef.current = null;
  }, [showDialog]);

  const { data: leads = [], isLoading, isError, error: leadsError } = useLeads(filters, '-created_at', 200);
  const { data: properties = [] }       = useProperties();
  const createMutation = useCreateLead();
  const updateMutation = useUpdateLead();
  const deleteMutation = useDeleteLead();

  const filtered = useMemo(() => leads.filter(l => {
    const matchSearch = !searchTerm ||
      (l.full_name || l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.phone || '').includes(searchTerm);
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  }), [leads, searchTerm, statusFilter]);

  const counts = useMemo(() => ({
    total:     leads.length,
    new:       leads.filter(l => l.status === 'NEW').length,
    contacted: leads.filter(l => l.status === 'CONTACTED').length,
    won:       leads.filter(l => l.status === 'CONFIRMED').length,
  }), [leads]);

  // ── CRUD ─────────────────────────────────────────────────────────────────────
  const closeGuestDialog = () => {
    setShowDialog(false);
    setEditingLead(null);
  };

  const openNew = () => {
    setEditingLead(null);
    setShowDialog(true);
  };
  const openEdit = lead => {
    setEditingLead(lead);
    setShowDialog(true);
  };

  const handleGuestSubmit = async (data) => {
    if (editingLead) {
      await updateMutation.mutateAsync({ id: editingLead.id, data });
      toast({ title: 'הליד עודכן' });
    } else {
      await createMutation.mutateAsync(data);
      toast({ title: 'ליד נוצר בהצלחה' });
    }
  };

  const handleDelete = id => {
    if (!confirm('למחוק ליד זה?')) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast({ title: 'הליד נמחק' }),
      onError: () => toast({ title: 'שגיאה במחיקת הליד', variant: 'destructive' }),
    });
  };

  const handleBulkSetStatus = async (rows, status) => {
    let done = 0;
    for (const row of rows) {
      await updateMutation.mutateAsync({ id: row.id, data: { status } }).catch(() => {});
      done++;
    }
    toast({ title: `עודכנו ${done} לידים ל-${STATUS_MAP[status]?.label || status}` });
  };

  const handleBulkDeleteRows = (rows) => {
    rows.forEach((row) => deleteMutation.mutate(row.id));
  };

  // ── CSV Export ───────────────────────────────────────────────────────────────
  const handleExport = () => {
    const data = filtered.map(l => ({
      ...l, property_name: properties.find(p => p.id === l.property_id)?.name || '',
    }));
    exportToCSV(data, 'leads', LEAD_COLUMNS);
    toast({ title: `יוצאו ${data.length} לידים ל-CSV` });
  };

  return (
    <div className="atlas-page-shell max-w-5xl space-y-5" dir="rtl">

      <div className="atlas-page-hero">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shadow-sm">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">ניהול לידים</h1>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">כל הפניות במקום אחד — מעקב סטטוס, פרטים מלאים, ודרך קצרה להפוך ליד להזמנה.</p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-sm flex-shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">לידים</h1>
            <p className="text-xs text-gray-400">{counts.total} לידים סה"כ</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2 min-h-[44px] h-11 text-sm rounded-xl border-gray-200 hidden sm:flex">
            <Download className="w-4 h-4" /> ייצוא CSV
          </Button>
          <Button onClick={openNew} className="gap-1.5 min-h-[44px] bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold h-11 text-sm rounded-xl shadow-sm px-5 touch-manipulation">
            <Plus className="w-4 h-4" /> ליד חדש
          </Button>
        </div>
      </div>

      {/* Stat pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'סה"כ',   value: counts.total,    bg: 'bg-gray-100',   text: 'text-gray-700' },
          { label: 'חדשים',  value: counts.new,       bg: 'bg-blue-50',    text: 'text-blue-700' },
          { label: 'בתהליך', value: counts.contacted, bg: 'bg-yellow-50',  text: 'text-yellow-700' },
          { label: 'נסגרו',  value: counts.won,       bg: 'bg-green-50',   text: 'text-green-700' },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${s.bg} border border-transparent`}>
            <span className={`text-sm font-bold ${s.text}`}>{s.value}</span>
            <span className="text-xs text-gray-500">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="חפש לפי שם, אימייל או טלפון..." className="h-9 pr-9 text-sm rounded-xl border-gray-200 bg-white" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[{ value: 'all', label: 'הכל' }, ...STATUS_OPTIONS.slice(0, 3)].map(s => (
            <button key={s.value} onClick={() => setStatusFilter(s.value)}
              className={`min-h-[44px] h-11 px-4 rounded-full text-xs font-medium transition-all border touch-manipulation ${statusFilter === s.value ? 'bg-[#0B1220] text-white border-[#0B1220]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Guests / leads table */}
      <div className="atlas-card-surface overflow-hidden">
        {isError ? (
          <div className="p-4 text-center text-sm text-red-600">שגיאה בטעינת הלידים</div>
        ) : filtered.length === 0 && !isLoading ? (
          <div className="text-center py-14 px-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/80 ring-1 ring-gray-100 flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-600 mb-1">
              {searchTerm || statusFilter !== 'all' ? 'לא נמצאו תוצאות' : 'עדיין אין לידים'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={openNew} size="sm" className="gap-1.5 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold rounded-xl min-h-[44px] mt-3 touch-manipulation">
                <Plus className="w-3.5 h-3.5" /> הוסף ליד ראשון
              </Button>
            )}
          </div>
        ) : (
          <ErrorBoundary section="guests-table" variant="inline" resetKey={`${selectedPropertyId ?? 'all'}|${statusFilter}|${searchTerm}`}>
            <GuestsTable
              leads={filtered}
              properties={properties}
              isLoading={isLoading}
              error={isError ? (leadsError instanceof Error ? leadsError : new Error('שגיאת טעינה')) : null}
              onEdit={openEdit}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDeleteRows}
              onBulkSetStatus={handleBulkSetStatus}
            />
          </ErrorBoundary>
        )}
      </div>

      {/* Dialog */}
      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          const h = guestDialogInterceptRef.current;
          if (h) {
            h(open);
            return;
          }
          setShowDialog(open);
        }}
      >
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{editingLead ? 'עריכת ליד' : 'ליד חדש'}</DialogTitle>
          </DialogHeader>
          <GuestForm
            key={editingLead?.id ?? 'new'}
            storageSuffix={editingLead?.id ?? 'new'}
            defaultValues={leadEntityToGuestFormValues(editingLead)}
            properties={properties.map((p) => ({ id: p.id, name: p.name }))}
            onSubmit={handleGuestSubmit}
            onCancel={closeGuestDialog}
            setDialogOpen={setShowDialog}
            onRegisterDialogInterceptor={(fn) => {
              guestDialogInterceptRef.current = fn;
            }}
            onAfterSubmitSuccess={() => {
              window.setTimeout(closeGuestDialog, 2000);
            }}
            submitLabel={editingLead ? 'שמור' : 'צור ליד'}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
