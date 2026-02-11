import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Logo from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText } from 'lucide-react';

export default function UserAgreement() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#F8FAFC]">
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

      {/* Hero */}
      <section className="py-12 px-4 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-[#00D1C1]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="h-8 w-8 text-[#00D1C1]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#0B1220] mb-4">
            הסכם שימוש
          </h1>
          <p className="text-gray-600">
            עודכן לאחרונה: ינואר 2024
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 space-y-8">
            
            <div>
              <h2 className="text-2xl font-bold text-[#0B1220] mb-4">1. קבלת התנאים</h2>
              <p className="text-gray-700 leading-relaxed">
                ברוכים הבאים ל-ATLAS. על ידי גישה לשירות או שימוש בו, אתם מסכימים להיות מחויבים להסכם שימוש זה.
                אם אינכם מסכימים לכל התנאים וההתניות של הסכם זה, אנא אל תשתמשו בשירות שלנו.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#0B1220] mb-4">2. שימוש בשירות</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                ATLAS מספקת פלטפורמה לניהול נכסים להשכרה. השימוש בשירות כפוף לתנאים הבאים:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                <li>אתם מתחייבים להשתמש בשירות למטרות חוקיות בלבד</li>
                <li>אתם אחראים לשמירה על סודיות פרטי ההתחברות שלכם</li>
                <li>אתם מתחייבים שלא להעביר את חשבונכם לצד שלישי</li>
                <li>אתם מתחייבים לספק מידע מדויק ועדכני</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#0B1220] mb-4">3. חשבון משתמש</h2>
              <p className="text-gray-700 leading-relaxed">
                כדי להשתמש בחלק מתכונות השירות, עליכם לרשום חשבון. אתם מסכימים לספק מידע נכון, עדכני ומלא
                במהלך תהליך הרישום ולעדכן מידע זה כדי לשמור עליו נכון, עדכני ומלא. אתם אחראים באופן בלעדי
                לשמירת סודיות החשבון והסיסמה שלכם.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#0B1220] mb-4">4. מחירים ותשלומים</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                השימוש בשירות כפוף לתשלום דמי מנוי חודשיים או שנתיים, בהתאם לתוכנית שנבחרה:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                <li>התשלומים מבוצעים באמצעות כרטיס אשראי או אמצעי תשלום מאושרים אחרים</li>
                <li>המחירים עשויים להשתנות בהודעה מוקדמת</li>
                <li>אין החזר כספי על תקופות שכבר שולמו</li>
                <li>ניתן לבטל את המנוי בכל עת, והביטול ייכנס לתוקף בתום תקופת החיוב הנוכחית</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#0B1220] mb-4">5. קניין רוחני</h2>
              <p className="text-gray-700 leading-relaxed">
                השירות וכל התוכן, התכונות והפונקציונליות הנלווים לו (כולל אך לא רק מידע, תוכנה, טקסט,
                תצוגות, תמונות, וידאו וסאונד) הם בבעלות ATLAS, בעלי הרישיונות שלה או ספקי תוכן אחרים
                ומוגנים על ידי זכויות יוצרים, סימני מסחר וחוקים אחרים.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#0B1220] mb-4">6. הגבלת אחריות</h2>
              <p className="text-gray-700 leading-relaxed">
                ATLAS לא תהיה אחראית לכל נזק עקיף, מקרי, מיוחד, תוצאתי או עונשי, כולל בין היתר אובדן רווחים,
                נתונים, שימוש, מוניטין או הפסדים בלתי מוחשיים אחרים, הנובעים מ: (א) הגישה שלכם או השימוש
                שלכם בשירות או חוסר היכולת לגשת או להשתמש בו; (ב) כל התנהגות או תוכן של צד שלישי בשירות.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#0B1220] mb-4">7. שינויים בשירות</h2>
              <p className="text-gray-700 leading-relaxed">
                אנו שומרים לעצמנו את הזכות לשנות, להשהות או להפסיק את השירות (או כל חלק ממנו) בכל עת,
                ללא הודעה מוקדמת. לא נהיה אחראים כלפיכם או כלפי צד שלישי כלשהו בגין כל שינוי, השעיה או
                הפסקה של השירות.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#0B1220] mb-4">8. סיום</h2>
              <p className="text-gray-700 leading-relaxed">
                אנו רשאים לסיים או להשעות את הגישה שלכם לשירות באופן מיידי, ללא הודעה מוקדמת או אחריות,
                מכל סיבה שהיא, כולל ללא הגבלה אם אתם מפרים את התנאים. כל ההוראות של תנאים אלה אשר מטבען
                צריכות לשרוד סיום, ישרדו את הסיום.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#0B1220] mb-4">9. דין חל ושיפוט</h2>
              <p className="text-gray-700 leading-relaxed">
                הסכם זה יהיה כפוף ויפורש בהתאם לחוקי מדינת ישראל. כל מחלוקת הנובעת מהסכם זה תהיה בסמכות
                השיפוט הבלעדית של בתי המשפט המוסמכים בישראל.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#0B1220] mb-4">10. שינויים בהסכם</h2>
              <p className="text-gray-700 leading-relaxed">
                אנו שומרים לעצמנו את הזכות, לפי שיקול דעתנו הבלעדי, לשנות או להחליף תנאים אלה בכל עת.
                אם שינוי הוא מהותי, ננסה לספק הודעה של לפחות 30 יום לפני כניסת התנאים החדשים לתוקף.
                המשך השימוש שלכם בשירות לאחר כניסת השינויים לתוקף מהווה הסכמה לתנאים המעודכנים.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#0B1220] mb-4">11. צור קשר</h2>
              <p className="text-gray-700 leading-relaxed">
                אם יש לכם שאלות לגבי הסכם שימוש זה, אנא צרו איתנו קשר בכתובת: support@atlas.co.il
              </p>
            </div>

            <div className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-6 mt-8">
              <p className="text-sm text-gray-600">
                על ידי שימוש בשירות ATLAS, אתם מאשרים שקראתם, הבנתם ומסכימים להיות מחויבים על ידי הסכם שימוש זה.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-white border-t border-gray-100 mt-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo variant="dark" />
            <div className="flex gap-6 text-gray-600 text-sm">
              <Link to={createPageUrl('About')} className="hover:text-[#0B1220] transition-colors">
                אודות
              </Link>
              <Link to={createPageUrl('Privacy')} className="hover:text-[#0B1220] transition-colors">
                מדיניות פרטיות
              </Link>
              <Link to={createPageUrl('Terms')} className="hover:text-[#0B1220] transition-colors">
                תנאי שימוש
              </Link>
            </div>
            <p className="text-gray-500 text-sm">
              © 2024 ATLAS. כל הזכויות שמורות
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}