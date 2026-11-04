/**
 * One tap = one voice session. 04.11.2026 22:28:27 + :28 one tap opened two voice-session slices (two sockets, two
 * budget slices). The guard refuses a second start while one is starting or running, and any start within
 * START_DEBOUNCE_MS of the last one (a double tap, a re-render, the open-screen effect racing the tap).
 */
export const START_DEBOUNCE_MS = 1000;

export function createStartGuard(now = () => Date.now()) {
  let busy = false;
  let last = -Infinity;
  return {
    /** true = go ahead (and the guard is now busy); false = ignore this start. */
    tryEnter() {
      const t = now();
      if (busy || t - last < START_DEBOUNCE_MS) return false;
      busy = true; last = t;
      return true;
    },
    /** The conversation ended, failed, or was closed: the next tap may start again. */
    release() { busy = false; },
    get busy() { return busy; },
  };
}

