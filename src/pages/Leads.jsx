import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  Users,
  MessageSquare,
  ArrowLeftRight,
  ThumbsUp,
  ThumbsDown,
  Send
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PullToRefresh from '@/components/common/PullToRefresh';

const statusColors = {
  NEW: 'bg-blue-100 text-blue-700 border-blue-200',
  CONTACTED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  OFFER_SENT: 'bg-purple-100 text-purple-700 border-purple-200',
  WON: 'bg-green-100 text-green-700 border-green-200',
  LOST: 'bg-gray-100 text-gray-700 border-gray-200'
};

const statusLabels = {
  NEW: 'חדש',
  CONTACTED: 'נוצר קשר',
  OFFER_SENT: 'הצעה נשלחה',
  WON: 'נצח',
  LOST: 'הפסיד'
};

const sourceLabels = {
  FACEBOOK: 'פייסבוק',
  WHATSAPP: 'וואטסאפ',
  WEBSITE: 'אתר',
  PHONE: 'טלפון',
  OTHER: 'אחר'
};

const sourceIcons = {
  FACEBOOK: '📘',
  WHATSAPP: '💬',
  WEBSITE: '🌐',
  PHONE: '📞',
  OTHER: '📋'
};

export default function Leads({ user, selectedPropertyId, orgId, properties }) {
  const [selectedLead, setSelectedLead] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'WHATSAPP',
    desired_checkin_date: '',
    desired_checkout_date: '',
    guests_count: 2,
    notes: '',
    status: 'NEW'
  });

  // Fetch leads
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', orgId, selectedPropertyId],
    queryFn: () => orgId ? base44.entities.Lead.filter(
      selectedPropertyId 
        ? { org_id: orgId, property_id: selectedPropertyId }
        : { org_id: orgId },
      '-created_date'
    ) : [],
    enabled: !!orgId
  });

  // Create lead mutation
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.create({
      ...data,
      org_id: orgId,
      property_id: selectedPropertyId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsCreateOpen(false);
      setNewLead({
        name: '',
        phone: '',
        email: '',
        source: 'WHATSAPP',
        desired_checkin_date: '',
        desired_checkout_date: '',
        guests_count: 2,
        notes: '',
        status: 'NEW'
      });
    }
  });

  // Update lead mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['leads'] });
      const previousLeads = queryClient.getQueryData(['leads', orgId, selectedPropertyId]);
      queryClient.setQueryData(['leads', orgId, selectedPropertyId], (old) =>
        old?.map(lead => lead.id === id ? { ...lead, ...data } : lead)
      );
      return { previousLeads };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['leads', orgId, selectedPropertyId], context.previousLeads);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.phone?.includes(searchQuery) ||
                         lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleStatusChange = (leadId, newStatus) => {
    updateMutation.mutate({ id: leadId, data: { status: newStatus } });
    if (selectedLead?.id === leadId) {
      setSelectedLead({ ...selectedLead, status: newStatus });
    }
  };

  const handleConvertToBooking = async (lead) => {
    try {
      // Create a new booking from the lead
      const booking = await base44.entities.Booking.create({
        org_id: lead.org_id,
        property_id: lead.property_id,
        lead_id: lead.id,
        guest_name: lead.name,
        phone: lead.phone,
        email: lead.email,
        checkin_date: lead.desired_checkin_date,
        checkout_date: lead.desired_checkout_date,
        guests_count: lead.guests_count,
        notes: lead.notes,
        status: 'PENDING',
        currency: 'ILS'
      });

      // Update lead status to WON
      await updateMutation.mutateAsync({ id: lead.id, data: { status: 'WON' } });

      // Navigate to booking
      navigate(`${createPageUrl('Bookings')}?id=${booking.id}`);
    } catch (error) {
      console.error('Failed to convert lead to booking:', error);
    }
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['leads'] });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1220]">לידים</h1>
          <p className="text-gray-500">ניהול ומעקב אחר לידים</p>
        </div>
        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl gap-2"
        >
          <Plus className="h-4 w-4" />
          ליד חדש
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="חיפוש לפי שם, טלפון או אימייל..." 
                className="pr-10 rounded-xl border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] rounded-xl">
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[150px] rounded-xl">
                <SelectValue placeholder="מקור" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל המקורות</SelectItem>
                {Object.entries(sourceLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Desktop: Leads Table */}
      <Card className="border-0 shadow-sm rounded-2xl overflow-hidden hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-right">שם</TableHead>
              <TableHead className="text-right">טלפון</TableHead>
              <TableHead className="text-right">מקור</TableHead>
              <TableHead className="text-right">תאריכים</TableHead>
              <TableHead className="text-right">סטטוס</TableHead>
              <TableHead className="text-right">נוצר</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                  {searchQuery || statusFilter !== 'all' || sourceFilter !== 'all'
                    ? 'לא נמצאו לידים התואמים את החיפוש'
                    : 'אין לידים עדיין'}
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map(lead => (
                <TableRow 
                 key={lead.id} 
                 className="cursor-pointer hover:bg-gray-50 select-none"
                 onClick={() => setSelectedLead(lead)}
                >
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell dir="ltr" className="text-left">{lead.phone}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      {sourceIcons[lead.source]}
                      {sourceLabels[lead.source]}
                    </span>
                  </TableCell>
                  <TableCell>
                    {lead.desired_checkin_date && lead.desired_checkout_date ? (
                      <span className="text-sm">
                        {format(parseISO(lead.desired_checkin_date), 'd/M')} - {format(parseISO(lead.desired_checkout_date), 'd/M')}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[lead.status]} border`}>
                      {statusLabels[lead.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {lead.created_date ? format(parseISO(lead.created_date), 'd/M/yy', { locale: he }) : '-'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleConvertToBooking(lead); }}>
                          <ArrowLeftRight className="h-4 w-4 ml-2" />
                          הפוך להזמנה
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(lead.id, 'CONTACTED'); }}>
                          <Phone className="h-4 w-4 ml-2" />
                          סמן נוצר קשר
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(lead.id, 'OFFER_SENT'); }}>
                          <Send className="h-4 w-4 ml-2" />
                          סמן הצעה נשלחה
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(lead.id, 'WON'); }} className="text-green-600">
                          <ThumbsUp className="h-4 w-4 ml-2" />
                          נצח
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(lead.id, 'LOST'); }} className="text-red-600">
                          <ThumbsDown className="h-4 w-4 ml-2" />
                          הפסיד
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile: Leads Cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <Card key={i} className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-24 mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredLeads.length === 0 ? (
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-8 text-center text-gray-500">
              {searchQuery || statusFilter !== 'all' || sourceFilter !== 'all'
                ? 'לא נמצאו לידים התואמים את החיפוש'
                : 'אין לידים עדיין'}
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map(lead => (
            <Card 
              key={lead.id} 
              className="border-0 shadow-sm rounded-2xl active:scale-98 transition-transform"
              onClick={() => setSelectedLead(lead)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#0B1220] mb-1">{lead.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600" dir="ltr">
                      <Phone className="h-3.5 w-3.5" />
                      {lead.phone}
                    </div>
                  </div>
                  <Badge className={`${statusColors[lead.status]} border`}>
                    {statusLabels[lead.status]}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <span className="text-base">{sourceIcons[lead.source]}</span>
                    {sourceLabels[lead.source]}
                  </span>
                  {lead.desired_checkin_date && lead.desired_checkout_date && (
                    <span className="flex items-center gap-1 text-gray-600">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(parseISO(lead.desired_checkin_date), 'd/M')} - {format(parseISO(lead.desired_checkout_date), 'd/M')}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Lead Details Sheet */}
      {selectedLead && (
        <Sheet open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <SheetContent side="left" className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>פרטי ליד</SheetTitle>
            </SheetHeader>
            
            <div className="space-y-6 py-6">
              {/* Contact Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">{selectedLead.name}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a href={`tel:${selectedLead.phone}`} className="text-[#00D1C1] hover:underline" dir="ltr">
                      {selectedLead.phone}
                    </a>
                  </div>
                  {selectedLead.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a href={`mailto:${selectedLead.email}`} className="text-[#00D1C1] hover:underline">
                        {selectedLead.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>סטטוס</Label>
                <Select 
                  value={selectedLead.status} 
                  onValueChange={(value) => handleStatusChange(selectedLead.id, value)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Details */}
              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">מקור</span>
                  <span className="flex items-center gap-1">
                    {sourceIcons[selectedLead.source]}
                    {sourceLabels[selectedLead.source]}
                  </span>
                </div>
                {selectedLead.desired_checkin_date && selectedLead.desired_checkout_date && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">תאריכים רצויים</span>
                    <span>
                      {format(parseISO(selectedLead.desired_checkin_date), 'd/M/yy')} - {format(parseISO(selectedLead.desired_checkout_date), 'd/M/yy')}
                    </span>
                  </div>
                )}
                {selectedLead.guests_count && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">מספר אורחים</span>
                    <span>{selectedLead.guests_count}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">נוצר בתאריך</span>
                  <span>{selectedLead.created_date ? format(parseISO(selectedLead.created_date), 'd/M/yy', { locale: he }) : '-'}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedLead.notes && (
                <div className="space-y-2 pt-3 border-t">
                  <Label>הערות</Label>
                  <p className="text-sm text-gray-600">{selectedLead.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-3 border-t">
                <Button 
                  className="w-full bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl"
                  onClick={() => handleConvertToBooking(selectedLead)}
                >
                  <ArrowLeftRight className="h-4 w-4 ml-2" />
                  הפוך להזמנה
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Create Lead Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>ליד חדש</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>שם</Label>
                <Input 
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  className="mt-1 rounded-xl"
                  placeholder="שם מלא"
                />
              </div>
              <div>
                <Label>טלפון</Label>
                <Input 
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  className="mt-1 rounded-xl"
                  placeholder="050-000-0000"
                  dir="ltr"
                />
              </div>
              <div>
                <Label>אימייל</Label>
                <Input 
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  className="mt-1 rounded-xl"
                  placeholder="email@example.com"
                  dir="ltr"
                />
              </div>
              <div>
                <Label>מקור</Label>
                <Select 
                  value={newLead.source} 
                  onValueChange={(value) => setNewLead({ ...newLead, source: value })}
                >
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(sourceLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>מספר אורחים</Label>
                <Input 
                  type="number"
                  value={newLead.guests_count}
                  onChange={(e) => setNewLead({ ...newLead, guests_count: parseInt(e.target.value) || 1 })}
                  className="mt-1 rounded-xl"
                  min={1}
                />
              </div>
              <div>
                <Label>תאריך כניסה</Label>
                <Input 
                  type="date"
                  value={newLead.desired_checkin_date}
                  onChange={(e) => setNewLead({ ...newLead, desired_checkin_date: e.target.value })}
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label>תאריך יציאה</Label>
                <Input 
                  type="date"
                  value={newLead.desired_checkout_date}
                  onChange={(e) => setNewLead({ ...newLead, desired_checkout_date: e.target.value })}
                  className="mt-1 rounded-xl"
                />
              </div>
              <div className="col-span-2">
                <Label>הערות</Label>
                <Textarea 
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  className="mt-1 rounded-xl"
                  rows={3}
                  placeholder="הערות נוספות..."
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl">
              ביטול
            </Button>
            <Button 
              onClick={() => createMutation.mutate(newLead)}
              disabled={!newLead.name || !newLead.phone || createMutation.isPending}
              className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl"
            >
              {createMutation.isPending ? 'שומר...' : 'צור ליד'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PullToRefresh>
  );
}