/** Footer link groups, shared by the landing footer and both site designs. Kept tiny on purpose (landing bundle). */
export const FOOTER_GROUPS = [
  { title: 'מוצר', links: [{ to: '/', label: 'דף הבית' }, { to: '/pricing', label: 'מחירים' }, { to: '/register', label: '14 ימי ניסיון' }, { to: '/login', label: 'כניסה' }] },
  { title: 'ללמוד', links: [{ to: '/blog', label: 'בלוג' }, { to: '/about', label: 'אודות' }, { to: '/contact', label: 'יצירת קשר' }] },
  { title: 'מידע משפטי', links: [
    { to: '/terms', label: 'תנאי שימוש' },
    { to: '/privacy', label: 'מדיניות פרטיות' },
    { to: '/cookies', label: 'עוגיות' },
    { to: '/cancellation', label: 'ביטול עסקה' },
    { to: '/data-processing', label: 'עיבוד מידע' },
    { to: '/data-security', label: 'אבטחת מידע' },
    { to: '/accessibility', label: 'הצהרת נגישות' },
  ] },
];
