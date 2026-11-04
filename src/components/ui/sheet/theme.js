/**
 * One switch for the sheet design system (fix/sheets-a vs fix/sheets-b).
 *   'a' minimal: white sheet, labelled fields, nothing extra.
 *   'b' richer:  canvas sheet, white grouped cards with section titles, date tiles, live summary on the button.
 */
export const SHEET_VARIANT = 'b';
export const isRich = () => SHEET_VARIANT === 'b';
