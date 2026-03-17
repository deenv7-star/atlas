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
        <h1 className="text-3xl font-bold text-[#0B1220] mb-4">תנאי שימוש - ATLAS</h1>
        <p className="text-gray-500 mb-8">עדכון אחרון: מרץ 2025</p>
        
        <div className="prose prose-lg max-w-none text-gray-700 space-y-8">
          <section className="bg-white rounded-2xl p-6 shadow-sm border">
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">1. קבלת התנאים</h2>
            <p className="leading-relaxed mb-3">
              בגישה לפלטפורמת ATLAS ובשימוש בה, אתם מצהירים כי קראתם, הבנתם ומסכימים להיות מחויבים על ידי 
              תנאי שימוש אלה וכל החוקים והתקנות החלים. אם אינכם מסכימים לתנאים אלה, אינכם רשאים להשתמש 
              או לגשת לפלטפורמה.
            </p>
            <p className="leading-relaxed text-sm text-gray-600">
              השימוש בפלטפורמה מותנה גם בקבלת מדיניות הפרטיות שלנו, המהווה חלק בלתי נפרד מתנאי שימוש אלה.
            </p>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm border">
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">2. תיאור השירות</h2>
            <p className="leading-relaxed mb-3">
              ATLAS היא פלטפורמת תוכנה כשירות (SaaS) מבוססת ענן לניהול נכסי אירוח לטווח קצר. השירות כולל:
            </p>
            <ul className="list-disc pr-6 space-y-2 mb-3">
              <li>מערכת ניהול לידים ומעקב פניות</li>
              <li>מערכת הזמנות ויומן דיגיטלי</li>
              <li>מעקב תשלומים ויתרות</li>
              <li>ניהול משימות ניקיון</li>
              <li>שליחת הודעות אוטומטיות ללקוחות</li>
              <li>יצירה וניהול חוזים דיגיטליים</li>
              <li>סנכרון עם יומנים חיצוניים</li>
              <li>דוחות וניתוחים</li>
            </ul>
            <p className="leading-relaxed text-sm text-gray-600">
              אנו שומרים לעצמנו את הזכות להוסיף, לשנות או להסיר תכונות בכל עת, תוך מתן הודעה מראש במידת הצורך.
            </p>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm border">
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">3. רישום וחשבון משתמש</h2>
            <p className="leading-relaxed mb-3">
              <strong>3.1 דרישות רישום:</strong> כדי להשתמש בפלטפורמה, עליכם ליצור חשבון ולספק מידע מדויק, 
              שלם ועדכני. אתם מתחייבים לעדכן את פרטי החשבון באופן שוטף.
            </p>
            <p className="leading-relaxed mb-3">
              <strong>3.2 אחריות לחשבון:</strong> אתם אחראים באופן בלעדי לשמירה על סודיות פרטי הגישה לחשבונכם 
              ולכל הפעילויות המתבצעות בחשבון. עליכם להודיע לנו מיד על כל שימוש לא מורשה בחשבון.
            </p>
            <p className="leading-relaxed mb-3">
              <strong>3.3 גיל מינימום:</strong> עליכם להיות בני 18 לפחות כדי להירשם לשירות.
            </p>
            <p className="leading-relaxed text-sm text-gray-600">
              <strong>3.4 השעיה וסגירת חשבון:</strong> אנו שומרים לעצמנו את הזכות להשעות או לסגור חשבונות 
              במקרה של הפרת תנאי שימוש, פעילות חשודה או פעילות בלתי חוקית.
            </p>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm border">
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">4. תשלום, חיוב ומנוי</h2>
            <p className="leading-relaxed mb-3">
              <strong>4.1 תוכניות מנוי:</strong> השירות מוצע במספר תוכניות מנוי חודשיות. כל תוכנית כוללת 
              מספר מוגדר של נכסים ותכונות כמפורט בדף התמחור.
            </p>
            <p className="leading-relaxed mb-3">
              <strong>4.2 חיוב:</strong> התשלום נגבה מראש בתחילת כל תקופת חיוב חודשית. החיוב יתבצע באופן 
              אוטומטי באמצעות אמצעי התשלום שציינתם.
            </p>
            <p className="leading-relaxed mb-3">
              <strong>4.3 שדרוג והורדת דרגה:</strong> תוכלו לשדרג או להוריד את דרגת המנוי בכל עת. 
              שדרוג יכנס לתוקף מיידית, והורדת דרגה תכנס לתוקף בתחילת תקופת החיוב הבאה.
            </p>
            <p className="leading-relaxed mb-3">
              <strong>4.4 ביטול מנוי:</strong> תוכלו לבטל את המנוי בכל עת דרך הגדרות החשבון. הביטול 
              יכנס לתוקף בסוף תקופת החיוב הנוכחית. לא תינתן החזרה כספית עבור תקופות חיוב שכבר שולמו.
            </p>
            <p className="leading-relaxed mb-3">
              <strong>4.5 מחירים:</strong> אנו שומרים לעצמנו את הזכות לשנות מחירים בכל עת. שינויים 
              לגבי מנויים קיימים יכנסו לתוקף לאחר מתן הודעה של 30 יום.
            </p>
            <p className="leading-relaxed text-sm text-gray-600">
              <strong>4.6 החזרת כספים:</strong> במקרים מיוחדים, אנו שומרים לעצמנו את הזכות לבחון 
              בקשות להחזר כספי על בסיס מקרה למקרה.
            </p>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm border">
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">5. שימוש מותר ואיסורים</h2>
            <p className="leading-relaxed mb-3">
              <strong>5.1 שימוש מותר:</strong> תוכלו להשתמש בשירות אך ורק למטרות חוקיות ובהתאם לתנאי שימוש אלה.
            </p>
            <p className="leading-relaxed mb-3">
              <strong>5.2 אסור לכם:</strong>
            </p>
            <ul className="list-disc pr-6 space-y-2 mb-3">
              <li>להעתיק, לשכפל או לנסות לבצע הנדסה לאחור של השירות</li>
              <li>להשתמש בשירות למטרות בלתי חוקיות או הונאה</li>
              <li>להפר זכויות קניין רוחני או כל זכות אחרת של צד שלישי</li>
              <li>להעלות תוכן פוגעני, מעליב או מזיק</li>
              <li>לשבש או להפריע לפעולת השירות</li>
              <li>להעביר וירוסים או קוד זדוני כלשהו</li>
              <li>לאסוף מידע על משתמשים אחרים</li>
            </ul>
            <p className="leading-relaxed text-sm text-gray-600">
              הפרה של הוראות אלו עלולה להוביל להשעיית החשבון או סגירתו ללא החזר כספי.
            </p>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm border">
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">6. קניין רוחני</h2>
            <p className="leading-relaxed mb-3">
              <strong>6.1 בעלות על השירות:</strong> הפלטפורמה, כל התכנים, התכונות, הפונקציונליות, 
              הקוד המקור והעיצוב הם בבעלותנו הבלעדית ומוגנים בחוקי זכויות יוצרים וקניין רוחני.
            </p>
            <p className="leading-relaxed mb-3">
              <strong>6.2 תוכן המשתמש:</strong> אתם שומרים על הבעלות על כל התוכן שאתם מעלים לפלטפורמה 
              (כגון נתוני לידים, הזמנות וכו'). אתם מעניקים לנו רישיון להשתמש בתוכן זה אך ורק לצורך 
              אספקת השירות.
            </p>
            <p className="leading-relaxed text-sm text-gray-600">
              <strong>6.3 משוב ורעיונות:</strong> כל משוב, הצעה או רעיון שתספקו לנו יהפוך לקניין שלנו, 
              ואנו נהיה רשאים להשתמש בהם ללא הגבלה.
            </p>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm border">
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">7. פרטיות ואבטחת מידע</h2>
            <p className="leading-relaxed mb-3">
              <strong>7.1 איסוף ושימוש במידע:</strong> אנו אוספים ומשתמשים במידע אישי בהתאם למדיניות 
              הפרטיות שלנו. השימוש בפלטפורמה מהווה הסכמה למדיניות זו.
            </p>
            <p className="leading-relaxed mb-3">
              <strong>7.2 אבטחת מידע:</strong> אנו נוקטים באמצעי אבטחה סבירים כדי להגן על המידע שלכם, 
              אך לא נוכל להבטיח אבטחה מוחלטת.
            </p>
            <p className="leading-relaxed text-sm text-gray-600">
              <strong>7.3 מחיקת נתונים:</strong> במקרה של ביטול חשבון, הנתונים יימחקו לצמיתות לאחר 
              30 יום. מומלץ לייצא את הנתונים לפני ביטול החשבון.
            </p>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm border">
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">8. הגבלת אחריות וכתבי שיפוי</h2>
            <p className="leading-relaxed mb-3">
              <strong>8.1 אחריות מוגבלת:</strong> הפלטפורמה מסופקת "כמות שהיא" ו"כפי שזמינה". איננו 
              מבטיחים שהשירות יהיה ללא הפרעות, מאובטח לחלוטין או נקי מטעויות.
            </p>
            <p className="leading-relaxed mb-3">
              <strong>8.2 הגבלת נזקים:</strong> באף מקרה לא נהיה אחראים לנזקים עקיפים, מקריים, מיוחדים 
              או תוצאתיים, לרבות אובדן רווחים, נתונים או מוניטין.
            </p>
            <p className="leading-relaxed mb-3">
              <strong>8.3 תקרת אחריות:</strong> באם תתבע אחריות כלשהי, האחריות המקסימלית שלנו תהיה 
              מוגבלת לסכום ששילמתם עבור השירות ב-12 החודשים שקדמו לאירוע שגרם לתביעה.
            </p>
            <p className="leading-relaxed text-sm text-gray-600">
              <strong>8.4 כתב שיפוי:</strong> אתם מתחייבים לשפות ולפצות אותנו בגין כל תביעה, נזק או 
              הוצאה הנובעים משימושכם בפלטפורמה או מהפרת תנאי שימוש אלה.
            </p>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm border">
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">9. שינויים בתנאים</h2>
            <p className="leading-relaxed mb-3">
              אנו שומרים לעצמנו את הזכות לעדכן או לשנות תנאי שימוש אלה בכל עת. שינויים מהותיים 
              יפורסמו באתר ו/או יישלחו אליכם בדואר אלקטרוני לפחות 30 יום לפני כניסתם לתוקף.
            </p>
            <p className="leading-relaxed text-sm text-gray-600">
              המשך השימוש בפלטפורמה לאחר פרסום השינויים מהווה הסכמה לתנאים המעודכנים. אם אינכם 
              מסכימים לשינויים, עליכם להפסיק את השימוש בשירות.
            </p>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm border">
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">10. סיום השירות</h2>
            <p className="leading-relaxed mb-3">
              <strong>10.1 סיום על ידי המשתמש:</strong> תוכלו לסיים את השימוש בשירות בכל עת על ידי 
              ביטול המנוי דרך הגדרות החשבון או מחיקת החשבון.
            </p>
            <p className="leading-relaxed mb-3">
              <strong>10.2 סיום על ידינו:</strong> אנו שומרים לעצמנו את הזכות להשעות או לסגור חשבונות 
              במקרה של הפרת תנאי שימוש, חוסר תשלום, או פעילות בלתי חוקית.
            </p>
            <p className="leading-relaxed text-sm text-gray-600">
              <strong>10.3 השלכות סיום:</strong> עם סיום החשבון, תאבדו גישה לכל הנתונים והתכונות. 
              נתונים יימחקו לאחר תקופת שמירה של 30 יום.
            </p>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm border">
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">11. דין וסמכות שיפוט</h2>
            <p className="leading-relaxed mb-3">
              תנאי שימוש אלה יהיו כפופים לחוקי מדינת ישראל ויתפרשו על פיהם, ללא התייחסות לכללי 
              ברירת הדין.
            </p>
            <p className="leading-relaxed text-sm text-gray-600">
              סכסוכים הנובעים מתנאי שימוש אלה או הקשורים להם יועברו לסמכותם הבלעדית של בתי המשפט 
              המוסמכים בתל אביב-יפו, ישראל.
            </p>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm border">
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">12. הוראות כלליות</h2>
            <p className="leading-relaxed mb-3">
              <strong>12.1 הסכם שלם:</strong> תנאי שימוש אלה יחד עם מדיניות הפרטיות מהווים את 
              ההסכם השלם בינינו לבינכם.
            </p>
            <p className="leading-relaxed mb-3">
              <strong>12.2 ניתוק הוראות:</strong> אם תיקבע חוסר תוקפה של הוראה כלשהי, יישארו 
              שאר ההוראות בתוקפן המלא.
            </p>
            <p className="leading-relaxed mb-3">
              <strong>12.3 ויתור:</strong> אי אכיפה של הוראה כלשהי אינה מהווה ויתור על זכות 
              לאכוף אותה בעתיד.
            </p>
            <p className="leading-relaxed text-sm text-gray-600">
              <strong>12.4 העברת זכויות:</strong> אין לכם רשות להעביר או להקצות זכויות או חובות 
              לפי הסכם זה. אנו רשאים להעביר זכויותינו בכל עת.
            </p>
          </section>

          <section className="bg-[#00D1C1]/5 rounded-2xl p-6 border border-[#00D1C1]/20">
            <h2 className="text-2xl font-bold text-[#0B1220] mb-4">13. יצירת קשר ותמיכה</h2>
            <p className="leading-relaxed mb-3">
              לשאלות, בקשות תמיכה או כל נושא הקשור לתנאי שימוש אלה, אנא צרו קשר:
            </p>
            <div className="space-y-2 text-sm">
              <p><strong>דואר אלקטרוני:</strong> legal@atlas-app.co.il</p>
              <p><strong>תמיכה טכנית:</strong> support@atlas-app.co.il</p>
              <p><strong>כתובת:</strong> רח' הרצל 1, תל אביב, ישראל</p>
            </div>
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