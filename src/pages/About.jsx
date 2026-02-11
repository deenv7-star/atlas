import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Logo from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { ArrowRight, Target, Users, Zap, Shield, Heart, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function About() {
  return (
    <div dir="rtl" className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Logo variant="dark" />
            <Link to={createPageUrl('Landing')}>
              <Button variant="ghost" className="gap-2">
                <ArrowRight className="h-4 w-4" />
                חזרה לדף הבית
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-2 bg-[#00D1C1]/10 rounded-full mb-6">
              <span className="text-[#00D1C1] font-semibold text-sm">אודות ATLAS</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-[#0B1220] mb-6">
              המהפכה בניהול נכסים להשכרה
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              ATLAS נוצרה מתוך הבנה עמוקה של האתגרים שבעלי נכסים מתמודדים איתם יום יום. 
              אנחנו כאן כדי להפוך את הניהול היומיומי לפשוט, יעיל ומדויק.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#00D1C1] rounded-xl flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-[#0B1220]">המשימה שלנו</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                להפוך כל בעל נכס לבעל עסק מצליח ומקצועי, עם כלים שעד היום היו זמינים רק לשחקנים הגדולים בתעשייה.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                אנחנו מאמינים שניהול נכסים צריך להיות פשוט, שקוף ויעיל - ללא קשר לגודל העסק או למספר הנכסים.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-[#0B1220] to-[#1a2744] rounded-2xl p-8 text-white"
            >
              <h3 className="text-2xl font-bold mb-6">החזון שלנו</h3>
              <p className="text-lg leading-relaxed mb-6">
                להיות הפלטפורמה המובילה לניהול נכסים בישראל, שמאפשרת לכל בעל נכס להתמקד במה שחשוב באמת - 
                לספק חווית אירוח מעולה ולהגדיל את ההכנסות.
              </p>
              <div className="flex items-center gap-2 text-[#00D1C1] font-semibold">
                <Zap className="h-5 w-5" />
                <span>חדשנות ללא פשרות</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0B1220] mb-4">הערכים שלנו</h2>
            <p className="text-xl text-gray-600">העקרונות שמנחים אותנו בכל החלטה</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: 'התמקדות בלקוח',
                desc: 'הצרכים שלך בראש סדר העדיפויות. אנחנו מקשיבים, לומדים ומשתפרים כל הזמן.',
                color: 'from-blue-400 to-blue-600'
              },
              {
                icon: Shield,
                title: 'אמינות ושקיפות',
                desc: 'המידע שלך מאובטח, התהליכים שלנו ברורים, והתמיכה שלנו תמיד זמינה.',
                color: 'from-green-400 to-green-600'
              },
              {
                icon: TrendingUp,
                title: 'צמיחה משותפת',
                desc: 'ההצלחה שלך היא ההצלחה שלנו. אנחנו כאן כדי לראות אותך מצליח ומשגשג.',
                color: 'from-[#00D1C1] to-[#00B8A9]'
              }
            ].map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${value.color} rounded-xl flex items-center justify-center mb-6`}>
                  <value.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#0B1220] mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-4 bg-[#F8FAFC]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-[#F2E9DB] rounded-xl flex items-center justify-center">
                <Heart className="h-6 w-6 text-[#0B1220]" />
              </div>
              <h2 className="text-3xl font-bold text-[#0B1220]">הסיפור שלנו</h2>
            </div>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                ATLAS נוצרה מתוך צורך אמיתי. אחרי שנים של עבודה עם בעלי נכסים, ראינו את אותו דפוס חוזר על עצמו:
                אנשים מוכשרים ומסורים שטבעים בניירת, אקסלים אינסופיים, והודעות וואטסאפ שאובדות בערבוביה.
              </p>
              
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                הבנו שחייבת להיות דרך טובה יותר. דרך שמאפשרת לבעלי נכסים להתמקד במה שהם עושים הכי טוב -
                ליצור חוויות אירוח מדהימות - ולהשאיר את כל השאר לטכנולוגיה.
              </p>
              
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                היום, ATLAS משרתת מאות בעלי נכסים ברחבי הארץ, וכל יום אנחנו שמחים לראות איך המערכת שלנו 
                משנה להם את החיים - חוסכת זמן, מונעת טעויות, ומאפשרת להם לצמוח.
              </p>

              <div className="bg-white border-r-4 border-[#00D1C1] rounded-lg p-6 mt-8">
                <p className="text-xl font-semibold text-[#0B1220] italic">
                  "הטכנולוגיה הטובה ביותר היא זו שעושה את החיים פשוטים יותר, לא מסובכים יותר."
                </p>
                <p className="text-gray-600 mt-3">- צוות ATLAS</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { number: '200+', label: 'לקוחות מרוצים' },
              { number: '500+', label: 'נכסים מנוהלים' },
              { number: '98%', label: 'שביעות רצון' },
              { number: '24/7', label: 'תמיכה' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-5xl font-bold text-[#00D1C1] mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#0B1220] to-[#1a2744]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              רוצים להצטרף למהפכה?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              בואו נראה ביחד איך ATLAS יכולה לשנות את הדרך שבה אתם מנהלים את הנכסים שלכם
            </p>
            <Link to={createPageUrl('Landing')}>
              <Button 
                size="lg" 
                className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] font-semibold px-10 py-6 text-lg rounded-xl"
              >
                התחילו עכשיו
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto text-center">
          <Logo variant="dark" />
          <p className="text-gray-500 mt-4">© 2024 ATLAS. כל הזכויות שמורות</p>
        </div>
      </footer>
    </div>
  );
}