import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Logo from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { ArrowRight, Mail, Phone, Clock, MapPin, MessageCircle, Send, Loader2 } from 'lucide-react';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { submitPublicContact, buildContactMailto } from '@/lib/submitPublicContact';

const SUBJECT_OPTIONS = [
  { value: '', label: 'בחר נושא' },
  { value: 'sales', label: 'שאלה לפני רכישה' },
  { value: 'support', label: 'תמיכה טכנית' },
  { value: 'billing', label: 'חיוב ותשלומים' },
  { value: 'partnership', label: 'שותפויות' },
  { value: 'other', label: 'אחר' },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const honeypotRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (honeypotRef.current?.value?.trim()) {
        return;
      }
      const { ok, status, data } = await submitPublicContact({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject,
        message: form.message.trim(),
        website: honeypotRef.current?.value || '',
      });
      if (status === 204) {
        return;
      }
      if (ok) {
        setSent(true);
        atlasToastApi.success('הפנייה נשלחה בהצלחה');
        return;
      }
      if (status === 503 && data?.code === 'EMAIL_NOT_CONFIGURED') {
        window.location.href = buildContactMailto({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          subject: SUBJECT_OPTIONS.find((o) => o.value === form.subject)?.label || '',
          message: form.message.trim(),
        });
        setSent(true);
        atlasToastApi.info('נפתח לכם מייל — שלחו את ההודעה מתוך תיבת הדואר שלכם');
        return;
      }
      atlasToastApi.error(typeof data?.error === 'string' ? data.error : 'לא הצלחנו לשלוח. נסו שוב או כתבו ל־support@atlas-app.co.il');
    } catch {
      window.location.href = buildContactMailto({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: SUBJECT_OPTIONS.find((o) => o.value === form.subject)?.label || '',
        message: form.message.trim(),
      });
      setSent(true);
      atlasToastApi.info('נפתח מייל — שלחו את ההודעה ידנית');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid #E5E7EB',
    fontSize: 15,
    fontFamily: "'Heebo', sans-serif",
    outline: 'none',
    transition: 'border-color 0.2s',
    direction: 'rtl',
  };

  return (
    <div dir="rtl" className="min-h-screen bg-white" style={{ fontFamily: "'Heebo', sans-serif" }}>
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo variant="dark" />
          <Link to={createPageUrl('Landing')}>
            <Button variant="ghost" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              חזרה לעמוד הבית
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">צור קשר</h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            נשמח לשמוע ממך. צוות ATLAS זמין בימים א–ה 09:00–18:00 — גם בוואטסאפ וגם במייל.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-12">
          {/* Contact info */}
          <div className="md:col-span-2 space-y-6">
            {[
              { icon: Mail, label: 'אימייל', value: 'support@atlas-app.co.il', href: 'mailto:support@atlas-app.co.il' },
              { icon: Phone, label: 'טלפון', value: '03-1234567', href: 'tel:031234567' },
              { icon: Clock, label: 'שעות פעילות', value: 'ימים א-ה 09:00-18:00' },
              { icon: MapPin, label: 'כתובת', value: 'תל אביב, ישראל' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-0.5">{item.label}</p>
                  {item.href ? (
                    <a href={item.href} className="text-gray-900 font-semibold hover:text-indigo-600 transition-colors">{item.value}</a>
                  ) : (
                    <p className="text-gray-900 font-semibold">{item.value}</p>
                  )}
                </div>
              </div>
            ))}

            <a
              href="https://wa.me/972545380085"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-[#25D366] text-white rounded-xl px-5 py-3.5 font-semibold hover:bg-[#20bd5a] transition-colors mt-8 w-fit"
            >
              <MessageCircle className="w-5 h-5" />
              שלח הודעה בוואטסאפ
            </a>

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">שאלות נפוצות</h3>
              <div className="space-y-2">
                {['כמה זמן לוקח להתחיל?', 'האם יש ניסיון חינם?', 'האם המערכת בעברית?'].map((q, i) => (
                  <Link key={i} to={createPageUrl('Landing')} className="block text-sm text-indigo-600 hover:text-indigo-800 transition-colors">
                    {q} ←
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="md:col-span-3">
            {sent ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Send className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">תודה על הפנייה</h3>
                <p className="text-gray-600">
                  אם נפתח לכם חלון מייל — שלחו את ההודעה. אחרת נחזור אליכם תוך יום עסקים לרוב הפניות.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl border border-gray-100 p-8 space-y-5" noValidate>
                {/* Honeypot — leave hidden; bots often fill */}
                <div className="sr-only" aria-hidden="true">
                  <label htmlFor="contact-website">Website</label>
                  <input ref={honeypotRef} type="text" id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">שם מלא</label>
                    <input
                      type="text" required
                      style={inputStyle}
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      onFocus={e => { e.target.style.borderColor = '#4F46E5'; }}
                      onBlur={e => { e.target.style.borderColor = '#E5E7EB'; }}
                      placeholder="השם שלך"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">טלפון</label>
                    <input
                      type="tel"
                      style={inputStyle}
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      onFocus={e => { e.target.style.borderColor = '#4F46E5'; }}
                      onBlur={e => { e.target.style.borderColor = '#E5E7EB'; }}
                      placeholder="050-1234567"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">אימייל</label>
                  <input
                    type="email" required
                    style={inputStyle}
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    onFocus={e => { e.target.style.borderColor = '#4F46E5'; }}
                    onBlur={e => { e.target.style.borderColor = '#E5E7EB'; }}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">נושא</label>
                  <select
                    style={{ ...inputStyle, appearance: 'none', background: 'white' }}
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                  >
                    {SUBJECT_OPTIONS.map((o) => (
                      <option key={o.value || 'general'} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">הודעה</label>
                  <textarea
                    required rows={5}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    onFocus={e => { e.target.style.borderColor = '#4F46E5'; }}
                    onBlur={e => { e.target.style.borderColor = '#E5E7EB'; }}
                    placeholder="ספר לנו במה נוכל לעזור..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%', background: submitting ? '#9CA3AF' : '#4F46E5', color: 'white', border: 'none',
                    borderRadius: 12, padding: '14px 0', fontWeight: 700, fontSize: 16,
                    fontFamily: "'Heebo', sans-serif", cursor: submitting ? 'wait' : 'pointer', transition: 'all 0.25s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                  onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = '#4338CA'; }}
                  onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = '#4F46E5'; }}
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
                  {submitting ? 'שולח…' : 'שלח הודעה'}
                </button>
                <p className="text-xs text-gray-500 text-center leading-relaxed">
                  לחלופין:{' '}
                  <a href="mailto:support@atlas-app.co.il" className="text-indigo-600 font-medium hover:underline">support@atlas-app.co.il</a>
                  {' · '}
                  <a href="https://wa.me/972545380085" className="text-indigo-600 font-medium hover:underline" target="_blank" rel="noopener noreferrer">וואטסאפ</a>
                </p>
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="py-8 px-4 bg-gray-50 border-t border-gray-100 mt-16">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-sm text-gray-400">© 2025 ATLAS. כל הזכויות שמורות.</p>
          <div className="flex gap-4 text-sm text-gray-400">
            <Link to={createPageUrl('Privacy')} className="hover:text-gray-600 transition-colors">פרטיות</Link>
            <Link to={createPageUrl('Terms')} className="hover:text-gray-600 transition-colors">תנאי שימוש</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
