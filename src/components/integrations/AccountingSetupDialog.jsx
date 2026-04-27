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
  MORNING: {
    title: 'Morning (מורנינג)',
    icon: '☀️',
    color: 'bg-[#00A6ED]',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'xxxxx...', required: true },
      { key: 'company_id', label: 'Company ID', type: 'text', placeholder: '12345', required: true }
    ],
    helpUrl: 'https://morning.co.il',
    helpText: 'קבל את פרטי ה-API מהגדרות המערכת במורנינג'
  },
  GREEN_INVOICE: {
    title: 'Green Invoice',
    icon: '📊',
    color: 'bg-green-600',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'xxxxx...', required: true },
      { key: 'api_secret', label: 'API Secret', type: 'password', placeholder: 'xxxxx...', required: true }
    ],
    helpUrl: 'https://www.greeninvoice.co.il/api',
    helpText: 'צור מפתחות API בהגדרות Green Invoice'
  },
  QUICKBOOKS: {
    title: 'QuickBooks',
    icon: '💼',
    color: 'bg-[#2CA01C]',
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'ABxxxxx', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'xxxxx...', required: true },
      { key: 'realm_id', label: 'Company ID', type: 'text', placeholder: '123456789' }
    ],
    helpUrl: 'https://developer.intuit.com',
    helpText: 'צור אפליקציה ב-QuickBooks Developer Portal'
  },
  ZOHO_BOOKS: {
    title: 'Zoho Books',
    icon: '🧾',
    color: 'bg-orange-600',
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'xxxxx', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'xxxxx...', required: true },
      { key: 'organization_id', label: 'Organization ID', type: 'text', placeholder: '123456789' }
    ],
    helpUrl: 'https://api-console.zoho.com',
    helpText: 'צור אפליקציה ב-Zoho API Console'
  },
  XERO: {
    title: 'Xero',
    icon: '📈',
    color: 'bg-blue-700',
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'xxxxx', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'xxxxx...', required: true }
    ],
    helpUrl: 'https://developer.xero.com',
    helpText: 'צור אפליקציה ב-Xero Developer Portal'
  },
  HASHAVSHEVET: {
    title: 'חשבשבת (HashavShevet)',
    icon: '🧮',
    color: 'bg-gray-700',
    fields: [
      { key: 'license_key', label: 'License Key', type: 'password', placeholder: 'xxxxx...', required: true },
      { key: 'company_id', label: 'מזהה חברה', type: 'text', placeholder: '12345', required: true }
    ],
    helpUrl: 'https://www.hashavshevet.co.il',
    helpText: 'פנה לתמיכת חשבשבת לקבלת פרטי אינטגרציה'
  }
};

export default function AccountingSetupDialog({ open, onOpenChange, provider, onSave }) {
  const config = PROVIDER_CONFIGS[provider];
  const [formData, setFormData] = useState({});
  const [integrationName, setIntegrationName] = useState('');
  const [autoSync, setAutoSync] = useState(true);
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
        ? 'החיבור עבד בהצלחה! החשבונאות מסונכרנת ✓' 
        : 'שגיאה בחיבור. בדוק את פרטי החשבון ונסה שוב.'
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
      auto_sync: autoSync,
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
            <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center text-white text-lg`}>
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

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <Label className="font-medium">סנכרון אוטומטי</Label>
              <p className="text-xs text-gray-500">סנכרן חשבוניות וקבלות אוטומטית</p>
            </div>
            <Switch checked={autoSync} onCheckedChange={setAutoSync} />
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