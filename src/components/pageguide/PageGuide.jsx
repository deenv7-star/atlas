/**
 * feat/pages-clarity (05.11.2026): every secondary screen answers, in one look, what it is, what it gives you,
 * how it fills and what to do now. GuideEmpty replaces a bare empty state; GuideHint is the one-line reminder
 * once the screen has data (dismissable, remembered per screen on this device).
 * Rule from Deen (05.11): a 65-year-old zimmer owner must get it instantly. Big plain text, one primary action,
 * a filled example clearly marked "דוגמה".
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Info, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { clarityVariant } from './flag';
import './pageguide.css';

function ActionBtn({ a, primary }) {
  const Icon = a.icon;
  const inner = <>{Icon ? <Icon strokeWidth={1.75} aria-hidden /> : null}{a.label}</>;
  const variant = primary ? 'default' : 'outline';
  if (a.to) return <Button asChild variant={variant} className="pg-btn"><Link to={a.to} state={a.state}>{inner}</Link></Button>;
  return <Button type="button" variant={variant} className="pg-btn" onClick={a.onClick} disabled={a.disabled}>{inner}</Button>;
}

function Actions({ actions }) {
  if (!actions?.length) return null;
  return (
    <div className="pg-actions">
      {actions.map((a, i) => <ActionBtn key={a.label} a={a} primary={i === 0} />)}
    </div>
  );
}

/** One example row, built like the real row of that screen (initial / title / line / status). */
export function SampleRow({ row }) {
  return (
    <div className="pg-row">
      <span className="pg-row-av" aria-hidden>{row.badge || (row.title || 'א')[0]}</span>
      <span className="pg-row-main">
        <span className="pg-row-title">{row.title}</span>
        {row.sub ? <span className="pg-row-sub">{row.sub}</span> : null}
      </span>
      {row.tag ? <span className={cn('pg-tag', row.tone && `pg-tag--${row.tone}`)}>{row.tag}</span> : null}
    </div>
  );
}

function Steps({ steps, label = 'איך זה עובד' }) {
  return (
    <div>
      <p className="pg-label">{label}</p>
      <ol className="pg-steps">
        {steps.map((s, i) => (
          <li key={s} className="pg-step"><span className="pg-num" aria-hidden>{i + 1}</span><span>{s}</span></li>
        ))}
      </ol>
    </div>
  );
}

function Sample({ guide, rows }) {
  return (
    <figure className="pg-sample" aria-label={`דוגמה: ${guide.sampleCaption || 'כך זה ייראה'}`}>
      <figcaption className="pg-sample-cap"><span className="pg-pill">דוגמה</span>{guide.sampleCaption || 'כך זה ייראה כשיתמלא'}</figcaption>
      <div className="pg-sample-rows">
        {rows.map((r) => <SampleRow key={r.title + (r.sub || '')} row={r} />)}
      </div>
    </figure>
  );
}

/**
 * guide: { what, gain, steps[3], auto?, sample[{title, sub, tag, tone, badge}], sampleCaption? }
 * actions: [{ label, icon?, onClick? | to?, state? }]: the first one is the primary action.
 */
export function GuideEmpty({ guide, actions, variant: forced, className, children }) {
  const v = forced || clarityVariant();
  if (v === 'a') {
    return (
      <section className={cn('pg pg-a v7-card', className)} data-clarity="a" aria-label={guide.what}>
        <p className="pg-eyebrow">מה עושים כאן</p>
        <h2 className="pg-what">{guide.what}</h2>
        {guide.gain ? <p className="pg-gain"><Check strokeWidth={2.25} aria-hidden />{guide.gain}</p> : null}
        <Steps steps={guide.steps} />
        {guide.auto ? <p className="pg-auto">{guide.auto}</p> : null}
        <Actions actions={actions} />
        {children}
        {guide.sample?.length ? <Sample guide={guide} rows={guide.sample.slice(0, 1)} /> : null}
      </section>
    );
  }
  return (
    <section className={cn('pg pg-b v7-card', className)} data-clarity="b" aria-label={guide.what}>
      {guide.sample?.length ? <Sample guide={guide} rows={guide.sample.slice(0, 2)} /> : null}
      <div className="pg-b-body">
        <h2 className="pg-what">{guide.what}</h2>
        {guide.gain ? <p className="pg-gain"><Check strokeWidth={2.25} aria-hidden />{guide.gain}</p> : null}
        <Steps steps={guide.steps} />
        {guide.auto ? <p className="pg-auto">{guide.auto}</p> : null}
        <Actions actions={actions} />
        {children}
      </div>
    </section>
  );
}

const hintKey = (id) => `atlas_hint_off_${id}`;

/** The compact line on a screen that already has data. One line, one ✕. */
export function GuideHint({ id, text, className }) {
  const [off, setOff] = useState(() => { try { return localStorage.getItem(hintKey(id)) === '1'; } catch { return false; } });
  if (off || !text) return null;
  const close = () => { setOff(true); try { localStorage.setItem(hintKey(id), '1'); } catch { /* ignore */ } };
  return (
    <div className={cn('pg-hint', className)} role="note">
      <Info strokeWidth={1.75} aria-hidden className="pg-hint-ic" />
      <p className="pg-hint-text">{text}</p>
      <button type="button" className="pg-hint-x" onClick={close} aria-label="הסתרת ההסבר"><X strokeWidth={1.75} aria-hidden /></button>
    </div>
  );
}
