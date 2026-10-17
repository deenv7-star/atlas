/**
 * Version B canvas: the owner's place, drawn as it is being built.
 * Flat, hand-built SVG in the brand palette (navy roofs, white walls, indigo doors, lilac trees);
 * windows light up amber in the reveal. Houses for zimmers / villas / apartments / other, one building
 * whose windows are the rooms for hotels / boutique hotels / guesthouses.
 */
import React from 'react';
import { MapPin, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { typeInfo, PROVIDERS } from '@/lib/onboarding/store';
import { formatMoney } from '@/lib/stay/format';

const NAVY = '#1B2656';
const INDIGO = '#3E2BF1';
const LILAC = '#C9C3FB';
const WIN = '#E4E1FD';
const LIT = '#F8B040';

export const ROOM_TYPES = new Set(['hotel', 'boutique', 'guesthouse']);

function Tree({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-2" y="-6" width="4" height="22" rx="2" fill="#B3B9CF" />
      <circle cx="0" cy="-14" r="15" fill={LILAC} opacity="0.75" />
      <circle cx="-7" cy="-6" r="10" fill={LILAC} opacity="0.9" />
    </g>
  );
}

/** One house. kind: zimmer | villa | apartments | other. */
export function House({ kind = 'zimmer', lit = false, active = false, photo }) {
  const w = lit ? LIT : WIN;
  const clip = React.useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 120 112" className="h-full w-full overflow-visible" aria-hidden>
      <ellipse cx="60" cy="106" rx="50" ry="5" fill={NAVY} opacity="0.08" />
      {kind === 'apartments' ? (
        <>
          <rect x="24" y="14" width="72" height="92" rx="5" fill="#fff" stroke={active ? INDIGO : '#DCE0EC'} strokeWidth="2" />
          {[0, 1, 2].map((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={36 + c * 28} y={24 + r * 24} width="20" height="14" rx="3" fill={w} style={{ transition: 'fill 400ms' }} />))}
          <rect x="52" y="88" width="16" height="18" rx="3" fill={INDIGO} />
        </>
      ) : kind === 'villa' ? (
        <>
          <rect x="10" y="44" width="100" height="62" rx="5" fill="#fff" stroke={active ? INDIGO : '#DCE0EC'} strokeWidth="2" />
          <rect x="26" y="22" width="58" height="26" rx="4" fill="#fff" stroke={active ? INDIGO : '#DCE0EC'} strokeWidth="2" />
          <rect x="6" y="40" width="108" height="8" rx="4" fill={NAVY} />
          <rect x="22" y="18" width="66" height="7" rx="3.5" fill={NAVY} />
          <rect x="36" y="29" width="16" height="12" rx="3" fill={w} style={{ transition: 'fill 400ms' }} />
          <rect x="58" y="29" width="16" height="12" rx="3" fill={w} style={{ transition: 'fill 400ms' }} />
          <rect x="22" y="60" width="22" height="16" rx="3" fill={w} style={{ transition: 'fill 400ms' }} />
          <rect x="76" y="60" width="22" height="16" rx="3" fill={w} style={{ transition: 'fill 400ms' }} />
          <rect x="52" y="78" width="16" height="28" rx="3" fill={INDIGO} />
        </>
      ) : (
        <>
          <path d="M18 54 L60 18 L102 54 Z" fill={NAVY} />
          <rect x="26" y="50" width="68" height="56" rx="4" fill="#fff" stroke={active ? INDIGO : '#DCE0EC'} strokeWidth="2" />
          {photo ? (
            <>
              <clipPath id={clip}><rect x="34" y="60" width="24" height="18" rx="3" /></clipPath>
              <image href={photo} x="34" y="60" width="24" height="18" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clip})`} />
            </>
          ) : <rect x="34" y="60" width="24" height="18" rx="3" fill={w} style={{ transition: 'fill 400ms' }} />}
          <rect x="66" y="72" width="18" height="34" rx="3" fill={INDIGO} />
          <circle cx="60" cy="40" r="5" fill={w} style={{ transition: 'fill 400ms' }} />
          {kind === 'zimmer' ? <rect x="92" y="88" width="24" height="14" rx="7" fill="#fff" stroke={LILAC} strokeWidth="2" /> : null}
          {kind === 'zimmer' ? <rect x="96" y="91" width="16" height="6" rx="3" fill="#A79EF8" /> : null}
        </>
      )}
    </svg>
  );
}

/** A building whose windows are the rooms (hotels, boutique hotels, guesthouses). */
function Building({ rooms, lit, activeKey, onRoom, compact }) {
  const cols = rooms.length <= 4 ? 2 : rooms.length <= 9 ? 3 : 4;
  return (
    <div className={cn('relative mx-auto flex flex-col items-center', compact ? 'w-[180px]' : 'w-[230px]')}>
      <div className="h-3 w-[86%] rounded-t-[10px] bg-[#1B2656]" />
      <div className="w-full rounded-[10px] border-2 border-[#DCE0EC] bg-white p-3 shadow-[0_10px_24px_-14px_rgba(27,38,86,0.35)]">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
          {rooms.map((u, k) => (
            <button key={u.key} type="button" onClick={() => onRoom?.(u.key)} tabIndex={onRoom ? 0 : -1}
              className={cn('ob-pop ob-press flex aspect-[4/3] min-h-[44px] items-end justify-center rounded-[6px] pb-0.5 text-[10px] font-bold transition-colors duration-300',
                lit ? 'bg-[#F8B040] text-[#5A3A00]' : 'bg-[#E4E1FD] text-brand-700', activeKey === u.key && 'ring-2 ring-brand-600 ring-offset-1')}
              style={{ animationDelay: `${k * 35}ms` }} aria-label={onRoom ? `${u.name}, עריכה` : undefined}>
              <span className="truncate px-0.5">{u.name.replace(/^חדר\s*/, '') || k + 1}</span>
            </button>
          ))}
        </div>
        <div className="mx-auto mt-2.5 h-7 w-9 rounded-t-[6px] bg-[#3E2BF1]" />
      </div>
    </div>
  );
}

/**
 * The scene. props: d (draft), lit (reveal), compact (phones), onUnit (tap a unit), onAdd (tap +), activeKey
 */
export function Scene({ d, lit = false, compact = false, onUnit, onAdd, activeKey, showPrices = false }) {
  const t = typeInfo(d.type);
  const roomsMode = ROOM_TYPES.has(d.type);
  const kind = d.type === 'villa' ? 'villa' : d.type === 'apartments' ? 'apartments' : 'zimmer';
  const units = d.units || [];
  const providers = Object.entries(d.channels || {}).filter(([, c]) => c.on && Object.values(c.links || {}).some(Boolean)).map(([k]) => k);
  return (
    <div className={cn('relative isolate overflow-hidden rounded-[28px] transition-colors duration-700', lit ? 'bg-[#1B2656]' : 'bg-[#EEF0F8]', compact ? 'h-[248px]' : 'h-full min-h-[460px]')}>
      {/* ground + trees */}
      <svg className="absolute inset-x-0 bottom-0 -z-10 h-[46%] w-full" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden>
        <path d="M0 40 C 90 18, 180 30, 260 22 S 360 14, 400 26 L400 120 L0 120 Z" fill={lit ? '#24306A' : '#E3E7F3'} style={{ transition: 'fill 700ms' }} />
      </svg>
      <svg className="pointer-events-none absolute bottom-[30%] start-3 -z-10 h-16 w-16" viewBox="-20 -32 40 52" aria-hidden><Tree x={0} y={0} /></svg>
      <svg className="pointer-events-none absolute bottom-[34%] end-4 -z-10 h-12 w-12" viewBox="-20 -32 40 52" aria-hidden><Tree x={0} y={0} s={0.9} /></svg>

      {/* the sign: business name + settlement */}
      <div className={cn('absolute z-10 flex max-w-[60%] flex-col items-start gap-1.5', compact ? 'start-4 top-4' : 'start-6 top-6')}>
        <span className={cn('ob-pop inline-flex max-w-full items-center rounded-[12px] px-3.5 py-2 font-extrabold', compact ? 'text-[17px]' : 'px-5 py-3 text-[24px]', ' shadow-[0_6px_16px_-8px_rgba(27,38,86,0.4)] transition-colors duration-500',
          lit ? 'bg-white text-navy-900' : d.businessName ? 'bg-navy-900 text-white' : 'border-2 border-dashed border-[#C9CEE0] bg-white/60 text-ink-400')} key={d.businessName ? 'n' : 'e'}>
          <span className="truncate">{d.businessName || (d.type ? t.label : 'השם של העסק')}</span>
        </span>
        {d.settlement ? (
          <span className={cn('ob-pop inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-semibold', lit ? 'bg-white/15 text-white' : 'bg-white text-navy-900')}>
            <MapPin className="h-3.5 w-3.5 text-brand-600" aria-hidden />{d.settlement}
          </span>
        ) : null}
      </div>

      {/* photos pinned like prints */}
      {d.photos?.length ? (
        <div className={cn('absolute z-10 flex', compact ? 'end-3 top-3' : 'end-6 top-6')} aria-hidden>
          {d.photos.slice(0, 3).map((p, k) => (
            <span key={k} className={cn('ob-pop block overflow-hidden border-white bg-white shadow-[0_6px_14px_-6px_rgba(27,38,86,0.45)] first:ms-0', compact ? '-ms-4 h-14 w-14 rounded-[10px] border-[3px]' : '-ms-8 h-28 w-28 rounded-[14px] border-[5px]')}
              style={{ transform: `rotate(${[-6, 4, -2][k]}deg)`, animationDelay: `${k * 60}ms` }}>
              <img src={p} alt="" className="h-full w-full object-cover" />
            </span>
          ))}
        </div>
      ) : null}

      {/* the units */}
      <div className={cn('absolute inset-x-0 z-0 flex items-end justify-center px-4', compact ? 'bottom-6 top-[86px]' : 'bottom-10 top-[110px]')}>
        {!d.type ? (
          <p className="mb-6 rounded-full bg-white/80 px-4 py-2 text-[15px] font-semibold text-ink-400">כאן המקום שלכם ייבנה</p>
        ) : roomsMode ? (
          <div className="flex items-end gap-3">
            <Building rooms={units.length ? units : [{ key: 'x', name: '' }]} lit={lit} activeKey={activeKey} onRoom={onUnit} compact={compact} />
            {onAdd ? <AddButton onAdd={onAdd} label={`הוספת ${t.unit}`} /> : null}
          </div>
        ) : (
          <div className={cn('ob-scroll-hide flex max-w-full items-end gap-2 pb-1', onUnit ? 'overflow-x-auto' : 'overflow-hidden', units.length > 3 && 'justify-start')}>
            {(units.length ? units : [{ key: 'x', name: '', placeholder: true }]).map((u, k) => {
              const size = compact ? (units.length > 3 ? 78 : 104) : (units.length > 4 ? 112 : 150);
              const inner = (
                <>
                  <span className="block" style={{ width: size, height: size * 0.93 }}><House kind={kind} lit={lit} active={activeKey === u.key} photo={u.photo} /></span>
                  {u.name ? (
                    <span className={cn('mt-1 max-w-[120px] truncate rounded-full px-2.5 py-0.5 text-[13px] font-bold', lit ? 'bg-white/15 text-white' : 'bg-white text-navy-900')}>{u.name}</span>
                  ) : null}
                  {showPrices && u.name ? <span className={cn('text-[12px] font-semibold tabular-nums', lit ? 'text-white/80' : 'text-ink-600')}>{formatMoney(u.price)} · {u.guests} אורחים</span> : null}
                </>
              );
              return onUnit && !u.placeholder ? (
                <button key={u.key} type="button" onClick={() => onUnit(u.key)} className="ob-pop ob-press flex shrink-0 flex-col items-center rounded-[16px] p-1" style={{ animationDelay: `${k * 50}ms` }} aria-label={`${u.name}, עריכה`}>{inner}</button>
              ) : (
                <div key={u.key} className={cn('ob-pop flex shrink-0 flex-col items-center p-1', u.placeholder && 'opacity-40')} style={{ animationDelay: `${k * 50}ms` }}>{inner}</div>
              );
            })}
            {onAdd && !t.single ? <AddButton onAdd={onAdd} label={`הוספת ${t.unit}`} /> : null}
          </div>
        )}
      </div>

      {/* channels: small flags at the bottom */}
      {providers.length ? (
        <div className="absolute bottom-3 start-4 z-10 flex gap-1.5">
          {providers.map((k) => (
            <span key={k} className="ob-pop inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold text-white" style={{ background: PROVIDERS[k].color }}>
              <Check className="h-3 w-3" strokeWidth={3} aria-hidden />{PROVIDERS[k].label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AddButton({ onAdd, label }) {
  return (
    <button type="button" onClick={onAdd} aria-label={label}
      className="ob-press mb-6 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-brand-600 bg-white text-brand-600 shadow-[0_8px_20px_-10px_rgba(62,43,241,0.6)]">
      <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
    </button>
  );
}
