/**
 * The hero's start geometry (moved here unchanged from HeroPhoto's measure()): the stage, the property tile
 * inside the real screen, and an overscanned frame whose baked-in corner radius lands exactly on the tile's
 * radius at the end (the overscan hides the corners at the start). Sizes the frame and the photo inline.
 *
 * Self-contained on purpose (no imports, no outer variables): the prerendered landing also runs this exact
 * function from an inline script right after the hero's HTML (heroGeometryScript), so the photo is framed the
 * same way before the JS bundle arrives as after; HeroPhoto then re-measures with the same numbers.
 */
export function heroGeometry(st, s, im, fr, desk) {
  /* the property photo tile inside the real captures, as fractions of the screen image (from ea07f10) */
  var T = desk
    ? { x: 80 / 2880, y: 202 / 1800, w: 704 / 2880, h: 432 / 1800, r: 28 / 1440 }
    : { x: 40 / 780, y: 568 / 1594, w: 338 / 780, h: 460 / 1594, r: 28 / 390 };
  var W = st.offsetWidth; var H = st.offsetHeight;
  var sr = st.getBoundingClientRect();
  var r = s.getBoundingClientRect();
  var tx = r.left - sr.left + T.x * r.width; var ty = r.top - sr.top + T.y * r.height;
  var tw = T.w * r.width; var th = T.h * r.height; var tr = T.r * r.width;
  var m = 24; var rx = 0; var ry = 0;
  for (var k = 0; k < 4; k += 1) {
    rx = (tr * (W + 2 * m)) / tw; ry = (tr * (H + 2 * m)) / th;
    m = Math.max(24, Math.ceil(0.32 * Math.max(rx, ry)));
  }
  var FW = W + 2 * m; var FH = H + 2 * m;
  var portrait = window.matchMedia('(max-aspect-ratio: 2/3)').matches;
  var pw = im.naturalWidth || (portrait ? 720 : 1920);
  var ph = im.naturalHeight || 1440;
  var cover = Math.max(FW / pw, FH / ph);
  var iw = pw * cover; var ih = ph * cover;
  Object.assign(fr.style, { left: -m + 'px', top: -m + 'px', width: FW + 'px', height: FH + 'px', borderRadius: rx + 'px / ' + ry + 'px' });
  Object.assign(im.style, { width: iw + 'px', height: ih + 'px', left: (FW - iw) / 2 + 'px', top: (FH - ih) / 2 + 'px' });
  return { W: W, H: H, m: m, FW: FW, FH: FH, pw: pw, ph: ph, cover: cover, tx: tx, ty: ty, tw: tw, th: th };
}

/**
 * Inline script placed right after the hero section's HTML: frames the photo exactly as heroGeometry does
 * (in the first frame's requestAnimationFrame, so it reuses that frame's layout instead of forcing an
 * extra one in the middle of parsing),
 * and sets the progress-0 transforms HeroPhoto writes first (same layers, same rasterization), before the
 * first paint of the prerendered page. Never runs on a client render (React does not execute
 * scripts it creates), and does nothing for reduced motion (the static hero has no frame).
 */
export const heroGeometryScript = `(function(g){try{var s=document.currentScript,h=s&&s.previousElementSibling;if(!h||!h.classList.contains('is-scroll')||matchMedia('(prefers-reduced-motion: reduce)').matches)return;var d=matchMedia('(min-width: 900px)').matches,st=h.querySelector('.ph-stage'),fr=h.querySelector('.ph-clip'),im=fr&&fr.querySelector('img'),sh=h.querySelector(d?'.ph-win-shot img':'.ph-phone-scr img');function run(){try{if(st&&fr&&im&&sh){g(st,sh,im,fr,d);fr.style.transform='translate3d(0px, 0px, 0px) scale(1, 1)';im.style.transform='scale(1, 1)'}}catch(e){}}if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else run()}catch(e){}})(${heroGeometry.toString()})`;
