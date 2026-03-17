import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2, Home, CalendarDays, ArrowLeft, ArrowRight,
  Check, SkipForward, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'org',      title: 'שם הארגון',          icon: Building2 },
  { key: 'property', title: 'הוספת נכס ראשון',    icon: Home },
  { key: 'booking',  title: 'הזמנה ראשונה',       icon: CalendarDays },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, checkAppState } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);

  const [orgForm, setOrgForm] = useState({
    name: user?.organization_name || '',
  });

  const [propertyForm, setPropertyForm] = useState({
    name: '',
    address: '',
    type: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    max_guests: 2,
    base_price: '',
  });

  const [bookingForm, setBookingForm] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    check_in_date: '',
    check_out_date: '',
    total_price: '',
    status: 'PENDING',
  });

  const [createdPropertyId, setCreatedPropertyId] = useState(null);

  const handleSaveOrg = async () => {
    if (!orgForm.name.trim()) return;
    setSaving(true);
    try {
      if (user?.organization_id) {
        await base44.entities.Organization.update(user.organization_id, {
          name: orgForm.name.trim(),
        });
      }
      setCompletedSteps(prev => [...prev, 'org']);
      setCurrentStep(1);
    } catch (err) {
      console.error('Failed to save org:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProperty = async () => {
    if (!propertyForm.name.trim()) return;
    setSaving(true);
    try {
      const property = await base44.entities.Property.create({
        name: propertyForm.name.trim(),
        address: propertyForm.address.trim(),
        type: propertyForm.type,
        bedrooms: parseInt(propertyForm.bedrooms) || 1,
        bathrooms: parseInt(propertyForm.bathrooms) || 1,
        max_guests: parseInt(propertyForm.max_guests) || 2,
        base_price: parseFloat(propertyForm.base_price) || null,
      });
      setCreatedPropertyId(property.id);
      setCompletedSteps(prev => [...prev, 'property']);
      setCurrentStep(2);
    } catch (err) {
      console.error('Failed to save property:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBooking = async () => {
    if (!bookingForm.guest_name.trim() || !bookingForm.check_in_date) return;
    setSaving(true);
    try {
      await base44.entities.Booking.create({
        guest_name: bookingForm.guest_name.trim(),
        guest_email: bookingForm.guest_email.trim(),
        guest_phone: bookingForm.guest_phone.trim(),
        check_in_date: bookingForm.check_in_date,
        check_out_date: bookingForm.check_out_date,
        total_price: parseFloat(bookingForm.total_price) || null,
        status: 'PENDING',
        property_id: createdPropertyId || undefined,
      });
      setCompletedSteps(prev => [...prev, 'booking']);
      await finishOnboarding();
    } catch (err) {
      console.error('Failed to save booking:', err);
    } finally {
      setSaving(false);
    }
  };

  const finishOnboarding = async () => {
    try {
      await checkAppState();
    } catch {}
    navigate('/Dashboard', { replace: true });
  };

  const handleSkipBooking = () => {
    finishOnboarding();
  };

  const stepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">שם הארגון</h2>
              <p className="text-sm text-gray-500 mt-1">
                בחר שם לארגון שלך. זה יופיע בחשבוניות ובתקשורת עם האורחים.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">שם הארגון *</Label>
              <Input
                value={orgForm.name}
                onChange={e => setOrgForm({ name: e.target.value })}
                placeholder="למשל: נופש בגליל בע״מ"
                className="h-12 text-base rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                autoFocus
              />
            </div>
            <Button
              onClick={handleSaveOrg}
              disabled={!orgForm.name.trim() || saving}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-xl shadow-lg shadow-indigo-500/25 gap-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowLeft className="w-5 h-5" />
              )}
              {saving ? 'שומר...' : 'המשך'}
            </Button>
          </div>
        );

      case 1:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Home className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">הוספת נכס ראשון</h2>
              <p className="text-sm text-gray-500 mt-1">
                הוסף את הנכס הראשון שלך. תוכל להוסיף עוד נכסים בהמשך.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">שם הנכס *</Label>
                <Input
                  value={propertyForm.name}
                  onChange={e => setPropertyForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="למשל: וילה בכנרת"
                  className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                  autoFocus
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">כתובת</Label>
                <Input
                  value={propertyForm.address}
                  onChange={e => setPropertyForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="רחוב, עיר"
                  className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">חדרי שינה</Label>
                <Input
                  type="number"
                  value={propertyForm.bedrooms}
                  onChange={e => setPropertyForm(p => ({ ...p, bedrooms: e.target.value }))}
                  min="1"
                  className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">אורחים מקסימום</Label>
                <Input
                  type="number"
                  value={propertyForm.max_guests}
                  onChange={e => setPropertyForm(p => ({ ...p, max_guests: e.target.value }))}
                  min="1"
                  className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">מחיר ללילה (₪)</Label>
                <Input
                  type="number"
                  value={propertyForm.base_price}
                  onChange={e => setPropertyForm(p => ({ ...p, base_price: e.target.value }))}
                  placeholder="0"
                  className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                />
              </div>
            </div>
            <Button
              onClick={handleSaveProperty}
              disabled={!propertyForm.name.trim() || saving}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 rounded-xl shadow-lg shadow-teal-500/25 gap-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowLeft className="w-5 h-5" />
              )}
              {saving ? 'שומר...' : 'הוסף נכס והמשך'}
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CalendarDays className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">הזמנה ראשונה</h2>
              <p className="text-sm text-gray-500 mt-1">
                הוסף הזמנה ראשונה, או דלג וצור הזמנות מאוחר יותר.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">שם האורח</Label>
                <Input
                  value={bookingForm.guest_name}
                  onChange={e => setBookingForm(p => ({ ...p, guest_name: e.target.value }))}
                  placeholder="שם מלא"
                  className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">אימייל</Label>
                <Input
                  value={bookingForm.guest_email}
                  onChange={e => setBookingForm(p => ({ ...p, guest_email: e.target.value }))}
                  placeholder="email@example.com"
                  className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">טלפון</Label>
                <Input
                  value={bookingForm.guest_phone}
                  onChange={e => setBookingForm(p => ({ ...p, guest_phone: e.target.value }))}
                  placeholder="050-0000000"
                  className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">תאריך כניסה</Label>
                <Input
                  type="date"
                  value={bookingForm.check_in_date}
                  onChange={e => setBookingForm(p => ({ ...p, check_in_date: e.target.value }))}
                  className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">תאריך יציאה</Label>
                <Input
                  type="date"
                  value={bookingForm.check_out_date}
                  onChange={e => setBookingForm(p => ({ ...p, check_out_date: e.target.value }))}
                  className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">מחיר כולל (₪)</Label>
                <Input
                  type="number"
                  value={bookingForm.total_price}
                  onChange={e => setBookingForm(p => ({ ...p, total_price: e.target.value }))}
                  placeholder="0"
                  className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSkipBooking}
                className="flex-1 h-12 text-base font-semibold rounded-xl border-gray-200 gap-2"
              >
                <SkipForward className="w-5 h-5" />
                דלג
              </Button>
              <Button
                onClick={handleSaveBooking}
                disabled={!bookingForm.guest_name.trim() || !bookingForm.check_in_date || saving}
                className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/25 gap-2"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                {saving ? 'שומר...' : 'צור הזמנה וסיים'}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl" style={{ fontFamily: "'Heebo', sans-serif" }}>
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/atlas-logo-final.png"
            alt="ATLAS"
            className="mx-auto mb-3"
            style={{ height: 48, width: 'auto', objectFit: 'contain' }}
          />
          <div className="flex items-center justify-center gap-1.5 text-indigo-600">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">בואו נתחיל!</span>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === currentStep;
            const isDone = completedSteps.includes(step.key);
            return (
              <React.Fragment key={step.key}>
                {idx > 0 && (
                  <div className={cn(
                    "h-0.5 w-10 rounded-full transition-colors",
                    idx <= currentStep ? 'bg-indigo-400' : 'bg-gray-200'
                  )} />
                )}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-110'
                    : isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-400'
                )}>
                  {isDone ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
          {stepContent()}
        </div>

        {/* Step count */}
        <p className="text-center text-sm text-gray-400 mt-4">
          שלב {currentStep + 1} מתוך {STEPS.length}
        </p>
      </div>
    </div>
  );
}
