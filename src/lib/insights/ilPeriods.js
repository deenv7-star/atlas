/**
 * High-demand periods for Israeli zimmers: חגים (Hebcal, Israel schedule, i=on) + החופש הגדול (1.7–31.8).
 * Generated 19.10.2026 from https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&mod=on&i=on&year=2026..2028.
 * יום העצמאות = the festive night only (the evening of יום הזכרון's date).
 * `from` / `to` are the NIGHTS that fall inside the period (erev day included). Pure data, no network.
 */
export const IL_PEAK_PERIODS = [
  { name: 'פורים', from: '2026-03-02', to: '2026-03-03', kind: 'holiday' },
  { name: 'פסח', from: '2026-04-01', to: '2026-04-08', kind: 'holiday' },
  { name: 'יום העצמאות', from: '2026-04-21', to: '2026-04-21', kind: 'holiday' },
  { name: 'שבועות', from: '2026-05-21', to: '2026-05-22', kind: 'holiday' },
  { name: 'החופש הגדול', from: '2026-07-01', to: '2026-08-31', kind: 'school' },
  { name: 'ראש השנה', from: '2026-09-11', to: '2026-09-13', kind: 'holiday' },
  { name: 'סוכות', from: '2026-09-25', to: '2026-10-03', kind: 'holiday' },
  { name: 'חנוכה', from: '2026-12-04', to: '2026-12-12', kind: 'holiday' },
  { name: 'פורים', from: '2027-03-22', to: '2027-03-23', kind: 'holiday' },
  { name: 'פסח', from: '2027-04-21', to: '2027-04-28', kind: 'holiday' },
  { name: 'יום העצמאות', from: '2027-05-11', to: '2027-05-11', kind: 'holiday' },
  { name: 'שבועות', from: '2027-06-10', to: '2027-06-11', kind: 'holiday' },
  { name: 'החופש הגדול', from: '2027-07-01', to: '2027-08-31', kind: 'school' },
  { name: 'ראש השנה', from: '2027-10-01', to: '2027-10-03', kind: 'holiday' },
  { name: 'סוכות', from: '2027-10-15', to: '2027-10-23', kind: 'holiday' },
  { name: 'חנוכה', from: '2027-12-24', to: '2028-01-01', kind: 'holiday' },
  { name: 'פורים', from: '2028-03-11', to: '2028-03-12', kind: 'holiday' },
  { name: 'פסח', from: '2028-04-10', to: '2028-04-17', kind: 'holiday' },
  { name: 'יום העצמאות', from: '2028-05-01', to: '2028-05-01', kind: 'holiday' },
  { name: 'שבועות', from: '2028-05-30', to: '2028-05-31', kind: 'holiday' },
  { name: 'החופש הגדול', from: '2028-07-01', to: '2028-08-31', kind: 'school' },
  { name: 'ראש השנה', from: '2028-09-20', to: '2028-09-22', kind: 'holiday' },
  { name: 'סוכות', from: '2028-10-04', to: '2028-10-12', kind: 'holiday' },
  { name: 'חנוכה', from: '2028-12-12', to: '2028-12-20', kind: 'holiday' },
];
