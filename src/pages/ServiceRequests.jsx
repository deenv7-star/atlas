import React, { useState, useEffect } from 'react';
import { PageHeader, StatTile } from '@/components/ds';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { Sparkles, AlertTriangle, CheckCircle2 as CheckDone } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { readCommandPaletteFlag } from '@/lib/commandPaletteNavigationState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Clock,
  Phone,
  User,
  ArrowUpCircle,
  Bell,
} from 'lucide-react';
import { motion } from 'framer-motion';
import PullToRefresh from '@/components/common/PullToRefresh';
import { MaintenanceTable } from '@/components/tables/MaintenanceTable';
import { useMaintenanceUrlState } from '@/hooks/url-state/useMaintenanceUrlState';
import { ShareViewButton } from '@/components/ui/ShareViewButton';

export default function ServiceRequests({ orgId, selectedPropertyId }) {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    openMaintenanceId,
    filterStatus,
    filterUrgency,
    setUrlState,
    setOpenMaintenanceId,
  } = useMaintenanceUrlState();

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [newRequestForm, setNewRequestForm] = useState({
    guest_name: '',
    title: '',
    description: '',
    urgency: 'MEDIUM',
    property_id: '',
    request_type: 'MAINTENANCE',
  });
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading, isError, error: requestsError, refetch } = useQuery({
    queryKey: ['guestRequests', orgId, selectedPropertyId],
    queryFn: () => {
      const filters = { org_id: orgId };
      if (selectedPropertyId) filters.property_id = selectedPropertyId;
      return base44.entities.GuestRequest.filter(filters, '-created_date', 300);
    },
    enabled: !!orgId
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties', orgId],
    queryFn: () => base44.entities.Property.filter({ org_id: orgId }, '-created_at', 200),
    enabled: !!orgId
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GuestRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guestRequests'] });
      setSelectedRequest(null);
      setOpenMaintenanceId(null);
    }
  });

  const createMutation = useMutation({
    mutationFn: (payload) => base44.entities.GuestRequest.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guestRequests'] });
      setNewRequestOpen(false);
      setNewRequestForm({
        guest_name: '',
        title: '',
        description: '',
        urgency: 'MEDIUM',
        property_id: '',
        request_type: 'MAINTENANCE',
      });
    },
  });

  const requestTypes = {
    MAINTENANCE: 'תחזוקה',
    AMENITY: 'שירותים',
    CLEANING: 'ניקיון',
    COMPLAINT: 'תלונה',
    QUESTION: 'שאלה',
    OTHER: 'אחר'
  };

  const urgencyConfig = {
    LOW: { label: 'נמוך', color: 'bg-brand-100 text-brand-700', icon: Clock },
    MEDIUM: { label: 'בינוני', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    HIGH: { label: 'גבוה', color: 'bg-orange-100 text-orange-800', icon: ArrowUpCircle },
    URGENT: { label: 'דחוף', color: 'bg-red-100 text-red-800', icon: Bell }
  };

  const statusConfig = {
    NEW: { label: 'חדש', color: 'bg-brand-100 text-brand-700' },
    IN_PROGRESS: { label: 'בטיפול', color: 'bg-brand-100 text-brand-700' },
    RESOLVED: { label: 'טופל', color: 'bg-green-100 text-green-800' },
    CLOSED: { label: 'סגור', color: 'bg-neutral-100 text-navy-900' }
  };

  useEffect(() => {
    if (!openMaintenanceId || !requests.length) return;
    const row = requests.find((r) => r.id === openMaintenanceId);
    if (row) setSelectedRequest(row);
  }, [openMaintenanceId, requests]);

  useEffect(() => {
    if (!readCommandPaletteFlag(location.state, 'newMaintenance')) return;
    setNewRequestForm((f) => ({
      ...f,
      property_id: selectedPropertyId || f.property_id || '',
    }));
    setNewRequestOpen(true);
    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      { replace: true, state: null },
    );
  }, [location.state, location.pathname, location.search, location.hash, navigate, selectedPropertyId]);

  const filteredRequests = requests.filter(req => {
    if (filterStatus !== 'all' && req.status !== filterStatus) return false;
    if (filterUrgency !== 'all' && req.urgency !== filterUrgency) return false;
    return true;
  });

  const stats = {
    total: requests.length,
    new: requests.filter(r => r.status === 'NEW').length,
    urgent: requests.filter(r => r.urgency === 'URGENT').length,
    resolved: requests.filter(r => r.status === 'RESOLVED').length
  };

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.name || 'לא ידוע';
  };

  return (
    <PullToRefresh onRefresh={refetch}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-[1200px] space-y-8 px-5 pb-16 pt-6 md:px-10 md:pt-10"
      >
        {/* Header & Stats */}
        <div className="space-y-5">
          <PageHeader title="בקשות שירות" subtitle="בקשות תחזוקה מאורחים ומהצוות." className="!mb-0" />
          <div className="rounded-[14px] border border-line bg-white p-4 shadow-card">
            <h3 className="mb-1 text-[15px] font-bold text-navy-900">קישור לטופס אורחים</h3>
            <p className="mb-3 text-[14px] text-ink-600">שלחו לאורחים בהודעת הכניסה, או תלו בנכס.</p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                aria-label="קישור לטופס אורחים"
                value={`${window.location.origin}${createPageUrl('GuestService')}`}
                className="h-11 min-w-0 flex-1 rounded-[10px] border border-line bg-canvas px-3 text-[14px] text-navy-900"
                dir="ltr"
              />
              <Button
                onClick={() => {
                  navigator.clipboard?.writeText(`${window.location.origin}${createPageUrl('GuestService')}`);
                  atlasToastApi.success('הקישור הועתק');
                }}
              >
                העתקה
              </Button>
            </div>
          </div>
          
          <div className="stat-row">
            <StatTile label="חדשות" value={stats.new} icon={Sparkles} />
            <StatTile label="דחופות" value={stats.urgent} icon={AlertTriangle} tone="danger" />
            <StatTile label="טופלו" value={stats.resolved} icon={CheckDone} tone="success" />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <ShareViewButton />
              
              <Select value={filterStatus} onValueChange={(v) => void setUrlState({ filterStatus: v })}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסטטוסים</SelectItem>
                  {Object.entries(statusConfig).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Select value={filterUrgency} onValueChange={(v) => void setUrlState({ filterUrgency: v })}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הדחיפויות</SelectItem>
                {Object.entries(urgencyConfig).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Requests table */}
        <div className="rounded-2xl border border-line bg-white shadow-sm overflow-hidden">
          <MaintenanceTable
            requests={filteredRequests}
            properties={properties}
            isLoading={isLoading}
            error={isError ? (requestsError instanceof Error ? requestsError : new Error('שגיאת טעינה')) : null}
            onOpen={(row) => {
              setSelectedRequest(row);
              setOpenMaintenanceId(row.id);
            }}
            highlightRowId={openMaintenanceId}
          />
        </div>

        <Dialog open={newRequestOpen} onOpenChange={setNewRequestOpen}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>בקשת תחזוקה חדשה</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4 pt-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!orgId) return;
                const propertyId =
                  newRequestForm.property_id || selectedPropertyId || properties[0]?.id || '';
                if (!propertyId) return;
                createMutation.mutate({
                  org_id: orgId,
                  property_id: propertyId,
                  guest_name: newRequestForm.guest_name.trim() || 'צוות',
                  title: newRequestForm.title.trim() || 'בקשת תחזוקה',
                  description: newRequestForm.description.trim() || '—',
                  urgency: newRequestForm.urgency,
                  request_type: newRequestForm.request_type,
                  status: 'NEW',
                });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="cp-maint-guest">שם פונה</Label>
                <Input
                  id="cp-maint-guest"
                  value={newRequestForm.guest_name}
                  onChange={(e) => setNewRequestForm((f) => ({ ...f, guest_name: e.target.value }))}
                  placeholder="צוות / שם אורח"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp-maint-title">כותרת</Label>
                <Input
                  id="cp-maint-title"
                  value={newRequestForm.title}
                  onChange={(e) => setNewRequestForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="תיאור קצר"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp-maint-desc">תיאור</Label>
                <Textarea
                  id="cp-maint-desc"
                  value={newRequestForm.description}
                  onChange={(e) => setNewRequestForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="פרטים"
                  className="min-h-[88px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>דחיפות</Label>
                  <Select
                    value={newRequestForm.urgency}
                    onValueChange={(v) => setNewRequestForm((f) => ({ ...f, urgency: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(urgencyConfig).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>נכס</Label>
                  {properties.length > 0 ? (
                    <Select
                      value={
                        newRequestForm.property_id
                        || selectedPropertyId
                        || properties[0]?.id
                        || undefined
                      }
                      onValueChange={(v) => setNewRequestForm((f) => ({ ...f, property_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר נכס" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-xs text-amber-700">אין נכסים, הוסף נכס בהגדרות.</p>
                  )}
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-brand-600 hover:bg-[#00B8AA] text-navy-900"
                disabled={
                  createMutation.isPending
                  || !orgId
                  || !(
                    newRequestForm.property_id
                    || selectedPropertyId
                    || properties[0]?.id
                  )
                }
              >
                {createMutation.isPending ? 'שולח…' : 'צור בקשה'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Request Details Sheet */}
        <Sheet
          open={!!selectedRequest}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedRequest(null);
              setOpenMaintenanceId(null);
            }
          }}
        >
          <SheetContent side="left" className="w-full sm:max-w-lg overflow-y-auto">
            {selectedRequest && (
              <>
                <SheetHeader>
                  <SheetTitle className="text-xl">{selectedRequest.title}</SheetTitle>
                </SheetHeader>

                <div className="space-y-6 mt-6">
                  <div className="flex gap-2">
                    <Badge className={urgencyConfig[selectedRequest.urgency].color}>
                      {urgencyConfig[selectedRequest.urgency].label}
                    </Badge>
                    <Badge className={statusConfig[selectedRequest.status].color}>
                      {statusConfig[selectedRequest.status].label}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-semibold text-navy-900 mb-2">פרטי האורח</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[#64748B]" />
                        <span>{selectedRequest.guest_name}</span>
                      </div>
                      {selectedRequest.guest_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-[#64748B]" />
                          <a href={`tel:${selectedRequest.guest_phone}`} className="text-brand-600 hover:underline">
                            {selectedRequest.guest_phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-navy-900 mb-2">תיאור הבקשה</h4>
                    <p className="text-sm text-[#64748B] leading-relaxed whitespace-pre-wrap">
                      {selectedRequest.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-navy-900 mb-2">עדכן סטטוס</h4>
                    <Select
                      value={selectedRequest.status}
                      onValueChange={(value) => {
                        updateMutation.mutate({
                          id: selectedRequest.id,
                          data: { 
                            status: value,
                            resolved_at: value === 'RESOLVED' ? new Date().toISOString() : selectedRequest.resolved_at
                          }
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <h4 className="font-semibold text-navy-900 mb-2">הערות פנימיות</h4>
                    <Textarea
                      value={selectedRequest.notes || ''}
                      onChange={(e) => {
                        setSelectedRequest({ ...selectedRequest, notes: e.target.value });
                      }}
                      placeholder="הוסף הערות..."
                      className="min-h-24"
                    />
                    <Button
                      onClick={() => {
                        updateMutation.mutate({
                          id: selectedRequest.id,
                          data: { notes: selectedRequest.notes }
                        });
                      }}
                      disabled={updateMutation.isPending}
                      className="mt-2 w-full bg-brand-600 hover:bg-[#00B8AA] text-navy-900"
                    >
                      שמור הערות
                    </Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </motion.div>
    </PullToRefresh>
  );
}