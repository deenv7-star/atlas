import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
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
  ArrowLeft,
  AlertCircle,
  Inbox,
  CalendarCheck,
  Wallet,
  Brush,
  Send,
  FileSignature,
  Star,
  Bot,
  Rocket,
  Target,
  Zap,
  TrendingUp,
  Shield
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function Landing() {
  const t = translations.he;
  const [openFaq, setOpenFaq] = useState(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 300], [0, 50]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    { icon: Inbox, title: t.features[0].title, desc: t.features[0].desc, gradient: 'from-blue-400 to-cyan-500' },
    { icon: CalendarCheck, title: t.features[1].title, desc: t.features[1].desc, gradient: 'from-purple-400 to-pink-500' },
    { icon: Wallet, title: t.features[2].title, desc: t.features[2].desc, gradient: 'from-green-400 to-emerald-500' },
    { icon: Brush, title: t.features[3].title, desc: t.features[3].desc, gradient: 'from-orange-400 to-red-500' },
    { icon: Send, title: t.features[4].title, desc: t.features[4].desc, gradient: 'from-cyan-400 to-blue-500' },
    { icon: FileSignature, title: t.features[5].title, desc: t.features[5].desc, gradient: 'from-indigo-400 to-purple-500' }
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-white overflow-hidden font-['Heebo',sans-serif]">
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .gradient-bg {
          background: linear-gradient(135deg, 
            #F8FAFC 0%, 
            #EFF6FF 25%, 
            #F0F9FF 50%, 
            #ECFDF5 75%, 
            #F8FAFC 100%);
          background-size: 300% 300%;
          animation: gradient-shift 15s ease infinite;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .floating-card {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
      `}</style>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-xl border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Logo variant="dark" />
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                className="text-[#0F172A] hover:bg-gray-100/50 font-medium"
                onClick={() => base44.auth.redirectToLogin(createPageUrl('Dashboard'))}
              >
                כניסה
              </Button>
              <Button 
                className="bg-gradient-to-r from-[#00D1C1] to-[#00B8A9] hover:shadow-lg hover:shadow-[#00D1C1]/30 text-white font-medium px-8"
                onClick={() => base44.auth.redirectToLogin(createPageUrl('Dashboard'))}
              >
                <Sparkles className="w-4 h-4 ml-2" />
                התחל חינם
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative gradient-bg overflow-hidden pt-32 pb-40">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-200/30 to-blue-200/30 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div 
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
            transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              style={{ y: heroY, opacity: heroOpacity }}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div 
                className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-full mb-8 shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <Bot className="w-5 h-5 text-[#00D1C1]" />
                <span className="text-sm font-semibold bg-gradient-to-r from-[#00D1C1] to-[#00B8A9] bg-clip-text text-transparent">
                  מופעל על ידי AI מתקדם
                </span>
              </motion.div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#0B1220] mb-8 leading-[1.1]">
                נהלו טוב יותר
                <br />
                את הנכסים שלכם
                <br />
                <span className="relative inline-block mt-2">
                  <span className="bg-gradient-to-l from-[#00D1C1] via-[#00B8A9] to-[#00D1C1] bg-clip-text text-transparent">
                    עם ה-AI של ATLAS
                  </span>
                  <motion.div 
                    className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-[#00D1C1] to-[#00B8A9] rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  />
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed font-light">
                {t.heroSubtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg"
                    onClick={() => base44.auth.redirectToLogin(createPageUrl('Dashboard'))}
                    className="bg-gradient-to-r from-[#00D1C1] to-[#00B8A9] hover:shadow-2xl hover:shadow-[#00D1C1]/40 text-white text-lg px-10 py-7 font-semibold"
                  >
                    התחל עכשיו בחינם
                    <ArrowLeft className="w-5 h-5 mr-2" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg"
                    variant="outline"
                    className="glass-card border-2 hover:border-[#00D1C1] hover:bg-white/50 text-lg px-10 py-7 font-semibold"
                  >
                    <Rocket className="w-5 h-5 mr-2" />
                    צפה בהדגמה
                  </Button>
                </motion.div>
              </div>

              <div className="flex items-center gap-8 mt-12">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-white" />
                  ))}
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">500+ בתי מלון</div>
                  <div className="text-gray-600">סומכים על ATLAS</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative"
            >
              {/* Floating cards */}
              <motion.div 
                className="absolute -top-8 -right-8 glass-card rounded-2xl p-4 shadow-2xl floating-card z-10"
                style={{ transform: `translate(${mousePosition.x / 50}px, ${mousePosition.y / 50}px)` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">הזמנה חדשה</div>
                    <div className="font-bold text-gray-900">וילה בכנרת</div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="absolute -bottom-8 -left-8 glass-card rounded-2xl p-4 shadow-2xl floating-card z-10"
                style={{ 
                  transform: `translate(${-mousePosition.x / 60}px, ${-mousePosition.y / 60}px)`,
                  animationDelay: '2s'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">הכנסות החודש</div>
                    <div className="font-bold text-gray-900 text-lg">₪247,000</div>
                  </div>
                </div>
              </motion.div>

              <div className="bg-gradient-to-br from-[#0B1220] to-[#1a2744] rounded-2xl p-4 shadow-2xl">
                <div className="bg-[#F8FAFC] rounded-xl overflow-hidden">
                  <div className="bg-white border-b px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <span className="text-sm text-gray-400 mr-4">atlas.stayflow.io</span>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-[#00D1C1]/10 to-cyan-100 rounded-xl p-4">
                        <p className="text-sm text-gray-500">לידים חדשים</p>
                        <p className="text-2xl font-bold text-[#0B1220]">12</p>
                      </div>
                      <div className="bg-gradient-to-br from-[#F2E9DB] to-orange-100 rounded-xl p-4">
                        <p className="text-sm text-gray-500">הזמנות החודש</p>
                        <p className="text-2xl font-bold text-[#0B1220]">28</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-medium">כניסות היום</span>
                        <span className="text-[#00D1C1] text-sm">3 אורחים</span>
                      </div>
                      <div className="space-y-2">
                        {['משפחת כהן - וילה צפון', 'דני לוי - סוויטה'].map((item, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 text-sm">
                            <span>{item}</span>
                            <span className="text-green-600 font-medium">✓ מאושר</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 relative bg-gradient-to-b from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-block px-4 py-2 bg-red-50 rounded-full mb-6">
              <span className="text-sm font-semibold text-red-600">האתגרים של היום</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#0B1220] mb-6">
              {t.problemTitle}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              ניהול נכסים לטווח קצר הוא אתגר מתמיד
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '😫', gradient: 'from-red-400 to-pink-500', title: 'יותר מדי מערכות', desc: 'WhatsApp, Excel, אימייל - הכל מפוזר' },
              { icon: '⏰', gradient: 'from-orange-400 to-yellow-500', title: 'בזבוז זמן אדיר', desc: 'שעות על עדכונים ותזכורות ידניות' },
              { icon: '💸', gradient: 'from-purple-400 to-indigo-500', title: 'הפסד הכנסות', desc: 'לידים נופלים, תשלומים מאחרים' }
            ].map((problem, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -8 }}
              >
                <Card className="border-2 hover:border-gray-300 hover:shadow-2xl transition-all h-full">
                  <div className={`h-1.5 bg-gradient-to-r ${problem.gradient}`} />
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl mb-6">{problem.icon}</div>
                    <h3 className="text-2xl font-bold text-[#0B1220] mb-4">{problem.title}</h3>
                    <p className="text-gray-600">{problem.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution - AI Section */}
      <section className="py-28 relative overflow-hidden bg-gradient-to-br from-[#0B1220] via-gray-900 to-[#0B1220]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjMDBEMUMxIiBzdHJva2Utb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-full mb-6">
              <Sparkles className="w-5 h-5 text-[#00D1C1]" />
              <span className="text-sm font-semibold text-white">מופעל על ידי בינה מלאכותית</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              ה-AI שעושה לך ניהול נכסים
              <br />
              <span className="bg-gradient-to-l from-[#00D1C1] to-[#00B8A9] bg-clip-text text-transparent">
                טוב הרבה יותר
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              תהליך דיגיטלי מלא, אוטומציות חכמות, וכלים שעושים את העבודה בשבילך
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {[
              { icon: Zap, title: 'ריכוז מוחלט', desc: 'כל המידע במקום אחד - הזמנות, לידים, תשלומים', gradient: 'from-yellow-400 to-orange-500' },
              { icon: Bot, title: 'אוטומציות AI', desc: 'הבינה המלאכותית עובדת 24/7 - מזכירה ושולחת', gradient: 'from-cyan-400 to-blue-500' },
              { icon: TrendingUp, title: 'יותר הכנסות', desc: 'אף ליד לא נופל, כל תשלום מגיע בזמן', gradient: 'from-green-400 to-emerald-500' },
              { icon: Shield, title: 'בטיחות מקסימלית', desc: 'כל המידע מוצפן ברמה הגבוהה ביותר', gradient: 'from-purple-400 to-pink-500' },
              { icon: Users, title: 'שיתוף מושלם', desc: 'כל הצוות רואה את אותו מידע בזמן אמת', gradient: 'from-red-400 to-rose-500' },
              { icon: TrendingUp, title: 'תובנות חכמות', desc: 'דוחות שמראים בדיוק מה קורה בעסק', gradient: 'from-indigo-400 to-violet-500' }
            ].map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group"
              >
                <Card className="glass-card border-gray-700 hover:border-[#00D1C1]/50 transition-all h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50">
                  <div className={`h-1 bg-gradient-to-r ${benefit.gradient}`} />
                  <CardContent className="p-8">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <benefit.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">{benefit.title}</h3>
                    <p className="text-gray-300">{benefit.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Button 
              size="lg"
              onClick={() => base44.auth.redirectToLogin(createPageUrl('Dashboard'))}
              className="bg-gradient-to-r from-[#00D1C1] to-[#00B8A9] hover:shadow-2xl hover:shadow-[#00D1C1]/50 text-white text-lg px-12 py-7 font-semibold"
            >
              <Target className="w-5 h-5 ml-2" />
              התחל עכשיו - חינם לחלוטין
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 bg-gradient-to-b from-white via-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#0B1220] mb-4">
              כל מה שצריך במקום אחד
            </h2>
            <p className="text-xl text-gray-600">כלים מתקדמים לניהול מושלם של הנכסים</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full border-2 hover:border-gray-300 hover:shadow-xl transition-all">
                  <div className={`h-1 bg-gradient-to-r ${feature.gradient}`} />
                  <CardContent className="p-8">
                    <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6`}>
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-[#0B1220] mb-3">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-[#F2E9DB]/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-[#0B1220] text-center mb-16">
            איך זה עובד?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {t.howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-[#0B1220] text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold text-[#0B1220] mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-[#0B1220]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            מה אומרים עלינו
          </h2>
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
                    <p className="text-white/90 mb-4 leading-relaxed">"{testimonial.text}"</p>
                    <p className="text-[#00D1C1] font-medium">{testimonial.author}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-[#0B1220] text-center mb-4">
            תוכניות ומחירים
          </h2>
          <p className="text-gray-600 text-center mb-12 text-lg">בחר את התוכנית המתאימה לך</p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(t.pricing).map(([key, plan], i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <Card className={`h-full rounded-2xl ${key === 'pro' ? 'border-2 border-[#00D1C1] shadow-2xl scale-105' : 'border-2'}`}>
                  <CardContent className="p-8">
                    {key === 'pro' && (
                      <span className="bg-gradient-to-r from-[#00D1C1] to-[#00B8A9] text-white text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block">
                        הכי פופולרי ⭐
                      </span>
                    )}
                    <h3 className="text-2xl font-bold text-[#0B1220] mb-2">{plan.name}</h3>
                    <div className="mb-6">
                      <span className="text-5xl font-bold text-[#0B1220]">₪{plan.price}</span>
                      <span className="text-gray-500 text-lg">/חודש</span>
                    </div>
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-3 text-gray-700">
                          <CheckCircle2 className="h-5 w-5 text-[#00D1C1] flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full rounded-xl py-6 text-lg font-semibold ${key === 'pro' 
                        ? 'bg-gradient-to-r from-[#00D1C1] to-[#00B8A9] text-white hover:shadow-xl' 
                        : 'bg-[#0B1220] hover:bg-[#1a2744] text-white'}`}
                      onClick={() => base44.auth.redirectToLogin(createPageUrl('Dashboard'))}
                    >
                      {t.startTrial}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-[#F2E9DB]/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-[#0B1220] text-center mb-12">
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
                  className="cursor-pointer border-2 hover:border-[#00D1C1]/30 hover:shadow-md transition-all rounded-xl overflow-hidden"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-5 bg-white">
                      <span className="font-semibold text-[#0B1220] text-lg">{item.q}</span>
                      {openFaq === i ? (
                        <ChevronUp className="h-5 w-5 text-[#00D1C1]" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    {openFaq === i && (
                      <div className="px-5 pb-5 bg-white text-gray-600 leading-relaxed">
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
      <section className="py-24 px-4 bg-gradient-to-br from-[#0B1220] via-gray-900 to-[#0B1220] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjMDBEMUMxIiBzdHJva2Utb3BhY2l0eT0iLjMiLz48L2c+PC9zdmc+')]" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t.finalCta}
            </h2>
            <p className="text-xl text-white/80 mb-10">{t.tagline}</p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-[#00D1C1] to-[#00B8A9] hover:shadow-2xl hover:shadow-[#00D1C1]/50 text-white font-semibold px-12 py-7 text-xl rounded-xl"
              onClick={() => base44.auth.redirectToLogin(createPageUrl('Dashboard'))}
            >
              {t.startTrial}
              <ArrowLeft className="mr-2 h-6 w-6" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-4 bg-gradient-to-br from-[#0B1220] via-gray-900 to-[#0B1220] border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
              <Logo variant="light" />
              <p className="text-gray-400 mt-4 leading-relaxed">
                פלטפורמת ניהול נכסים חכמה המופעלת על ידי AI
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-bold text-white mb-4">קישורים</h4>
              <div className="space-y-3">
                <Link to={createPageUrl('Privacy')} className="block text-gray-400 hover:text-[#00D1C1] transition-colors">
                  {t.privacyPolicy}
                </Link>
                <Link to={createPageUrl('Terms')} className="block text-gray-400 hover:text-[#00D1C1] transition-colors">
                  {t.termsOfService}
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold text-white mb-4">צור קשר</h4>
              <div className="space-y-3 text-gray-400">
                <p>support@atlas.io</p>
                <p>03-1234567</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-sm">
                © 2026 ATLAS by STAYFLOW. {t.allRightsReserved}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Made with</span>
                <span className="text-red-400">❤️</span>
                <span>in Israel</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}