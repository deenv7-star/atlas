/** What atlas is doing while a tool runs, said plainly (same lines as the text brain, loop.js). */
const LINES = {
  get_day_overview: 'רגע, בודקת את היום', find_bookings: 'מחפשת בהזמנות', get_booking: 'פותחת את ההזמנה',
  check_availability: 'בודקת מה פנוי', get_leads: 'בודקת פניות', get_money: 'בודקת בכספים',
  get_business_settings: 'בודקת בהגדרות', search_help: 'בודקת במדריך', propose_booking: 'מכינה הזמנה',
  propose_guest_message: 'מכינה הודעה', propose_support_handoff: 'מכינה פנייה לנציג',
};
export const statusLine = (name) => LINES[name] || 'רגע, בודקת';

/** The caption under the face for each state. */
export const STATE_LINE = {
  idle: 'כאן בשבילכם', connecting: 'רגע, מתחברת', listening: 'מקשיבה', hearing: 'שומעת אתכם',
  thinking: 'רגע, חושבת', speaking: 'atlas מדברת', ended: 'השיחה הסתיימה', error: 'משהו השתבש',
};
/** Face mood per state (AtlasFace moods). */
export const STATE_MOOD = {
  idle: 'neutral', connecting: 'thinking', listening: 'attentive', hearing: 'attentive',
  thinking: 'thinking', speaking: 'happy', ended: 'neutral', error: 'concerned',
};
