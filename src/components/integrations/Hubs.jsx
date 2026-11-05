/**
 * Two layouts of the same integrations hub (project rule: two versions, Deen picks).
 *   A "קטלוג"       calm catalogue: search, category chips, "already connected" row, then a tile grid per category.
 *   B "לפי משימה"   one list: a short summary on top, category index on the side (desktop) / chips (phone),
 *                    one row per service with its action button at the end.
 * Both: every tile = mark + name + one plain line of what it does for the owner + a status, nothing else.
 */
import React, { useMemo } from 'react';
import { Search, X, ChevronLeft, Check } from 'lucide-react';
import BrandTile from './BrandTile';
import { CATEGORIES, STATUS_LABEL, matches } from './catalog';
import './hub.css';

const ACTION = { connected: 'פתיחה', live: 'פתיחה', ready: 'חברו עכשיו', soon: 'פרטים', meta: 'פרטים', request: 'פרטים' };

function Pill({ s }) {
  return <span className={`ih-pill is-${s}`}>{s === 'connected' ? <Check strokeWidth={2.5} aria-hidden /> : null}{STATUS_LABEL[s]}</span>;
}

function SearchBox({ q, setQ }) {
  return (
    <div className="ih-search">
      <Search strokeWidth={2} aria-hidden />
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש: Booking, קבלות, WhatsApp…" aria-label="חיפוש חיבור" />
      {q ? <button type="button" className="ih-x ch-press" onClick={() => setQ('')} aria-label="ניקוי החיפוש"><X strokeWidth={2} aria-hidden /></button> : null}
    </div>
  );
}

function Chips({ cat, setCat, counts }) {
  return (
    <div className="ih-chips" role="tablist" aria-label="סוג חיבור">
      {[{ id: 'all', short: 'הכול' }, ...CATEGORIES].map((c) => (
        <button key={c.id} type="button" role="tab" aria-selected={cat === c.id} className={`ih-chip ch-press ${cat === c.id ? 'is-on' : ''}`} onClick={() => setCat(c.id)}>
          {c.short}{counts?.[c.id] ? <span className="ih-chip-n" aria-label={`${counts[c.id]} מחוברים`}>{counts[c.id]}</span> : null}
        </button>
      ))}
    </div>
  );
}

function useFiltered(items, q, cat) {
  return useMemo(() => items.filter((it) => (cat === 'all' || it.cat === cat) && matches(it, q)), [items, q, cat]);
}

function Empty({ q, onAsk }) {
  return (
    <div className="ih-empty">
      <p className="ih-empty-t">לא מצאנו "{q}"</p>
      <p>ספרו לנו מה אתם רוצים לחבר, ונבדוק.</p>
      <button type="button" className="ih-mini ch-press" onClick={onAsk}>ספרו לנו</button>
    </div>
  );
}

/* ── A ─────────────────────────────────────────────────────────────────────────────────────────────── */
function TileA({ it, onOpen }) {
  return (
    <li>
      <button type="button" className={`ih-tile ch-press is-${it.s}`} onClick={() => onOpen(it)} aria-label={`${it.name}. ${it.gain}. ${STATUS_LABEL[it.s]}`}>
        <span className="ih-tile-m"><BrandTile item={it} size={48} /></span>
        <span className="ih-tile-p"><Pill s={it.s} /></span>
        <span className="ih-tile-n">{it.name}{it.sub ? <small>{it.sub}</small> : null}</span>
        <span className="ih-tile-g">{it.gain}</span>
      </button>
    </li>
  );
}

export function HubA({ items, q, setQ, cat, setCat, onOpen, onAsk, counts, children }) {
  const list = useFiltered(items, q, cat);
  const connected = items.filter((it) => it.s === 'connected');
  const cats = CATEGORIES.filter((c) => cat === 'all' || c.id === cat);
  return (
    <div className="ih ih-a">
      <div className="ih-a-bar">
        <SearchBox q={q} setQ={setQ} />
        <Chips cat={cat} setCat={setCat} counts={counts} />
      </div>
      {!q && cat === 'all' && connected.length ? (
        <section className="ih-sec" aria-labelledby="ih-conn">
          <h2 id="ih-conn" className="ih-h2">מחובר אצלכם</h2>
          <ul className="ih-conn-row">
            {connected.map((it) => (
              <li key={it.id}><button type="button" className="ih-conn ch-press" onClick={() => onOpen(it)}><BrandTile item={it} size={36} /><span>{it.name}</span><Check strokeWidth={2.5} aria-hidden /></button></li>
            ))}
          </ul>
        </section>
      ) : null}
      {list.length === 0 ? <Empty q={q} onAsk={onAsk} /> : cats.map((c) => {
        const rows = list.filter((it) => it.cat === c.id);
        if (!rows.length) return null;
        return (
          <section key={c.id} className="ih-sec" aria-labelledby={`ih-${c.id}`}>
            <h2 id={`ih-${c.id}`} className="ih-h2">{c.label}</h2>
            <ul className="ih-grid">{rows.map((it) => <TileA key={it.id} it={it} onOpen={onOpen} />)}</ul>
            {c.id === 'calendars' && children ? <div className="ih-after">{children}</div> : null}
          </section>
        );
      })}
    </div>
  );
}

/* ── B ─────────────────────────────────────────────────────────────────────────────────────────────── */
function RowB({ it, onOpen }) {
  return (
    <li className={`ih-row is-${it.s}`}>
      <button type="button" className="ih-row-b ch-press" onClick={() => onOpen(it)}>
        <BrandTile item={it} size={44} />
        <span className="ih-row-t">
          <b>{it.name}{it.sub ? <small> · {it.sub}</small> : null}</b>
          <span>{it.gain}</span>
        </span>
        <span className="ih-row-end">
          {it.s !== 'ready' ? <Pill s={it.s} /> : null}
          <span className={`ih-act ${it.s === 'ready' ? 'is-primary' : ''}`}>{ACTION[it.s]}<ChevronLeft strokeWidth={2} aria-hidden /></span>
        </span>
      </button>
    </li>
  );
}

export function HubB({ items, q, setQ, cat, setCat, onOpen, onAsk, counts, children }) {
  const list = useFiltered(items, q, cat);
  const nConn = items.filter((it) => it.s === 'connected' || it.s === 'live').length;
  const nReady = items.filter((it) => it.s === 'ready').length;
  const cats = CATEGORIES.filter((c) => cat === 'all' || c.id === cat);
  return (
    <div className="ih ih-b">
      <div className="ih-b-sum">
        <p className="ih-b-k"><b className="tabular">{nConn}</b> פעילים אצלכם · <b className="tabular">{nReady}</b> אפשר לחבר עכשיו</p>
        <SearchBox q={q} setQ={setQ} />
      </div>
      <div className="ih-b-body">
        <nav className="ih-b-nav" aria-label="סוג חיבור">
          {[{ id: 'all', label: 'הכול' }, ...CATEGORIES].map((c) => (
            <button key={c.id} type="button" aria-current={cat === c.id ? 'true' : undefined} className={`ih-b-navb ch-press ${cat === c.id ? 'is-on' : ''}`} onClick={() => setCat(c.id)}>
              <span>{c.label}</span>{counts?.[c.id] ? <span className="ih-chip-n">{counts[c.id]}</span> : null}
            </button>
          ))}
        </nav>
        <div className="ih-b-chips"><Chips cat={cat} setCat={setCat} counts={counts} /></div>
        <div className="ih-b-list">
          {list.length === 0 ? <Empty q={q} onAsk={onAsk} /> : cats.map((c) => {
            const rows = list.filter((it) => it.cat === c.id);
            if (!rows.length) return null;
            return (
              <section key={c.id} className="ih-card" aria-labelledby={`ihb-${c.id}`}>
                <h2 id={`ihb-${c.id}`} className="ih-h2">{c.label}</h2>
                <ul className="ih-rows">{rows.map((it) => <RowB key={it.id} it={it} onOpen={onOpen} />)}</ul>
                {c.id === 'calendars' && children ? <div className="ih-after">{children}</div> : null}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
