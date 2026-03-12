import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  Users, Plus, Search, Filter, Edit, Trash2, Check,
  Phone, Mail, CalendarDays, Building2, MessageSquare,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'חדש', color: 'bg-blue-100 text-blue-700' },
  { value: 'CONTACTED', label: 'נוצר קשר', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'OFFER_SENT', label: 'הצעה נשלחה', color: 'bg-purple-100 text-purple-700' },
  { value: 'CONFIRMED', label: 'מאושר', color: 'bg-green-100 text-green-700' },
  { value: 'REJECTED', label: 'נדחה', color: 'bg-red-100 text-red-700' },
  { value: 'LOST', label: 'אבוד', color: 'bg-gray-100 text-gray-500' },
];

const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s]));

const emptyLead = {
  full_name: '',
  email: '',
  phone: '',
  property_id: '',
  check_in_date: '',
  check_out_date: '',
  nights: '',
  adults: 2,
  children: 0,
  status: 'NEW',
  source: '',
  notes: '',
  budget: '',
};

export default function LeadsPage({ user, selectedPropertyId }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [form, setForm] = useState(emptyLead);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', selectedPropertyId],
    queryFn: () => base44.entities.Lead.list(selectedPropertyId ? { property_id: selectedPropertyId } : {}),
    staleTime: 2 * 60 * 1000,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties-list'],
    queryFn: () => base44.entities.Property.list(),
    staleTime: 10 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      toast({ title: 'ליד נוצר בהצלחה' });
      setShowDialog(false);
      setForm(emptyLead);
    },
    onError: () => toast({ title: 'שגיאה ביצירת הליד', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      toast({ title: 'ליד עודכן' });
      setShowDialog(false);
    },
    onError: () => toast({ title: 'שגיאה בעדכון', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Lead.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      toast({ title: 'ליד נמחק' });
    },
    onError: () => toast({ title: 'שגיאה במחיקה', variant: 'destructive' }),
  });

  const filtered = useMemo(() => {
    return leads.filter(l => {
      const matchSearch = !searchTerm ||
        (l.full_name || l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.phone || '').includes(searchTerm);
      const matchStatus = statusFilter === 'all' || l.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [leads, searchTerm, statusFilter]);

  const openNew = () => {
    setEditingLead(null);
    setForm(emptyLead);
    setShowDialog(true);
  };

  const openEdit = (lead) => {
    setEditingLead(lead);
    setForm({
      full_name: lead.full_name || lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      property_id: lead.property_id || '',
      check_in_date: lead.check_in_date || '',
      check_out_date: lead.check_out_date || '',
      nights: lead.nights || '',
      adults: lead.adults || 2,
      children: lead.children || 0,
      status: lead.status || 'NEW',
      source: lead.source || '',
      notes: lead.notes || '',
      budget: lead.budget || '',
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.full_name) {
      toast({ title: 'נא למלא שם', variant: 'destructive' });
      return;
    }
    if (editingLead) {
      updateMutation.mutate({ id: editingLead.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const quickStatusChange = (lead, newStatus) => {
    updateMutation.mutate({ id: lead.id, data: { ...lead, status: newStatus } });
  };

  const counts = useMemo(() => ({
    total: leads.length,
    new: leads.filter(l => l.status === 'NEW').length,
    confirmed: leads.filter(l => l.status === 'CONFIRMED').length,
  }), [leads]);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00D1C1]" />
            לידים
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{counts.total} לידים סה"כ</p>
        </div>
        <Button
          onClick={openNew}
          className="gap-1.5 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold h-9 text-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          ליד חדש
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'סה"כ', value: counts.total, color: 'text-gray-700' },
          { label: 'חדשים', value: counts.new, color: 'text-blue-600' },
          { label: 'מאושרים', value: counts.confirmed, color: 'text-green-600' },
        ].map(stat => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="חפש לפי שם, אימייל או טלפון..."
            className="h-9 pr-9 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 text-sm w-full sm:w-40">
            <Filter className="w-3.5 h-3.5 ml-1 text-gray-400" />
            <SelectValue placeholder="כל הסטטוסים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leads list */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-18 rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">
                {searchTerm || statusFilter !== 'all' ? 'לא נמצאו תוצאות' : 'אין לידים עדיין'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={openNew} size="sm" className="mt-3 gap-1.5 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold">
                  <Plus className="w-3.5 h-3.5" />
                  הוסף ליד ראשון
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((lead) => {
                const statusInfo = STATUS_MAP[lead.status] || STATUS_MAP.NEW;
                const property = properties.find(p => p.id === lead.property_id);
                return (
                  <div key={lead.id} className="flex items-start gap-3 p-3 hover:bg-gray-50/80 transition-colors group">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-purple-600 mt-0.5">
                      {(lead.full_name || lead.name || 'ל')[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-800">
                          {lead.full_name || lead.name || 'ליד'}
                        </p>
                        <Badge className={`${statusInfo.color} text-[10px] py-0 px-1.5 border-0`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        {lead.phone && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Phone className="w-3 h-3" /> {lead.phone}
                          </span>
                        )}
                        {lead.email && (
                          <span className="flex items-center gap-1 text-xs text-gray-400 truncate max-w-[180px]">
                            <Mail className="w-3 h-3 flex-shrink-0" /> {lead.email}
                          </span>
                        )}
                        {lead.check_in_date && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <CalendarDays className="w-3 h-3" />
                            {format(parseISO(lead.check_in_date), 'dd/MM/yy')}
                          </span>
                        )}
                        {property && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Building2 className="w-3 h-3" /> {property.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick status */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700" onClick={() => openEdit(lead)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                        onClick={() => { if (confirm('למחוק ליד זה?')) deleteMutation.mutate(lead.id); }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingLead ? 'עריכת ליד' : 'ליד חדש'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">שם מלא *</Label>
              <Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="שם מלא" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">טלפון</Label>
              <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="050-0000000" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">אימייל</Label>
              <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" className="h-9 text-sm" />
            </div>
            {properties.length > 0 && (
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">נכס</Label>
                <Select value={form.property_id} onValueChange={val => setForm(p => ({ ...p, property_id: val }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="בחר נכס" /></SelectTrigger>
                  <SelectContent>
                    {properties.map(prop => <SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">תאריך כניסה</Label>
              <Input type="date" value={form.check_in_date} onChange={e => setForm(p => ({ ...p, check_in_date: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">תאריך יציאה</Label>
              <Input type="date" value={form.check_out_date} onChange={e => setForm(p => ({ ...p, check_out_date: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">תקציב (₪)</Label>
              <Input type="number" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} placeholder="0" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">סטטוס</Label>
              <Select value={form.status} onValueChange={val => setForm(p => ({ ...p, status: val }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">הערות</Label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="הערות נוספות..." rows={2} className="text-sm resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDialog(false)} className="h-9">ביטול</Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="h-9 gap-1.5 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <div className="w-4 h-4 border-2 border-[#0B1220] border-t-transparent rounded-full animate-spin" />
              ) : <Check className="w-4 h-4" />}
              {editingLead ? 'שמור' : 'צור ליד'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}