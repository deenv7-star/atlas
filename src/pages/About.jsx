import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import Logo from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Target, Users, Globe, Shield, Heart } from 'lucide-react';

export default function About() {
  return (
    <div dir="rtl" className="min-h-screen bg-white" style={{ fontFamily: "'Heebo', sans-serif" }}>
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo variant="dark" />
            <Link to={createPageUrl('Landing')}>
              <Button variant="ghost">חזרה לעמוד הראשי</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
          >
            מי אנחנו
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 leading-relaxed"
          >
            atlas היא פלטפורמת ניהול נכסים מתקדמת, שפותחה מתוך חזון להנגיש כלי ניהול מקצועיים לכל בעלי נכסים להשכרה - לא רק לחברות גדולות או מתחמים ענק. הטכנולוגיה של atlas משלבת ניהול חכם עם אוטומציה מתקדמת, ומאפשרת קבלת החלטות מושכלות, שקופות ויעילות.
          </motion.p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Target className="w-16 h-16 text-brand-600 mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">המשימה שלנו</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                אנחנו ב-atlas מאמינים בניהול פשוט, יעיל ומבוסס טכנולוגיה. המשימה שלנו היא לאפשר לכל בעל נכס ליהנות ממערכת ניהול שבעבר הייתה שמורה רק לשחקנים גדולים - ולהפוך את ניהול הנכסים לפשוט, אוטומטי ושקוף.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                המערכת שלנו מרכזת את כל תהליכי העבודה - מניהול לידים והזמנות, דרך ניהול תשלומים וניקיון, ועד לתקשורת עם האורחים - הכל במקום אחד.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-[#3E2BF1]/10 to-brand-100 rounded-3xl p-12 flex items-center justify-center"
            >
              <div className="text-center">
                <div className="text-6xl font-bold text-brand-600 mb-4">50+</div>
                <div className="text-xl text-gray-700">נכסים מנוהלים בגרסת בטא</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">המייסד</h2>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-[#3E2BF1] flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
              ?
            </div>
            <p className="text-lg text-gray-600 text-center max-w-xl">
              atlas נוסדה על ידי צוות ישראלי שמכיר מקרוב את אתגרי ניהול מתחמי הנופש. 
              אנחנו כאן כדי לתת לכם את הכלים שהעסק שלכם באמת צריך.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">הערכים שלנו</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8"
            >
              <Users className="w-12 h-12 text-brand-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">מוקד בלקוח</h3>
              <p className="text-gray-600">אנחנו מאמינים שכל בעל נכס ראוי לכלים מקצועיים שיעזרו לו לנהל את העסק בצורה הטובה ביותר.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-8"
            >
              <Shield className="w-12 h-12 text-brand-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">שקיפות מלאה</h3>
              <p className="text-gray-600">כל המידע זמין ונגיש - אתם יודעים בדיוק מה קורה עם הנכסים שלכם בכל רגע נתון.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-8"
            >
              <Globe className="w-12 h-12 text-brand-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">חדשנות מתמדת</h3>
              <p className="text-gray-600">אנחנו משקיעים בפיתוח מתמיד כדי להבטיח שתמיד תהיה לכם הטכנולוגיה המתקדמת ביותר.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-8"
            >
              <Heart className="w-12 h-12 text-brand-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">פותח בישראל 🇮🇱</h3>
              <p className="text-gray-600">המערכת פותחה בישראל, בעברית, עבור שוק האירוח הישראלי. אנחנו כאן בשבילכם.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">הבעיה</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                עולם ניהול הנכסים נשלט במשך שנים על ידי אקסלים מסורבלים, קבוצות וואטסאפ בלתי מסודרות וחוסר סנכרון בין מערכות שונות. רוב בעלי הנכסים לא באמת יודעים מה המצב האמיתי של הנכסים שלהם, כמה הזמנות יש, מה סטטוס התשלומים ומתי צריך ניקיון.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                התוצאה: זמן רב מבוזבז, טעויות אנוש, הזמנות כפולות, ואובדן הכנסות.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">הפתרון</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                atlas משנה את כללי המשחק: מערכת אחת מרכזית שמנהלת את כל התהליכים - מהליד הראשון ועד התשלום האחרון. אוטומציה חכמה שדואגת לכל הפרטים, יומן סנכרון שמונע הזמנות כפולות, וממשק אינטואיטיבי שמאפשר לכם לנהל הכל בלחיצת כפתור.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                התוצאה: חיסכון של 20+ שעות עבודה בשבוע, אפס טעויות, ושליטה מלאה בעסק.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-[#F4F3FF]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-6">
            מוכנים להצטרף?
          </h2>
          <p className="text-xl text-ink-600 mb-8">
            הצטרפו למנהלי מתחמים שכבר עובדים עם atlas
          </p>
          <Button
            asChild
            size="lg"
            className="bg-brand-600 hover:bg-brand-500 text-white font-semibold px-10 py-6 text-lg rounded-xl"
          >
            <Link to="/register">התחילו עכשיו</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-white border-t border-line">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo  />
            <div className="flex gap-6 text-ink-400 text-sm">
              <Link to={createPageUrl('Privacy')} className="hover:text-navy-900 transition-colors">
                מדיניות פרטיות
              </Link>
              <Link to={createPageUrl('Terms')} className="hover:text-navy-900 transition-colors">
                תנאי שימוש
              </Link>
            </div>
            <p className="text-ink-400 text-sm">
              © {new Date().getFullYear()} atlas. כל הזכויות שמורות
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}