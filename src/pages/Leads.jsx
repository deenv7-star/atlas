import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
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
  Users, Plus, Search, Check, Edit, Trash2,
  Phone, Mail, CalendarDays, Building2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

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
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-teal-400 to-teal-600',
  'from-amber-400 to-amber-600',
  'from-rose-400 to-rose-600',
];

const emptyLead = {
  full_name: '',
  email: '',
  phone: '',
  property_id: '',
  check_in_date: '',
  check_out_date: '',
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

  const { data: leads = [], isLoading, isError } = useQuery({
    queryKey: ['leads', selectedPropertyId],
    queryFn: async () => {
      let q = supabase.from('leads').select('*');
      if (selectedPropertyId) q = q.eq('property_id', selectedPropertyId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('properties').select('*');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('leads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.from('leads').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'ליד נוצר בהצלחה' });
      setShowDialog(false);
      setForm(emptyLead);
    },
    onError: () => toast({ title: 'שגיאה ביצירת הליד', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data: payload }) => {
      const { data, error } = await supabase.from('leads').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'הליד עודכן' });
      setShowDialog(false);
    },
    onError: () => toast({ title: 'שגיאה בעדכון הליד', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'הליד נמחק' });
    },
    onError: () => toast({ title: 'שגיאה במחיקת הליד', variant: 'destructive' }),
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

  const counts = useMemo(() => ({
    total: leads.length,
    new: leads.filter(l => l.status === 'NEW').length,
    contacted: leads.filter(l => l.status === 'CONTACTED').length,
    won: leads.filter(l => l.status === 'CONFIRMED').length,
  }), [leads]);

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

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto animate-fade-in" dir="rtl">

      <div className="bg-gradient-to-br from-indigo-50/80 to-white rounded-2xl border border-indigo-100/50 p-5 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול לידים</h1>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed mr-12">כאן מנהלים את כל הפניות והלידים שלך. הוסף ליד חדש, עקוב אחר סטטוס, ותהפוך פניות להזמנות.</p>
        <p className="text-indigo-500 text-xs mt-1 mr-12">טיפ: לחץ על ליד כדי לראות פרטים מלאים ולשנות סטטוס</p>
      </div>

      {/* ── Page header ── */}
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
        <Button
          onClick={openNew}
          className="gap-1.5 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold h-9 text-sm rounded-xl shadow-sm"
        >
          <Plus className="w-4 h-4" />
          ליד חדש
        </Button>
      </div>

      {/* ── Stat pills ── */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'סה"כ',    value: counts.total,    bg: 'bg-gray-100',   text: 'text-gray-700' },
          { label: 'חדשים',   value: counts.new,      bg: 'bg-blue-50',    text: 'text-blue-700' },
          { label: 'בתהליך',  value: counts.contacted, bg: 'bg-yellow-50', text: 'text-yellow-700' },
          { label: 'נסגרו',   value: counts.won,       bg: 'bg-green-50',  text: 'text-green-700' },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${s.bg} border border-transparent`}>
            <span className={`text-sm font-bold ${s.text}`}>{s.value}</span>
            <span className="text-xs text-gray-500">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="חפש לפי שם, אימייל או טלפון..."
            className="h-9 pr-9 text-sm rounded-xl border-gray-200 bg-white"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[{ value: 'all', label: 'הכל' }, ...STATUS_OPTIONS.slice(0, 3)].map(s => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`h-8 px-3 rounded-full text-xs font-medium transition-all border ${
                statusFilter === s.value
                  ? 'bg-[#0B1220] text-white border-[#0B1220]'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Leads list ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              {searchTerm || statusFilter !== 'all' ? 'לא נמצאו תוצאות' : 'אין לידים עדיין'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button
                onClick={openNew}
                size="sm"
                className="mt-3 gap-1.5 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                הוסף ליד ראשון
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((lead, idx) => {
              const statusInfo = STATUS_MAP[lead.status] || STATUS_MAP.NEW;
              const property = properties.find(p => p.id === lead.property_id);
              const avatarGradient = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              const displayName = lead.full_name || lead.name || 'ליד';
              return (
                <div
                  key={lead.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors group"
                >
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center flex-shrink-0 text-sm font-bold text-white shadow-sm`}>
                    {displayName[0]}
                  </div>

                  {/* Info */}
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
                          <Phone className="w-3 h-3" />
                          <span dir="ltr">{lead.phone}</span>
                        </span>
                      )}
                      {lead.email && (
                        <span className="flex items-center gap-1 text-xs text-gray-400 truncate max-w-[160px]">
                          <Mail className="w-3 h-3 flex-shrink-0" />{lead.email}
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
                          <Building2 className="w-3 h-3" />{property.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => openEdit(lead)}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      onClick={() => { if (confirm('למחוק ליד זה?')) deleteMutation.mutate(lead.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Dialog ── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingLead ? 'עריכת ליד' : 'ליד חדש'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs text-gray-500">שם מלא *</Label>
              <Input
                value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                placeholder="שם מלא"
                className="h-9 text-sm rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">טלפון</Label>
              <Input
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="050-0000000"
                className="h-9 text-sm rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">אימייל</Label>
              <Input
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="email@example.com"
                className="h-9 text-sm rounded-xl"
              />
            </div>
            {properties.length > 0 && (
              <div className="col-span-2 space-y-1">
                <Label className="text-xs text-gray-500">נכס</Label>
                <Select value={form.property_id} onValueChange={val => setForm(p => ({ ...p, property_id: val }))}>
                  <SelectTrigger className="h-9 text-sm rounded-xl">
                    <SelectValue placeholder="בחר נכס" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map(prop => (
                      <SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">תאריך כניסה</Label>
              <Input
                type="date"
                value={form.check_in_date}
                onChange={e => setForm(p => ({ ...p, check_in_date: e.target.value }))}
                className="h-9 text-sm rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">תאריך יציאה</Label>
              <Input
                type="date"
                value={form.check_out_date}
                onChange={e => setForm(p => ({ ...p, check_out_date: e.target.value }))}
                className="h-9 text-sm rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">תקציב (₪)</Label>
              <Input
                type="number"
                value={form.budget}
                onChange={e => setForm(p => ({ ...p, budget: e.target.value }))}
                placeholder="0"
                className="h-9 text-sm rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">סטטוס</Label>
              <Select value={form.status} onValueChange={val => setForm(p => ({ ...p, status: val }))}>
                <SelectTrigger className="h-9 text-sm rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs text-gray-500">הערות</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="הערות נוספות..."
                rows={2}
                className="text-sm resize-none rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDialog(false)}
              className="h-9 rounded-xl"
            >
              ביטול
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="h-9 gap-1.5 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold rounded-xl"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <div className="w-4 h-4 border-2 border-[#0B1220] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {editingLead ? 'שמור' : 'צור ליד'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
