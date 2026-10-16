import React, { useEffect, useState } from 'react';
import { nightsBetween } from '@/lib/entityPayloads';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLead, useUpdateLead, useDeleteLead } from '@/data/entities';
import { atlasToastApi } from '@/components/ui/AtlasToast';
import { ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Phone,
  Mail,
  Calendar,
  Users,
  ArrowLeftRight,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { optimisticEntityClassName } from '@/lib/optimistic/entityVisualState';

const statusLabels = {
  NEW: 'חדש',
  CONTACTED: 'נוצר קשר',
  OFFER_SENT: 'הצעה נשלחה',
  CONFIRMED: 'מאושר',
  WON: 'נסגר',
  LOST: 'לא רלוונטי',
};

const sourceLabels = {
  FACEBOOK: 'פייסבוק',
  WHATSAPP: 'וואטסאפ',
  WEBSITE: 'אתר',
  PHONE: 'טלפון',
  OTHER: 'אחר',
};

export default function LeadDetail({ orgId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: lead, isLoading } = useLead(id);
  const updateMutation = useUpdateLead();
  const [notesDraft, setNotesDraft] = useState('');
  const [notesInvalid, setNotesInvalid] = useState(false);

  useEffect(() => {
    if (lead?.notes != null) setNotesDraft(String(lead.notes));
  }, [lead?.notes, lead?.id]);

  useEffect(() => {
    const onValidation = (e) => {
      const d = e.detail;
      if (d?.entity === 'lead' && d?.id === id) {
        setNotesInvalid(true);
        window.setTimeout(() => setNotesInvalid(false), 4000);
      }
    };
    window.addEventListener('atlas:entity-validation-error', onValidation);
    return () => window.removeEventListener('atlas:entity-validation-error', onValidation);
  }, [id]);

  const deleteLead = useDeleteLead();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleConvertToBooking = async (leadRow) => {
    const booking = await base44.entities.Booking.create({
      org_id: leadRow.org_id,
      property_id: leadRow.property_id,
      lead_id: leadRow.id,
      guest_name: leadRow.full_name,
      guest_phone: leadRow.phone,
      guest_email: leadRow.email,
      check_in_date: leadRow.check_in_date,
      check_out_date: leadRow.check_out_date,
      nights: leadRow.nights ?? nightsBetween(leadRow.check_in_date, leadRow.check_out_date),
      adults: leadRow.adults,
      children: leadRow.children,
      source: leadRow.source || null,
      notes: leadRow.notes,
      status: 'PENDING',
    });

    await updateMutation.mutateAsync({ id: leadRow.id, data: { status: 'WON' } });
    navigate(`${createPageUrl('BookingDetail')}/${booking.id}`);
  };

  const saveNotes = () => {
    if (!lead) return;
    const next = notesDraft.trim();
    if (next === (lead.notes || '').trim()) return;
    updateMutation.mutate({ id: lead.id, data: { notes: next } });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6 text-center text-gray-500">
        ליד לא נמצא
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className={cn('p-6 space-y-6 max-w-2xl mx-auto', optimisticEntityClassName(lead.id))}
    >
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => navigate(createPageUrl('Leads'))} className="press -ms-2 inline-flex h-11 items-center gap-1 rounded-[10px] px-2 text-[15px] font-medium text-brand-600 hover:bg-brand-50">
          <ChevronRight className="h-5 w-5" />
          לידים
        </button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" className="h-11" onClick={() => navigate(`${createPageUrl('Leads')}?openGuestId=${encodeURIComponent(lead.id)}`)}>
            <Pencil />
            עריכה
          </Button>
          <Button variant="ghost" size="icon" className="h-11 w-11 text-ink-600 hover:text-danger-600" aria-label="מחיקת ליד" onClick={() => setConfirmDelete(true)}>
            <Trash2 />
          </Button>
        </div>
      </div>
      <h1 className="text-[26px] font-bold leading-tight text-navy-900">{lead.full_name || 'ליד'}</h1>
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-[420px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-bold text-navy-900">למחוק את הליד?</DialogTitle>
          </DialogHeader>
          <p className="text-[15px] text-ink-600">{lead.full_name || 'הליד'} יוסר מרשימת הלידים.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>ביטול</Button>
            <Button variant="destructive" disabled={deleteLead.isPending} onClick={() => { const leadId = lead.id; setConfirmDelete(false); navigate(createPageUrl('Leads')); deleteLead.mutate(leadId, { onSuccess: () => atlasToastApi.success('הליד נמחק'), onError: () => atlasToastApi.error('לא הצלחנו למחוק את הליד. נסו שוב.') }); }}>מחיקה</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="space-y-4">
        <h3 className="font-semibold text-[#1B2656] select-none">פרטי קשר</h3>
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-600/10 rounded-xl flex items-center justify-center">
                <span className="text-lg font-bold text-brand-600 select-none">
                  {lead.full_name?.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium">{lead.full_name}</p>
                <p className="text-sm text-gray-500">{sourceLabels[lead.source]}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <span dir="ltr">{lead.phone}</span>
            </div>
            {lead.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{lead.email}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(lead.check_in_date || lead.check_out_date) && (
        <div className="space-y-4">
          <h3 className="font-semibold text-[#1B2656] select-none">תאריכים מבוקשים</h3>
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm">כניסה: {lead.check_in_date && format(parseISO(lead.check_in_date), 'd/M/yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm">יציאה: {lead.check_out_date && format(parseISO(lead.check_out_date), 'd/M/yyyy')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {lead.adults && (
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-4 flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-gray-400" />
            <span>{lead.adults} אורחים</span>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <h3 className="font-semibold text-[#1B2656] select-none">הערות</h3>
        <Card
          className={cn(
            'border-0 shadow-sm rounded-2xl',
            notesInvalid && 'ring-2 ring-red-500/70 ring-offset-2',
          )}
        >
          <CardContent className="p-4 space-y-2">
            <Label htmlFor="lead-notes" className="text-xs text-gray-500">
              נשמר אוטומטית בעת יציאה מהשדה
            </Label>
            <Textarea
              id="lead-notes"
              dir="rtl"
              rows={4}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={saveNotes}
              placeholder="הערות פנימיות על הליד…"
              className="rounded-xl text-sm resize-y min-h-[100px]"
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-[#1B2656] select-none">סטטוס</h3>
        <Select
          value={lead.status}
          onValueChange={(value) => updateMutation.mutate({ id: lead.id, data: { status: value } })}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        className="w-full bg-brand-600 hover:bg-brand-500 text-white rounded-xl"
        onClick={() => handleConvertToBooking(lead)}
      >
        <ArrowLeftRight className="h-4 w-4 ml-2" />
        הפוך להזמנה
      </Button>
    </motion.div>
  );
}
