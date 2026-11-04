/**
 * How atlas speaks about herself. ONE SWITCH for the whole product: the brain prompt (text + voice, server),
 * the status lines under her face, the screen captions and the in-browser demo all read from here.
 *
 *   ATLAS_PERSON = 'female'  first person, female: "רגע, בודקת", "הכנתי", "אני יכולה"   (pending Deen's OK, 04.11.2026)
 *   ATLAS_PERSON = 'plural'  gender-neutral "we" (the voice before v3): "רגע, בודקים", "הכנו", "אנחנו יכולים"
 *
 * The owner is always addressed in plural ("אתם") in both. Changing this line changes the edge prompt too, so a
 * switch needs the ai-chat + voice-session redeploy and an app build (see work/backup/2026-11-04-assistant-v3/SHIP.md).
 */
export const ATLAS_PERSON = 'female';

const LEX = {
  female: {
    // brain prompt (supabase/functions/_shared/brain/prompt.js)
    promptWho: 'כמו מישהי מהצוות שמכירה את העסק מבפנים',
    promptSelf: 'על עצמכם מדברים בגוף ראשון נקבה ("בודקת", "הכנתי", "מצאתי").',
    promptCheck: 'רגע, בודקת',
    promptVoiceSelf: 'על עצמכם מדברים בגוף ראשון נקבה: "אני יכולה", "בודקת", "הכנתי". אף פעם לא בלשון זכר.',
    promptNotHeard: 'לא שמעתי טוב, אפשר לחזור?',
    // app lines
    tools: {
      get_day_overview: 'רגע, בודקת את היום', find_bookings: 'מחפשת בהזמנות', get_booking: 'פותחת את ההזמנה',
      check_availability: 'בודקת מה פנוי', get_leads: 'בודקת פניות', get_money: 'בודקת בכספים',
      get_business_settings: 'בודקת בהגדרות', search_help: 'בודקת במדריך', propose_booking: 'מכינה הזמנה',
      propose_guest_message: 'מכינה הודעה', propose_support_handoff: 'מכינה פנייה לנציג',
    },
    checking: 'רגע, בודקת',
    states: { connecting: 'רגע, מתחברת', listening: 'מקשיבה', hearing: 'שומעת אתכם', thinking: 'רגע, חושבת', speaking: 'atlas מדברת' },
    writeHere: 'אפשר לכתוב לי', writeToMe: 'כתבו לי', placeholder: 'כתבו לי שאלה',
    hintPrepare: 'או לבקש שאכין הזמנה',
    notHeard: 'לא שמעתי טוב. אפשר לחזור על השאלה?',
    prepared: 'הכנתי', yesPrepared: 'יש, הכנתי',
    askBooking: 'תכיני הזמנה חדשה לנועה לסוף השבוע',
  },
  plural: {
    promptWho: 'כמו מישהו מהצוות שמכיר את העסק מבפנים',
    promptSelf: 'על עצמכם מדברים ברבים, בלי מגדר ("בודקים", "הכנו", "מצאנו"). אף פעם לא "אני יכול" או "אני יכולה".',
    promptCheck: 'רגע, בודקים',
    promptVoiceSelf: 'על עצמכם מדברים ברבים, בלי מגדר: "אנחנו יכולים", "בודקים", "הכנו". אף פעם לא "אני יכול" או "אני יכולה".',
    promptNotHeard: 'לא שמענו טוב, אפשר לחזור?',
    tools: {
      get_day_overview: 'רגע, בודקים את היום', find_bookings: 'מחפשים בהזמנות', get_booking: 'פותחים את ההזמנה',
      check_availability: 'בודקים מה פנוי', get_leads: 'בודקים פניות', get_money: 'בודקים בכספים',
      get_business_settings: 'בודקים בהגדרות', search_help: 'בודקים במדריך', propose_booking: 'מכינים הזמנה',
      propose_guest_message: 'מכינים הודעה', propose_support_handoff: 'מכינים פנייה לנציג',
    },
    checking: 'רגע, בודקים',
    states: { connecting: 'רגע, מתחברים', listening: 'מקשיבים', hearing: 'שומעים אתכם', thinking: 'רגע, חושבים', speaking: 'atlas עונה' },
    writeHere: 'אפשר לכתוב כאן', writeToMe: 'כתבו לנו', placeholder: 'כתבו שאלה',
    hintPrepare: 'או לבקש שנכין הזמנה',
    notHeard: 'לא שמענו טוב. אפשר לחזור על השאלה?',
    prepared: 'הכנו', yesPrepared: 'יש, הכנו',
    askBooking: 'תכינו הזמנה חדשה לנועה לסוף השבוע',
  },
};

export const PERSONA = LEX[ATLAS_PERSON] || LEX.plural;
