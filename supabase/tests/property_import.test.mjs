// property-import core: SSRF guard, parsing, merge, missing questions, photo save. No network: fetch / DNS / model are fakes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkUrl, isPrivateIp, safeFetch, parsePage, finalize, missingFields, runImport, savePhotos, interestingLinks, canonicalUrl, embeddedStrings, visibleText } from '../functions/property-import/core.js';
import { IMPORT_SCHEMA, emptyResult, FIELDS } from '../functions/property-import/schema.js';
import { profileView, PROFILE_EXEC } from '../functions/_shared/brain/propertyProfile.js';
import { TOOL_NAMES } from '../functions/_shared/brain/tools.js';

const html = (body, head = '') => `<!doctype html><html><head>${head}</head><body>${body}</body></html>`.padEnd(6000, ' ');
const res = (status, body, headers = {}) => new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8', ...headers } });
const publicDns = async () => ['93.184.216.34'];

test('urls: https only, no private / local / credential / odd-port targets', () => {
  assert.equal(checkUrl('booking.com/hotel/il/x.html').kind, 'booking');
  assert.equal(checkUrl('http://www.airbnb.co.il/rooms/123?x=1').kind, 'airbnb');
  assert.ok(checkUrl('http://ramotnof.co.il').url.startsWith('https://'));
  for (const bad of ['ftp://x.com', 'https://127.0.0.1/', 'https://localhost/', 'https://a:b@x.com/', 'https://x.com:8080/', 'https://[::1]/', 'https://intranet/', 'https://foo.internal/', 'https://abc.supabase.co/functions/v1/x', 'javascript:alert(1)', 'file:///etc/passwd']) {
    assert.ok(checkUrl(bad).error, bad);
  }
  for (const ip of ['10.0.0.1', '172.16.3.4', '192.168.1.1', '169.254.169.254', '127.0.0.1', '0.0.0.0', '100.64.1.1', '::1', 'fd00::1', '::ffff:10.0.0.1', 'fe80::1']) assert.ok(isPrivateIp(ip), ip);
  for (const ip of ['93.184.216.34', '80.179.152.136', '2a00:1450:4001::1']) assert.ok(!isPrivateIp(ip), ip);
});

test('canonical listing urls drop tracking and dates', () => {
  assert.equal(canonicalUrl('https://www.booking.com/hotel/il/hameiri-estate.en-gb.html?aid=1&checkin=2026-11-01', 'booking'), 'https://www.booking.com/hotel/il/hameiri-estate.he.html');
  assert.equal(canonicalUrl('https://he.airbnb.com/rooms/45244430?check_in=x', 'airbnb'), 'https://www.airbnb.com/rooms/45244430');
});

test('safeFetch re-checks every redirect hop and blocks private DNS answers', async () => {
  const hops = [];
  const fetchImpl = async (u) => { hops.push(u); return u.includes('first') ? res(302, '', { location: 'https://second.example.org/x' }) : res(200, html('ok')); };
  const ok = await safeFetch('https://first.example.org/', { fetchImpl, resolve: publicDns });
  assert.equal(ok.status, 200);
  assert.deepEqual(hops, ['https://first.example.org/', 'https://second.example.org/x']);
  // redirect into the metadata service / a private host
  const evil = async (u) => (u.includes('first') ? res(302, '', { location: 'http://169.254.169.254/latest' }) : res(200, 'secret'));
  await assert.rejects(safeFetch('https://first.example.org/', { fetchImpl: evil, resolve: publicDns }), /bad_host|blocked/);
  // a public-looking name that resolves to a private IP (DNS rebinding style)
  await assert.rejects(safeFetch('https://rebind.example.org/', { fetchImpl: async () => res(200, 'x'), resolve: async () => ['10.1.2.3'] }), /private_ip/);
});

test('safeFetch caps the body size', async () => {
  const big = 'x'.repeat(5000);
  const r = await safeFetch('https://big.example.org/', { fetchImpl: async () => res(200, big), resolve: publicDns, maxBytes: 1000 });
  assert.equal(r.body.byteLength, 1000);
});

test('Booking page: JSON-LD facts, CDN photos (deduped, large size), visible text', () => {
  const ld = `<script type="application/ld+json">{"@type":"Hotel","name":"אחוזת דוגמה","address":{"streetAddress":"החלוצים 1, ראש פינה","addressLocality":"ראש פינה"},"aggregateRating":{"ratingValue":9.4,"bestRating":10,"reviewCount":120}}</script>`;
  const imgs = '<img src="https://cf.bstatic.com/xdata/images/hotel/max500/111.jpg?k=abc"><img src="https://cf.bstatic.com/xdata/images/hotel/square60/111.jpg?k=abc"><img src="https://cf.bstatic.com/xdata/images/hotel/max300/222.jpg?k=def">';
  const p = parsePage(html(`${imgs}<div>צ'ק-אין</div><div>החל מהשעה 15:00</div><script>var x="hidden"</script>`, ld), 'booking', 'https://www.booking.com/hotel/il/x.he.html');
  assert.equal(p.facts.name, 'אחוזת דוגמה');
  assert.equal(p.facts.rating.score, 9.4);
  assert.equal(p.photos.length, 2);
  assert.ok(p.photos.every((u) => u.includes('/max1024x768/')));
  assert.match(p.text, /15:00/);
  assert.doesNotMatch(p.text, /hidden/);
});

test('Airbnb embedded state: human strings only, unavailable amenities dropped', () => {
  const state = { a: { __typename: 'AmenityItem', available: true, title: 'חניה חינם במקום' }, b: { __typename: 'AmenityItem', available: false, title: 'מכונת כביסה' }, c: { title: 'כללי הבית', items: ['ללא עישון'] }, d: { url: 'https://x' }, e: { __typename: 'LoggingContext', title: 'noise' } };
  const s = embeddedStrings(`<script id="data-deferred-state-0" type="application/json">${JSON.stringify(state)}</script>`);
  assert.match(s, /חניה חינם/);
  assert.match(s, /ללא עישון/);
  assert.doesNotMatch(s, /מכונת כביסה|noise|https/);
});

test('own site: interesting same-site pages first, other sites ignored; badges from other hosts dropped', () => {
  const h = html('<a href="/תקנון.html">תקנון</a><a href="/הבקתות.html">הבקתות שלנו</a><a href="https://other.com/rooms">rooms</a><a href="/gallery.jpg">x</a><a href="/blog">בלוג</a>'
    + '<img src="/gallery/1.jpg"><img src="https://www.tripadvisor.com/img/award.jpg"><img src="/img/logo.png">');
  const links = interestingLinks(h, 'https://www.zimmer-example.co.il/');
  assert.equal(links.length, 2);
  assert.match(decodeURIComponent(links[0]), /תקנון/);
  const p = parsePage(h, 'site', 'https://www.zimmer-example.co.il/');
  assert.deepEqual(p.photos, ['https://www.zimmer-example.co.il/gallery/1.jpg']);
});

test('visibleText strips scripts/styles even when a page is messy', () => {
  assert.equal(visibleText('<head><title>t</title></head><style>.a{}</style><p>שלום</p><script>alert(1)</script><p>עולם</p>'), 'שלום\nעולם');
});

test('schema: strict, every field has a confidence slot', () => {
  assert.equal(IMPORT_SCHEMA.additionalProperties, false);
  assert.deepEqual(IMPORT_SCHEMA.required.sort(), Object.keys(IMPORT_SCHEMA.properties).sort());
  assert.deepEqual(Object.keys(emptyResult().confidence), FIELDS);
});

test('finalize: trusted facts fill gaps, platform urls are not "website", vague cancellation dropped, phones normalised', () => {
  const model = { ...emptyResult(), business_name: null, check_in_time: '15:00', check_out_time: 'עד 11:30', cancellation_policy: 'משתנה לפי התאריכים', contact: { ...emptyResult().contact, website: 'https://www.booking.com/hotel/il/x.html' }, confidence: { ...emptyResult().confidence, check_in_time: 'high', cancellation_policy: 'medium' } };
  const sources = [{ ok: true, kind: 'site', url: 'https://ramot.example.co.il/', facts: { name: 'הכי נוף', lat: 32.9, lng: 35.6, rating: { score: 4.9, scale: 5, count: 10 } }, contacts: { phones: ['+972-54-467-1581'], whatsapp: ['972544671581'], emails: [] }, photos: ['https://ramot.example.co.il/a.jpg'] }, { ok: false, input: 'x', error: 'blocked', kind: 'booking' }];
  const r = finalize(model, sources);
  assert.equal(r.business_name, 'הכי נוף');
  assert.equal(r.check_out_time, '11:30');
  assert.equal(r.cancellation_policy, null);
  assert.equal(r.contact.website, 'https://ramot.example.co.il');
  assert.equal(r.contact.phone, '0544671581');
  assert.equal(r.contact.whatsapp, '0544671581');
  assert.equal(r.location.lat, 32.9);
  assert.equal(r.reviews.count, 10);
  assert.equal(r.photos.length, 1);
  assert.deepEqual(r.sources.map((s) => s.ok), [true, false]);
  assert.ok(missingFields(r).includes('cancellation_policy'));
  assert.ok(!missingFields(r).includes('contact'));
});

test('runImport: blocked source + pasted text still extracts (fallback); nothing at all is refused', async () => {
  const fetchImpl = async () => res(202, '<html><script>window.awsWafCookieDomainList=[]</script><div id="challenge-container"></div></html>');
  let sent = null;
  const llmFetch = async (_u, init) => { sent = JSON.parse(init.body); return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ ...emptyResult(), business_name: 'צימר דוגמה', unit_count: 2, confidence: { ...emptyResult().confidence, business_name: 'high', unit_count: 'high' } }) } }] }), { status: 200 }); };
  const out = await runImport({ urls: ['https://www.booking.com/hotel/il/x.html'], text: 'צימר דוגמה, 2 יחידות, כניסה 15:00' }, { fetch: fetchImpl, llmFetch, resolve: publicDns, key: 'k' });
  assert.equal(out.result.business_name, 'צימר דוגמה');
  assert.equal(out.result.sources[0].error, 'blocked');
  assert.equal(sent.response_format.type, 'json_schema');
  assert.match(sent.messages[1].content[0].text, /טקסט שהבעלים הדביקו/);
  const none = await runImport({ urls: [] }, { fetch: fetchImpl, resolve: publicDns, key: 'k' });
  assert.equal(none.error, 'nothing_to_import');
  const failed = await runImport({ urls: ['https://www.booking.com/hotel/il/x.html'] }, { fetch: fetchImpl, resolve: publicDns, key: 'k' });
  assert.equal(failed.error, 'all_sources_failed');
});

test('runImport: no OpenAI key → structured facts only, nothing invented', async () => {
  const ld = '<script type="application/ld+json">{"@type":"VacationRental","name":"בקתה באמירים","latitude":32.9,"longitude":35.4}</script>';
  const out = await runImport({ urls: ['https://www.airbnb.com/rooms/1'] }, { fetch: async () => res(200, html('<p>x</p>', ld)), resolve: publicDns, key: '' });
  assert.equal(out.model_error, 'not_configured');
  assert.equal(out.result.business_name, 'בקתה באמירים');
  assert.equal(out.result.unit_count, null);
});

test('savePhotos: images only, through the guard, in order', async () => {
  const png = new Uint8Array(3000).fill(7);
  const fetchImpl = async (u) => (u.includes('bad') ? res(200, 'x', { 'content-type': 'text/html' }) : new Response(png, { status: 200, headers: { 'content-type': 'image/jpeg' } }));
  const ups = [];
  const out = await savePhotos(['https://cdn.example.org/1.jpg', 'https://cdn.example.org/bad', 'https://10.0.0.1/x.jpg', 'https://cdn.example.org/2.jpg'], '11111111-2222-3333-4444-555555555555', { fetch: fetchImpl, resolve: publicDns, upload: async (path) => { ups.push(path); return `https://store/${path}`; } });
  assert.equal(out.saved.length, 2);
  assert.ok(out.saved.every((x) => x.url.includes('/import/')));
  assert.equal(out.failed, 2);
  assert.ok(ups.every((p) => p.startsWith('11111111-2222-3333-4444-555555555555/import/')));
  assert.equal((await savePhotos(['https://x/1.jpg'], 'nope', { fetch: fetchImpl, upload: async () => 'u' })).error, 'no_org');
});

test('brain: get_property_info is a tool and reads the profile from settings', async () => {
  assert.ok(TOOL_NAMES.includes('get_property_info'));
  const profile = { business_name: 'הכי נוף שיש', parking: 'חניה ליד כל בקתה', guest_faq: [{ q: 'יש חניה?', a: 'כן' }], house_rules: ['שקט אחרי 23:00'] };
  const db = { from: () => ({ select: () => ({ eq: () => ({ limit: async () => ({ data: [{ organizations: { settings: { property_profile: profile, check_in_time: '15:00' } } }], error: null }) }) }) }) };
  const v = await PROFILE_EXEC.get_property_info(db, {}, { userId: 'u' });
  assert.equal(v.parking, 'חניה ליד כל בקתה');
  assert.equal(v.check_in, '15:00');
  const empty = { from: () => ({ select: () => ({ eq: () => ({ limit: async () => ({ data: [{ organizations: { settings: {} } }], error: null }) }) }) }) };
  assert.equal((await PROFILE_EXEC.get_property_info(empty, {}, { userId: 'u' })).empty, true);
  assert.equal(profileView(null), null);
});
