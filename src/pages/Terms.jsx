import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Logo from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function Terms() {
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
        <h1 className="text-3xl font-bold text-[#0B1220] mb-8">תנאי שימוש</h1>
        
        <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
          <p>
            עדכון אחרון: ינואר 2024
          </p>
          
          <section>
            <h2 className="text-xl font-bold text-[#0B1220] mb-3">1. קבלת התנאים</h2>
            <p>
              בשימוש בפלטפורמת STAYFLOW, אתם מסכימים לתנאי שימוש אלה. אם אינכם מסכימים 
              לתנאים, אנא אל תשתמשו בשירותים שלנו.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0B1220] mb-3">2. תיאור השירות</h2>
            <p>
              STAYFLOW היא פלטפורמה לניהול נכסי אירוח, הכוללת ניהול לידים, הזמנות, 
              תשלומים, ניקיון, הודעות וחוזים. השירות מיועד לבעלי נכסים ומנהלי אירוח.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0B1220] mb-3">3. חשבון משתמש</h2>
            <p>
              אתם אחראים לשמירה על סודיות פרטי הכניסה שלכם ולכל הפעילות בחשבונכם. 
              יש להודיע לנו מיד על כל שימוש לא מורשה.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0B1220] mb-3">4. תשלום ומנוי</h2>
            <p>
              השירות מוצע בתוכניות מנוי חודשיות. התשלום נגבה מראש בתחילת כל תקופת חיוב. 
              ביטול יכנס לתוקף בסוף תקופת החיוב הנוכחית.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0B1220] mb-3">5. הגבלת אחריות</h2>
            <p>
              STAYFLOW מסופק "כמות שהוא". איננו אחראים לנזקים ישירים או עקיפים הנובעים 
              משימוש בשירות, למעט כנדרש על פי חוק.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0B1220] mb-3">6. שינויים בתנאים</h2>
            <p>
              אנו שומרים לעצמנו את הזכות לעדכן תנאים אלה. שינויים מהותיים יישלחו 
              בהתראה מראש.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0B1220] mb-3">7. יצירת קשר</h2>
            <p>
              לשאלות בנוגע לתנאי שימוש אלה, אנא צרו קשר בכתובת: legal@stayflow.io
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