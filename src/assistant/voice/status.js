/** What atlas is doing while a tool runs, said plainly (same lines as the text brain, loop.js). */
const LINES = {
  get_day_overview: 'בודקים את היום', find_bookings: 'מחפשים בהזמנות', get_booking: 'פותחים את ההזמנה',
  check_availability: 'בודקים מה פנוי', get_leads: 'בודקים פניות', get_money: 'בודקים בכספים',
  get_business_settings: 'בודקים את ההגדרות', search_help: 'בודקים במדריך', propose_booking: 'מכינים הזמנה',
  propose_guest_message: 'מכינים הודעה', propose_support_handoff: 'מכינים פנייה לנציג',
};
export const statusLine = (name) => LINES[name] || 'בודקים';

/** The caption under the face for each state. */
export const STATE_LINE = {
  idle: 'מוכנים', connecting: 'מתחברים', listening: 'מקשיבים', hearing: 'שומעים אתכם',
  thinking: 'חושבים', speaking: 'atlas עונה', ended: 'השיחה הסתיימה', error: 'משהו השתבש',
};
/** Face mood per state (AtlasFace moods). */
export const STATE_MOOD = {
  idle: 'neutral', connecting: 'thinking', listening: 'attentive', hearing: 'attentive',
  thinking: 'thinking', speaking: 'happy', ended: 'neutral', error: 'concerned',
};
