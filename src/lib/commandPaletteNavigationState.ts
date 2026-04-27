/** Router `location.state` shape when navigating from the command palette (quick actions). */
export type CommandPaletteNavigateState = {
  commandPalette: {
    newBooking?: true;
    newGuest?: true;
    newMaintenance?: true;
    newPayment?: true;
  };
};

export function readCommandPaletteFlag(
  state: unknown,
  key: keyof NonNullable<CommandPaletteNavigateState['commandPalette']>,
): boolean {
  if (!state || typeof state !== 'object') return false;
  const cp = (state as { commandPalette?: unknown }).commandPalette;
  if (!cp || typeof cp !== 'object') return false;
  return Boolean((cp as Record<string, unknown>)[key]);
}
