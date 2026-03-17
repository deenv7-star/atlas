import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const email = location.state?.email || '';
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  // Redirect if already authenticated (e.g. just verified via email link)
  useEffect(() => {
    if (isAuthenticated) {
      navigate(user?.onboarding_completed ? '/dashboard' : '/onboarding', { replace: true });
    }
  }, [isAuthenticated, user?.onboarding_completed, navigate]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        navigate('/onboarding', { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleResend = async () => {
    if (!email || countdown > 0) return;
    setResending(true);
    try {
      await supabase.auth.resend({ type: 'signup', email });
      setResent(true);
      setCountdown(60);
      setTimeout(() => setResent(false), 4000);
    } catch {
      // silently ignore
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 px-4 py-12" dir="rtl" style={{ fontFamily: "'Heebo', sans-serif" }}>
      <div className="w-full max-w-[440px] text-center">
        {/* Logo */}
        <img
          src="/atlas-logo-final.png"
          alt="ATLAS"
          className="mx-auto mb-10"
          style={{ height: 56, width: 'auto', objectFit: 'contain' }}
        />

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-8">
          {/* Animated mail icon */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-20" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Mail className="w-9 h-9 text-white" />
            </div>
          </div>

          <h1 className="text-xl font-extrabold text-gray-900 mb-2">
            שלחנו לך מייל לאימות
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-2">
            לחץ על הקישור שקיבלת כדי לאמת את החשבון שלך
          </p>

          {email && (
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 font-semibold text-sm px-4 py-2 rounded-full mb-6">
              <Mail className="w-3.5 h-3.5" />
              {email}
            </div>
          )}

          <div className="border-t border-gray-100 pt-6 mt-2">
            <p className="text-gray-400 text-sm mb-4">לא קיבלת את המייל?</p>

            {resent ? (
              <div className="flex items-center justify-center gap-2 text-emerald-600 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                מייל נשלח מחדש!
              </div>
            ) : (
              <Button
                onClick={handleResend}
                disabled={resending || countdown > 0}
                variant="outline"
                className="h-11 px-6 rounded-xl font-semibold gap-2 border-gray-200"
              >
                {resending ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {countdown > 0 ? `שלח שוב (${countdown}s)` : 'שלח שוב'}
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link to="/login" className="text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
            חזרה להתחברות
          </Link>
        </p>
      </div>
    </div>
  );
}
