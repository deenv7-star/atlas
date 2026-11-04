/**
 * Audit 04.11 #3: the assistant waited forever on a hung connection. A deadline for one answer:
 *   - `firstMs`: no response at all within this time → give up (30 s);
 *   - `stallMs`: the stream started but no new piece arrived for this long → give up.
 * The caller's own signal (the stop button) still aborts as before; a deadline abort is told apart
 * by `timedOut()`, so the UI shows the timeout error with "נסו שוב" instead of "stopped".
 * Pure (no imports), unit-tested in tests/unit/fix-1104-assistant.test.mjs.
 */
export const FIRST_BYTE_MS = 30_000;
export const STALL_MS = 20_000;

export function createDeadline(outer, { firstMs = FIRST_BYTE_MS, stallMs = STALL_MS, setT = setTimeout, clearT = clearTimeout } = {}) {
  const ac = new AbortController();
  let timedOut = false;
  let timer = null;
  const fire = () => { timedOut = true; ac.abort(); };
  const arm = (ms) => { if (timer) clearT(timer); timer = setT(fire, ms); };
  const onOuter = () => ac.abort();
  if (outer) {
    if (outer.aborted) ac.abort();
    else outer.addEventListener('abort', onOuter, { once: true });
  }
  arm(firstMs);
  return {
    signal: ac.signal,
    /** A piece of the answer arrived: restart the stall timer. */
    bump() { if (!ac.signal.aborted) arm(stallMs); },
    clear() { if (timer) clearT(timer); timer = null; outer?.removeEventListener?.('abort', onOuter); },
    timedOut: () => timedOut,
  };
}
