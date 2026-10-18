/**
 * Tiny safe renderer for bot / agent answers: paragraphs, numbered and bulleted lists, **bold**.
 * Builds React nodes only (no innerHTML), so nothing in an answer can inject markup.
 */
import React from 'react';

function inline(text, keyBase) {
  const out = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0; let m; let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<strong key={`${keyBase}-b${i++}`}>{m[1]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Markdown({ text }) {
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  const blocks = [];
  let list = null;
  const flush = () => { if (list) { blocks.push(list); list = null; } };
  lines.forEach((raw) => {
    const line = raw.trimEnd();
    const ol = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
    const ul = line.match(/^\s*[-•*]\s+(.*)$/);
    if (ol) {
      if (!list || list.type !== 'ol') { flush(); list = { type: 'ol', start: Number(ol[1]), items: [] }; }
      list.items.push(ol[2]);
    } else if (ul) {
      if (!list || list.type !== 'ul') { flush(); list = { type: 'ul', items: [] }; }
      list.items.push(ul[1]);
    } else if (!line.trim()) {
      flush();
    } else {
      flush();
      const prev = blocks[blocks.length - 1];
      if (prev && prev.type === 'p' && !prev.closed) prev.lines.push(line);
      else blocks.push({ type: 'p', lines: [line] });
    }
    if (!line.trim()) { const prev = blocks[blocks.length - 1]; if (prev && prev.type === 'p') prev.closed = true; }
  });
  flush();
  return (
    <div className="sp-md">
      {blocks.map((b, i) => {
        if (b.type === 'ol') return <ol key={i} start={b.start}>{b.items.map((t, j) => <li key={j}>{inline(t, `${i}-${j}`)}</li>)}</ol>;
        if (b.type === 'ul') return <ul key={i}>{b.items.map((t, j) => <li key={j}>{inline(t, `${i}-${j}`)}</li>)}</ul>;
        return <p key={i}>{b.lines.map((l, j) => <React.Fragment key={j}>{j ? <br /> : null}{inline(l, `${i}-${j}`)}</React.Fragment>)}</p>;
      })}
    </div>
  );
}
