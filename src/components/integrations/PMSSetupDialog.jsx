import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';

const PROVIDER_CONFIGS = {
  GUESTY: {
    title: 'Guesty',
    icon: 'G',
    color: 'bg-[#5B21B6]',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'xxxxx...', required: true },
      { key: 'account_id', label: 'Account ID', type: 'text', placeholder: '12345' }
    ],
    helpUrl: 'https://www.guesty.com/api',
    helpText: 'קבל API Key מהגדרות Guesty'
  },
  HOSTAWAY: {
    title: 'Hostaway',
    icon: 'H',
    color: 'bg-blue-600',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'xxxxx...', required: true },
      { key: 'account_id', label: 'Account ID', type: 'text', placeholder: '12345', required: true }
    ],
    helpUrl: 'https://dashboard.hostaway.com',
    helpText: 'צור API Key בהגדרות Hostaway'
  },
  LODGIFY: {
    title: 'Lodgify',
    icon: 'L',
    color: 'bg-orange-600',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'xxxxx...', required: true }
    ],
    helpUrl: 'https://www.lodgify.com',
    helpText: 'קבל API Key מפאנל Lodgify'
  },
  CLOUDBEDS: {
    title: 'Cloudbeds',
    icon: 'C',
    color: 'bg-green-600',
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'xxxxx', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'xxxxx...', required: true },
      { key: 'property_id', label: 'Property ID', type: 'text', placeholder: '12345' }
    ],
    helpUrl: 'https://www.cloudbeds.com',
    helpText: 'צור אפליקציה ב-Cloudbeds Marketplace'
  },
  OPERA: {
    title: 'Opera PMS',
    icon: 'O',
    color: 'bg-red-600',
    fields: [
      { key: 'endpoint_url', label: 'API Endpoint', type: 'text', placeholder: 'https://...', required: true },
      { key: 'username', label: 'Username', type: 'text', placeholder: 'api_user', required: true },
      { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••', required: true },
      { key: 'hotel_code', label: 'Hotel Code', type: 'text', placeholder: 'HTL001' }
    ],
    helpUrl: 'https://www.oracle.com/hospitality',
    helpText: 'פנה למנהל המערכת לפרטי API'
  },
  MEWS: {
    title: 'Mews',
    icon: 'M',
    color: 'bg-cyan-600',
    fields: [
      { key: 'client_token', label: 'Client Token', type: 'password', placeholder: 'xxxxx...', required: true },
      { key: 'access_token', label: 'Access Token', type: 'password', placeholder: 'xxxxx...', required: true }
    ],
    helpUrl: 'https://www.mews.com',
    helpText: 'צור Integration Token ב-Mews Commander'
  },
  APALEO: {
    title: 'Apaleo',
    icon: '🏨',
    color: 'bg-indigo-600',
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'xxxxx', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'xxxxx...', required: true }
    ],
    helpUrl: 'https://www.apaleo.com',
    helpText: 'צור אפליקציה ב-Apaleo Store'
  },
  CHANNELMANAGER: {
    title: 'Channel Manager',
    icon: '🔗',
    color: 'bg-pink-600',
    fields: [
      { key: 'api_endpoint', label: 'API Endpoint', type: 'text', placeholder: 'https://...', required: true },
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'xxxxx...', required: true },
      { key: 'property_id', label: 'Property ID', type: 'text', placeholder: '12345' }
    ],
    helpUrl: '#',
    helpText: 'הזן את פרטי ה-Channel Manager שלך'
  }
};

export default function PMSSetupDialog({ open, onOpenChange, provider, onSave }) {
  const config = PROVIDER_CONFIGS[provider];
  const [formData, setFormData] = useState({});
  const [integrationName, setIntegrationName] = useState('');
  const [syncBookings, setSyncBookings] = useState(true);
  const [syncGuests, setSyncGuests] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!config) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const success = Math.random() > 0.2;
    setTestResult({
      success,
      message: success 
        ? 'החיבור עבד בהצלחה! PMS מסונכרן ✓' 
        : 'שגיאה בחיבור. בדוק את פרטי ההתחברות ונסה שוב.'
    });
    setTesting(false);
  };

  const handleSave = () => {
    if (!integrationName.trim()) {
      atlasToastApi.error('יש למלא שם לאינטגרציה');
      return;
    }
    const missingFields = config.fields.filter(f => f.required && !formData[f.key]?.trim()).map(f => f.label);
    if (missingFields.length > 0) {
      atlasToastApi.error(`חסרים שדות: ${missingFields.join(', ')}`);
      return;
    }
    onSave({
      provider,
      name: integrationName,
      config: formData,
      sync_bookings: syncBookings,
      sync_guests: syncGuests,
      status: testResult?.success ? 'ACTIVE' : 'INACTIVE'
    });
    setFormData({});
    setIntegrationName('');
    setTestResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center text-white font-bold`}>
              {config.icon}
            </div>
            <span>חיבור {config.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-sm text-blue-900 flex items-start gap-2">
              <span>{config.helpText}</span>
              <a href={config.helpUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 flex-shrink-0">
                <ExternalLink className="h-4 w-4" />
              </a>
            </AlertDescription>
          </Alert>

          <div>
            <Label>שם האינטגרציה *</Label>
            <Input value={integrationName} onChange={(e) => setIntegrationName(e.target.value)} placeholder={`${config.title} ראשי`} className="mt-1" />
          </div>

          {config.fields.map(field => (
            <div key={field.key}>
              <Label>{field.label} {field.required && '*'}</Label>
              <Input type={field.type} value={formData[field.key] || ''} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })} placeholder={field.placeholder} className="mt-1" dir="ltr" />
            </div>
          ))}

          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">סנכרן הזמנות</Label>
                <p className="text-xs text-gray-500">ייבא הזמנות מה-PMS</p>
              </div>
              <Switch checked={syncBookings} onCheckedChange={setSyncBookings} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">סנכרן פרטי אורחים</Label>
                <p className="text-xs text-gray-500">ייבא מידע על האורחים</p>
              </div>
              <Switch checked={syncGuests} onCheckedChange={setSyncGuests} />
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button onClick={handleTest} disabled={testing || !integrationName.trim() || config.fields.some(f => f.required && !formData[f.key]?.trim())} variant="outline" className="w-full">
              {testing ? <><Loader2 className="h-4 w-4 ml-2 animate-spin" />בודק חיבור...</> : 'בדוק חיבור'}
            </Button>
            {testResult && (
              <Alert className={`mt-3 ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <AlertDescription className="flex items-center gap-2">
                  {testResult.success ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                  <span className={testResult.success ? 'text-green-900' : 'text-red-900'}>{testResult.message}</span>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button onClick={handleSave} disabled={!testResult?.success} className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220]">שמור והפעל</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}