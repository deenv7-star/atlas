/**
 * Mounts a below-the-fold landing section only when it comes near the viewport (perf budget,
 * see PR #136): its JS and CSS load in their own chunk. The placeholder keeps the anchor and space.
 */
import React, { Suspense, useEffect, useRef, useState } from 'react';

export default function LazyGrowth({ load, id = 'growth', minHeight = 900 }) {
  const ref = useRef(null);
  const [Comp, setComp] = useState(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let done = false;
    const go = () => { if (done) return; done = true; load().then((m) => setComp(() => m.default)); };
    if (typeof IntersectionObserver === 'undefined' || window.location.hash === `#${id}`) { go(); return undefined; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { go(); io.disconnect(); } }, { rootMargin: '800px 0px' });
    io.observe(el);
    // also load when the browser is idle after first paint, so a fast jump (nav link to #pricing) never leaves a gap
    const ric = window.requestIdleCallback || ((f) => setTimeout(f, 2500));
    const cic = window.cancelIdleCallback || clearTimeout;
    const idle = ric(go, { timeout: 4000 });
    return () => { io.disconnect(); cic(idle); };
  }, [load, id]);
  if (Comp) return <Suspense fallback={null}><Comp /></Suspense>;
  return <div ref={ref} id={id} style={{ minHeight }} aria-hidden="true" />;
}
