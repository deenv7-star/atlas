import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Logo from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function Privacy() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#F8FAFC] font-['Heebo',sans-serif]">
      <nav className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Landing')}>
            <Logo variant="dark" />
          </Link>
          <Link to={createPageUrl('Landing')}>
            <Button variant="ghost" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              חזרה לעמוד הבית
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-[#0B1220] mb-8">מדיניות פרטיות</h1>
        
        <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
          <p>
            עדכון אחרון: ינואר 2024
          </p>
          
          <section>
            <h2 className="text-xl font-bold text-[#0B1220] mb-3">1. מידע שאנו אוספים</h2>
            <p>
              אנו אוספים מידע שאתם מספקים לנו ישירות, כולל שם, כתובת דוא"ל, מספר טלפון, 
              ומידע על הנכסים וההזמנות שלכם. בנוסף, אנו אוספים מידע באופן אוטומטי כגון 
              נתוני שימוש באתר וכתובות IP.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0B1220] mb-3">2. שימוש במידע</h2>
            <p>
              אנו משתמשים במידע שנאסף כדי לספק ולשפר את השירותים שלנו, לתקשר איתכם,
              לעבד תשלומים, ולשלוח עדכונים והודעות רלוונטיות.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0B1220] mb-3">3. שמירה על המידע</h2>
            <p>
              אנו מיישמים אמצעי אבטחה מתאימים כדי להגן על המידע האישי שלכם מפני גישה 
              לא מורשית, שינוי, חשיפה או השמדה.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0B1220] mb-3">4. שיתוף מידע</h2>
            <p>
              איננו מוכרים או משכירים מידע אישי לצדדים שלישיים. אנו עשויים לשתף מידע 
              עם ספקי שירות שעוזרים לנו להפעיל את הפלטפורמה, בכפוף להתחייבויות סודיות.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0B1220] mb-3">5. זכויותיכם</h2>
            <p>
              יש לכם זכות לגשת למידע האישי שלכם, לתקן אותו, או לבקש את מחיקתו. 
              לכל בקשה, אנא צרו קשר עם צוות התמיכה שלנו.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0B1220] mb-3">6. יצירת קשר</h2>
            <p>
              לשאלות בנוגע למדיניות פרטיות זו, אנא צרו קשר בכתובת: privacy@stayflow.io
            </p>
          </section>
        </div>
      </main>

      <footer className="py-8 px-4 border-t bg-white mt-12">
        <div className="max-w-4xl mx-auto text-center text-gray-500 text-sm">
          © 2024 STAYFLOW. כל הזכויות שמורות.
        </div>
      </footer>
    </div>
  );
}