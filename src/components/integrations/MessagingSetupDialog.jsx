import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';

const PROVIDER_CONFIGS = {
  WHATSAPP: {
    title: 'WhatsApp Business API',
    icon: '💬',
    color: 'bg-[#25D366]',
    fields: [
      { key: 'phone_number_id', label: 'Phone Number ID', type: 'text', placeholder: '1234567890', required: true },
      { key: 'access_token', label: 'Access Token', type: 'password', placeholder: 'EAAxxxxx...', required: true },
      { key: 'business_account_id', label: 'Business Account ID', type: 'text', placeholder: '1234567890' }
    ],
    helpUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started',
    helpText: 'קבל את פרטי ה-API מ-Meta Business Suite'
  },
  EMAIL_SMTP: {
    title: 'Email (SMTP)',
    icon: '📧',
    color: 'bg-gray-600',
    fields: [
      { key: 'smtp_host', label: 'SMTP Host', type: 'text', placeholder: 'smtp.gmail.com', required: true },
      { key: 'smtp_port', label: 'SMTP Port', type: 'number', placeholder: '587', required: true },
      { key: 'smtp_username', label: 'Username/Email', type: 'email', placeholder: 'you@example.com', required: true },
      { key: 'smtp_password', label: 'Password/App Password', type: 'password', placeholder: '••••••••', required: true },
      { key: 'from_name', label: 'From Name', type: 'text', placeholder: 'ATLAS Notifications', required: true },
      { key: 'from_email', label: 'From Email', type: 'email', placeholder: 'noreply@yourdomain.com', required: true }
    ],
    helpUrl: 'https://support.google.com/mail/answer/7126229',
    helpText: 'השתמש ב-App Password אם יש הפעלת 2FA'
  },
  SMS_TWILIO: {
    title: 'SMS (Twilio)',
    icon: '📱',
    color: 'bg-[#F22F46]',
    fields: [
      { key: 'account_sid', label: 'Account SID', type: 'text', placeholder: 'ACxxxxx...', required: true },
      { key: 'auth_token', label: 'Auth Token', type: 'password', placeholder: 'xxxxx...', required: true },
      { key: 'from_number', label: 'Twilio Phone Number', type: 'tel', placeholder: '+972501234567', required: true }
    ],
    helpUrl: 'https://www.twilio.com/console',
    helpText: 'קבל את הפרטים מקונסולת Twilio'
  },
  SENDGRID: {
    title: 'SendGrid',
    icon: '📬',
    color: 'bg-blue-500',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'SG.xxxxx...', required: true },
      { key: 'from_name', label: 'From Name', type: 'text', placeholder: 'ATLAS', required: true },
      { key: 'from_email', label: 'From Email', type: 'email', placeholder: 'noreply@yourdomain.com', required: true }
    ],
    helpUrl: 'https://app.sendgrid.com/settings/api_keys',
    helpText: 'צור API Key מהגדרות SendGrid'
  },
  TELEGRAM: {
    title: 'Telegram Bot',
    icon: '✈️',
    color: 'bg-[#0088cc]',
    fields: [
      { key: 'bot_token', label: 'Bot Token', type: 'password', placeholder: '123456789:ABCdef...', required: true }
    ],
    helpUrl: 'https://core.telegram.org/bots#creating-a-new-bot',
    helpText: 'צור בוט דרך @BotFather ב-Telegram'
  }
};

export default function MessagingSetupDialog({ open, onOpenChange, provider, onSave }) {
  const config = PROVIDER_CONFIGS[provider];
  const [formData, setFormData] = useState({});
  const [integrationName, setIntegrationName] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!config) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock test - in real implementation, this would call a backend endpoint
    const success = Math.random() > 0.2; // 80% success rate for demo
    
    setTestResult({
      success,
      message: success 
        ? 'החיבור עבד בהצלחה! ✓' 
        : 'שגיאה בחיבור. בדוק את הפרטים שוב.'
    });
    setTesting(false);
  };

  const handleSave = () => {
    if (!integrationName.trim()) {
      atlasToastApi.error('יש למלא שם לאינטגרציה');
      return;
    }

    const missingFields = config.fields
      .filter(f => f.required && !formData[f.key]?.trim())
      .map(f => f.label);

    if (missingFields.length > 0) {
      atlasToastApi.error(`חסרים שדות: ${missingFields.join(', ')}`);
      return;
    }

    onSave({
      provider,
      name: integrationName,
      config: formData,
      status: testResult?.success ? 'ACTIVE' : 'INACTIVE'
    });

    // Reset form
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
          {/* Help Banner */}
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

          {/* Integration Name */}
          <div>
            <Label>שם האינטגרציה *</Label>
            <Input
              value={integrationName}
              onChange={(e) => setIntegrationName(e.target.value)}
              placeholder={`לדוגמה: ${config.title} ראשי`}
              className="mt-1"
            />
          </div>

          {/* Dynamic Fields */}
          {config.fields.map(field => (
            <div key={field.key}>
              <Label>
                {field.label} {field.required && '*'}
              </Label>
              <Input
                type={field.type}
                value={formData[field.key] || ''}
                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className="mt-1"
                dir={field.type === 'email' || field.type === 'tel' ? 'ltr' : 'rtl'}
              />
            </div>
          ))}

          {/* Test Connection */}
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