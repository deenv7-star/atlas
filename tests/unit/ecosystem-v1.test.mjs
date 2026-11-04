// ecosystem v1 (05.11.2026): static guards for the design-system / copy sweep.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

/** Every nav label the sheet shows, read from the source (the module imports lucide/React, so no import here). */
function navItems() {
  const src = read('src/config/navigation.js');
  const groups = src.slice(src.indexOf('export const NAV_GROUPS'), src.indexOf('/** "כספים" is one place'));
  return [...groups.matchAll(/\{ page: '(\w+)', label: '([^']+)'/g)].map((m) => ({ page: m[1], label: m[2] }));
}

const PAGE_FILE = { GuestPortal: 'GuestPages', Dashboard: null, Payments: null };
// Dashboard's h1 is the greeting; "כסף" is the section, its first tab is titled "תשלומים".

test('#25 every nav label is that page\'s own title (title = nav label)', () => {
  for (const { page, label } of navItems()) {
    if (PAGE_FILE[page] === null) continue;
    const file = `src/pages/${PAGE_FILE[page] || page}.jsx`;
    const src = read(file);
    assert.ok(src.includes(label), `${file} should show "${label}" as its title`);
  }
});

test('#7 no coming-soon screen in the nav', () => {
  assert.ok(!navItems().some((i) => i.page === 'OwnerReports'));
});

test('#3 no invoice / receipt words on the app screens that the review flagged', () => {
  const files = ['src/pages/Invoices.jsx', 'src/pages/Billing.jsx', 'src/pages/Integrations.jsx', 'src/components/bookings/BookingDetails.jsx',
    'src/config/navigation.js', 'src/seo/routeMeta.js', 'src/components/invoices/InvoicePreview.jsx'];
  for (const f of files) {
    const visible = read(f).split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
    assert.ok(!/קבלה|קבלות|חשבוניות|מסמכים שהוצאתם/.test(visible.replace(/חשבונית ירוקה/g, '')), `${f} still says invoice/receipt`);
  }
});

test('#11 inquiries are "פנייה", never "ליד" in the booking journey or titles', () => {
  assert.ok(!/label: 'ליד'/.test(read('src/components/bookings/BookingDetails.jsx')));
  assert.ok(!/לידים/.test(read('src/seo/routeMeta.js')));
});

test('#24 legacy PascalCase paths resolve to their canonical path', async () => {
  const src = read('src/utils/index.ts');
  assert.ok(src.includes('export function canonicalPathFor'));
  assert.ok(/MonthlyReport: '\/monthly-report'/.test(src));
});

test('#12 no Hebrew letter glued to a Latin word with a hyphen in the integrations subtitle', () => {
  const src = read('src/pages/Integrations.jsx');
  assert.ok(!src.includes('Airbnb ו-Booking.com נכנסים'));
});

test('#23 the assistant speaks female first person in the text status lines too', () => {
  const loop = read('supabase/functions/_shared/brain/loop.js');
  assert.ok(loop.includes('PERSONA.tools'));
  assert.ok(!/'בודקים בנתונים שלכם'/.test(read('src/assistant/ui.jsx')));
});
