import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead, useProperties } from '@/data/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  Users, Plus, Search, Edit, Trash2,
  Phone, Mail, CalendarDays, Building2,
  Download, CheckSquare, Square, X, ChevronDown,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { exportToCSV, LEAD_COLUMNS } from '@/lib/csvExport';
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

const AVATAR_COLORS = [
  'from-blue-400 to-blue-600', 'from-purple-400 to-purple-600',
  'from-teal-400 to-teal-600', 'from-amber-400 to-amber-600', 'from-rose-400 to-rose-600',
];

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

  // ── Bulk selection ──────────────────────────────────────────────────────────
  const [selected, setSelected]       = useState(new Set());
  const [showBulkMenu, setShowBulkMenu] = useState(false);

  const { data: leads = [], isLoading } = useLeads(filters, '-created_at', 200);
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

  // ── Bulk ─────────────────────────────────────────────────────────────────────
  const allFilteredIds = filtered.map(l => l.id);
  const allSelected    = allFilteredIds.length > 0 && allFilteredIds.every(id => selected.has(id));
  const someSelected   = selected.size > 0;

  const toggleSelect = id => setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const toggleAll    = () => {
    if (allSelected) setSelected(prev => { const next = new Set(prev); allFilteredIds.forEach(id => next.delete(id)); return next; });
    else setSelected(prev => new Set([...prev, ...allFilteredIds]));
  };
  const clearSelection = () => setSelected(new Set());

  const handleBulkStatusChange = async status => {
    const ids = [...selected];
    let done = 0;
    for (const id of ids) { await updateMutation.mutateAsync({ id, data: { status } }).catch(() => {}); done++; }
    toast({ title: `עודכנו ${done} לידים ל-${STATUS_MAP[status]?.label || status}` });
    clearSelection(); setShowBulkMenu(false);
  };

  const handleBulkDelete = () => {
    if (!confirm(`למחוק ${selected.size} לידים?`)) return;
    [...selected].forEach(id => deleteMutation.mutate(id));
    clearSelection();
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

      {/* Bulk Action Bar */}
      {someSelected && (
        <div className="flex items-center gap-3 px-4 py-3 bg-purple-50 border border-purple-200 rounded-2xl">
          <button onClick={clearSelection} className="w-7 h-7 rounded-lg flex items-center justify-center text-purple-400 hover:text-purple-600 hover:bg-purple-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-purple-700">{selected.size} נבחרו</span>
          <div className="mr-auto flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowBulkMenu(v => !v)}
                className="flex items-center gap-1.5 min-h-[36px] px-3 rounded-xl text-xs font-semibold bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors">
                שנה סטטוס <ChevronDown className="w-3 h-3" />
              </button>
              {showBulkMenu && (
                <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[150px]">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s.value} onClick={() => handleBulkStatusChange(s.value)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-right hover:bg-gray-50 transition-colors border-r-2 ${s.color.split(' ')[0].replace('bg-', 'border-')}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleBulkDelete}
              className="flex items-center gap-1.5 min-h-[36px] px-3 rounded-xl text-xs font-semibold bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> מחק
            </button>
            <button onClick={() => {
              const data = filtered.filter(l => selected.has(l.id)).map(l => ({ ...l, property_name: properties.find(p => p.id === l.property_id)?.name || '' }));
              exportToCSV(data, 'leads_selected', LEAD_COLUMNS);
              toast({ title: `יוצאו ${data.length} לידים` });
            }} className="flex items-center gap-1.5 min-h-[36px] px-3 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              <Download className="w-3.5 h-3.5" /> ייצוא
            </button>
          </div>
        </div>
      )}

      {/* Leads list */}
      <div className="atlas-card-surface overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="atlas-list-skeleton" />)}</div>
        ) : filtered.length === 0 ? (
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
          <>
            {/* Select all header */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-50 bg-gray-50/50">
              <button onClick={toggleAll} className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors touch-manipulation min-h-[36px]">
                {allSelected ? <CheckSquare className="w-4 h-4 text-purple-500" /> : <Square className="w-4 h-4" />}
                {allSelected ? 'בטל הכל' : `בחר הכל (${filtered.length})`}
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {filtered.map((lead, idx) => {
                const statusInfo    = STATUS_MAP[lead.status] || STATUS_MAP.NEW;
                const property      = properties.find(p => p.id === lead.property_id);
                const avatarGradient = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                const displayName   = lead.full_name || lead.name || 'ליד';
                const isChecked     = selected.has(lead.id);
                return (
                  <div key={lead.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors group ${isChecked ? 'bg-purple-50/40' : ''}`}>
                    {/* Checkbox */}
                    <button onClick={() => toggleSelect(lead.id)}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-purple-400 hover:bg-purple-50 transition-colors touch-manipulation">
                      {isChecked ? <CheckSquare className="w-4 h-4 text-purple-500" /> : <Square className="w-4 h-4" />}
                    </button>

                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center flex-shrink-0 text-sm font-bold text-white shadow-sm`}>
                      {displayName[0]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800">{displayName}</p>
                        <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        {lead.phone && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Phone className="w-3 h-3" /><span dir="ltr">{lead.phone}</span>
                          </span>
                        )}
                        {lead.email && (
                          <span className="flex items-center gap-1 text-xs text-gray-400 truncate max-w-[160px]">
                            <Mail className="w-3 h-3 flex-shrink-0" />{lead.email}
                          </span>
                        )}
                        {lead.check_in_date && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <CalendarDays className="w-3 h-3" />{format(parseISO(lead.check_in_date), 'dd/MM/yy')}
                          </span>
                        )}
                        {property && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Building2 className="w-3 h-3" />{property.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => openEdit(lead)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(lead.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
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
