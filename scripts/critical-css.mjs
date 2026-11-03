/**
 * Critical CSS for the prerendered lean pages ("/" and /pricing), PERF-002.
 * The entry stylesheet (src/index.css: Tailwind for the whole app, ~210 KB) used to be inlined whole into the
 * landing HTML on every visit. Here it is cut down to the rules the prerendered markup can match:
 *   - a rule is kept when every class / id its selector needs appears in the page's HTML
 *     (classes inside :not() / :is() / :where() are not required, so the cut errs on keeping)
 *   - rules without classes (elements, :root, attributes), @font-face, @keyframes, @property are always kept
 * The full sheet stays linked right after it (inert until src/main.jsx enables it, before hydration), so anything
 * that appears later (menus, dialogs, the cookie notice) has its styles, and the cascade order is unchanged.
 */
import postcss from 'postcss';

const unescape = (s) => s
  .replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/\\(.)/g, '$1');

/** class and id tokens of an HTML string */
export function htmlTokens(html) {
  const classes = new Set(); const ids = new Set();
  for (const m of html.matchAll(/\sclass="([^"]*)"/g)) m[1].split(/\s+/).forEach((c) => c && classes.add(c.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")));
  for (const m of html.matchAll(/\sid="([^"]*)"/g)) ids.add(m[1]);
  return { classes, ids };
}

const stripFns = (sel) => {
  // drop the arguments of :not() / :is() / :where() / :has() (balanced parens)
  let out = ''; let i = 0;
  while (i < sel.length) {
    const m = sel.slice(i).match(/^:(not|is|where|has)\(/);
    if (m) {
      let depth = 1; let j = i + m[0].length;
      while (j < sel.length && depth) { if (sel[j] === '\\') { j += 2; continue; } if (sel[j] === '(') depth += 1; else if (sel[j] === ')') depth -= 1; j += 1; }
      i = j; continue;
    }
    if (sel[i] === '\\') { out += sel.slice(i, i + 2); i += 2; continue; }
    out += sel[i]; i += 1;
  }
  return out;
};
const TOKEN = /([.#])((?:\\[0-9a-fA-F]{1,6}\s?|\\.|[\w-])+)/g;

function selectorMatches(sel, tokens) {
  const s = stripFns(sel.replace(/\[[^\]]*\]/g, '[]'));
  for (const m of s.matchAll(TOKEN)) {
    const name = unescape(m[2]);
    if (m[1] === '.' ? !tokens.classes.has(name) : !tokens.ids.has(name)) return false;
  }
  return true;
}

export function criticalCss(css, tokens) {
  const root = postcss.parse(css);
  root.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
    const keep = rule.selectors.filter((sel) => selectorMatches(sel, tokens));
    if (!keep.length) rule.remove(); else if (keep.length !== rule.selectors.length) rule.selectors = keep;
  });
  // empty @media / @supports / @layer blocks
  let changed = true;
  while (changed) { changed = false; root.walkAtRules((at) => { if (at.nodes && at.nodes.length === 0) { at.remove(); changed = true; } }); }
  return root.toString().replace(/\n\s*/g, '');
}
