import React, { useState } from 'react';
import { MessageCircle, Mail } from 'lucide-react';
import { buildWhatsAppLead, buildMailtoLead } from './content';

/**
 * There is no public lead backend on static deploys, so the form never fakes a submit:
 * it opens WhatsApp (or the mail app) with the visitor's details already filled in.
 */
export default function ContactForm({ idPrefix = 'lead' }) {
  const [v, setV] = useState({ name: '', phone: '', units: '', message: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  const valid = () => {
    if (!v.name.trim()) return 'כתבו שם, כדי שנדע איך לפנות אליכם.';
    if (v.phone && !/^[0-9+\-\s()]{9,}$/.test(v.phone.trim())) return 'מספר הטלפון לא נראה תקין.';
    return '';
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const err = valid();
    setError(err);
    if (err) return;
    window.open(buildWhatsAppLead(v), '_blank', 'noopener,noreferrer');
  };

  const onMail = () => {
    const err = valid();
    setError(err);
    if (err) return;
    window.location.href = buildMailtoLead(v);
  };

  return (
    <form className="cf" onSubmit={onSubmit} noValidate aria-describedby={error ? `${idPrefix}-err` : undefined}>
      <div className="cf-row">
        <label className="cf-field" htmlFor={`${idPrefix}-name`}>
          <span>שם</span>
          <input id={`${idPrefix}-name`} name="name" autoComplete="name" value={v.name} onChange={set('name')} required aria-invalid={error && !v.name.trim() ? true : undefined} />
        </label>
        <label className="cf-field" htmlFor={`${idPrefix}-phone`}>
          <span>טלפון</span>
          <input id={`${idPrefix}-phone`} name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" value={v.phone} onChange={set('phone')} />
        </label>
      </div>
      <label className="cf-field" htmlFor={`${idPrefix}-units`}>
        <span>כמה יחידות יש לכם?</span>
        <select id={`${idPrefix}-units`} name="units" value={v.units} onChange={set('units')}>
          <option value="">בחרו</option>
          <option value="1-3">1-3</option>
          <option value="4-10">4-10</option>
          <option value="יותר מ-10">יותר מ-10</option>
        </select>
      </label>
      <label className="cf-field" htmlFor={`${idPrefix}-msg`}>
        <span>במה נוכל לעזור? (לא חובה)</span>
        <textarea id={`${idPrefix}-msg`} name="message" rows={3} value={v.message} onChange={set('message')} />
      </label>
      {error && <p id={`${idPrefix}-err`} className="cf-error" role="alert">{error}</p>}
      <div className="cf-actions">
        <button type="submit" className="btn btn-primary">
          <MessageCircle size={20} strokeWidth={1.75} aria-hidden="true" />
          שליחה בוואטסאפ
        </button>
        <button type="button" className="btn btn-ghost" onClick={onMail}>
          <Mail size={20} strokeWidth={1.75} aria-hidden="true" />
          שליחה במייל
        </button>
      </div>
      <p className="cf-note">הפרטים נפתחים אצלכם בוואטסאפ או במייל. שום דבר לא נשלח בלי שתלחצו שליחה.</p>
    </form>
  );
}
