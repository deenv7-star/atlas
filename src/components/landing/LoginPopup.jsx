import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

export default function LoginPopup({ isOpen, onClose }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  const handleGoogleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  const handleFacebookLogin = () => {
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  const handleSignUp = () => {
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Popup */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="pointer-events-auto w-full max-w-md"
            >
              <Card className="w-full relative overflow-hidden border-2 border-gray-200 shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Gradient Header */}
                <div className="h-24 sm:h-32 bg-gradient-to-br from-[#00D1C1] to-[#00B8A9] relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">ברוכים הבאים</h2>
                  </div>
                </div>

                <CardContent className="p-6 sm:p-8 -mt-6">
                  <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6">
                    <p className="text-center text-gray-600 text-sm sm:text-base mb-5 sm:mb-6">
                      התחברו כדי להמשיך לחשבון שלכם
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                      {/* Email Input */}
                      <div className="relative">
                        <Mail className="absolute right-3 top-3 w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="אימייל"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pr-10 h-11 sm:h-12 text-right text-sm sm:text-base"
                          required
                        />
                      </div>

                      {/* Password Input */}
                      <div className="relative">
                        <Lock className="absolute right-3 top-3 w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="סיסמה"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pr-10 pl-10 h-11 sm:h-12 text-right text-sm sm:text-base"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-3 text-gray-400 hover:text-gray-600 active:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="w-4 sm:w-5 h-4 sm:h-5" /> : <Eye className="w-4 sm:w-5 h-4 sm:h-5" />}
                        </button>
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        className="w-full h-11 sm:h-12 bg-gradient-to-r from-[#00D1C1] to-[#00B8A9] hover:shadow-lg text-white font-semibold text-base sm:text-lg"
                      >
                        התחברות
                      </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-4 sm:my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-500 text-xs sm:text-sm">או</span>
                      </div>
                    </div>

                    {/* Social Login */}
                    <div className="space-y-2 sm:space-y-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 sm:h-12 border-2 text-sm sm:text-base"
                        onClick={handleGoogleLogin}
                      >
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 sm:w-5 h-4 sm:h-5 ml-2" />
                        המשך עם Google
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 sm:h-12 border-2 text-sm sm:text-base"
                        onClick={handleFacebookLogin}
                      >
                        <svg className="w-4 sm:w-5 h-4 sm:h-5 ml-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" />
                        </svg>
                        המשך עם Facebook
                      </Button>
                    </div>

                    {/* Sign Up Link */}
                    <p className="text-center text-xs sm:text-sm text-gray-600 mt-4 sm:mt-6">
                      אין לכם חשבון?{' '}
                      <button 
                        onClick={handleSignUp}
                        className="text-[#00D1C1] font-semibold hover:underline active:opacity-70"
                      >
                        הרשמו כאן
                      </button>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}