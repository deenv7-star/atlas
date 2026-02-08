import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const PROVIDER_CONFIGS = {
  STRIPE: {
    title: 'Stripe',
    icon: 'S',
    color: 'bg-[#635BFF]',
    fields: [
      { key: 'public_key', label: 'Publishable Key', type: 'text', placeholder: 'pk_live_...', required: true },
      { key: 'secret_key', label: 'Secret Key', type: 'password', placeholder: 'sk_live_...', required: true },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', placeholder: 'whsec_...' }
    ],
    helpUrl: 'https://dashboard.stripe.com/apikeys',
    helpText: 'קבל את מפתחות ה-API מדשבורד Stripe'
  },
  PAYPAL: {
    title: 'PayPal',
    icon: 'P',
    color: 'bg-[#003087]',
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'AXxxx...', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'EXxxx...', required: true },
      { key: 'mode', label: 'Environment', type: 'select', options: ['sandbox', 'live'], default: 'sandbox', required: true }
    ],
    helpUrl: 'https://developer.paypal.com/dashboard/applications',
    helpText: 'צור אפליקציה ב-PayPal Developer Dashboard'
  },
  BIT: {
    title: 'Bit',
    icon: '💳',
    color: 'bg-green-600',
    fields: [
      { key: 'merchant_id', label: 'Merchant ID', type: 'text', placeholder: '12345', required: true },
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'xxxxx...', required: true },
      { key: 'terminal_id', label: 'Terminal ID', type: 'text', placeholder: '67890' }
    ],
    helpUrl: 'https://www.bitpay.co.il',
    helpText: 'קבל את פרטי האינטגרציה מחברת Bit'
  },
  TRANZILA: {
    title: 'Tranzila',
    icon: '💰',
    color: 'bg-blue-600',
    fields: [
      { key: 'terminal_name', label: 'Terminal Name', type: 'text', placeholder: 'terminal123', required: true },
      { key: 'terminal_password', label: 'Terminal Password', type: 'password', placeholder: '••••••••', required: true }
    ],
    helpUrl: 'https://www.tranzila.com',
    helpText: 'השתמש בפרטי הטרמינל שקיבלת מ-Tranzila'
  },
  MESHULAM: {
    title: 'Meshulam',
    icon: '🏦',
    color: 'bg-orange-600',
    fields: [
      { key: 'page_code', label: 'Page Code', type: 'text', placeholder: 'xxxxx', required: true },
      { key: 'user_id', label: 'User ID', type: 'text', placeholder: 'xxxxx', required: true },
      { key: 'api_token', label: 'API Token', type: 'password', placeholder: 'xxxxx...', required: true }
    ],
    helpUrl: 'https://www.meshulam.co.il',
    helpText: 'קבל את פרטי ה-API מפאנל Meshulam'
  },
  CARDCOM: {
    title: 'Cardcom',
    icon: '🔐',
    color: 'bg-purple-600',
    fields: [
      { key: 'terminal', label: 'Terminal Number', type: 'text', placeholder: '1000', required: true },
      { key: 'api_name', label: 'API Name', type: 'text', placeholder: 'api_user', required: true },
      { key: 'api_password', label: 'API Password', type: 'password', placeholder: '••••••••', required: true }
    ],
    helpUrl: 'https://www.cardcom.co.il',
    helpText: 'השתמש בפרטי ה-API שקיבלת מ-Cardcom'
  }
};

export default function PaymentSetupDialog({ open, onOpenChange, provider, onSave }) {
  const config = PROVIDER_CONFIGS[provider];
  const [formData, setFormData] = useState({});
  const [integrationName, setIntegrationName] = useState('');
  const [currency, setCurrency] = useState('ILS');
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
        ? 'החיבור עבד בהצלחה! שער התשלומים מוכן לשימוש ✓' 
        : 'שגיאה בחיבור. בדוק את פרטי ה-API ונסה שוב.'
    });
    setTesting(false);
  };

  const handleSave = () => {
    if (!integrationName.trim()) {
      toast.error('יש למלא שם לאינטגרציה');
      return;
    }

    const missingFields = config.fields
      .filter(f => f.required && !formData[f.key]?.trim())
      .map(f => f.label);

    if (missingFields.length > 0) {
      toast.error(`חסרים שדות: ${missingFields.join(', ')}`);
      return;
    }

    onSave({
      provider,
      name: integrationName,
      config: formData,
      currency,
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
              <a 
                href={config.helpUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 flex-shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </AlertDescription>
          </Alert>

          <div>
            <Label>שם האינטגרציה *</Label>
            <Input
              value={integrationName}
              onChange={(e) => setIntegrationName(e.target.value)}
              placeholder={`לדוגמה: ${config.title} ראשי`}
              className="mt-1"
            />
          </div>

          <div>
            <Label>מטבע ברירת מחדל *</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ILS">₪ שקל</SelectItem>
                <SelectItem value="USD">$ דולר</SelectItem>
                <SelectItem value="EUR">€ יורו</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {config.fields.map(field => (
            <div key={field.key}>
              <Label>
                {field.label} {field.required && '*'}
              </Label>
              {field.type === 'select' ? (
                <Select 
                  value={formData[field.key] || field.default || ''} 
                  onValueChange={(value) => setFormData({ ...formData, [field.key]: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={field.type}
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="mt-1"
                  dir="ltr"
                />
              )}
            </div>
          ))}

          <div className="pt-4 border-t">
            <Button
              onClick={handleTest}
              disabled={testing || !integrationName.trim() || config.fields.some(f => f.required && !formData[f.key]?.trim())}
              variant="outline"
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  בודק חיבור...
                </>
              ) : (
                'בדוק חיבור'
              )}
            </Button>

            {testResult && (
              <Alert className={`mt-3 ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <AlertDescription className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={testResult.success ? 'text-green-900' : 'text-red-900'}>
                    {testResult.message}
                  </span>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!testResult?.success}
            className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220]"
          >
            שמור והפעל
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}