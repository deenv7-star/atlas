import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info, ChevronRight, CheckCircle2, ExternalLink } from 'lucide-react';

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
    instructions: 'היכנס לאתר Airbnb → לחץ על "Calendar" למטה → בחר את הנכס → לחץ על "Availability Settings" → גלול ל-"Calendar Sync" → העתק את ה-URL שמתחת ל-"Export Calendar"',
    helpUrl: 'https://www.airbnb.com/help/article/99',
    color: 'bg-[#FF5A5F]'
  },
  BOOKING_COM: { 
    name: 'Booking.com', 
    icon: '🏨',
    instructions: 'היכנס ל-Extranet של Booking.com → Properties → בחר נכס → Calendar → Calendar import/export → העתק את קישור ה-"Export" (iCal URL)',
    helpUrl: 'https://partner.booking.com/en-gb/help/rates-availability/how-can-i-synchronise-my-booking-com-calendar-other-platforms',
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
      // Validate iCal URL format
      if (!icalUrl.startsWith('http://') && !icalUrl.startsWith('https://')) {
        alert('כתובת iCal חייבת להתחיל ב-https:// או http://');
        return;
      }
      
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
              <div className="bg-amber-50 p-3 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800 flex-1">
                    <p className="font-medium mb-1">איך מוצאים את כתובת iCal:</p>
                    <p>{CALENDAR_PROVIDERS[selectedProvider]?.instructions}</p>
                  </div>
                </div>
                {CALENDAR_PROVIDERS[selectedProvider]?.helpUrl && (
                  <a 
                    href={CALENDAR_PROVIDERS[selectedProvider].helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-medium"
                  >
                    <ExternalLink className="h-3 w-3" />
                    הוראות מפורטות מהאתר הרשמי
                  </a>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">הדבק כתובת iCal</Label>
                <Input
                  value={icalUrl}
                  onChange={(e) => setIcalUrl(e.target.value)}
                  placeholder="https://www.airbnb.com/calendar/ical/..."
                  dir="ltr"
                  className="text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">הכתובת חייבת להתחיל ב-https://</p>
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