import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Logo from '@/components/common/Logo';
import { motion } from 'framer-motion';

export default function GuestService() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking');
  const propertyId = searchParams.get('property');
  
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
      // In a real app, this would be a public endpoint
      // For now, we'll use the regular API
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
      booking_id: bookingId,
      property_id: propertyId,
      org_id: 'demo_org' // This would come from the booking/property lookup
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
      <div dir="rtl" className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-[#00D1C1] shadow-xl">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 bg-gradient-to-br from-[#00D1C1] to-[#00B8AA] rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="h-10 w-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-3">הבקשה נשלחה בהצלחה!</h2>
              <p className="text-[#64748B] leading-relaxed">
                קיבלנו את הבקשה שלך ונטפל בה בהקדם.<br />
                תקבל עדכון ברגע שהבעיה תטופל.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-white">
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-8 text-center">
          <Logo variant="dark" size="large" />
          <h1 className="text-3xl font-bold text-[#0F172A] mt-6 mb-2">שירות חדרים</h1>
          <p className="text-[#64748B]">יש בעיה או צורך? נשמח לעזור</p>
        </div>

        <Card className="shadow-xl border-[#E5E7EB]">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="guest_name">שם מלא *</Label>
                  <Input
                    id="guest_name"
                    value={formData.guest_name}
                    onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                    placeholder="הכנס שם מלא"
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
                    placeholder="050-1234567"
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
                    <SelectTrigger className="mt-2">
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
                    <SelectTrigger className="mt-2">
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
                  placeholder="אנא תאר את הבעיה או הבקשה בפירוט..."
                  required
                  className="mt-2 min-h-32"
                />
              </div>

              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full bg-[#00D1C1] hover:bg-[#00B8AA] text-[#0F172A] h-12 text-base font-semibold"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                    שולח...
                  </>
                ) : (
                  'שלח בקשה'
                )}
              </Button>

              {submitMutation.isError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">אירעה שגיאה. אנא נסה שוב.</p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-[#64748B] mt-6">
          נטפל בבקשתך בהקדם האפשרי ונעדכן אותך
        </p>
      </div>
    </div>
  );
}