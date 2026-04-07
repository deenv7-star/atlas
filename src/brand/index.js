/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║                    ATLAS — BRAND IDENTITY SYSTEM                  ║
 * ║                        Version 1.0 · 2026                         ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 *
 * Single source of truth for all brand tokens.
 * Import from here — never hardcode brand values in components.
 */

// ─────────────────────────────────────────────────────────────────────────────
// BRAND IDENTITY
// ─────────────────────────────────────────────────────────────────────────────

export const BRAND = {
  name: 'Atlas',
  nameHe: 'אטלס',
  tagline: 'נשא יותר. נהל פחות.',
  taglineEn: 'Carry More. Manage Less.',
  missionHe: 'להעביר את הכובד התפעולי מהיזם לתשתית, כדי שיוכל להתמקד בצמיחה.',
  missionEn: 'Transfer the operational burden from the operator to the infrastructure, so they can focus on growth.',
  categoryHe: 'מערכת הפעלה לניהול נכסים',
  categoryEn: 'Property Management Operating System',
  copyrightYear: 2026,
};

// ─────────────────────────────────────────────────────────────────────────────
// COLOR PALETTE
// ─────────────────────────────────────────────────────────────────────────────
//
// Naming convention: ATLAS_{ROLE}_{VARIANT?}
//
// Roles:
//   TEAL   — Primary brand. Energy, Mediterranean, trust.
//   NIGHT  — Primary dark. Authority, depth, premium.
//   SAND   — Warm neutral. Israeli earth, approachable.
//   CLOUD  — Page bg. Spacious, clean, airy.
//   GOLD   — Success, revenue, premium tier.
//   CORAL  — Alert, warning, cancellation.
//   INDIGO — AI features, intelligent automation.

export const COLORS = {
  // ── Primary ──────────────────────────────────────────────────────────
  /** Primary brand. Vibrant Mediterranean teal. */
  TEAL: '#00D1C1',
  /** Hover/glow state. Lighter teal. */
  TEAL_GLOW: '#00EEDD',
  /** Active/pressed state. Deeper teal. */
  TEAL_DEEP: '#00A89A',
  /** Darkest teal — strong accent. */
  TEAL_DARK: '#007A75',
  /** Teal as RGB for rgba() usage */
  TEAL_RGB: '0, 209, 193',

  // ── Dark / Ink ────────────────────────────────────────────────────────
  /** Primary dark. Deep navy, like the sky Atlas holds. */
  NIGHT: '#0B1220',
  /** Slightly lighter — card bg in dark contexts. */
  NIGHT_SURFACE: '#111827',
  /** Muted ink — secondary text, icons. */
  INK_MUTED: '#4B5563',

  // ── Neutrals ─────────────────────────────────────────────────────────
  /** Warm cream/sand. Israeli desert warmth. */
  SAND: '#F2E9DB',
  /** Light sand — softer backgrounds. */
  SAND_LIGHT: '#FAF5EE',
  /** Page background. Light blue-grey. */
  CLOUD: '#F4F6FB',
  /** Card / surface white. */
  WHITE: '#FFFFFF',
  /** Borders, dividers — very soft. */
  MIST: '#E8EBF0',
  /** Stronger border. */
  BORDER: '#D1D5DB',
  /** Placeholder text, disabled states. */
  FOG: '#9CA3AF',

  // ── Accent ────────────────────────────────────────────────────────────
  /** Revenue, success, premium. Warm gold. */
  GOLD: '#F5A623',
  /** Gold hover. */
  GOLD_DEEP: '#D4891A',
  /** Soft gold background. */
  GOLD_BG: '#FFFBEB',

  /** Alerts, cancellations, warnings. */
  CORAL: '#FF6B6B',
  /** Coral pressed. */
  CORAL_DEEP: '#E85555',
  /** Soft coral background. */
  CORAL_BG: '#FFF1F2',

  /** AI, intelligence, automations. */
  INDIGO: '#6C63FF',
  /** Indigo pressed. */
  INDIGO_DEEP: '#5A52E0',
  /** Soft indigo background. */
  INDIGO_BG: '#F0EFFE',

  // ── Semantic ─────────────────────────────────────────────────────────
  SUCCESS: '#10B981',
  SUCCESS_BG: '#F0FDF4',
  WARNING: '#F59E0B',
  WARNING_BG: '#FFFBEB',
  DANGER: '#EF4444',
  DANGER_BG: '#FFF1F2',
  INFO: '#3B82F6',
  INFO_BG: '#EFF6FF',
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────────────────────────────────────

export const TYPOGRAPHY = {
  // Stacks
  STACK_PRIMARY: "'Heebo', 'Rubik', system-ui, -apple-system, sans-serif",
  STACK_RTL: "'Rubik', 'Heebo', system-ui, -apple-system, sans-serif",
  STACK_MONO: "'JetBrains Mono', ui-monospace, monospace",

  // Scale (rem)
  SIZE: {
    XS: '0.75rem',   // 12px — labels, captions
    SM: '0.875rem',  // 14px — secondary text, table cells
    BASE: '1rem',    // 16px — body copy
    LG: '1.125rem',  // 18px — large body, card titles
    XL: '1.25rem',   // 20px — sub-headings
    '2XL': '1.5rem', // 24px — section headings
    '3XL': '1.875rem', // 30px — page headings
    '4XL': '2.25rem', // 36px — hero sub-text
    '5XL': '3rem',   // 48px — hero display
    '6XL': '3.75rem', // 60px — max display
  },

  // Weights
  WEIGHT: {
    REGULAR: 400,
    MEDIUM: 500,
    SEMIBOLD: 600,
    BOLD: 700,
    EXTRABOLD: 800,
    BLACK: 900,
  },

  // Line heights
  LEADING: {
    TIGHT: 1.15,   // Large display text
    SNUG: 1.3,     // Headings
    NORMAL: 1.5,   // Body
    RELAXED: 1.65, // Long-form / prose
  },

  // Letter spacing
  TRACKING: {
    TIGHT: '-0.025em',  // Large headings
    NORMAL: '0',
    WIDE: '0.025em',    // Labels, badges
    WIDER: '0.05em',    // Caps labels
    WIDEST: '0.1em',    // All-caps overlines
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SPACING
// ─────────────────────────────────────────────────────────────────────────────

export const SPACING = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
};

// ─────────────────────────────────────────────────────────────────────────────
// BORDER RADIUS
// ─────────────────────────────────────────────────────────────────────────────

export const RADIUS = {
  SM: '0.375rem',   // 6px — badges, chips
  MD: '0.5rem',     // 8px — inputs, small buttons
  LG: '0.75rem',    // 12px — standard
  XL: '1rem',       // 16px — cards
  '2XL': '1.25rem', // 20px — panels, sections
  '3XL': '1.5rem',  // 24px — large panels
  FULL: '9999px',   // Pills, avatars
};

// ─────────────────────────────────────────────────────────────────────────────
// SHADOWS
// ─────────────────────────────────────────────────────────────────────────────

export const SHADOWS = {
  XS: '0 1px 2px rgba(15, 23, 42, 0.04)',
  SM: '0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03)',
  MD: '0 4px 24px rgba(15, 23, 42, 0.06)',
  LG: '0 8px 40px rgba(15, 23, 42, 0.10)',
  XL: '0 16px 60px rgba(15, 23, 42, 0.14)',
  /** Teal glow — CTAs, focused inputs, active states */
  TEAL_SM: '0 2px 8px rgba(0, 209, 193, 0.25)',
  TEAL_MD: '0 6px 20px rgba(0, 209, 193, 0.35)',
  TEAL_LG: '0 8px 32px rgba(0, 209, 193, 0.45)',
  /** Indigo glow — AI features */
  INDIGO_SM: '0 2px 8px rgba(108, 99, 255, 0.25)',
  INDIGO_MD: '0 6px 20px rgba(108, 99, 255, 0.35)',
  /** Hero section subtle glow */
  HERO: '0 2px 20px rgba(79, 70, 229, 0.06)',
  /** Inset for glass morphism surfaces */
  INSET: 'inset 0 1px 0 rgba(255, 255, 255, 0.12)',
};

// ─────────────────────────────────────────────────────────────────────────────
// MOTION
// ─────────────────────────────────────────────────────────────────────────────
//
// Design principle: Motion carries meaning. Every transition communicates state.
// Fast entering (≤420ms). No gratuitous animation. Spring = alive, not robotic.

export const MOTION = {
  // Easing curves
  EASE: {
    OUT: 'cubic-bezier(0.23, 1, 0.32, 1)',         // Punchy, snappy enter
    IN: 'cubic-bezier(0.55, 0, 1, 0.45)',           // Fast exit
    IN_OUT: 'cubic-bezier(0.77, 0, 0.175, 1)',      // Smooth transition
    SPRING: 'cubic-bezier(0.34, 1.3, 0.64, 1)',     // Bouncy, alive
    SMOOTH: 'cubic-bezier(0.4, 0, 0.2, 1)',         // Material-like
  },

  // Durations
  DURATION: {
    INSTANT: '80ms',
    FAST: '150ms',    // Hover bg changes
    NORMAL: '250ms',  // State changes
    ENTER: '420ms',   // Page / panel enters
    SLOW: '600ms',    // Large reveals
    SCENIC: '800ms',  // Hero animations
  },

  // Stagger step for list animations
  STAGGER: '80ms',

  // Framer Motion presets (use with motion.div)
  VARIANTS: {
    FADE_UP: {
      hidden: { opacity: 0, y: 24 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.42, ease: [0.23, 1, 0.32, 1] },
      },
    },
    FADE_IN: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] },
      },
    },
    SCALE_IN: {
      hidden: { opacity: 0, scale: 0.92 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.38, ease: [0.34, 1.3, 0.64, 1] },
      },
    },
    SLIDE_RIGHT: {
      hidden: { opacity: 0, x: -24 },
      visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.42, ease: [0.23, 1, 0.32, 1] },
      },
    },
    CONTAINER_STAGGER: {
      hidden: {},
      visible: {
        transition: { staggerChildren: 0.08, delayChildren: 0.05 },
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// BRAND COPY — Hebrew & English
// ─────────────────────────────────────────────────────────────────────────────

export const COPY = {
  // ── Taglines & Headlines ─────────────────────────────────────────────
  TAGLINE_HE: 'נשא יותר. נהל פחות.',
  TAGLINE_EN: 'Carry More. Manage Less.',

  HERO_HEADLINE_HE: 'ניהול הנכסים שלך בסדר גודל חדש',
  HERO_HEADLINE_EN: 'Property management at a new scale',

  HERO_SUB_HE: 'אטלס מרכזת הזמנות, אורחים, ניקיון, תשלומים ואוטומציה בפלטפורמה אחת חכמה — כדי שתוכל לנהל יותר נכסים עם פחות מאמץ.',
  HERO_SUB_EN: 'Atlas centralizes bookings, guests, cleaning, payments and automation in one intelligent platform — so you can manage more properties with less effort.',

  // ── Value Props ───────────────────────────────────────────────────────
  VALUE_PROPS: [
    { icon: 'Clock', titleHe: 'חוסך 20+ שעות שבועיות', titleEn: 'Save 20+ hours per week', descHe: 'אוטומציה מלאה של תהליכי עבודה שחוזרים על עצמם' },
    { icon: 'Shield', titleHe: 'אפס הזמנות כפולות', titleEn: 'Zero double-bookings', descHe: 'סנכרון לוח שנה מלא עם Airbnb, Booking ועוד' },
    { icon: 'BarChart3', titleHe: 'שקיפות מלאה', titleEn: 'Complete transparency', descHe: 'כל נתוני העסק בזמן אמת, בלי Excel, בלי ניחושים' },
    { icon: 'Zap', titleHe: 'מוכן תוך שעות', titleEn: 'Ready in hours', descHe: 'אונבורדינג מהיר, תמיכה בעברית, פרטנר ישראלי' },
  ],

  // ── CTAs ─────────────────────────────────────────────────────────────
  CTA_PRIMARY_HE: 'התחילו בחינם',
  CTA_PRIMARY_EN: 'Start Free',
  CTA_SECONDARY_HE: 'צפייה בדמו',
  CTA_SECONDARY_EN: 'Watch Demo',
  CTA_PRICING_HE: 'בחרו תוכנית',
  CTA_PRICING_EN: 'Choose a Plan',

  // ── Social Proof ──────────────────────────────────────────────────────
  SOCIAL_PROOF_HE: '50+ נכסים מנוהלים • ישראל',
  SOCIAL_PROOF_EN: '50+ properties managed • Israel',

  // ── Pricing Tier Names ────────────────────────────────────────────────
  PRICING: {
    BASIC: { nameHe: 'בסיקה', nameEn: 'Basic', price: 299, currency: '₪', period: 'mo' },
    PRO: { nameHe: 'מתקדמת', nameEn: 'Pro', price: 599, currency: '₪', period: 'mo', recommended: true },
    ENTERPRISE: { nameHe: 'ארגונית', nameEn: 'Enterprise', price: null, currency: null },
  },

  // ── Navigation ────────────────────────────────────────────────────────
  NAV: {
    DASHBOARD: 'דשבורד',
    CALENDAR: 'לוח שנה',
    BOOKINGS: 'הזמנות',
    LEADS: 'לידים',
    MESSAGES: 'הודעות',
    REVIEWS: 'ביקורות',
    CLEANING: 'ניקיון',
    INVOICES: 'חשבוניות',
    PAYMENTS: 'תשלומים',
    REVENUE: 'הכנסות',
    AI: 'עוזר AI',
    AUTOMATIONS: 'אוטומציות',
  },

  // ── Status Labels ─────────────────────────────────────────────────────
  STATUS: {
    NEW: 'חדש',
    CONFIRMED: 'מאושר',
    CANCELLED: 'בוטל',
    PENDING: 'ממתין',
    CHECKED_IN: 'נכנס',
    CHECKED_OUT: 'יצא',
    COMPLETED: 'הושלם',
    IN_PROGRESS: 'בביצוע',
  },

  // ── Toast / Notification Templates ────────────────────────────────────
  TOAST: {
    BOOKING_CREATED: 'ההזמנה נוצרה בהצלחה',
    BOOKING_UPDATED: 'ההזמנה עודכנה',
    BOOKING_CANCELLED: 'ההזמנה בוטלה',
    PAYMENT_RECEIVED: 'תשלום התקבל',
    SAVE_SUCCESS: 'השינויים נשמרו',
    SAVE_ERROR: 'שגיאה בשמירת הנתונים',
    GENERIC_ERROR: 'משהו השתבש, נסה שוב',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// BRAND ARCHETYPE & PERSONALITY
// ─────────────────────────────────────────────────────────────────────────────

export const BRAND_PERSONALITY = {
  /**
   * Primary Archetype: THE SAGE + THE HERO
   *
   * Sage: Provides clarity, intelligence, data-informed decisions.
   * Hero: Empowers users to overcome operational chaos and scale.
   */
  archetypes: ['Sage', 'Hero'],

  /**
   * Personality Traits (5 pillars)
   *
   * 1. CONFIDENT — Knows its craft deeply. Speaks with quiet authority.
   * 2. DIRECT    — Israeli directness (ישרות). No fluff, no buzzwords.
   * 3. WARM      — Cares genuinely about user success. Not cold tech.
   * 4. INTELLIGENT — Thinks ahead. Surfaces the right insight at the right time.
   * 5. RELIABLE  — Never drops the ball. Like the Titan, it carries.
   */
  traits: ['Confident', 'Direct', 'Warm', 'Intelligent', 'Reliable'],

  /**
   * Voice & Tone Guidelines
   *
   * DO:
   *   ✓ Speak in plain, clear Hebrew — no corporate jargon
   *   ✓ Lead with the benefit, not the feature
   *   ✓ Use concrete numbers when possible ("20+ שעות", "50+ נכסים")
   *   ✓ Address the user directly ("אתה", not "המשתמש")
   *   ✓ Celebrate wins — use positive reinforcement in toasts/alerts
   *   ✓ Be concise — if you can say it in 5 words, don't use 10
   *
   * DON'T:
   *   ✗ Use buzzwords ("סינרגיה", "אינובציה", "דיסרפשן")
   *   ✗ Over-promise or use hyperbole
   *   ✗ Use passive voice
   *   ✗ Use long, complex sentences in UI copy
   *   ✗ Be cold or robotic in error messages
   */
  voiceGuidelines: {
    tone: ['Professional', 'Direct', 'Warm', 'Empowering'],
    avoid: ['Jargon', 'Passive voice', 'Hyperbole', 'Overly formal'],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGO USAGE
// ─────────────────────────────────────────────────────────────────────────────

export const LOGO = {
  /**
   * Primary: Full color (teal on white or dark bg)
   * Mono: Single color for embossed/engraved contexts
   * Min size: 24px height (digital), 10mm (print)
   * Clear space: equal to the height of the "A" letterform on all sides
   */
  paths: {
    FULL: '/atlas-logo-final.png',
    ICON: '/favicon.svg',
  },
  minHeightPx: 24,
  clearSpaceRatio: 0.25, // 25% of logo height
};

// ─────────────────────────────────────────────────────────────────────────────
// BREAKPOINTS
// ─────────────────────────────────────────────────────────────────────────────

export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
};

// ─────────────────────────────────────────────────────────────────────────────
// Z-INDEX SCALE
// ─────────────────────────────────────────────────────────────────────────────

export const Z = {
  BASE: 0,
  RAISED: 10,
  DROPDOWN: 100,
  STICKY: 200,
  OVERLAY: 300,
  MODAL: 400,
  POPOVER: 500,
  TOAST: 600,
  TOOLTIP: 700,
};

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT EXPORT — full brand system
// ─────────────────────────────────────────────────────────────────────────────

const AtlasBrand = {
  BRAND,
  COLORS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
  MOTION,
  COPY,
  BRAND_PERSONALITY,
  LOGO,
  BREAKPOINTS,
  Z,
};

export default AtlasBrand;
