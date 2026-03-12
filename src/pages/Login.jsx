import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Building2 } from 'lucide-react';

export default function Login() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    organization_name: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.full_name.trim() || !form.email.trim()) {
      setError('נא למלא שם מלא וכתובת אימייל');
      return;
    }

    const userObj = {
      id: `user_${Date.now()}`,
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      organization_id: `org_${Date.now()}`,
      organization_name: form.organization_name.trim() || 'הארגון שלי',
      subscription_plan: 'pro',
      created_date: new Date().toISOString(),
    };

    loginUser(userObj);

    const returnUrl = searchParams.get('return');
    if (returnUrl) {
      window.location.href = returnUrl;
    } else {
      navigate('/Dashboard');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B1220] via-[#0f1d35] to-[#0B1220] px-4"
      dir="rtl"
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#00D1C1] flex items-center justify-center shadow-lg">
              <Building2 className="w-5 h-5 text-[#0B1220]" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">ATLAS</span>
          </div>
          <p className="text-white/50 text-sm">מערכת ניהול נכסים לטווח קצר</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">כניסה למערכת</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="text-white/70 text-sm">שם מלא</Label>
              <Input
                id="full_name"
                type="text"
                placeholder="ישראל ישראלי"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#00D1C1] focus:ring-[#00D1C1]/30"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/70 text-sm">כתובת אימייל</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#00D1C1] focus:ring-[#00D1C1]/30"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="org" className="text-white/70 text-sm">שם הארגון (אופציונלי)</Label>
              <Input
                id="org"
                type="text"
                placeholder="חברת הנכסים שלי"
                value={form.organization_name}
                onChange={e => setForm(f => ({ ...f, organization_name: e.target.value }))}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#00D1C1] focus:ring-[#00D1C1]/30"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] font-semibold h-11 rounded-xl mt-2 gap-2"
            >
              <LogIn className="w-4 h-4" />
              כניסה
            </Button>
          </form>

          <p className="text-white/30 text-xs text-center mt-6 leading-relaxed">
            המידע נשמר באופן מקומי בדפדפן שלך.
            <br />
            אין צורך בחשבון חיצוני.
          </p>
        </div>
      </div>
    </div>
  );
}
