import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  ArrowLeftRight
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { createPageUrl } from '@/utils';

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
  WON: 'נסגר',
  LOST: 'לא רלוונטי',
};

const sourceLabels = {
  FACEBOOK: 'פייסבוק',
  WHATSAPP: 'וואטסאפ',
  WEBSITE: 'אתר',
  PHONE: 'טלפון',
  OTHER: 'אחר'
};

export default function LeadDetail({ orgId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const leads = await base44.entities.Lead.filter({ id });
      return leads[0];
    },
    enabled: !!id
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['lead', id] });
      const previousLead = queryClient.getQueryData(['lead', id]);
      queryClient.setQueryData(['lead', id], (old) => ({ ...old, ...data }));
      return { previousLead };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['lead', variables.id], context.previousLead);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
    }
  });

  const handleConvertToBooking = async (lead) => {
    const booking = await base44.entities.Booking.create({
      org_id: lead.org_id,
      property_id: lead.property_id,
      lead_id: lead.id,
      guest_name: lead.full_name,
      guest_phone: lead.phone,
      guest_email: lead.email,
      check_in_date: lead.check_in_date,
      check_out_date: lead.check_out_date,
      adults: lead.adults,
      notes: lead.notes,
      status: 'PENDING',
    });
    
    await updateMutation.mutateAsync({ id: lead.id, data: { status: 'WON' } });
    navigate(`${createPageUrl('BookingDetail')}/${booking.id}`);
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
      className="p-6 space-y-6 max-w-2xl mx-auto"
    >
      <div className="space-y-4">
        <h3 className="font-semibold text-[#0B1220] select-none">פרטי קשר</h3>
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#00D1C1]/10 rounded-xl flex items-center justify-center">
                <span className="text-lg font-bold text-[#00D1C1] select-none">
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
          <h3 className="font-semibold text-[#0B1220] select-none">תאריכים מבוקשים</h3>
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

      {lead.notes && (
        <div className="space-y-2">
          <h3 className="font-semibold text-[#0B1220] select-none">הערות</h3>
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{lead.notes}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-semibold text-[#0B1220] select-none">סטטוס</h3>
        <Select 
          value={lead.status} 
          onValueChange={(value) => updateMutation.mutate({ id: lead.id, data: { status: value } })}
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

      <Button 
        className="w-full bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl"
        onClick={() => handleConvertToBooking(lead)}
      >
        <ArrowLeftRight className="h-4 w-4 ml-2" />
        הפוך להזמנה
      </Button>
    </motion.div>
  );
}