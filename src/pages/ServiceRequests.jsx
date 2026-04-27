import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Clock,
  Phone,
  User,
  Filter,
  ArrowUpCircle,
  Bell,
  Wrench,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PullToRefresh from '@/components/common/PullToRefresh';
import { MaintenanceTable } from '@/components/tables/MaintenanceTable';

export default function ServiceRequests({ orgId, selectedPropertyId }) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
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
    }
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
    LOW: { label: 'נמוך', color: 'bg-blue-100 text-blue-800', icon: Clock },
    MEDIUM: { label: 'בינוני', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    HIGH: { label: 'גבוה', color: 'bg-orange-100 text-orange-800', icon: ArrowUpCircle },
    URGENT: { label: 'דחוף', color: 'bg-red-100 text-red-800', icon: Bell }
  };

  const statusConfig = {
    NEW: { label: 'חדש', color: 'bg-purple-100 text-purple-800' },
    IN_PROGRESS: { label: 'בטיפול', color: 'bg-blue-100 text-blue-800' },
    RESOLVED: { label: 'טופל', color: 'bg-green-100 text-green-800' },
    CLOSED: { label: 'סגור', color: 'bg-gray-100 text-gray-800' }
  };

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
        className="space-y-6"
      >
        {/* Header & Stats */}
        <div className="mb-6">
          <div className="bg-gradient-to-br from-indigo-50/80 to-white rounded-2xl border border-indigo-100/50 p-5 mb-6" dir="rtl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-indigo-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">בקשות שירות</h1>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mr-[3.25rem]">נהל בקשות תחזוקה ושירות מאורחים ומנהלי נכסים. עקוב אחר סטטוס הטיפול.</p>
            <p className="text-indigo-500 text-xs mt-1 mr-[3.25rem]">💡 טיפ: בקשות דחופות מסומנות באדום — טפל בהן קודם</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-[#0F172A] mb-2">📋 קישור לטופס אורחים</h3>
            <p className="text-sm text-gray-600 mb-3">שתף את הקישור הזה עם האורחים שלך (בהודעת כניסה, בנכס וכו'):</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={`${window.location.origin}${createPageUrl('GuestService')}`}
                className="flex-1 px-3 py-2 bg-white border rounded-lg text-sm"
                dir="ltr"
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}${createPageUrl('GuestService')}`);
                  alert('הקישור הועתק!');
                }}
                className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220]"
              >
                העתק
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'סה"כ בקשות', value: stats.total, color: 'from-blue-500 to-blue-600' },
              { label: 'חדשות', value: stats.new, color: 'from-purple-500 to-purple-600' },
              { label: 'דחופות', value: stats.urgent, color: 'from-red-500 to-red-600' },
              { label: 'טופלו', value: stats.resolved, color: 'from-green-500 to-green-600' }
            ].map((stat, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl mb-2`}>
                    <span className="text-white text-xl font-bold">{stat.value}</span>
                  </div>
                  <p className="text-sm text-[#64748B] font-medium">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#64748B]" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
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

            <Select value={filterUrgency} onValueChange={setFilterUrgency}>
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
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <MaintenanceTable
            requests={filteredRequests}
            properties={properties}
            isLoading={isLoading}
            error={isError ? (requestsError instanceof Error ? requestsError : new Error('שגיאת טעינה')) : null}
            onOpen={setSelectedRequest}
          />
        </div>

        {/* Request Details Sheet */}
        <Sheet
          open={!!selectedRequest}
          onOpenChange={(open) => {
            if (!open) setSelectedRequest(null);
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
                    <h4 className="font-semibold text-[#0F172A] mb-2">פרטי האורח</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[#64748B]" />
                        <span>{selectedRequest.guest_name}</span>
                      </div>
                      {selectedRequest.guest_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-[#64748B]" />
                          <a href={`tel:${selectedRequest.guest_phone}`} className="text-[#00D1C1] hover:underline">
                            {selectedRequest.guest_phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#0F172A] mb-2">תיאור הבקשה</h4>
                    <p className="text-sm text-[#64748B] leading-relaxed whitespace-pre-wrap">
                      {selectedRequest.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#0F172A] mb-2">עדכן סטטוס</h4>
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
                    <h4 className="font-semibold text-[#0F172A] mb-2">הערות פנימיות</h4>
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
                      className="mt-2 w-full bg-[#00D1C1] hover:bg-[#00B8AA] text-[#0F172A]"
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