import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info, ChevronRight, CheckCircle2 } from 'lucide-react';

const CALENDAR_PROVIDERS = {
  GOOGLE: { 
    name: 'Google Calendar', 
    icon: '📅',
    instructions: 'זה קל מאוד! עבור ל-Google Calendar → הגדרות → שיתוף יומן → עתק את כתובת iCal',
    color: 'bg-blue-500'
  },
  OUTLOOK: { 
    name: 'Outlook', 
    icon: '📆',
    instructions: 'בעמוד הבית של Outlook → הפעולות → שתף יומן זה → הצג עמודי קישור → עתק את כתובת iCal',
    color: 'bg-cyan-600'
  },
  AIRBNB: { 
    name: 'Airbnb', 
    icon: '🏠',
    instructions: 'עבור ל-Airbnb → ניהול רכוש שלך → ערוץ Airbnb → יומן → סיכום → כתובת iCal',
    color: 'bg-[#FF5A5F]'
  },
  BOOKING_COM: { 
    name: 'Booking.com', 
    icon: '🏨',
    instructions: 'כנס ל-Booking.com → הגדרות בעלות נכס → ערוצים שלי → סינכרון יומן → הורד כתובת iCal',
    color: 'bg-blue-700'
  },
  ICAL: { 
    name: 'iCal (כללי)', 
    icon: '📋',
    instructions: 'הדבק כתובת iCal כלשהי מכל מקור שתומך ב-iCal',
    color: 'bg-gray-600'
  }
};

export default function CalendarSetupWizard({ open, onOpenChange, onSelect, properties, selectedPropertyId, onPropertyChange }) {
  const [step, setStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [icalUrl, setIcalUrl] = useState('');

  const handleNext = () => {
    if (step === 1 && !selectedPropertyId) return;
    if (step === 2 && !selectedProvider) return;
    if (step === 3 && !icalUrl) return;
    
    if (step === 3) {
      onSelect({
        provider: selectedProvider,
        sync_direction: 'IMPORT',
        ical_url: icalUrl
      });
      setStep(1);
      setSelectedProvider('');
      setIcalUrl('');
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const resetWizard = () => {
    setStep(1);
    setSelectedProvider('');
    setIcalUrl('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>אשף חיבור יומן</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">{step}/3</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Select Property */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="bg-blue-50 p-3 rounded-lg flex gap-2">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">בחר את הנכס שברצונך לסנכרן את היומן שלו</p>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">בחר נכס</Label>
                <Select value={selectedPropertyId} onValueChange={onPropertyChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר נכס..." />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Select Provider */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="bg-green-50 p-3 rounded-lg flex gap-2">
                <Info className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">בחר מאיזה מקור תרצה לייבא את היומן</p>
              </div>
              <div className="space-y-2">
                {Object.entries(CALENDAR_PROVIDERS).map(([key, provider]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedProvider(key)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-right ${
                      selectedProvider === key 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{provider.icon}</span>
                      <span className="font-medium text-gray-900">{provider.name}</span>
                      {selectedProvider === key && <CheckCircle2 className="h-5 w-5 text-blue-500 mr-auto" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Get iCal URL */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="bg-amber-50 p-3 rounded-lg flex gap-2">
                <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">איך מוצאים את כתובת iCal:</p>
                  <p>{CALENDAR_PROVIDERS[selectedProvider]?.instructions}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">הדבק כתובת iCal</Label>
                <Input
                  value={icalUrl}
                  onChange={(e) => setIcalUrl(e.target.value)}
                  placeholder="https://..."
                  dir="ltr"
                  className="text-xs"
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                חזור
              </Button>
            )}
            <Button 
              onClick={handleNext} 
              disabled={
                (step === 1 && !selectedPropertyId) ||
                (step === 2 && !selectedProvider) ||
                (step === 3 && !icalUrl)
              }
              className="flex-1"
            >
              {step === 3 ? 'הוסף סנכרון' : 'הבא'} <ChevronRight className="h-4 w-4 mr-1" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}