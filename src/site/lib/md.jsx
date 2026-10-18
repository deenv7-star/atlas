/**
 * Tiny, dependency-free Markdown renderer for the public site (blog + legal pages).
 * Same output on the server (prerender) and in the browser, so the static HTML and
 * the SPA render are identical.
 *
 * Supported: ## / ### headings (auto ids, or "## Title {#id}"), paragraphs, - lists,
 * 1. lists, - [ ] checklists, > callouts ("> **בקצרה:** ..."), | tables |, **bold**,
 * [links](/path), {{PLACEHOLDER}} tokens from src/config/legal.js.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { LEGAL, legalValue } from '@/config/legal';

export function slugifyHe(text) {
  return String(text)
    .replace(/\{#[^}]+\}/g, '')
    .replace(/[*`"'״׳?.,:;!()[\]/\\]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 80);
}

function headingParts(raw) {
  const m = raw.match(/^(.*?)\s*\{#([a-z0-9-]+)\}\s*$/i);
  if (m) return { text: m[1], id: m[2] };
  return { text: raw, id: slugifyHe(raw) };
}

/** Parse markdown into a flat block list. */
export function parseMd(src) {
  const lines = String(src).replace(/\r/g, '').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i += 1; continue; }
    let m;
    if ((m = line.match(/^(#{2,4})\s+(.*)$/))) {
      const { text, id } = headingParts(m[2]);
      blocks.push({ type: 'h', level: m[1].length, text, id });
      i += 1; continue;
    }
    if (line.startsWith('>')) {
      const buf = [];
      while (i < lines.length && lines[i].startsWith('>')) { buf.push(lines[i].replace(/^>\s?/, '')); i += 1; }
      blocks.push({ type: 'callout', text: buf.join(' ') });
      continue;
    }
    if (line.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) { rows.push(lines[i]); i += 1; }
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(rows[0]);
      const body = rows.slice(2).map(cells);
      blocks.push({ type: 'table', head, body });
      continue;
    }
    if (/^- \[[ x]\] /.test(line)) {
      const items = [];
      while (i < lines.length && /^- \[[ x]\] /.test(lines[i])) { items.push(lines[i].replace(/^- \[[ x]\] /, '')); i += 1; }
      blocks.push({ type: 'check', items });
      continue;
    }
    if (/^- /.test(line)) {
      const items = [];
      while (i < lines.length && /^- /.test(lines[i])) { items.push(lines[i].replace(/^- /, '')); i += 1; }
      blocks.push({ type: 'ul', items });
      continue;
    }
    if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(lines[i].replace(/^\d+\. /, '')); i += 1; }
      blocks.push({ type: 'ol', items });
      continue;
    }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,4}\s|>|\||- |\d+\. )/.test(lines[i])) { buf.push(lines[i].trim()); i += 1; }
    blocks.push({ type: 'p', text: buf.join(' ') });
  }
  return blocks;
}

export function tocFromBlocks(blocks) {
  return blocks.filter((b) => b.type === 'h' && b.level === 2).map((b) => ({ id: b.id, text: nbHyphen(stripInline(b.text)) }));
}

export function stripInline(text) {
  return String(text)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\{\{([A-Z_]+)\}\}/g, (_, k) => legalValue(k) ?? `{{${k}}}`);
}

/** Plain-text version of a markdown document (word counts, llms-full.txt). */
export function mdToText(src) {
  return parseMd(src).map((b) => {
    if (b.type === 'ul' || b.type === 'ol' || b.type === 'check') return b.items.map((x) => '- ' + stripInline(x)).join('\n');
    if (b.type === 'table') return [b.head, ...b.body].map((r) => r.map(stripInline).join(' | ')).join('\n');
    if (b.type === 'h') return '\n' + stripInline(b.text);
    return stripInline(b.text);
  }).join('\n');
}

const INLINE_RE = /(\*\*(.+?)\*\*)|(\[([^\]]+)\]\(([^)]+)\))|(\{\{([A-Z_]+)\}\})/g;

/** Keeps "ל-Airbnb" / "מ-5,000" on one line: a Hebrew prefix letter + hyphen becomes a non-breaking hyphen. */
export function nbHyphen(text) {
  return String(text).replace(/(^|[\s(])([בהולמשכ]{1,2})-(?=[A-Za-z0-9"])/g, '$1$2\u2011');
}

export function Inline({ text }) {
  const out = [];
  let last = 0;
  let m;
  let k = 0;
  const s = nbHyphen(text);
  INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    if (m[1]) out.push(<strong key={k++}><Inline text={m[2]} /></strong>);
    else if (m[3]) {
      const href = m[5];
      const label = <Inline text={m[4]} />;
      if (href.startsWith('/')) out.push(<Link key={k++} to={href}>{label}</Link>);
      else if (href.startsWith('#')) out.push(<a key={k++} href={href}>{label}</a>);
      else out.push(<a key={k++} href={href} target="_blank" rel="noopener noreferrer">{label}<span className="s-sr"> (נפתח בחלון חדש)</span></a>);
    } else if (m[6]) {
      out.push(<Placeholder key={k++} name={m[7]} />);
    }
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return <>{out}</>;
}

/** Renders a value from src/config/legal.js, or a highlighted {{KEY}} when it is still empty. */
export function Placeholder({ name }) {
  const v = legalValue(name);
  if (v !== null) return <>{v}</>;
  if (!(name in LEGAL)) return <>{`{{${name}}}`}</>;
  return <mark className="s-ph" title="פרט שעוד לא מולא (src/config/legal.js)">{`{{${name}}}`}</mark>;
}

export function Markdown({ source, blocks: given }) {
  const blocks = given || parseMd(source);
  return (
    <>
      {blocks.map((b, idx) => {
        switch (b.type) {
          case 'h': {
            const Tag = `h${b.level}`;
            return <Tag key={idx} id={b.id}><Inline text={b.text} /></Tag>;
          }
          case 'callout':
            return <blockquote key={idx} className="s-quote"><p><Inline text={b.text} /></p></blockquote>;
          case 'table':
            return (
              <div key={idx} className="s-table" role="region" aria-label={b.head.some(Boolean) ? `טבלה: ${b.head.map(stripInline).join(', ')}` : `טבלה: ${stripInline(b.body[0]?.[0] || '')}`} tabIndex={0}>
                <table>
                  {b.head.some(Boolean) && <thead><tr>{b.head.map((c, j) => <th key={j} scope="col"><Inline text={c} /></th>)}</tr></thead>}
                  <tbody>{b.body.map((r, j) => <tr key={j}>{r.map((c, n) => <td key={n}><Inline text={c} /></td>)}</tr>)}</tbody>
                </table>
              </div>
            );
          case 'check':
            return (
              <ul key={idx} className="s-check">
                {b.items.map((it, j) => (
                  <li key={j}><span className="s-box" aria-hidden="true" /><span><Inline text={it} /></span></li>
                ))}
              </ul>
            );
          case 'ul':
            return <ul key={idx}>{b.items.map((it, j) => <li key={j}><Inline text={it} /></li>)}</ul>;
          case 'ol':
            return <ol key={idx}>{b.items.map((it, j) => <li key={j}><Inline text={it} /></li>)}</ol>;
          default:
            return <p key={idx}><Inline text={b.text} /></p>;
        }
      })}
    </>
  );
}
