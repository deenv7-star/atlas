import React, { useState } from 'react';
import { PageHeader, StatTile } from '@/components/ds';
import { FileBarChart, Send, Download, Users, Home, DollarSign, Percent, Mail, Calendar, CheckCircle, Clock, ChevronDown, Settings, Building2, Phone, CreditCard, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const OWNERS = [
  {
    id: 1,
    name: 'יוסי כהן',
    idNumber: '301234567',
    email: 'yossi@gmail.com',
    phone: '050-1234567',
    properties: ['דירה דיזנגוף 45, ת״א', 'סטודיו הירקון 12, ת״א'],
    totalRevenue: 24600,
    totalExpenses: 2850,
    payout: 18487,
  },
  {
    id: 2,
    name: 'רונית לוי',
    idNumber: '204567890',
    email: 'ronit.levy@gmail.com',
    phone: '052-9876543',
    properties: ['וילה רמת הנדיב, זכרון', 'דירת גן כרמל, חיפה', 'פנטהאוז מוריה, חיפה'],
    totalRevenue: 38200,
    totalExpenses: 4100,
    payout: 28985,
  },
  {
    id: 3,
    name: 'אבי מזרחי',
    idNumber: '105678901',
    email: 'avi.m@outlook.co.il',
    phone: '054-5551234',
    properties: ['לופט פלורנטין, ת״א'],
    totalRevenue: 12800,
    totalExpenses: 1450,
    payout: 9647,
  },
  {
    id: 4,
    name: 'מיכל ברגמן',
    idNumber: '208901234',
    email: 'michal.b@gmail.com',
    phone: '053-7771234',
    properties: ['דירה מצדה 8, אילת', 'סוויטה אלמוגים, אילת'],
    totalRevenue: 19400,
    totalExpenses: 2200,
    payout: 14620,
  },
];

const PROPERTY_DETAILS = {
  1: [
    { name: 'דירה דיזנגוף 45, ת״א', nights: 22, gross: 15400, expenses: 1800 },
    { name: 'סטודיו הירקון 12, ת״א', nights: 18, gross: 9200, expenses: 1050 },
  ],
  2: [
    { name: 'וילה רמת הנדיב, זכרון', nights: 14, gross: 16800, expenses: 1900 },
    { name: 'דירת גן כרמל, חיפה', nights: 20, gross: 12400, expenses: 1200 },
    { name: 'פנטהאוז מוריה, חיפה', nights: 16, gross: 9000, expenses: 1000 },
  ],
  3: [
    { name: 'לופט פלורנטין, ת״א', nights: 24, gross: 12800, expenses: 1450 },
  ],
  4: [
    { name: 'דירה מצדה 8, אילת', nights: 19, gross: 11400, expenses: 1300 },
    { name: 'סוויטה אלמוגים, אילת', nights: 15, gross: 8000, expenses: 900 },
  ],
};

const PAYOUT_HISTORY = [
  { month: 'מרץ 2026', revenue: 24600, expenses: 2850, commission: 3263, net: 18487, status: 'pending' },
  { month: 'פברואר 2026', revenue: 21300, expenses: 2400, commission: 2835, net: 16065, status: 'paid' },
  { month: 'ינואר 2026', revenue: 19800, expenses: 3100, commission: 2505, net: 14195, status: 'paid' },
  { month: 'דצמבר 2025', revenue: 28500, expenses: 2900, commission: 3840, net: 21760, status: 'paid' },
  { month: 'נובמבר 2025', revenue: 17600, expenses: 2050, commission: 2333, net: 13217, status: 'paid' },
  { month: 'אוקטובר 2025', revenue: 22100, expenses: 2700, commission: 2910, net: 16490, status: 'paid' },
];

function formatCurrency(n) {
  return '₪' + n.toLocaleString('he-IL');
}

export default function OwnerReports() {
  const [selectedOwner, setSelectedOwner] = useState(OWNERS[0]);
  const [feePercent, setFeePercent] = useState(15);
  const [autoSend, setAutoSend] = useState(true);
  const [includeExpenses, setIncludeExpenses] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const properties = PROPERTY_DETAILS[selectedOwner.id] || [];
  const totalGross = properties.reduce((s, p) => s + p.gross, 0);
  const totalExpenses = properties.reduce((s, p) => s + p.expenses, 0);
  const totalNights = properties.reduce((s, p) => s + p.nights, 0);
  const commission = Math.round(totalGross * feePercent / 100);
  const netPayout = totalGross - totalExpenses - commission;

  return (
    <div dir="rtl" className="mx-auto w-full max-w-[1200px] space-y-8 px-5 pb-16 pt-6 md:px-10 md:pt-10">

      {/* ── Header ───────────────────────────────── */}
      <PageHeader title="דוחות בעלים" subtitle="דוח חודשי לכל בעל נכס: הכנסות, הוצאות וסכום לתשלום." className="!mb-0" />

      <div className="stat-row">
        <StatTile label="שולם לבעלים השנה" value={formatCurrency(142300)} icon={CreditCard} tone="success" />
        <StatTile label="עמלות ניהול שנצברו" value={formatCurrency(25100)} icon={DollarSign} />
        <StatTile label="נכסים בניהול" value="8" icon={Building2} tone="amber" />
      </div>

      {/* ── Owner Selector ───────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-navy-900 mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-500" />
          בעל הנכס
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {OWNERS.map((owner) => (
            <button
              key={owner.id}
              onClick={() => setSelectedOwner(owner)}
              className={cn(
                'text-right rounded-2xl border-2 p-4 transition-[background-color,border-color,color,box-shadow,transform] duration-200 hover:shadow-md',
                selectedOwner.id === owner.id
                  ? 'border-brand-500 bg-brand-50/60 shadow-md ring-2 ring-brand-200'
                  : 'border-line bg-white hover:border-line'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                  selectedOwner.id === owner.id
                    ? 'bg-brand-500 text-white'
                    : 'bg-neutral-100 text-ink-600'
                )}>
                  {owner.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-navy-900 text-sm">{owner.name}</p>
                  <p className="text-xs text-ink-600">{owner.properties.length} נכסים</p>
                </div>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-600">הכנסות החודש</span>
                <span className="font-bold text-navy-900">{formatCurrency(owner.totalRevenue)}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-ink-600">לתשלום</span>
                <span className="font-bold text-emerald-600">{formatCurrency(owner.payout)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Statement Preview ────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-navy-900 mb-3 flex items-center gap-2">
          <FileBarChart className="w-5 h-5 text-brand-500" />
          תצוגה מקדימה של הדוח
        </h2>
        <div className="bg-white rounded-2xl border border-line shadow-sm overflow-hidden">

          {/* Statement Header */}
          <div className="bg-navy-900 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold mb-1">דוח חודשי, מרץ 2026</h3>
                <p className="text-white/70 text-sm">תאריך הפקה: 17 במרץ 2026</p>
              </div>
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg tracking-wide">ATLAS</span>
              </div>
            </div>
          </div>

          {/* Owner Info */}
          <div className="p-6 border-b border-line bg-canvas">
            <h4 className="text-sm font-bold text-ink-600 mb-3">פרטי בעל הנכס</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-ink-600 text-xs">שם</span>
                <p className="font-semibold text-navy-900">{selectedOwner.name}</p>
              </div>
              <div>
                <span className="text-ink-600 text-xs">ת.ז.</span>
                <p className="font-semibold text-navy-900">{selectedOwner.idNumber}</p>
              </div>
              <div>
                <span className="text-ink-600 text-xs">אימייל</span>
                <p className="font-semibold text-navy-900">{selectedOwner.email}</p>
              </div>
              <div>
                <span className="text-ink-600 text-xs">טלפון</span>
                <p className="font-semibold text-navy-900">{selectedOwner.phone}</p>
              </div>
            </div>
          </div>

          {/* Property Breakdown Table */}
          <div className="p-6">
            <h4 className="text-sm font-bold text-ink-600 mb-4">פירוט לפי נכס</h4>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className="border-b-2 border-line">
                    <th className="text-right py-3 px-3 font-bold text-ink-600">נכס</th>
                    <th className="text-center py-3 px-3 font-bold text-ink-600">לילות מאוכלסים</th>
                    <th className="text-center py-3 px-3 font-bold text-ink-600">הכנסות ברוטו</th>
                    <th className="text-center py-3 px-3 font-bold text-ink-600">הוצאות</th>
                    <th className="text-center py-3 px-3 font-bold text-ink-600">עמלת ניהול ({feePercent}%)</th>
                    <th className="text-center py-3 px-3 font-bold text-ink-600">נטו לבעלים</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((p, idx) => {
                    const propCommission = Math.round(p.gross * feePercent / 100);
                    const propNet = p.gross - p.expenses - propCommission;
                    return (
                      <tr key={idx} className="border-b border-line hover:bg-canvas transition-colors">
                        <td className="py-3 px-3 font-medium text-navy-900">
                          <div className="flex items-center gap-2">
                            <Home className="w-4 h-4 text-brand-500 shrink-0" />
                            {p.name}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center text-ink-600">{p.nights}</td>
                        <td className="py-3 px-3 text-center font-medium text-navy-900">{formatCurrency(p.gross)}</td>
                        <td className="py-3 px-3 text-center text-red-600">-{formatCurrency(p.expenses)}</td>
                        <td className="py-3 px-3 text-center text-amber-600">-{formatCurrency(propCommission)}</td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-600">{formatCurrency(propNet)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-neutral-300 bg-canvas">
                    <td className="py-3 px-3 font-bold text-navy-900">סה״כ</td>
                    <td className="py-3 px-3 text-center font-bold text-navy-900">{totalNights}</td>
                    <td className="py-3 px-3 text-center font-bold text-navy-900">{formatCurrency(totalGross)}</td>
                    <td className="py-3 px-3 text-center font-bold text-red-600">-{formatCurrency(totalExpenses)}</td>
                    <td className="py-3 px-3 text-center font-bold text-amber-600">-{formatCurrency(commission)}</td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-600">{formatCurrency(netPayout)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Summary & Net Payout */}
          <div className="mx-6 mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <span className="text-xs text-ink-600 block mb-1">הכנסות ברוטו</span>
                <p className="text-lg font-bold text-navy-900">{formatCurrency(totalGross)}</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-ink-600 block mb-1">הוצאות + עמלה</span>
                <p className="text-lg font-bold text-red-500">-{formatCurrency(totalExpenses + commission)}</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-ink-600 block mb-1">עמלת ניהול ({feePercent}%)</span>
                <p className="text-lg font-bold text-amber-600">{formatCurrency(commission)}</p>
              </div>
            </div>
            <div className="border-t-2 border-emerald-200 pt-4 flex flex-col items-center">
              <span className="text-sm text-emerald-700 font-medium mb-1">סכום נטו לתשלום</span>
              <p className="text-4xl font-extrabold text-emerald-600 tracking-tight">{formatCurrency(netPayout)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex flex-wrap gap-3">
            <button className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-brand-200 transition-[background-color,border-color,color,box-shadow,transform] duration-200">
              <Send className="w-4 h-4" />
              שלח דוח לבעלים
            </button>
            <button className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-emerald-200 transition-[background-color,border-color,color,box-shadow,transform] duration-200">
              <MessageCircle className="w-4 h-4" />
              שלח ב-WhatsApp
            </button>
            <button className="flex items-center gap-2 bg-white border border-line text-ink-600 px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-canvas transition-[background-color,border-color,color,box-shadow,transform] duration-200">
              <Download className="w-4 h-4" />
              הורד PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Payout History ───────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-navy-900 mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-500" />
          היסטוריית תשלומים, {selectedOwner.name}
        </h2>
        <div className="bg-white rounded-2xl border border-line shadow-sm overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="bg-canvas border-b border-line">
                  <th className="text-right py-3 px-4 font-bold text-ink-600">חודש</th>
                  <th className="text-center py-3 px-4 font-bold text-ink-600">הכנסות</th>
                  <th className="text-center py-3 px-4 font-bold text-ink-600">הוצאות</th>
                  <th className="text-center py-3 px-4 font-bold text-ink-600">עמלה</th>
                  <th className="text-center py-3 px-4 font-bold text-ink-600">נטו לתשלום</th>
                  <th className="text-center py-3 px-4 font-bold text-ink-600">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {PAYOUT_HISTORY.map((row, idx) => (
                  <tr key={idx} className="border-b border-line hover:bg-canvas transition-colors">
                    <td className="py-3 px-4 font-medium text-navy-900">{row.month}</td>
                    <td className="py-3 px-4 text-center text-ink-600">{formatCurrency(row.revenue)}</td>
                    <td className="py-3 px-4 text-center text-red-600">-{formatCurrency(row.expenses)}</td>
                    <td className="py-3 px-4 text-center text-amber-600">-{formatCurrency(row.commission)}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{formatCurrency(row.net)}</td>
                    <td className="py-3 px-4 text-center">
                      {row.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          <CheckCircle className="w-3 h-3" />
                          שולם
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <Clock className="w-3 h-3" />
                          ממתין
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Settings Panel ───────────────────────── */}
      <div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="mb-3 flex min-h-11 items-center gap-2 text-lg font-bold text-navy-900 transition-colors hover:text-brand-600"
        >
          <Settings className="w-5 h-5 text-brand-500" />
          הגדרות דוחות
          <ChevronDown className={cn('w-4 h-4 text-ink-400 transition-transform duration-200', showSettings && 'rotate-180')} />
        </button>

        {showSettings && (
          <div className="bg-white rounded-2xl border border-line shadow-sm p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">

            {/* Fee Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-ink-600 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-brand-500" />
                  אחוז עמלת ניהול
                </label>
                <span className="text-lg font-bold text-brand-600">{feePercent}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={25}
                step={1}
                value={feePercent}
                onChange={(e) => setFeePercent(Number(e.target.value))}
                className="w-full h-2 bg-brand-100 rounded-full appearance-none cursor-pointer accent-brand-600"
              />
              <div className="flex justify-between text-xs text-ink-400 mt-1">
                <span>10%</span>
                <span>25%</span>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-500" />
                    שליחה אוטומטית ב-1 לחודש
                  </p>
                  <p className="text-xs text-ink-600 mr-6">הדוח ישלח אוטומטית לבעלי הנכסים מדי חודש</p>
                </div>
                <button
                  onClick={() => setAutoSend(!autoSend)}
                  className={cn(
                    'relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0',
                    autoSend ? 'bg-brand-500' : 'bg-gray-300'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-200',
                    autoSend ? 'right-0.5' : 'right-[calc(100%-1.625rem)]'
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink-600 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-brand-500" />
                    כלול פירוט הוצאות
                  </p>
                  <p className="text-xs text-ink-600 mr-6">הצג פירוט מלא של כל ההוצאות בדוח</p>
                </div>
                <button
                  onClick={() => setIncludeExpenses(!includeExpenses)}
                  className={cn(
                    'relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0',
                    includeExpenses ? 'bg-brand-500' : 'bg-gray-300'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-200',
                    includeExpenses ? 'right-0.5' : 'right-[calc(100%-1.625rem)]'
                  )} />
                </button>
              </div>
            </div>

            {/* Owner Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-ink-600 flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-brand-500" />
                  אימייל בעלים
                </label>
                <input
                  type="email"
                  value={selectedOwner.email}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl border border-line bg-canvas text-sm text-ink-600 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 transition-[background-color,border-color,color,box-shadow,transform]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-ink-600 flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-brand-500" />
                  WhatsApp בעלים
                </label>
                <input
                  type="tel"
                  value={selectedOwner.phone}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl border border-line bg-canvas text-sm text-ink-600 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 transition-[background-color,border-color,color,box-shadow,transform]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
