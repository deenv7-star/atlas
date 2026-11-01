// atlas launch video: real screen captures from a local production build in local demo mode.
// Usage: see notes.md.  node videos/01-captures/capture.mjs [--only=calendar,channels,whatsapp,finance] [--devices=iphone,mac]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { routeBuild } from './lib/server.mjs';
import * as S from './lib/seed.mjs';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('/opt/node-tools/node_modules/playwright'); }
const { chromium } = playwright;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, 'build/dist');
// The build is served under the product's real origin via request interception (no network), so links the
// app builds from window.location.origin (guest page /g/<token>) read atlas-il.com instead of 127.0.0.1.
const BASE = 'https://atlas-il.com';
const DPR = 3;
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const ONLY = args.only ? args.only.split(',') : null;
const DEVICES = {
  iphone: { viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true, label: 'iPhone 15/16 Pro logical 393x852' },
  mac: { viewport: { width: 1512, height: 982 }, isMobile: false, hasTouch: false, label: 'MacBook Pro 14" default scaled 1512x982' },
};
const DEV_LIST = args.devices ? args.devices.split(',') : Object.keys(DEVICES);

// Runtime-only CSS: hides the floating help launcher (support widget) so it does not cover the UI.
const BASE_CSS = '.sp-launcher{visibility:hidden !important}';

const manifest = [];
const logs = [];
const log = (...a) => { const s = a.join(' '); logs.push(s); console.log(s); };

function rel(p) { return path.relative(HERE, p).split(path.sep).join('/'); }

async function newPage(browser, dev, data, isoTime) {
  const d = DEVICES[dev];
  const ctx = await browser.newContext({
    viewport: d.viewport, deviceScaleFactor: DPR, isMobile: d.isMobile, hasTouch: d.hasTouch,
    locale: 'he-IL', timezoneId: 'Asia/Jerusalem', serviceWorkers: 'block', reducedMotion: 'no-preference',
  });
  // seed localStorage once per context (the app's own local demo store), keep later writes made by the app
  await ctx.addInitScript((snap) => {
    try {
      if (!localStorage.getItem('__capture_seeded')) {
        localStorage.clear();
        for (const [k, v] of Object.entries(snap)) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
        localStorage.setItem('__capture_seeded', '1');
      }
    } catch { /* ignore */ }
  }, data);
  await routeBuild(ctx, DIST, BASE);
  // WhatsApp deep links (wa.me) must not leave the page during capture: answer them with an empty page.
  await ctx.route(/wa\.me|api\.whatsapp\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<html></html>' }));
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date(isoTime));
  page.on('pageerror', (e) => log(`  [pageerror ${dev}] ${e.message}`));
  page.on('popup', (p) => p.close().catch(() => {}));
  page.dev = dev;
  return { ctx, page };
}

async function go(page, route) {
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: BASE_CSS });
  await page.evaluate(() => document.fonts.ready);
  await settle(page);
}
async function settle(page, ms = 1200) {
  await page.waitForTimeout(ms);
  // finish entrance animations so stills are final
  await page.evaluate(() => document.getAnimations().forEach((a) => { try { if (a.effect?.getTiming?.().iterations !== Infinity) a.finish(); } catch { /* */ } }));
  await page.waitForTimeout(150);
}

async function fontCheck(page) {
  return page.evaluate(() => ({
    heebo300: document.fonts.check('300 16px Heebo'),
    heebo700: document.fonts.check('700 16px Heebo'),
    loaded: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}`).slice(0, 12),
    bodyFont: getComputedStyle(document.body).fontFamily,
    dir: document.documentElement.dir || getComputedStyle(document.body).direction,
  }));
}

function outPath(dev, name) {
  const p = path.join(HERE, dev, `${name}.png`);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  return p;
}

/** Full viewport screenshot. */
async function full(page, name, what, extra = {}) {
  const file = outPath(page.dev, name);
  // rule 6: no payment-link feature on screen. Scan the visible DOM text before every full frame.
  const payHits = await page.evaluate(() => (document.body.innerText.match(/קישור\s*(ל)?תשלום|לינק\s*(ל)?תשלום|תשלום\s*בלינק|payment\s*link|pay(ment)?[-_]?link/gi) || []));
  if (payHits.length) log(`  !! payment-link text on ${name}: ${payHits.join(', ')}`);
  await page.screenshot({ path: file, animations: 'disabled', caret: 'hide' });
  manifest.push({ file: rel(file), device: page.dev, kind: 'full', what, payment_link_text_in_dom: payHits.length > 0, ...extra });
  log(`  full  ${rel(file)}`);
  return file;
}

/**
 * Element crop + matching "slot empty" full screenshot (element hidden with visibility:hidden at runtime).
 * The element is scrolled into view first so its box sits inside the full screenshot `parent`.
 */
async function lift(page, locator, { el, parent, slot, what, pad = 0, noSlot = false }) {
  const loc = locator.first();
  await loc.waitFor({ state: 'visible', timeout: 8000 });
  const box = await loc.boundingBox();
  if (!box) throw new Error(`no box for ${el}`);
  const vp = page.viewportSize();
  const clip = {
    x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad),
    width: Math.min(vp.width, box.x + box.width + pad) - Math.max(0, box.x - pad),
    height: Math.min(vp.height, box.y + box.height + pad) - Math.max(0, box.y - pad),
  };
  const elFile = outPath(page.dev, el);
  // crop from the same viewport frame as the parent full screenshot, so pixels and bbox match exactly
  await page.screenshot({ path: elFile, clip, animations: 'disabled', caret: 'hide' });
  const r = (n) => Math.round(n * 100) / 100;
  manifest.push({
    file: rel(elFile), device: page.dev, kind: 'element', what,
    parent: parent ? rel(outPath(page.dev, parent)) : null,
    bbox_css: { x: r(box.x), y: r(box.y), w: r(box.width), h: r(box.height) },
    clipped_to_viewport: clip.width < box.width || clip.height < box.height,
  });
  log(`  el    ${rel(elFile)}  @ ${r(box.x)},${r(box.y)} ${r(box.width)}x${r(box.height)}`);
  if (!noSlot && slot) {
    const handle = await loc.elementHandle({ timeout: 3000 }).catch(() => null);
    if (!handle) { log(`  (slot skipped for ${el}: element went away, e.g. a toast)`); return box; }
    await handle.evaluate((n) => { n.dataset.captureHidden = n.style.visibility || ''; n.style.visibility = 'hidden'; });
    const slotFile = outPath(page.dev, slot);
    await page.screenshot({ path: slotFile, animations: 'disabled', caret: 'hide' });
    await handle.evaluate((n) => { n.style.visibility = n.dataset.captureHidden; delete n.dataset.captureHidden; });
    manifest.push({ file: rel(slotFile), device: page.dev, kind: 'slot-empty', what: `${what} — same frame with the element hidden (empty slot)`, element: rel(elFile), parent: parent ? rel(outPath(page.dev, parent)) : null });
    log(`  slot  ${rel(slotFile)}`);
  }
  return box;
}

async function centerOn(page, locator) {
  const h = await locator.first().elementHandle();
  await h.evaluate((n) => n.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' }));
  await page.waitForTimeout(300);
}

/** Hide runtime elements by selector (demo-only notes etc.) — recorded in the notes. */
async function hide(page, css) { await page.addStyleTag({ content: `${css}{display:none !important}` }); }

// ───────────────────────────── data stages ─────────────────────────────
const H = S.history();
const stage = {
  // Beat 3/4 base: direct bookings only (before channels arrive)
  base: () => S.store({ bookings: [...S.DIRECT, ...H], payments: S.paymentsFor([...S.DIRECT, ...H]), leads: S.LEADS, automations: S.AUTOMATIONS }),
  bookingOnly: () => S.store({ bookings: [...S.DIRECT, S.BOOKING_COM, ...H], payments: S.paymentsFor([...S.DIRECT, ...H]), leads: S.LEADS, automations: S.AUTOMATIONS }),
  both: () => S.store({ bookings: [...S.DIRECT, S.BOOKING_COM, S.AIRBNB, ...H], payments: S.paymentsFor([...S.DIRECT, ...H]), leads: S.LEADS, automations: S.AUTOMATIONS }),
  monthEnd: ({ expenses = S.EXPENSES, invoices = S.RECEIPTS } = {}) => {
    const bookings = [...S.DIRECT, S.BOOKING_COM_PRICED, S.AIRBNB_PRICED, ...S.LATE_MONTH_CHANNEL, ...H];
    return S.store({ bookings, payments: S.paymentsFor(bookings), expenses, invoices, leads: S.LEADS, automations: S.AUTOMATIONS });
  },
};

const T = {
  night: '2026-11-04T23:40:00+02:00', // Wednesday 23:40, "פנוי בשבת?"
  friday: '2026-11-06T15:00:00+02:00', // Friday 15:00, guests arrive
  monthEnd: '2026-11-30T20:00:00+02:00', // end of November
};

// ───────────────────────────── scenes ─────────────────────────────
async function sceneCalendar(browser, dev) {
  log(`[calendar] ${dev}`);
  const { ctx, page } = await newPage(browser, dev, stage.base(), T.night);
  await go(page, '/calendar');
  log(`  fonts ${JSON.stringify(await fontCheck(page))}`);
  const sat = page.locator('button[data-day="2026-11-07"]');
  await full(page, 'calendar-full', 'Calendar, November 2026, Wednesday 23:40. Saturday 7.11 shows a free night (open ring dot) in בקתת האלון; other units busy/free per dots.');
  await lift(page, sat, { el: 'el-calendar-saturday', parent: 'calendar-full', slot: 'calendar-slot-empty', what: 'Saturday 7 November cell in the month grid (dots: one per unit; ring = free night between bookings)', pad: 0 });
  if (dev === 'mac') {
    // timeline gap pill "פנוי" on Saturday for בקתת האלון
    await page.locator('[data-timeline]').evaluate((n) => n.scrollIntoView({ block: 'end', behavior: 'instant' }));
    await page.waitForTimeout(300);
    await full(page, 'calendar-timeline-full', 'Calendar timeline scrolled into view: בקתת האלון row shows a dashed "פנוי" pill on Saturday night between two bookings.');
    const colIdx = 6; // 7 Nov is the 7th day column
    const pill = page.locator('[data-timeline] span.border-dashed', { hasText: 'פנוי' }).nth(0);
    // pick the pill that sits under the 7.11 column
    const pills = page.locator('[data-timeline] span.border-dashed', { hasText: 'פנוי' });
    const colBox = await page.locator('[data-timeline] [data-col="2026-11-07"]').boundingBox();
    let target = pill;
    for (let i = 0; i < await pills.count(); i += 1) {
      const b = await pills.nth(i).boundingBox();
      if (b && colBox && b.x < colBox.x + colBox.width && b.x + b.width > colBox.x) { target = pills.nth(i); break; }
    }
    void colIdx;
    await lift(page, target, { el: 'el-calendar-saturday-free-pill', parent: 'calendar-timeline-full', slot: 'calendar-timeline-slot-empty', what: 'Dashed "פנוי" (free) pill on Saturday night, בקתת האלון row' });
    // open the day sheet for בקתת האלון on Saturday (tap the timeline cell)
    await page.locator('[data-timeline] button[aria-label^="בקתת האלון, 7 בנובמבר"]').first().click();
  } else {
    await sat.click();
  }
  await page.locator('[role="dialog"]').waitFor();
  await settle(page, 600);
  await full(page, 'calendar-day-saturday-full', 'Day sheet for Saturday 7 November: per unit "הלילה פנוי"/"הלילה תפוס" with buttons הזמנה חדשה / חסימת תאריכים.');
  await lift(page, page.locator('[role="dialog"]'), { el: 'el-day-sheet-saturday', parent: 'calendar-day-saturday-full', slot: 'calendar-day-saturday-slot-empty', what: 'Saturday day sheet dialog (real DaySheet component)' });
  const freeRow = page.locator('[role="dialog"] li', { hasText: 'בקתת האלון' });
  await lift(page, freeRow, { el: 'el-day-sheet-alon-free', parent: 'calendar-day-saturday-full', slot: 'calendar-day-saturday-alon-slot-empty', what: 'Row "בקתת האלון · הלילה פנוי" inside the Saturday sheet' });
  await ctx.close();
}

async function sceneLead(browser, dev) {
  log(`[lead] ${dev}`);
  const { ctx, page } = await newPage(browser, dev, stage.base(), T.night);
  await go(page, '/leads');
  await full(page, 'leads-before', 'Leads list before saving the new inquiry (2 existing leads).');
  await page.getByRole('button', { name: 'ליד חדש' }).first().click();
  const dlg = page.locator('[role="dialog"]');
  await dlg.waitFor();
  await dlg.locator('input[name="full_name"]').fill('מיכל אברהם');
  await dlg.locator('input[name="phone"]').fill('052-6189024');
  // unit select (Radix)
  await dlg.getByRole('combobox').first().click();
  await page.getByRole('option', { name: 'בקתת האלון' }).click();
  await dlg.locator('input[name="check_in_date"]').fill('2026-11-07');
  await dlg.locator('input[name="check_out_date"]').fill('2026-11-08');
  await dlg.locator('input[name="source"]').fill('וואטסאפ');
  await dlg.locator('textarea[name="notes"]').fill('שאלה ב-23:40 אם פנוי בשבת. זוג, לילה אחד.');
  await page.locator('h2:has-text("ליד חדש")').click(); // blur, close any picker
  await settle(page, 500);
  await full(page, 'lead-form-filled', 'New lead dialog filled: מיכל אברהם, בקתת האלון, 7–8.11, source וואטסאפ, note "פנוי בשבת".');
  await lift(page, dlg, { el: 'el-lead-form', parent: 'lead-form-filled', slot: 'lead-form-slot-empty', what: 'New lead dialog (GuestForm) filled in' });
  const saveBtn = dlg.getByRole('button', { name: 'שמירת ליד' });
  await saveBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await full(page, 'lead-form-filled-bottom', 'New lead dialog scrolled to its save button.');
  await lift(page, saveBtn, { el: 'el-lead-save-button', parent: 'lead-form-filled-bottom', slot: 'lead-form-save-slot-empty', what: '"שמירת ליד" button' });
  await saveBtn.click();
  const toast = page.getByText('הליד נשמר').first();
  await toast.waitFor({ timeout: 8000 });
  await page.waitForTimeout(450);
  await full(page, 'lead-saved-toast', 'Right after saving: toast "הליד נשמר".');
  await lift(page, toast.locator('xpath=ancestor-or-self::*[@role="status" or @data-sonner-toast or contains(@class,"toast")][1]').or(toast), { el: 'el-toast-lead-saved', parent: 'lead-saved-toast', slot: 'lead-saved-toast-slot-empty', what: 'Toast "הליד נשמר"' });
  await page.waitForTimeout(2600); // dialog closes itself after 2s
  await page.locator('[role="dialog"]').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
  await settle(page, 2500); // let the toast go
  await full(page, 'leads-after', 'Leads list after saving: מיכל אברהם appears as a new lead for 7.11, 1 night.');
  const row = page.locator('a[href^="/lead/"]', { hasText: 'מיכל אברהם' });
  await lift(page, row, { el: 'el-lead-row-new', parent: 'leads-after', slot: 'leads-after-slot-empty', what: 'New lead row "מיכל אברהם · ל-7 בנוב׳ · לילה אחד · חדש"' });
  await row.first().click();
  await settle(page, 1200);
  await full(page, 'lead-detail', 'Lead detail page for the saved inquiry.');
  await ctx.close();
}

async function channelState(browser, dev, key, data, label) {
  const { ctx, page } = await newPage(browser, dev, data, T.night);
  await go(page, '/calendar');
  if (dev === 'mac') {
    await page.locator('[data-timeline]').evaluate((n) => n.scrollIntoView({ block: 'end', behavior: 'instant' }));
    // keep 5–9 Nov in view
    await page.locator('[data-timeline] [data-col="2026-11-01"]').evaluate((n) => n.scrollIntoView({ inline: 'end', block: 'nearest', behavior: 'instant' }));
    await page.waitForTimeout(300);
  } else {
    // bring the 5–6 November agenda (where the channel arrivals land) under the header
    await page.locator('section[aria-label^="חמישי, 5"]').evaluate((n) => { n.scrollIntoView({ block: 'start', behavior: 'instant' }); window.scrollBy(0, -110); });
    await page.waitForTimeout(300);
  }
  const name = `channels-${key}`;
  await full(page, name, label);
  return { ctx, page, name };
}

async function sceneChannels(browser, dev) {
  log(`[channels] ${dev}`);
  // A: no channel bookings yet
  let s = await channelState(browser, dev, 'a-none', stage.base(), 'Calendar before any channel booking (direct bookings only). No Booking/Airbnb badge anywhere.');
  await s.ctx.close();
  // B: Booking.com booking landed in סוויטת הגפן
  s = await channelState(browser, dev, 'b-booking', stage.bookingOnly(), 'After the Booking.com iCal booking lands in סוויטת הגפן (5–8.11): only the "Booking" badge is present.');
  await liftChannel(s.page, dev, 'booking', s.name);
  await s.ctx.close();
  // C: Airbnb booking landed in צימר הזית
  s = await channelState(browser, dev, 'c-both', stage.both(), 'After the Airbnb iCal booking lands in צימר הזית (6–9.11): both "Booking" and "Airbnb" badges present, each on its own unit.');
  await liftChannel(s.page, dev, 'booking', s.name);
  await liftChannel(s.page, dev, 'airbnb', s.name);
  await s.ctx.close();
}

async function liftChannel(page, dev, ch, parent) {
  const label = ch === 'booking' ? 'Booking' : 'Airbnb';
  const unit = ch === 'booking' ? 'סוויטת הגפן' : 'צימר הזית';
  if (dev === 'mac') {
    const bar = page.locator(`[data-timeline] a[aria-label*="${unit}, ${label}"]`);
    await lift(page, bar, { el: `el-${ch}-bar-${parent.split('-')[1]}`, parent, slot: `${parent}-no-${ch}-bar`, what: `${label} booking bar in the ${unit} row (iCal import: no name, labelled "הזמנה")` });
    const badge = bar.locator('span', { hasText: new RegExp(`^${label}$`) }).last();
    await lift(page, badge, { el: `el-${ch}-badge-${parent.split('-')[1]}`, parent, slot: `${parent}-no-${ch}-badge`, what: `"${label}" channel badge (SourceBadge) on the bar` });
  } else {
    const item = page.locator('li a[aria-label*="מגיעים"]', { hasText: label }).filter({ hasText: unit });
    await lift(page, item, { el: `el-${ch}-arrival-${parent.split('-')[1]}`, parent, slot: `${parent}-no-${ch}-arrival`, what: `Agenda row: ${label} arrival in ${unit}` });
    const badge = item.locator('span', { hasText: new RegExp(`^${label}$`) }).last();
    await lift(page, badge, { el: `el-${ch}-badge-${parent.split('-')[1]}`, parent, slot: `${parent}-no-${ch}-badge`, what: `"${label}" channel badge (SourceBadge)` });
  }
}

async function sceneWhatsApp(browser, dev) {
  log(`[whatsapp] ${dev}`);
  const { ctx, page } = await newPage(browser, dev, stage.both(), T.friday);
  // 1) the automation that prepares the welcome message
  await go(page, '/automations');
  // demo-only note ("works after you sign in") is hidden: it never shows on a real account
  await page.evaluate(() => {
    for (const p of document.querySelectorAll('p')) if (p.textContent.includes('בהדגמה רק רואים')) { const c = p.closest('div'); if (c) c.style.display = 'none'; }
  });
  const step = page.locator('li[data-step="welcome"]');
  await step.getByRole('button', { name: 'איך ההודעה נראית' }).click();
  await centerOn(page, step);
  await settle(page, 500);
  await full(page, 'automations-welcome-full', 'Guest-message automations: step "ביום ההגעה" is ON (פועל) at 16:00, with the welcome text preview open.');
  await lift(page, step, { el: 'el-automation-welcome-card', parent: 'automations-welcome-full', slot: 'automations-welcome-slot-empty', what: 'Automation step card "ביום ההגעה · פועל" with welcome preview' });
  await lift(page, step.locator('p.whitespace-pre-line'), { el: 'el-automation-welcome-preview', parent: 'automations-welcome-full', slot: 'automations-welcome-preview-slot-empty', what: 'Welcome message preview bubble (template text, sample guest)' });

  // 2) Today board, Friday 15:00: the welcome message is ready for the arriving guest
  await go(page, '/today');
  const fold = page.getByRole('button', { name: /מחכה לשליחה|מחכות לשליחה/ });
  await fold.first().click();
  await settle(page, 600);
  const board = page.locator('section[aria-label="היום"]');
  const msgRow = board.locator('li li', { hasText: 'נועה ואלון ברק' }).filter({ has: page.getByRole('button', { name: 'שליחה', exact: true }) });
  await centerOn(page, msgRow);
  await full(page, 'today-message-ready-full', 'Today board, Friday 15:00: arrivals today and the prepared WhatsApp message(s) waiting for one tap.');
  await lift(page, board, { el: 'el-today-board', parent: 'today-message-ready-full', slot: 'today-board-slot-empty', what: '"היום במתחם" card with the message row expanded' });
  await lift(page, msgRow, { el: 'el-today-welcome-row', parent: 'today-message-ready-full', slot: 'today-welcome-row-slot-empty', what: 'Row: נועה ואלון ברק — welcome template ready, "שליחה" button' });
  // 3) composer with the real welcome text
  await msgRow.getByRole('button', { name: 'שליחה', exact: true }).first().click();
  const sheet = page.locator('[role="dialog"]');
  await sheet.waitFor({ timeout: 8000 }).catch(async (e) => { await page.screenshot({ path: '/tmp/claude-0/-home-user-atlas/54fba07f-b642-5445-8ed2-aab84bf2ad60/scratchpad/dbg.png' }); log('  dbg: ' + (await page.locator('li', { hasText: 'נועה ואלון ברק' }).count())); throw e; });
  await settle(page, 700);
  await full(page, 'whatsapp-composer-full', 'WhatsApp composer opened from the board: welcome text filled with this booking (unit, Wi-Fi, check-out).');
  await lift(page, sheet, { el: 'el-whatsapp-composer', parent: 'whatsapp-composer-full', slot: 'whatsapp-composer-slot-empty', what: 'WhatsApp composer sheet (template chips, message text, "שליחה בוואטסאפ")' });
  const ta = sheet.locator('textarea');
  if (await ta.count()) await lift(page, ta, { el: 'el-whatsapp-welcome-text', parent: 'whatsapp-composer-full', slot: 'whatsapp-composer-text-slot-empty', what: 'The welcome message text as it will be sent' });
  // 4) send: opens wa.me (intercepted) and logs the message as sent
  await sheet.getByRole('button', { name: 'שליחה בוואטסאפ' }).click();
  await page.getByText(/ההודעה נשמרה בהודעות/).first().waitFor({ timeout: 8000 });
  await page.waitForTimeout(600);
  await full(page, 'whatsapp-sent-toast', 'After tapping send: toast "נפתח וואטסאפ ל… ההודעה נשמרה בהודעות", the board no longer lists the welcome as waiting.');
  // 5) message history: the sent welcome
  await go(page, '/messages');
  if (dev === 'iphone') { await page.locator('button', { hasText: 'נועה ואלון ברק' }).first().click(); await settle(page, 800); }
  await full(page, 'messages-welcome-sent', 'Messages screen: thread with נועה ואלון ברק, WhatsApp tag, the welcome message logged as sent (outbound bubble, 15:00).');
  const bubble = page.locator('p.whitespace-pre-wrap', { hasText: 'ברוכים הבאים' }).locator('xpath=..');
  await lift(page, bubble, { el: 'el-whatsapp-sent-bubble', parent: 'messages-welcome-sent', slot: 'messages-welcome-sent-slot-empty', what: 'Outbound welcome bubble with time 15:00' });
  if (dev === 'mac') {
    const thread = page.locator('button', { hasText: 'נועה ואלון ברק' }).first();
    await lift(page, thread, { el: 'el-whatsapp-thread-row', parent: 'messages-welcome-sent', slot: 'messages-thread-row-slot-empty', what: 'Thread row with WhatsApp tag and message preview' });
  }
  await ctx.close();
}

async function sceneFinance(browser, dev) {
  log(`[finance] ${dev}`);
  // Monthly report: before expenses are logged vs after
  {
    const { ctx, page } = await newPage(browser, dev, stage.monthEnd({ expenses: [] }), T.monthEnd);
    await go(page, '/monthly-report?m=2026-11');
    await full(page, 'report-before-expenses', 'Monthly report, November 2026, before expenses are logged (income only).');
    await ctx.close();
  }
  const { ctx, page } = await newPage(browser, dev, stage.monthEnd(), T.monthEnd);
  await go(page, '/monthly-report?m=2026-11');
  await full(page, 'report-full', 'Monthly report, November 2026: income, expenses, net, income by channel (Booking / Airbnb / direct).');
  const tiles = page.locator('.stat-row, [class*="stat-row"]').first();
  if (await tiles.count()) await lift(page, tiles, { el: 'el-report-kpis', parent: 'report-full', slot: 'report-kpis-slot-empty', what: 'KPI tiles: הכנסות / הוצאות / נטו …' });
  const channels = page.locator('section, div').filter({ has: page.getByText('הכנסות לפי ערוץ', { exact: true }) }).last();
  await centerOn(page, channels);
  await full(page, 'report-channels-full', 'Monthly report scrolled to "הכנסות לפי ערוץ".');
  await lift(page, channels, { el: 'el-report-income-by-channel', parent: 'report-channels-full', slot: 'report-channels-slot-empty', what: 'Income by channel block with bars' });
  const exp = page.locator('section, div').filter({ has: page.getByText('הוצאות', { exact: true }) }).filter({ hasText: 'ניקיון' }).last();
  if (await exp.count()) {
    await centerOn(page, exp);
    await full(page, 'report-expenses-full', 'Monthly report scrolled to the expenses block.');
    await lift(page, exp, { el: 'el-report-expenses', parent: 'report-expenses-full', slot: 'report-expenses-slot-empty', what: 'Expenses by category block' });
  }

  // Expense tracker
  await go(page, '/expense-tracker');
  await full(page, 'expenses-full', 'Expenses screen: totals, this month, estimated net profit, recent expenses.');
  await lift(page, page.locator('.stat-row').first(), { el: 'el-expenses-kpis', parent: 'expenses-full', slot: 'expenses-kpis-slot-empty', what: 'Expense KPI row (סה״כ הוצאות / החודש / רווח נקי משוער)' });
  const expRow = page.locator('tbody tr', { hasText: 'ניקיון אחרי אורחים' });
  if (await expRow.count()) { await centerOn(page, expRow); await full(page, 'expenses-row-full', 'Expenses table scrolled to the cleaning row.'); await lift(page, expRow, { el: 'el-expense-row', parent: 'expenses-row-full', slot: 'expenses-row-slot-empty', what: 'Expense row: ניקיון ₪1,400' }); }

  // Today: income chart (6 months), plus a frame sequence of the real bar-growth animation
  await go(page, '/today');
  const chart = page.locator('section[aria-label="הכנסות"]');
  await centerOn(page, chart);
  await full(page, 'today-income-chart-full', 'Today board at month end: income chart for the last 6 months (November highlighted).');
  await lift(page, chart, { el: 'el-income-chart', parent: 'today-income-chart-full', slot: 'today-income-chart-slot-empty', what: 'Income bar chart card' });
  const hero = page.locator('a, section, div').filter({ hasText: 'הכנסות החודש' }).filter({ has: page.locator('svg') }).first();
  void hero;
  // frame sequence: reload, pause the bar animations, step them
  await page.reload({ waitUntil: 'networkidle' });
  await page.addStyleTag({ content: BASE_CSS });
  await centerOn(page, chart);
  const dur = await page.evaluate(() => {
    const as = document.getAnimations().filter((a) => a.effect?.target?.classList?.contains('v7-bar'));
    as.forEach((a) => a.pause());
    return as.reduce((m, a) => Math.max(m, (a.effect.getComputedTiming().endTime) || 0), 0);
  });
  const frames = 8;
  for (let i = 0; i < frames; i += 1) {
    const t = Math.round((dur * i) / (frames - 1));
    await page.evaluate((tt) => document.getAnimations().filter((a) => a.effect?.target?.classList?.contains('v7-bar')).forEach((a) => { a.currentTime = tt; }), t);
    await page.waitForTimeout(80);
    const f = outPath(dev, `seq-income-chart-${String(i).padStart(2, '0')}`);
    await chart.first().screenshot({ path: f });
    const b = await chart.first().boundingBox();
    manifest.push({ file: rel(f), device: dev, kind: 'sequence-frame', what: `Income chart bars growing (real CSS animation .v7-bar), frame ${i + 1}/${frames} at t=${t}ms of ${Math.round(dur)}ms`, parent: rel(outPath(dev, 'today-income-chart-full')), bbox_css: { x: b.x, y: b.y, w: b.width, h: b.height } });
  }
  log(`  seq   ${frames} chart frames (anim ${Math.round(dur)}ms)`);

  // Receipts: before (R-1043 draft) → after (sent)
  await ctx.close();
  for (const [key, status] of [['before', 'DRAFT'], ['after', 'SENT']]) {
    const invoices = S.RECEIPTS.map((r) => (r.id === 'inv_3' ? { ...r, status } : r));
    const s2 = await newPage(browser, dev, stage.monthEnd({ invoices }), T.monthEnd);
    const p = s2.page;
    await go(p, '/invoices');
    const name = `receipts-${key}`;
    await full(p, name, `Invoices & receipts list, R-1043 (Anna Weber, ₪2,850) ${status === 'SENT' ? 'marked נשלח (sent)' : 'still טיוטה (draft)'}.`);
    const row = dev === 'mac' ? p.locator('tbody tr', { hasText: 'R-1043' }) : p.locator('li', { hasText: 'R-1043' });
    await lift(p, row, { el: `el-receipt-row-${key}`, parent: name, slot: `${name}-slot-empty`, what: `Receipt row R-1043 (${status})` });
    const badge = row.getByText(status === 'SENT' ? 'נשלח' : 'טיוטה', { exact: true });
    await lift(p, badge, { el: `el-receipt-status-${key}`, parent: name, slot: `${name}-status-slot-empty`, what: `Status chip "${status === 'SENT' ? 'נשלח' : 'טיוטה'}"` });
    if (key === 'after') {
      if (dev === 'mac') await row.getByRole('button', { name: 'תצוגה מקדימה' }).click(); else await row.locator('button').first().click();
      const dlg = p.locator('[role="dialog"]');
      await dlg.waitFor();
      await settle(p, 700);
      await full(p, 'receipt-preview-full', 'Receipt preview dialog for R-1043 (קבלה).');
      await lift(p, dlg, { el: 'el-receipt-preview', parent: 'receipt-preview-full', slot: 'receipt-preview-slot-empty', what: 'Receipt (קבלה) preview document' });
    }
    await s2.ctx.close();
  }
}

// ───────────────────────────── main ─────────────────────────────
const SCENES = { calendar: sceneCalendar, lead: sceneLead, channels: sceneChannels, whatsapp: sceneWhatsApp, finance: sceneFinance };

async function main() {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error(`No build at ${DIST}. Run the build first (notes.md).`);
  const browser = await chromium.launch({ args: ['--lang=he-IL', '--font-render-hinting=none'], env: { ...process.env, LANG: 'he_IL.UTF-8', LANGUAGE: 'he' } });
  const failures = [];
  try {
    for (const [key, fn] of Object.entries(SCENES)) {
      if (ONLY && !ONLY.includes(key)) continue;
      for (const dev of DEV_LIST) {
        try { await fn(browser, dev); } catch (e) { failures.push(`${key}/${dev}: ${e.message.split('\n')[0]}`); log(`  !! ${key}/${dev}: ${e.message.split('\n')[0]}`); }
      }
    }
  } finally {
    await browser.close();
  }
  // merge manifest with existing (when running a subset)
  const mfile = path.join(HERE, 'manifest.json');
  let prev = [];
  if (ONLY && fs.existsSync(mfile)) prev = JSON.parse(fs.readFileSync(mfile, 'utf8')).files || [];
  const byFile = new Map(prev.map((m) => [m.file, m]));
  for (const m of manifest) byFile.set(m.file, m);
  const files = [...byFile.values()].map((m) => {
    const abs = path.join(HERE, m.file);
    return fs.existsSync(abs) ? { ...m, bytes: fs.statSync(abs).size } : null;
  }).filter(Boolean).sort((a, b) => a.file.localeCompare(b.file));
  fs.writeFileSync(mfile, JSON.stringify({
    generated: new Date().toISOString(),
    build: 'vite production build, VITE_ALLOW_LOCAL_DEMO=true, no Supabase (local demo mode), served statically',
    deviceScaleFactor: DPR,
    devices: Object.fromEntries(Object.entries(DEVICES).map(([k, d]) => [k, { ...d.viewport, label: d.label, png_px: { w: d.viewport.width * DPR, h: d.viewport.height * DPR } }])),
    bbox_note: 'bbox_css is in CSS px relative to the top-left of the parent full screenshot (the viewport). Multiply by deviceScaleFactor (3) for PNG pixels.',
    files,
  }, null, 2));
  fs.writeFileSync(path.join(HERE, 'capture-log.txt'), logs.join('\n') + (failures.length ? `\n\nFAILURES:\n${failures.join('\n')}` : '') + '\n');
  if (failures.length) { console.log('\nFAILURES:\n' + failures.join('\n')); process.exitCode = 1; }
}

main();
