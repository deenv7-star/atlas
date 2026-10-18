import { createPageUrl } from '@/utils';
import { GuestAvatar, Rise } from '@/components/app/atoms';
import { Page, PageHeader, SegmentedControl, EmptyState as DsEmptyState, StatusPill, SkelRows, fmtShort } from '@/components/ds';
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { readCommandPaletteFlag } from '@/lib/commandPaletteNavigationState';
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead, useProperties } from '@/data/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/AtlasToast';
import { Users, Plus, Search } from 'lucide-react';
import { exportToCSV, LEAD_COLUMNS } from '@/lib/csvExport';
import { GuestsTable } from '@/components/tables/GuestsTable';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GuestForm } from '@/components/forms/GuestForm';
import { emptyGuestFormValues } from '@/components/forms/atlasFormSchemas';
import { leadFormToPayload } from '@/lib/entityPayloads';
import { useGuestsUrlState } from '@/hooks/url-state/useGuestsUrlState';
import { sortGuestLeads } from '@/hooks/url-state/leadTableSort';
import { heCount } from '@/lib/hebrewCount';

const STATUS_OPTIONS = [
  { value: 'NEW',        label: 'חדש',          color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'CONTACTED',  label: 'בטיפול',     color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'OFFER_SENT', label: 'הצעה נשלחה',   color: 'bg-brand-100 text-brand-700 border-brand-200' },
  { value: 'CONFIRMED',  label: 'נסגר',         color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'REJECTED',   label: 'לא רלוונטי',          color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'LOST',       label: 'לא רלוונטי',   color: 'bg-gray-100 text-gray-500 border-gray-200' },
];
const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s]));

const STATUS_VALUE_SET = new Set(STATUS_OPTIONS.map((s) => s.value));

function leadMatchesTags(tags, l) {
  if (!tags.length) return true;
  return tags.some((tag) => {
    if (STATUS_VALUE_SET.has(tag)) return (l.status || '') === tag;
    const q = tag.toLowerCase();
    return (
      (l.full_name || l.name || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.phone || '').includes(tag)
    );
  });
}

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

export default function LeadsPage({ user: _user, selectedPropertyId }) {
  const { success, error: toastError } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const filters = useMemo(() => (selectedPropertyId ? { property_id: selectedPropertyId } : {}), [selectedPropertyId]);

  const url = useGuestsUrlState();
  const {
    search: searchTerm,
    page,
    pageSize,
    sorting,
    setSorting,
    tags,
    openGuestId,
    setUrlState,
    setOpenGuestId,
  } = url;

  const [showDialog, setShowDialog] = useState(false);
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

  const filtered = useMemo(() => leads.filter((l) => {
    const matchSearch = !searchTerm ||
      (l.full_name || l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.phone || '').includes(searchTerm);
    return matchSearch && leadMatchesTags(tags, l);
  }), [leads, searchTerm, tags]);

  const sorted = useMemo(() => sortGuestLeads(filtered, sorting), [filtered, sorting]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize) || 1);

  useEffect(() => {
    if (page > totalPages) void setUrlState({ page: totalPages });
  }, [page, totalPages, setUrlState]);

  useEffect(() => {
    if (!openGuestId || !leads.length) return;
    const row = leads.find((x) => x.id === openGuestId);
    if (row) {
      setEditingLead(row);
      setShowDialog(true);
    }
  }, [openGuestId, leads]);

  useEffect(() => {
    if (!readCommandPaletteFlag(location.state, 'newGuest')) return;
    setEditingLead(null);
    setShowDialog(true);
    setOpenGuestId(null);
    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      { replace: true, state: null },
    );
  }, [location.state, location.pathname, location.search, location.hash, navigate, setOpenGuestId]);

  const counts = useMemo(() => ({
    total:     leads.length,
    new:       leads.filter(l => l.status === 'NEW').length,
    contacted: leads.filter(l => l.status === 'CONTACTED').length,
    won:       leads.filter(l => l.status === 'CONFIRMED').length,
  }), [leads]);

  const closeGuestDialog = () => {
    setShowDialog(false);
    setEditingLead(null);
    setOpenGuestId(null);
  };

  const openNew = () => {
    setEditingLead(null);
    setShowDialog(true);
    setOpenGuestId(null);
  };
  const openEdit = (lead) => {
    setEditingLead(lead);
    setShowDialog(true);
    setOpenGuestId(lead.id);
  };

  const handleGuestSubmit = async (formData) => {
    const data = leadFormToPayload(formData);
    if (editingLead) {
      await updateMutation.mutateAsync({ id: editingLead.id, data });
      success('הליד עודכן');
    } else {
      await createMutation.mutateAsync(data);
      success('ליד נוצר בהצלחה');
    }
  };

  const handleDelete = id => {
    if (!confirm('למחוק ליד זה?')) return;
    deleteMutation.mutate(id, {
      onSuccess: () => success('הליד נמחק'),
      onError: () => toastError('שגיאה במחיקת הליד'),
    });
  };

  const handleBulkSetStatus = async (rows, status) => {
    let done = 0;
    for (const row of rows) {
      await updateMutation.mutateAsync({ id: row.id, data: { status } }).catch(() => {});
      done++;
    }
    success(`${done === 1 ? 'עודכן ליד אחד' : `עודכנו ${done} לידים`} ל-${STATUS_MAP[status]?.label || status}`);
  };

  const handleBulkDeleteRows = (rows) => {
    rows.forEach((row) => deleteMutation.mutate(row.id));
  };

  const handleExport = () => {
    const data = sorted.map(l => ({
      ...l, property_name: properties.find(p => p.id === l.property_id)?.name || '',
    }));
    exportToCSV(data, 'leads', LEAD_COLUMNS);
    success(`${data.length === 1 ? 'יוצא ליד אחד' : `יוצאו ${data.length} לידים`} ל-CSV`);
  };

  const setStatusTagFilter = (value) => {
    if (value === 'all') {
      void setUrlState({ tags: [], page: 1 });
      return;
    }
    const isOnly = tags.length === 1 && tags[0] === value;
    void setUrlState({ tags: isOnly ? [] : [value], page: 1 });
  };

  const activeStatusChip = tags.length === 1 && STATUS_VALUE_SET.has(tags[0]) ? tags[0] : 'all';

  return (
    <Page>
      <PageHeader
        title="לידים"
        subtitle={`${counts.new} חדשים · ${counts.contacted} בטיפול · ${counts.won} נסגרו להזמנה`}
        actions={
          <>
            <Button onClick={openNew}>
              <Plus strokeWidth={2.25} />
              ליד חדש
            </Button>
          </>
        }
      />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedControl
          ariaLabel="סינון לפי מצב"
          value={activeStatusChip}
          onChange={(v) => setStatusTagFilter(v)}
          options={[
            { value: 'all', label: 'הכל', count: counts.total },
            { value: 'NEW', label: 'חדשים', count: counts.new },
            { value: 'CONTACTED', label: 'בטיפול' },
            { value: 'OFFER_SENT', label: 'הצעה נשלחה' },
          ]}
        />
        <div className="relative lg:w-[340px]">
          <Search className="pointer-events-none absolute right-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-400" />
          <Input
            value={searchTerm}
            onChange={(e) => void setUrlState({ search: e.target.value, page: 1 })}
            placeholder="חיפוש לפי שם, טלפון או אימייל"
            className="rounded-full pr-10"
            aria-label="חיפוש לידים"
          />
        </div>
      </div>

      <div className="v7-card overflow-hidden">
        {isLoading ? <div className="p-4"><SkelRows rows={5} /></div> : sorted.length ? (
          <ul className="divide-y divide-[#EEF0F5]">
            {paged.map((l, idx) => (
              <Rise as="li" i={Math.min(idx, 8)} key={l.id}>
                <Link to={`${createPageUrl('LeadDetail')}/${l.id}`} className="press v7-row flex min-h-[76px] items-center gap-4 px-5 py-3 md:px-6">
                  <GuestAvatar name={l.full_name || 'ליד'} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-navy-900">{l.full_name || 'ללא שם'}</span>
                    <span className="block truncate text-[13px] text-ink-400">
                      {l.check_in_date ? `מבקש ${fmtShort(l.check_in_date)}` : 'בלי תאריכים'}{l.nights ? ` · ${heCount(l.nights, 'night')}` : ''}
                    </span>
                  </span>
                  <StatusPill status={l.status} label={STATUS_MAP[l.status]?.label} />
                </Link>
              </Rise>
            ))}
          </ul>
        ) : null}
        {!isLoading && sorted.length > pageSize ? (
          <nav aria-label="עמודים" className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
            <span className="text-[14px] text-ink-600 tabular">עמוד {page} מתוך {totalPages} · {heCount(sorted.length, 'lead')}</span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" disabled={page <= 1} onClick={() => void setUrlState({ page: page - 1 })}>הקודם</Button>
              <Button type="button" variant="outline" disabled={page >= totalPages} onClick={() => void setUrlState({ page: page + 1 })}>הבא</Button>
            </div>
          </nav>
        ) : null}
      </div>

      <div className={cn("v7-card overflow-hidden", sorted.length || isLoading ? "hidden" : "")}>
        {isError ? (
          <div className="p-4 text-center text-sm text-red-600">שגיאה בטעינת הלידים</div>
        ) : sorted.length === 0 && !isLoading ? (
          <DsEmptyState
            icon={Users}
            title={searchTerm || tags.length ? 'לא נמצאו לידים' : 'עדיין אין לידים'}
            description={searchTerm || tags.length ? 'נסו חיפוש אחר.' : 'כל פנייה מוואטסאפ, טלפון או מהאתר נכנסת לכאן, ומכאן הופכת להזמנה.'}
            action={!searchTerm && !tags.length ? <Button onClick={openNew}><Plus strokeWidth={2.25} />ליד חדש</Button> : null}
          />
        ) : (
          <ErrorBoundary section="guests-table" variant="inline" resetKey={`${selectedPropertyId ?? 'all'}|${searchTerm}|${tags.join(',')}|${page}`}>
            <GuestsTable
              leads={paged}
              properties={properties}
              isLoading={isLoading}
              error={isError ? (leadsError instanceof Error ? leadsError : new Error('שגיאת טעינה')) : null}
              onEdit={openEdit}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDeleteRows}
              onBulkSetStatus={handleBulkSetStatus}
              sorting={sorting}
              onSortingChange={setSorting}
              manualSorting
              highlightRowId={openGuestId}
            />
            {sorted.length > pageSize ? (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-3 py-2 text-sm text-gray-600">
                <span>עמוד {page} מתוך {totalPages} · {sorted.length} רשומות</span>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="h-9" disabled={page <= 1} onClick={() => void setUrlState({ page: page - 1 })}>הקודם</Button>
                  <Button type="button" variant="outline" size="sm" className="h-9" disabled={page >= totalPages} onClick={() => void setUrlState({ page: page + 1 })}>הבא</Button>
                  <select
                    className="h-9 rounded-lg border border-gray-200 px-2 text-sm"
                    value={String(pageSize)}
                    onChange={(e) => void setUrlState({ pageSize: Number(e.target.value), page: 1 })}
                  >
                    <option value="10">10 לעמוד</option>
                    <option value="25">25 לעמוד</option>
                    <option value="50">50 לעמוד</option>
                  </select>
                </div>
              </div>
            ) : null}
          </ErrorBoundary>
        )}
      </div>

      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          const h = guestDialogInterceptRef.current;
          if (h) {
            h(open);
            return;
          }
          setShowDialog(open);
          if (!open) setOpenGuestId(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="text-right">
            <DialogTitle className="text-[22px] font-bold text-navy-900">{editingLead ? 'עריכת ליד' : 'ליד חדש'}</DialogTitle>
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
            submitLabel={editingLead ? 'שמירה' : 'שמירת ליד'}
          />
        </DialogContent>
      </Dialog>
    </Page>
  );
}
