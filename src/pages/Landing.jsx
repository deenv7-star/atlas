import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Logo from '@/components/common/Logo';
import { translations } from '@/components/common/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle2, 
  Users, 
  Calendar, 
  CreditCard, 
  Sparkles, 
  MessageSquare, 
  FileText,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  Inbox,
  CalendarCheck,
  Wallet,
  Brush,
  Send,
  FileSignature,
  Star
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
  const t = translations.he;
  const [openFaq, setOpenFaq] = useState(null);
  const navigate = useNavigate();

  const features = [
    { icon: Inbox, title: t.features[0].title, desc: t.features[0].desc },
    { icon: CalendarCheck, title: t.features[1].title, desc: t.features[1].desc },
    { icon: Wallet, title: t.features[2].title, desc: t.features[2].desc },
    { icon: Brush, title: t.features[3].title, desc: t.features[3].desc },
    { icon: Send, title: t.features[4].title, desc: t.features[4].desc },
    { icon: FileSignature, title: t.features[5].title, desc: t.features[5].desc }
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-[#F8FAFC] font-['Heebo',sans-serif]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Logo variant="dark" />
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                className="text-[#64748B] hover:text-[#0F172A] rounded-lg px-4 h-10 text-sm font-medium"
                onClick={() => navigate(createPageUrl('Dashboard'))}
              >
                כניסה
              </Button>
              <Button 
                className="bg-[#00D1C1] hover:bg-[#00B8AA] text-[#0F172A] rounded-lg px-5 h-10 text-sm font-semibold shadow-lg shadow-[#00D1C1]/20"
                onClick={() => navigate(createPageUrl('Dashboard'))}
              >
                התחל בחינם
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-6 overflow-hidden bg-gradient-to-b from-white to-gray-50/50">
        {/* Sophisticated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#00D1C1]/8 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-gradient-to-tr from-[#00D1C1]/5 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
            <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-[#00D1C1]/20 rounded-full"></div>
            <div className="absolute top-1/3 left-1/3 w-1 h-1 bg-[#00D1C1]/30 rounded-full"></div>
            <div className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 bg-[#00D1C1]/20 rounded-full"></div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Strategic Hook */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white border border-gray-200 shadow-sm mb-8">
              <div className="w-2 h-2 bg-[#00D1C1] rounded-full animate-pulse"></div>
              <span className="text-sm text-[#0F172A] font-medium tracking-tight">העובדה שמנהלי נכסים לא רוצים לשמוע</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] mb-8 text-[#0F172A] tracking-tight">
              60 שעות עבודה בשבוע.<br />
              <span className="bg-gradient-to-r from-gray-600 to-gray-400 bg-clip-text text-transparent">40 מהן על</span>{' '}
              <span className="relative inline-block">
                <span className="relative z-10">משימות ניהוליות</span>
                <span className="absolute inset-x-0 bottom-2 h-3 bg-red-500/20"></span>
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-4xl mx-auto font-normal">
              תיאום לידים, מעקב תשלומים, שליחת חוזים, ניהול הזמנות —<br className="hidden sm:block" />
              <span className="text-[#0F172A] font-medium">עבודה שיכולה להיות אוטומטית במאה אחוז</span>
            </p>
          </motion.div>

          {/* Premium Comparison Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-20 max-w-6xl mx-auto">
            {/* Current State */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-rose-500 rounded-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative bg-white rounded-3xl border border-gray-200 p-10 h-full shadow-sm hover:shadow-xl transition-all duration-500">
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0F172A]">ניהול מסורתי</h3>
                    <p className="text-sm text-gray-500">המציאות של רוב המנהלים</p>
                  </div>
                </div>

                <div className="space-y-6 mb-8">
                  {[
                    { 
                      metric: '3.5 שעות ביום', 
                      detail: 'בתיאום כניסות ומעקב תשלומים בוואטסאפ',
                      impact: 'high'
                    },
                    { 
                      metric: '10+ כלים שונים', 
                      detail: 'אקסלים, קלנדרים, וואטסאפ — אף אחד לא מסונכרן',
                      impact: 'high'
                    },
                    { 
                      metric: 'חוזים ידניים', 
                      detail: 'העתקה, הדבקה, שכחת לשלוח — בעיות תמיד',
                      impact: 'medium'
                    },
                    { 
                      metric: 'ממוצע ₪8,400 בשנה', 
                      detail: 'הפסד מתשלומים שלא עוקבים אחריהם',
                      impact: 'critical'
                    }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-start gap-4 group/item"
                    >
                      <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        item.impact === 'critical' ? 'bg-red-600' :
                        item.impact === 'high' ? 'bg-red-500' :
                        'bg-red-400'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-[#0F172A] font-semibold text-lg mb-1 leading-tight">{item.metric}</p>
                        <p className="text-gray-600 text-sm leading-relaxed">{item.detail}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-baseline justify-between">
                    <span className="text-gray-500 text-sm font-medium">תוצאה:</span>
                    <div className="text-left">
                      <p className="text-3xl font-bold text-red-600">₪0</p>
                      <p className="text-sm text-gray-500 mt-1">תועלת מהמאמץ</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ATLAS Solution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00D1C1] to-[#00B8AA] rounded-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-white to-gray-50/50 rounded-3xl border border-[#00D1C1]/30 p-10 h-full shadow-lg hover:shadow-2xl transition-all duration-500">
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-[#00D1C1]/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#00D1C1] to-[#00B8AA] rounded-2xl flex items-center justify-center shadow-lg shadow-[#00D1C1]/20">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0F172A]">עם ATLAS</h3>
                    <p className="text-sm text-gray-600">ניהול בעידן החדש</p>
                  </div>
                </div>

                <div className="space-y-6 mb-8">
                  {[
                    { 
                      metric: '10 דקות ביום', 
                      detail: 'אוטומציה מלאה של הודעות, חוזים ותזכורות',
                      improvement: '95% חיסכון בזמן'
                    },
                    { 
                      metric: 'מערכת מרכזית אחת', 
                      detail: 'כל המידע במקום אחד, מסונכרן בזמן אמת',
                      improvement: 'ללא טעויות'
                    },
                    { 
                      metric: 'חוזים אוטומטיים', 
                      detail: 'נשלחים ונחתמים דיגיטלית ברגע שמאשרים הזמנה',
                      improvement: '100% כיסוי'
                    },
                    { 
                      metric: '0 תשלומים נשכחים', 
                      detail: 'מעקב חכם ותזכורות אוטומטיות למארחים ולאורחים',
                      improvement: '+₪8,400 בשנה'
                    }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-start gap-4"
                    >
                      <div className="mt-1 w-5 h-5 bg-[#00D1C1]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-[#00D1C1]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-1">
                          <p className="text-[#0F172A] font-semibold text-lg leading-tight">{item.metric}</p>
                          <span className="text-xs font-semibold text-[#00D1C1] bg-[#00D1C1]/10 px-2 py-1 rounded-lg whitespace-nowrap">
                            {item.improvement}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{item.detail}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="pt-6 border-t border-[#00D1C1]/20">
                  <div className="flex items-baseline justify-between">
                    <span className="text-gray-600 text-sm font-medium">תוצאה:</span>
                    <div className="text-left">
                      <p className="text-3xl font-bold bg-gradient-to-l from-[#00D1C1] to-[#00B8AA] bg-clip-text text-transparent">+20 שעות</p>
                      <p className="text-sm text-gray-600 mt-1">חזרו אליך כל שבוע</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Strategic CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0F172A] mb-6 leading-tight">
              הזמן שלך שווה יותר מזה
            </h2>
            <p className="text-lg text-gray-600 mb-10 leading-relaxed">
              תפסיקו לבזבז 40 שעות בשבוע על עבודה שמערכת יכולה לעשות בשבילכם
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#00D1C1] to-[#00B8AA] hover:from-[#00B8AA] hover:to-[#00A89A] text-white rounded-2xl px-10 h-14 text-base font-semibold shadow-xl shadow-[#00D1C1]/25 border-0 transition-all duration-300"
                onClick={() => navigate(createPageUrl('Dashboard'))}
              >
                התחילו עכשיו — ניסיון חינמי 30 יום
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-6 font-medium">
              ללא כרטיס אשראי • התקנה מהירה • תמיכה מלאה בעברית
            </p>
          </motion.div>
        </div>
      </section>

      {/* Problem Section - The Chaos */}
      <section className="py-20 px-6 bg-[#F8FAFC] relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-[#0F172A] mb-4 tracking-tight">
              היום זה נראה ככה...
            </h2>
            <p className="text-xl text-[#64748B]">30 טאבים פתוחים, 100 הודעות, ואתה עדיין לא יודע מי משלם מחר</p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Browser Window Mockup */}
            <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] overflow-hidden">
              {/* Browser Chrome */}
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-500 flex items-center gap-2">
                  <div className="flex gap-1 overflow-hidden">
                    {['WhatsApp', 'Excel', 'Gmail', 'Airbnb', 'Booking', 'Google Calendar', 'Facebook'].map((tab, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="text-[10px] px-2 py-0.5 bg-gray-100 rounded whitespace-nowrap"
                      >
                        {tab}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chaotic Desktop */}
              <div className="relative aspect-video bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                {/* Notification Popups */}
                {[
                  { text: 'WhatsApp: יש לידים חדשים', delay: 0.5, color: 'bg-green-100 border-green-200' },
                  { text: 'Gmail: תזכורת תשלום', delay: 0.8, color: 'bg-blue-100 border-blue-200' },
                  { text: 'Airbnb: הזמנה חדשה', delay: 1.1, color: 'bg-red-100 border-red-200' },
                  { text: 'Excel: קובץ לא נשמר', delay: 1.4, color: 'bg-yellow-100 border-yellow-200' },
                  { text: 'WhatsApp: איפה החוזה?', delay: 1.7, color: 'bg-green-100 border-green-200' },
                  { text: 'Google: חוזה עדכון', delay: 2.0, color: 'bg-purple-100 border-purple-200' }
                ].map((notif, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 300, scale: 0.8 }}
                    animate={{ 
                      opacity: [0, 1, 1, 0],
                      x: [300, 0, 0, -300],
                      scale: [0.8, 1, 1, 0.8]
                    }}
                    transition={{ 
                      duration: 3,
                      delay: notif.delay,
                      repeat: Infinity,
                      repeatDelay: 15
                    }}
                    className={`absolute top-4 left-4 ${notif.color} border rounded-lg px-4 py-2 text-sm font-medium shadow-lg`}
                    style={{ zIndex: 10 - i }}
                  >
                    {notif.text}
                  </motion.div>
                ))}

                {/* Sticky Notes - Chaos */}
                <div className="grid grid-cols-3 gap-3 h-full">
                  {[
                    { title: 'דחוף!', items: ['לבדוק תשלום דוד', 'לחתום חוזה יעל', 'מתי האורחים יוצאים?'], color: 'bg-red-200', rotate: '-rotate-2' },
                    { title: 'לעשות', items: ['ניקיון דירה 3', 'להזמין מנעולן', 'להעביר מפתחות'], color: 'bg-yellow-200', rotate: 'rotate-1' },
                    { title: 'זוכר?', items: ['חשבונית ינואר', 'לידים מפייסבוק', 'תיקון מזגן'], color: 'bg-blue-200', rotate: '-rotate-1' },
                    { title: 'תשלומים', items: ['150 ש"ח דוד', '2,000 ש"ח יעל', '800 ש"ח משה'], color: 'bg-green-200', rotate: 'rotate-2' },
                    { title: 'בעיות', items: ['מזגן לא עובד', 'דליפה במקלחת', 'שכן מתלונן'], color: 'bg-pink-200', rotate: '-rotate-1' },
                    { title: 'מחר', items: ['כניסה 14:00', 'יציאה 11:00', 'ניקיון 12:00'], color: 'bg-purple-200', rotate: 'rotate-1' }
                  ].map((note, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0, rotate: 0 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        rotate: [0, parseInt(note.rotate.match(/-?\d+/)[0]), parseInt(note.rotate.match(/-?\d+/)[0]) + 2, parseInt(note.rotate.match(/-?\d+/)[0])]
                      }}
                      transition={{ 
                        delay: 0.3 + i * 0.1,
                        rotate: { duration: 2, repeat: Infinity, repeatType: 'reverse' }
                      }}
                      className={`${note.color} ${note.rotate} p-3 rounded-lg shadow-md h-32`}
                    >
                      <h4 className="font-bold text-sm mb-2 text-[#0F172A]">{note.title}</h4>
                      <ul className="space-y-0.5">
                        {note.items.map((item, j) => (
                          <li key={j} className="text-[10px] text-[#0F172A] leading-tight truncate">• {item}</li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>

                {/* Stress Indicator */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
                  transition={{ delay: 2.5, duration: 0.5 }}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2"
                >
                  <AlertCircle className="h-5 w-5 animate-pulse" />
                  בלאגן מוחלט
                </motion.div>
              </div>
            </div>

            {/* Arrow Down */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex justify-center mt-8"
            >
              <div className="w-12 h-12 rounded-full bg-[#00D1C1] flex items-center justify-center">
                <ChevronRight className="h-6 w-6 text-white rotate-90" />
              </div>
            </motion.div>

            {/* Solution Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-8 bg-white rounded-2xl shadow-xl border border-[#E5E7EB] p-8 text-center"
            >
              <div className="w-16 h-16 bg-[#00D1C1] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#0F172A] mb-2">עם ATLAS</h3>
              <p className="text-[#64748B] text-lg">כל המידע במקום אחד. אוטומציה מלאה. אפס בלאגן.</p>
            </motion.div>
          </div>
        </div>
      </section>



      {/* Features */}
      <section className="py-24 px-6 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl sm:text-6xl font-bold text-[#0F172A] mb-4 tracking-tight">
              מערכת שלמה. באפליקציה אחת.
            </h2>
            <p className="text-xl text-[#64748B]">כל מה שצריך כדי להפוך את הנכסים שלך למכונת כסף</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="group">
                <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] hover:border-[#00D1C1] hover:shadow-lg hover:shadow-[#00D1C1]/10 transition-all">
                  <div className="w-12 h-12 bg-[#00D1C1] rounded-xl flex items-center justify-center mb-6">
                    <feature.icon className="h-6 w-6 text-[#0F172A]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0F172A] mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-[#64748B] leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0B1220] text-center mb-16">
            איך זה עובד?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {t.howItWorks.map((step, i) => {
              // Illustration SVGs for each step
              const illustrations = [
                // Step 1: Register
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#00D1C1', stopOpacity: 0.2 }} />
                      <stop offset="100%" style={{ stopColor: '#00D1C1', stopOpacity: 0.05 }} />
                    </linearGradient>
                  </defs>
                  {/* Background circle */}
                  <circle cx="100" cy="100" r="80" fill="url(#grad1)" />
                  {/* User icon */}
                  <circle cx="100" cy="85" r="25" fill="#00D1C1" />
                  <path d="M 60 150 Q 100 130 140 150" stroke="#00D1C1" strokeWidth="20" fill="none" strokeLinecap="round" />
                  {/* Plus icon */}
                  <motion.g
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <circle cx="150" cy="60" r="15" fill="#0B1220" />
                    <line x1="150" y1="52" x2="150" y2="68" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    <line x1="142" y1="60" x2="158" y2="60" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </motion.g>
                </svg>,
                
                // Step 2: Connect
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <defs>
                    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#00D1C1', stopOpacity: 0.2 }} />
                      <stop offset="100%" style={{ stopColor: '#00D1C1', stopOpacity: 0.05 }} />
                    </linearGradient>
                  </defs>
                  <circle cx="100" cy="100" r="80" fill="url(#grad2)" />
                  {/* Calendar grid */}
                  <rect x="60" y="70" width="80" height="70" rx="8" fill="#00D1C1" />
                  <rect x="65" y="75" width="70" height="60" rx="4" fill="white" />
                  {/* Grid lines */}
                  {[0, 1, 2, 3].map((row) => 
                    [0, 1, 2].map((col) => (
                      <motion.rect
                        key={`${row}-${col}`}
                        x={70 + col * 20}
                        y={80 + row * 13}
                        width="15"
                        height="8"
                        rx="2"
                        fill={row === 2 && col === 1 ? "#00D1C1" : "#E5E7EB"}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, delay: (row + col) * 0.2 }}
                      />
                    ))
                  )}
                  {/* Sync arrows */}
                  <motion.path
                    d="M 145 100 L 160 100"
                    stroke="#0B1220"
                    strokeWidth="3"
                    strokeLinecap="round"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <motion.path
                    d="M 155 95 L 160 100 L 155 105"
                    stroke="#0B1220"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </svg>,
                
                // Step 3: Automate
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <defs>
                    <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#00D1C1', stopOpacity: 0.2 }} />
                      <stop offset="100%" style={{ stopColor: '#00D1C1', stopOpacity: 0.05 }} />
                    </linearGradient>
                  </defs>
                  <circle cx="100" cy="100" r="80" fill="url(#grad3)" />
                  {/* AI Brain/Sparkle */}
                  <motion.g
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    style={{ transformOrigin: '100px 100px' }}
                  >
                    <circle cx="100" cy="100" r="35" fill="#00D1C1" opacity="0.3" />
                    <motion.circle
                      cx="100"
                      cy="100"
                      r="25"
                      fill="#00D1C1"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.g>
                  {/* Sparkles */}
                  <motion.circle
                    cx="65"
                    cy="70"
                    r="4"
                    fill="#0B1220"
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                  />
                  <motion.circle
                    cx="135"
                    cy="75"
                    r="4"
                    fill="#0B1220"
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                  <motion.circle
                    cx="130"
                    cy="130"
                    r="4"
                    fill="#0B1220"
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  />
                  <motion.circle
                    cx="70"
                    cy="135"
                    r="4"
                    fill="#0B1220"
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                  />
                  {/* Lightning bolt */}
                  <motion.path
                    d="M 100 70 L 95 100 L 105 100 L 100 130"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </svg>
              ];
              
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="text-center"
                >
                  <div className="relative mb-6 mx-auto w-full max-w-xs">
                    {/* Illustration container */}
                    <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-8 relative">
                      {illustrations[i]}
                      {/* Step number overlay */}
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.2 + 0.3, type: "spring" }}
                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-[#00D1C1] text-[#0B1220] rounded-2xl flex items-center justify-center shadow-xl text-2xl font-bold z-10"
                      >
                        {step.step}
                      </motion.div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[#0B1220] mb-2 mt-6">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-[#0F172A]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-white text-center mb-4">
            בעלי נכסים שמרוצים
          </h2>
          <p className="text-[#94A3B8] text-center text-lg mb-12">למה הם בחרו ב-ATLAS</p>
          <div className="grid md:grid-cols-3 gap-6">
            {t.testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full bg-white/5 border-white/10 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-5 w-5 fill-[#00D1C1] text-[#00D1C1]" />
                      ))}
                    </div>
                    <p className="text-white/90 mb-4 leading-relaxed text-base">"{testimonial.text}"</p>
                    <p className="text-[#00D1C1] font-semibold">{testimonial.author}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* Pricing */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl sm:text-6xl font-bold text-[#0F172A] mb-4 tracking-tight">
              תמחור פשוט. ללא הפתעות.
            </h2>
            <p className="text-xl text-[#64748B]">בחר את התוכנית שמתאימה לגודל העסק שלך</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {Object.entries(t.pricing).map(([key, plan]) => (
              <div 
                key={key} 
                className={`rounded-2xl p-8 border-2 transition-all ${
                  key === 'pro' 
                    ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-2xl shadow-[#00D1C1]/20 scale-105' 
                    : 'bg-white text-[#0F172A] border-[#E5E7EB] hover:border-[#00D1C1] hover:shadow-lg'
                }`}
              >
                {key === 'pro' && (
                  <div className="inline-block px-3 py-1 bg-[#00D1C1] rounded-full text-xs font-bold text-[#0F172A] mb-4">
                    המומלץ
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-8">
                  <span className="text-5xl font-bold">₪{plan.price}</span>
                  <span className={key === 'pro' ? 'text-white/60' : 'text-[#64748B]'}>/חודש</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className={`h-5 w-5 flex-shrink-0 ${key === 'pro' ? 'text-[#00D1C1]' : 'text-[#00D1C1]'}`} />
                      <span className={key === 'pro' ? 'text-white/90' : 'text-[#64748B]'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full rounded-xl h-12 font-semibold ${
                    key === 'pro' 
                      ? 'bg-[#00D1C1] hover:bg-[#00B8AA] text-[#0F172A]' 
                      : 'bg-[#0F172A] hover:bg-[#1E293B] text-white'
                  }`}
                  onClick={() => navigate(createPageUrl('Dashboard'))}
                >
                  התחל עכשיו
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-[#F2E9DB]/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0B1220] text-center mb-12">
            שאלות נפוצות
          </h2>
          <div className="space-y-4">
            {t.faq.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card 
                  className="cursor-pointer border-0 shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-4 bg-white">
                      <span className="font-medium text-[#0B1220]">{item.q}</span>
                      {openFaq === i ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    {openFaq === i && (
                      <div className="p-4 pt-0 bg-white text-gray-600">
                        {item.a}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-[#F8FAFC]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#0F172A] rounded-3xl p-12 sm:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00D1C1]/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00D1C1]/10 rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
                תתחיל לחסוך זמן היום?
              </h2>
              <p className="text-xl text-[#94A3B8] mb-10 max-w-2xl mx-auto">
                הצטרף ל-200+ בעלי נכסים שכבר משתמשים ב-ATLAS וחוסכים<br />20+ שעות בשבוע
              </p>
              <Button 
                size="lg" 
                className="bg-[#00D1C1] hover:bg-[#00B8AA] text-[#0F172A] rounded-xl px-8 h-14 text-base font-semibold shadow-xl shadow-[#00D1C1]/30"
                onClick={() => navigate(createPageUrl('Dashboard'))}
              >
                התחל ניסיון חינמי - 30 יום
              </Button>
              <p className="text-sm text-[#94A3B8] mt-4 font-medium">ללא כרטיס אשראי • ביטול בכל עת • תמיכה מלאה בעברית</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-white border-t border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo variant="dark" />
            <div className="flex gap-8 text-[#64748B] text-sm font-medium">
              <Link to={createPageUrl('Privacy')} className="hover:text-[#0F172A] transition-colors">
                {t.privacyPolicy}
              </Link>
              <Link to={createPageUrl('Terms')} className="hover:text-[#0F172A] transition-colors">
                {t.termsOfService}
              </Link>
            </div>
            <p className="text-[#94A3B8] text-sm">
              © 2026 ATLAS. כל הזכויות שמורות.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}