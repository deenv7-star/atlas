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
            עדכון אחרון: מרץ 2025
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
            <h2 className="text-xl font-bold text-[#0B1220] mb-3">5. שמירה והחזקת מידע</h2>
            <p>
              אנו שומרים את המידע האישי שלכם כל עוד החשבון פעיל. לאחר ביטול חשבון, הנתונים נשמרים 
              עד 30 יום לצורך גיבוי, ולאחר מכן נמחקים לצמיתות. נתוני חיוב נשמרים בהתאם לדרישות החוק 
              (7 שנים בישראל).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0B1220] mb-3">6. זכויותיכם (תואם GDPR)</h2>
            <p>
              בהתאם לתקנות הגנת הפרטיות (GDPR ורשות הגנת הפרטיות בישראל), יש לכם זכות:
            </p>
            <ul className="list-disc pr-6 space-y-2 mt-2">
              <li>גישה — לקבל עותק של המידע האישי שלכם</li>
              <li>תיקון — לתקן מידע שגוי או לא מעודכן</li>
              <li>מחיקה — לבקש מחיקת המידע שלכם ("הזכות להישכח")</li>
              <li>הגבלת עיבוד — להגביל את השימוש במידע</li>
              <li>ניידות נתונים — לקבל את הנתונים בפורמט מובנה</li>
              <li>התנגדות — להתנגד לעיבוד למטרות שיווק</li>
            </ul>
            <p className="mt-3">
              למימוש זכויותיכם, אנא צרו קשר בכתובת support@atlas-app.co.il. נענה בתוך 30 יום.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0B1220] mb-3">7. עוגיות וטכנולוגיות דומות</h2>
            <p>
              אנו משתמשים בעוגיות וטכנולוגיות דומות לשיפור הפעילות, לאבטחה ולניתוח שימוש. 
              ניתן להגדיר העדפות בדפדפן או לבטל עוגיות באמצעות ההגדרות.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0B1220] mb-3">8. יצירת קשר</h2>
            <p>
              לשאלות בנוגע למדיניות פרטיות זו, מימוש זכויות או תלונות:
            </p>
            <p className="mt-2">
              <strong>דוא"ל:</strong> support@atlas-app.co.il<br />
              <strong>אתר:</strong> https://atlas-app.co.il<br />
              <strong>שעות תמיכה:</strong> ימים א׳-ה׳ 09:00–18:00
            </p>
          </section>
        </div>
      </main>

      <footer className="py-8 px-4 border-t bg-white mt-12">
        <div className="max-w-4xl mx-auto text-center text-gray-500 text-sm">
          © 2025 ATLAS. כל הזכויות שמורות.
        </div>
      </footer>
    </div>
  );
}