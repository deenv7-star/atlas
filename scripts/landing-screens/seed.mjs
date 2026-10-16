// Realistic Hebrew demo data for ATLAS marketing screenshots (localStorage demo mode).
export function buildSeed(now = new Date('2026-10-16T10:00:00+03:00')) {
  const ORG = 'org_nofei_hagalil';
  const y = now.getFullYear(), m = now.getMonth();
  const d = (day) => { const x = new Date(Date.UTC(y, m, day)); return x.toISOString().slice(0, 10); };
  const ts = (day, h = 10, min = 0) => new Date(Date.UTC(y, m, day, h - 3, min)).toISOString();
  const props = [
    { id: 'p_gefen', name: 'צימר הגפן', base_price: 950, max_guests: 2, bedrooms: 1 },
    { id: 'p_zait', name: 'צימר הזית', base_price: 1100, max_guests: 4, bedrooms: 2 },
    { id: 'p_alon', name: 'וילת האלון', base_price: 2400, max_guests: 10, bedrooms: 4 },
    { id: 'p_teena', name: 'צימר התאנה', base_price: 880, max_guests: 2, bedrooms: 1 },
  ].map((p) => ({ ...p, org_id: ORG, type: 'צימר', address: 'מושב שומרה, גליל מערבי', bathrooms: 1, status: 'active', is_active: true, created_date: ts(1), created_at: ts(1) }));

  const B = [
    ['p_gefen', 'נועה ואלון שגיא', 2, 2, 'booking', 'CHECKED_OUT', 1980],
    ['p_zait', 'משפחת אבוטבול', 3, 3, 'direct', 'CHECKED_OUT', 3300],
    ['p_alon', 'קבוצת חברים - רותם', 4, 2, 'airbnb', 'CHECKED_OUT', 4950],
    ['p_teena', 'מיכל ודור', 6, 2, 'direct', 'CHECKED_OUT', 1760],
    ['p_gefen', 'Daniel Weiss', 8, 3, 'airbnb', 'CHECKED_OUT', 2940],
    ['p_zait', 'אורית בן חמו', 9, 2, 'booking', 'CHECKED_OUT', 2280],
    ['p_alon', 'משפחת חורי', 11, 3, 'direct', 'CHECKED_OUT', 7200],
    ['p_teena', 'גיל ושירן', 13, 2, 'booking', 'CHECKED_OUT', 1840],
    ['p_gefen', 'יעל ועומר כהן', 15, 2, 'direct', 'CHECKED_IN', 2100],
    ['p_zait', 'משפחת לוי', 16, 3, 'booking', 'CONFIRMED', 3450],
    ['p_alon', 'רוני פרץ - יום הולדת 40', 17, 2, 'direct', 'CONFIRMED', 5200],
    ['p_teena', 'Sarah Klein', 16, 4, 'airbnb', 'CONFIRMED', 3600],
    ['p_gefen', 'עדי ואביב', 20, 2, 'airbnb', 'CONFIRMED', 1990],
    ['p_zait', 'מורן מזרחי', 22, 2, 'direct', 'PENDING', 2300],
    ['p_alon', 'משפחת גרינברג', 23, 3, 'booking', 'CONFIRMED', 7650],
    ['p_teena', 'אסף ונטע', 24, 2, 'direct', 'CONFIRMED', 1880],
    ['p_gefen', 'ליאור ושני', 27, 3, 'booking', 'CONFIRMED', 2950],
    ['p_zait', 'חן וטל ברק', 29, 2, 'airbnb', 'PENDING', 2350],
  ];
  const phones = ['052-6418830', '054-7729105', '050-3317462', '053-9902417', '058-4471236', '052-8810394'];
  const bookings = B.map(([pid, guest, day, nights, src, status, total], i) => {
    const out = new Date(Date.UTC(y, m, day + nights)).toISOString().slice(0, 10);
    const prop = props.find((p) => p.id === pid);
    return {
      id: `b_${i + 1}`, org_id: ORG, property_id: pid, property_name: prop.name, guest_name: guest,
      guest_phone: phones[i % phones.length], guest_email: '', check_in_date: d(day), check_out_date: out,
      nights, adults: prop.max_guests > 4 ? 8 : 2, children: 0, total_price: total, status,
      booking_source: src, source: src, payment_status: status === 'PENDING' ? 'pending' : 'paid',
      created_date: ts(Math.max(1, day - 9), 9 + (i % 8), 12), created_at: ts(Math.max(1, day - 9), 9 + (i % 8), 12),
    };
  });

  const L = [
    ['שירה אוחיון', 'NEW', 'whatsapp', 'p_alon', 30, 2, 10, 5600, 'שבת חתן לכ-10 אנשים, מבקשים ג׳קוזי'],
    ['תומר ברקוביץ', 'NEW', 'website', 'p_gefen', 21, 2, 2, 2000, 'יום נישואין, שאלו על ארוחת בוקר'],
    ['הילה נחום', 'CONTACTED', 'instagram', 'p_zait', 25, 2, 4, 2400, 'זוג + 2 ילדים'],
    ['אבי ומירב סעדה', 'OFFER_SENT', 'facebook', 'p_teena', 28, 3, 2, 2640, 'הצעה נשלחה בוואטסאפ'],
    ['קרן פלד', 'NEW', 'phone', 'p_alon', 6, 2, 9, 5000, 'נובמבר, סופ״ש משפחתי'],
    ['יונתן רז', 'CONFIRMED', 'website', 'p_gefen', 20, 2, 2, 1990, 'נסגר, עבר להזמנה'],
    ['דנה שטרן', 'CONTACTED', 'whatsapp', 'p_zait', 31, 2, 3, 2300, 'מחכה לאישור תאריכים'],
  ];
  const leads = L.map(([name, status, source, pid, day, nights, guests, budget, notes], i) => ({
    id: `l_${i + 1}`, org_id: ORG, full_name: name, phone: phones[(i + 2) % phones.length], email: '',
    status, source, property_id: pid, check_in_date: d(day), check_out_date: d(day + nights), nights,
    adults: guests, children: 0, guests, budget, notes,
    created_date: ts(16 - (i % 5), 8 + i, 5 * i), created_at: ts(16 - (i % 5), 8 + i, 5 * i),
  }));

  const payments = bookings.flatMap((b, i) => {
    const paid = !['PENDING'].includes(b.status);
    const base = { org_id: ORG, booking_id: b.id, currency: 'ILS', description: `${b.property_name} · ${b.guest_name}` };
    if (b.status === 'CONFIRMED' && i % 3 === 0) {
      return [
        { ...base, id: `pay_${i}_a`, amount: Math.round(b.total_price * 0.3), status: 'PAID', method: 'bit', paid_date: b.created_date.slice(0, 10), paid_at: b.created_date, due_date: b.created_date.slice(0, 10), created_date: b.created_date, created_at: b.created_date },
        { ...base, id: `pay_${i}_b`, amount: b.total_price - Math.round(b.total_price * 0.3), status: 'PENDING', method: 'credit_card', due_date: b.check_in_date, created_date: b.created_date, created_at: b.created_date },
      ];
    }
    return [{ ...base, id: `pay_${i}`, amount: b.total_price, status: paid ? 'PAID' : 'PENDING', method: ['credit_card', 'bit', 'bank_transfer', 'credit_card'][i % 4], paid_date: paid ? b.check_in_date : null, paid_at: paid ? ts(Number(b.check_in_date.slice(8)), 12) : null, due_date: b.check_in_date, created_date: b.created_date, created_at: b.created_date }];
  });

  const msgs = [
    ['b_10', 'whatsapp', 'משפחת לוי', 'אישור הזמנה', 'שלום משפחת לוי, ההזמנה שלכם בצימר הזית מאושרת ל-16-19 באוקטובר. נשמח לראותכם!', 16, 9],
    ['b_9', 'whatsapp', 'יעל ועומר כהן', 'הוראות הגעה', 'היי יעל, מחר צ׳ק-אין מ-15:00. קוד לשער: 2419. מיקום: מושב שומרה, גליל מערבי.', 14, 18],
    ['b_11', 'sms', 'רוני פרץ', 'תזכורת יתרה לתשלום', 'שלום רוני, נותרה יתרה של ₪3,640 לתשלום עד יום ההגעה. לתשלום מאובטח: atlas.link/pay', 15, 11],
    ['b_8', 'whatsapp', 'גיל ושירן', 'בקשת ביקורת', 'תודה שהתארחתם בצימר התאנה! נשמח לשמוע איך היה, זה לוקח דקה.', 15, 12],
    ['b_12', 'email', 'Sarah Klein', 'Check-in details', 'Hi Sarah, check-in at Te\'ena cabin is from 3pm. Gate code 2419.', 15, 20],
    ['b_13', 'whatsapp', 'עדי ואביב', 'אישור הזמנה', 'היי עדי, ההזמנה לצימר הגפן ל-20 באוקטובר מאושרת.', 13, 16],
  ];
  msgs.push(['b_10', 'whatsapp', 'משפחת לוי', '', 'תודה רבה! אפשר להגיע קצת יותר מוקדם, בסביבות 13:00?', 16, 9.5, 'inbound']);
  msgs.push(['b_10', 'whatsapp', 'משפחת לוי', '', 'בטח, הצימר יהיה מוכן מ-13:00. נסיעה טובה!', 16, 10, 'outbound']);
  const messageLogs = msgs.map(([bid, channel, recipient, subject, body, day, h, dir], i) => ({
    guest_name: recipient, recipient_name: recipient, property_name: bookings.find((b) => b.id === bid)?.property_name || '',
    id: `m_${i + 1}`, org_id: ORG, booking_id: bid, direction: dir || 'outbound', channel, recipient, subject, body, content: body,
    status: i === 0 ? 'delivered' : 'sent', sent_at: ts(day, Math.floor(h), (h % 1) * 60), created_date: ts(day, Math.floor(h), (h % 1) * 60), created_at: ts(day, Math.floor(h), (h % 1) * 60),
  }));

  const cleaning = [
    ['p_gefen', 'ניקיון אחרי יציאה', 'DONE', 16, 'סבטלנה', 10],
    ['p_zait', 'ניקיון והחלפת מצעים', 'IN_PROGRESS', 16, 'מרים', 11],
    ['p_teena', 'הכנה לאורחים', 'OPEN', 16, 'סבטלנה', 13],
    ['p_alon', 'ניקיון יסודי + בריכה', 'OPEN', 17, 'צוות אבו-חמד', 12],
  ].map(([pid, title, status, day, who, hr], i) => ({ id: `c_${i + 1}`, org_id: ORG, property_id: pid, title, status, scheduled_date: d(day), scheduled_for: ts(day, hr), cleaner_name: who, assigned_to: who, assigned_to_name: who, title_he: title, checklist: [{ label: 'מצעים ומגבות', done: status !== 'OPEN' }, { label: 'מטבחון', done: status === 'DONE' }, { label: 'ג׳קוזי', done: status === 'DONE' }, { label: 'מלאי קפה ושתייה', done: status === 'DONE' }], created_date: ts(day - 1), created_at: ts(day - 1) }));

  const user = {
    id: 'user_demo_yael', email: 'yael@nofei-hagalil.co.il', full_name: 'יעל שמעוני',
    organization_id: ORG, organization_name: 'נופי הגליל', subscription_plan: 'pro', subscription_status: 'active', selected_plan: 'pro', trial_ends_at: '2027-06-30T00:00:00Z',
    onboarding_completed: true, is_platform_admin: false, role: 'owner', created_date: ts(1),
  };
  const reviews = [[1, 5], [2, 5], [4, 4], [5, 5], [6, 5], [7, 4], [8, 5]].map(([bi, rating], i) => ({ id: `r_${i}`, org_id: ORG, booking_id: bookings[bi].id, property_id: bookings[bi].property_id, guest_name: bookings[bi].guest_name, rating, status: 'COMPLETED', sent_at: bookings[bi].check_out_date, created_date: ts(Math.min(15, 3 + i * 2)), created_at: ts(Math.min(15, 3 + i * 2)) }));
  return {
    atlas_entity_ReviewRequest: reviews,
    atlas_current_user: user,
    atlas_entity_Property: props,
    atlas_entity_Booking: bookings,
    atlas_entity_Lead: leads,
    atlas_entity_Payment: payments,
    atlas_entity_MessageLog: messageLogs,
    atlas_entity_CleaningTask: cleaning,
  };
}
