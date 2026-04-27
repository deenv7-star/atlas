/** Serializes undo toasts: at most one active Sonner undo at a time; others wait in FIFO. */

const waiting: Array<() => void> = [];
let slotHeld = false;

export function enqueueUndoJob(start: () => void): void {
  if (slotHeld) {
    waiting.push(start);
    return;
  }
  slotHeld = true;
  start();
}

export function completeUndoSlot(): void {
  slotHeld = false;
  const next = waiting.shift();
  if (next) {
    slotHeld = true;
    next();
  }
}
