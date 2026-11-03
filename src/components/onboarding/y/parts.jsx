/**
 * Onboarding round Y: the controls both versions share. Look comes from oy.css; each version themes them
 * (.oy-light = white cards on canvas, .oy-glass = frosted glass over a photo). Every target ≥ 48px,
 * every input 17px+ (no iOS zoom), lucide 1.75 strokes, no shapes behind icons.
 */
import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronDown, ClipboardPaste, ExternalLink, Minus, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KINDS, MORE_KINDS, CHANNELS, CHECKIN_TIMES, CHECKOUT_TIMES, checkIcalLink, clampInt, UNITS_LIMIT, kindInfo } from '@/lib/onboarding/v2/model';
import { GUIDES } from '@/components/onboarding/v2/setup/guides';
import { YC } from './copy';
import { kindPhoto, LINKABLE } from './model';
import './oy.css';

const EASE = [0.23, 1, 0.32, 1];

/** Kind: three photo cards + "סוג אחר". */
export function KindPicker({ a, onPick, more, setMore, groupRef, nudge = 0, layout = 'grid' }) {
  return (
    <div className="flex flex-col gap-3">
      <div ref={groupRef} key={nudge} role="radiogroup" aria-label={YC.kind.group} className={cn('oy-kinds', `is-${layout}`, nudge && 'oy-nudge')}>
        {KINDS.map((t, i) => {
          const on = a.kind === t.value;
          return (
            <button key={t.value} type="button" role="radio" aria-checked={on} onClick={() => onPick(t.value)} className={cn('oy-kind oy-press', on && 'is-on')} style={{ '--i': i }}>
              <span className="oy-kind-img"><img src={kindPhoto(t.value)} alt="" draggable={false} /></span>
              <span className="oy-kind-t">
                <b>{t.label}</b>
                <small>{t.line}</small>
              </span>
              <span className="oy-kind-check" aria-hidden>{on ? <Check strokeWidth={2.5} /> : null}</span>
            </button>
          );
        })}
      </div>
      <button type="button" aria-expanded={more} onClick={() => setMore((m) => !m)} className="oy-more oy-press">
        {YC.kind.more}<ChevronDown strokeWidth={1.75} className={cn('transition-transform duration-200', more && 'rotate-180')} aria-hidden />
      </button>
      {more ? (
        <div role="radiogroup" aria-label={YC.kind.moreGroup} className="oy-fade oy-chips">
          {MORE_KINDS.map((t) => (
            <button key={t.value} type="button" role="radio" aria-checked={a.kind === t.value} onClick={() => onPick(t.value)} className={cn('oy-chip oy-press', a.kind === t.value && 'is-on')}>{t.label}</button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function NameField({ a, update, inputRef, big = false }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="oy-name" className="sr-only">{YC.name.label}</label>
      <input id="oy-name" ref={inputRef} className={cn('oy-input', big && 'is-big')} value={a.name} maxLength={50} autoComplete="organization" enterKeyHint="next"
        placeholder={YC.name.placeholder(a.kind)} onChange={(e) => update({ name: e.target.value })} aria-describedby="oy-name-line" />
      <p id="oy-name-line" className="oy-line">{YC.name.empty}</p>
    </div>
  );
}

/** A huge thin numeral between − and +. */
export function Counter({ value, min = 1, max = 30, onChange, label, unit }) {
  const still = useReducedMotion();
  return (
    <div className="oy-counter" role="group" aria-label={label}>
      <button type="button" className="oy-round oy-press" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`פחות: ${label}`}>
        <Minus strokeWidth={1.75} aria-hidden />
      </button>
      <span className="oy-counter-n" aria-live="polite">
        <motion.span key={value} initial={still ? false : { y: 14, opacity: 0, filter: 'blur(4px)' }} animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 0.28, ease: EASE }} className="tabular-nums">{value}</motion.span>
        {unit ? <small>{unit}</small> : null}
      </span>
      <button type="button" className="oy-round oy-press" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`עוד: ${label}`}>
        <Plus strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}

export function UnitsFields({ a, update }) {
  const k = kindInfo(a.kind || 'zimmer');
  const n = clampInt(a.unitCount, 1, UNITS_LIMIT);
  const gmax = clampInt(a.guestsMax, 1, 60);
  return (
    <div className="flex flex-col gap-4">
      <div className="oy-box">
        <Counter value={n} min={1} max={UNITS_LIMIT} onChange={(v) => update({ unitCount: v })} label={YC.units.count(k)} unit={n === 1 ? k.unit : k.units} />
      </div>
      <div className="oy-box">
        <p className="oy-box-h">{YC.units.guests(n)}</p>
        <p className="oy-line">{YC.units.guestsLine}</p>
        <Counter value={gmax} min={1} max={60} onChange={(v) => update((cur) => ({ guestsMax: v, guestsMin: Math.min(clampInt(cur.guestsMin, 1, 60), v), guestsVary: false }))} label={YC.units.guestsLabel} unit="אורחים" />
      </div>
    </div>
  );
}

export function ChannelsFields({ a, update, onEdit }) {
  const ch = a.channels || [];
  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label={YC.channels.group} className="oy-chips is-wrap">
        {CHANNELS.map((c) => {
          const on = ch.includes(c.value);
          return (
            <button key={c.value} type="button" role="checkbox" aria-checked={on} className={cn('oy-chip is-check oy-press', on && 'is-on')}
              onClick={() => { onEdit?.(); update((cur) => ({ channels: on ? (cur.channels || []).filter((v) => v !== c.value) : [...(cur.channels || []), c.value] })); }}>
              <span className="oy-tick" aria-hidden>{on ? <Check strokeWidth={2.5} /> : null}</span>{c.label}
            </button>
          );
        })}
      </div>
      {['booking', 'airbnb'].filter((c) => ch.includes(c)).map((c) => <LinkBox key={c} channel={c} a={a} update={update} onEdit={onEdit} />)}
    </div>
  );
}

function LinkBox({ channel, a, update, onEdit }) {
  const provider = LINKABLE[channel];
  const G = GUIDES[provider];
  const key = channel === 'booking' ? 'icalBooking' : 'icalAirbnb';
  const value = a[key] || '';
  const [open, setOpen] = useState(false);
  const check = useMemo(() => checkIcalLink(provider, value), [provider, value]);
  const n = clampInt(a.unitCount, 1, UNITS_LIMIT);
  const k = kindInfo(a.kind || 'zimmer');
  const id = `oy-link-${channel}`;
  const set = (v) => { onEdit?.(); update({ [key]: v }); };
  const paste = async () => { try { const t = await navigator.clipboard.readText(); if (t) set(t.trim()); } catch { /* type or long-press paste */ } };
  return (
    <section className="oy-box oy-fade" aria-labelledby={`${id}-h`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={`${id}-h`} className="oy-box-h">{YC.channels.linkTitle(G.short)}</h2>
        <span className="oy-line">{YC.channels.optional}</span>
      </div>
      <p className="oy-line">{n > 1 ? YC.channels.firstUnit(k.unit) : YC.channels.linkLine}</p>
      <div className="mt-2 flex items-center gap-2">
        <label htmlFor={id} className="sr-only">{YC.channels.linkTitle(G.short)}</label>
        <input id={id} dir="ltr" inputMode="url" autoComplete="off" autoCapitalize="off" spellCheck={false} value={value} onChange={(e) => set(e.target.value)}
          placeholder="https://…" className="oy-input is-url" aria-invalid={value && !check.ok ? 'true' : undefined} aria-describedby={`${id}-msg`} />
        {value ? <button type="button" className="oy-round oy-press" onClick={() => set('')} aria-label={YC.channels.clear}><X strokeWidth={1.75} aria-hidden /></button>
          : <button type="button" className="oy-round oy-press" onClick={paste} aria-label={YC.channels.paste}><ClipboardPaste strokeWidth={1.75} aria-hidden /></button>}
      </div>
      <p id={`${id}-msg`} className={cn('oy-msg', value && (check.ok ? 'is-ok' : 'is-bad'))} aria-live="polite">
        {value ? (check.ok ? <><Check strokeWidth={2.5} aria-hidden />{check.message}</> : check.message) : ''}
      </p>
      <button type="button" aria-expanded={open} aria-controls={`${id}-g`} onClick={() => setOpen((o) => !o)} className="oy-more oy-press">
        {YC.channels.where}<ChevronDown strokeWidth={1.75} className={cn('transition-transform duration-200', open && 'rotate-180')} aria-hidden />
      </button>
      {open ? (
        <div id={`${id}-g`} className="oy-fade flex flex-col gap-3 pb-1">
          <ol className="oy-guide">
            {G.steps.map((s, i) => (
              <li key={s.pic}><span className="oy-guide-n" aria-hidden>{i + 1}</span><span><b>{s.title}</b><small dir="ltr">{s.en}</small></span></li>
            ))}
          </ol>
          <a href={G.open.href} target="_blank" rel="noopener noreferrer" className="oy-open oy-press">{G.open.label}<ExternalLink strokeWidth={1.75} aria-hidden /></a>
        </div>
      ) : null}
    </section>
  );
}

export function TimesFields({ a, update }) {
  const Row = ({ title, group, options, field }) => (
    <div className="oy-box">
      <p className="oy-box-h">{title}</p>
      <div role="radiogroup" aria-label={group} className="oy-times">
        {options.map((t) => (
          <button key={t} type="button" role="radio" aria-checked={a[field] === t} onClick={() => update({ [field]: t })} className={cn('oy-time oy-press', a[field] === t && 'is-on')}>
            <span dir="ltr">{t}</span>
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div className="flex flex-col gap-4">
      {Row({ title: YC.times.in, group: YC.times.inGroup, options: CHECKIN_TIMES, field: 'checkIn' })}
      {Row({ title: YC.times.out, group: YC.times.outGroup, options: CHECKOUT_TIMES, field: 'checkOut' })}
      <button type="button" role="switch" aria-checked={!!a.timesVary} onClick={() => update({ timesVary: !a.timesVary })} className={cn('oy-switch oy-press', a.timesVary && 'is-on')}>
        <span>{YC.times.vary}</span><i aria-hidden><em /></i>
      </button>
    </div>
  );
}

export function PhoneField({ a, update, error, inputRef }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="oy-phone" className="sr-only">{YC.whatsapp.label}</label>
      <input id="oy-phone" ref={inputRef} dir="ltr" type="tel" inputMode="tel" autoComplete="tel" className="oy-input is-big is-phone" value={a.phone || ''} maxLength={20}
        placeholder={YC.whatsapp.placeholder} onChange={(e) => update({ phone: e.target.value })} aria-invalid={error ? 'true' : undefined} aria-describedby="oy-phone-msg" />
      <p id="oy-phone-msg" className={cn('oy-msg', error && 'is-bad')} aria-live="polite">{error || ''}</p>
    </div>
  );
}

/** The build list: a check because the write finished. */
export function BuildList({ steps, at, error, done, tone = 'light' }) {
  const still = useReducedMotion();
  return (
    <ol className={cn('oy-build', `is-${tone}`)} aria-label={YC.build.title}>
      {steps.map((s, i) => {
        const state = i < at || done ? 'done' : i === at ? (error ? 'error' : 'run') : 'wait';
        return (
          <motion.li key={s.id} className={`is-${state}`} initial={still ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE, delay: still ? 0 : i * 0.05 }}>
            <span className="oy-build-i" aria-hidden>
              {state === 'done' ? (
                <svg width="22" height="22" viewBox="0 0 24 24"><motion.path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: still ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, ease: EASE }} /></svg>
              ) : state === 'run' ? <span className="oy-spin" /> : state === 'error' ? '!' : <span className="oy-wait" />}
            </span>
            <span className="min-w-0 flex-1">
              <b>{s.title}</b>
              <small dir="auto">{state === 'wait' ? '\u00a0' : s.detail}</small>
            </span>
            <span className="sr-only">{YC.build.states[state]}</span>
          </motion.li>
        );
      })}
    </ol>
  );
}
