import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Wordmark } from '@/components/app/shell/shared';
import { motion } from 'framer-motion';

export default function GuestService() {
  const [searchParams] = useSearchParams();
  // Personal link from the hosts: /guest-service?t=<booking guest_token> (migration 013b validates it)
  const token = searchParams.get('t') || searchParams.get('token') || '';
  const bookingId = searchParams.get('booking');
  const propertyId = searchParams.get('property');
  const needsToken = isSupabaseConfigured && token.length < 16;
  
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_phone: '',
    request_type: 'MAINTENANCE',
    title: '',
    description: '',
    urgency: 'MEDIUM'
  });

  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      if (isSupabaseConfigured && supabase) {
        const { data: res, error } = await supabase.rpc('submit_guest_service', {
          p_token: token,
          p_guest_name: data.guest_name,
          p_guest_phone: data.guest_phone,
          p_request_type: data.request_type,
          p_title: data.title,
          p_description: data.description,
          p_urgency: data.urgency,
        });
        if (error) {
          const he = /[\u0590-\u05FF]/.test(error.message || '');
          throw new Error(he ? error.message : 'לא הצלחנו לשלוח את הבקשה. נסו שוב בעוד רגע.');
        }
        return res;
      }
      return await base44.entities.GuestRequest.create(data);
    },
    onSuccess: () => {
      setSubmitted(true);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate({
      ...formData,
      booking_id: bookingId || null,
      property_id: propertyId || null,
      // org_id is filled from the signed-in user's profile by the data client;
      // the old hardcoded 'demo_org' was not a uuid and always failed.
    });
  };

  const requestTypes = {
    MAINTENANCE: 'תחזוקה ותיקונים',
    AMENITY: 'שירותים ואבזור',
    CLEANING: 'ניקיון',
    COMPLAINT: 'תלונה',
    QUESTION: 'שאלה',
    OTHER: 'אחר'
  };

  const urgencyLevels = {
    LOW: 'נמוך',
    MEDIUM: 'בינוני',
    HIGH: 'גבוה',
    URGENT: 'דחוף מאוד'
  };

  if (submitted) {
    return (
      <div dir="rtl" className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-[#E5E7EB] shadow-card">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 bg-[#3E2BF1] rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="h-10 w-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-navy-900 mb-3">הבקשה נשלחה</h2>
              <p className="text-[#64748B] leading-relaxed">
                הבקשה הגיעה למארחים, והם יחזרו אליכם בהקדם.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (needsToken) {
    return (
      <div dir="rtl" className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 flex justify-center"><Wordmark size={28} /></div>
          <div className="v7-card p-8">
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-[#3E2BF1]" aria-hidden />
            <h1 className="text-xl font-bold text-navy-900 mb-2">הקישור הזה לא מלא</h1>
            <p className="text-[15px] text-ink-600 leading-relaxed">
              טופס השירות נפתח מהקישור האישי שקיבלתם מהמארחים לשהייה שלכם.
              בקשו מהם לשלוח אותו שוב, או פנו אליהם ישירות.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-canvas">
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-8 text-center">
          <div className="flex justify-center"><Wordmark size={28} /></div>
          <h1 className="text-3xl font-bold text-navy-900 mt-6 mb-2">שירות חדרים</h1>
          <p className="text-[#64748B]">יש בעיה או צורך? נשמח לעזור</p>
        </div>

        <Card className="shadow-card border-[#E5E7EB]">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="guest_name">שם מלא *</Label>
                  <Input
                    id="guest_name"
                    value={formData.guest_name}
                    onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                    placeholder="השם שלכם" autoComplete="name"
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="guest_phone">טלפון *</Label>
                  <Input
                    id="guest_phone"
                    type="tel"
                    value={formData.guest_phone}
                    onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                    placeholder="050-1234567" inputMode="tel" autoComplete="tel" dir="ltr"
                    required
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="request_type">סוג הבקשה *</Label>
                  <Select
                    value={formData.request_type}
                    onValueChange={(value) => setFormData({ ...formData, request_type: value })}
                  >
                    <SelectTrigger id="request_type" aria-label="סוג הבקשה" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(requestTypes).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="urgency">רמת דחיפות *</Label>
                  <Select
                    value={formData.urgency}
                    onValueChange={(value) => setFormData({ ...formData, urgency: value })}
                  >
                    <SelectTrigger id="urgency" aria-label="רמת דחיפות" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(urgencyLevels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">כותרת *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="למשל: הבריכה לא מחוממת"
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description">תיאור מפורט *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="ספרו לנו מה קרה ומה צריך"
                  required
                  className="mt-2 min-h-32"
                />
              </div>

              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white h-12 text-base font-semibold"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                    שולחים…
                  </>
                ) : (
                  'שליחת הבקשה'
                )}
              </Button>

              {submitMutation.isError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">{submitMutation.error?.message || 'לא הצלחנו לשלוח. נסו שוב בעוד רגע.'}</p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-[#64748B] mt-6">
          הבקשה עוברת ישירות למארחים של השהייה שלכם
        </p>
      </div>
    </div>
  );
}