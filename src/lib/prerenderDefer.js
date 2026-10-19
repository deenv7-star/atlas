/**
 * The prerendered landing's below-the-fold parts (the hero alone is 190svh, so none of them is on the first
 * screen). Until main.jsx hydrates, they are content-visibility: auto (scripts/prerender.mjs writes the CSS),
 * so the browser neither lays them out nor starts their ~450 KB of lazy images ahead of the headline. Then
 * main.jsx hands them back one per task (data-cv-on) and drops html.atlas-prerender: from then on the page is
 * exactly the normal page.
 *
 * Each selector ends in its own class, so dropping the html class at the end restyles only these elements,
 * not the whole document.
 */
export const DEFER_PARTS = ['.lm-ch', '.lm-blk', '.lm-facts', '.tb', '.v8p', '.l5-faq-sec', '.lm-x', '.v8-credits', '.l5-ftr']
  .map((c) => `.lm.has-ph ${c}`);

export const DEFER_CLASS = 'atlas-prerender';

/** The <style> the prerender puts in <head> of the landing. */
export function deferCss() {
  return `${DEFER_PARTS.map((p) => `html.${DEFER_CLASS} ${p}:not([data-cv-on])`).join(',')}{content-visibility:auto;contain-intrinsic-size:auto 900px}`;
}

/** After hydrateRoot: one part per task (its style + layout forced right there), then drop the class. */
export function revealDeferredParts(doc = document, win = window) {
  const html = doc.documentElement;
  if (!html.classList.contains(DEFER_CLASS)) return;
  const parts = [...doc.querySelectorAll(DEFER_PARTS.join(','))];
  let i = 0;
  const step = () => {
    if (i >= parts.length) { html.classList.remove(DEFER_CLASS); return; }
    const el = parts[i++];
    el.setAttribute('data-cv-on', '');
    void el.offsetHeight; // this part's style + layout now, in this small task (not all of them in the next frame)
    win.setTimeout(step, 0);
  };
  win.setTimeout(step, 0);
}
