import React, { useState } from 'react';
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
    <div dir="rtl" className="min-h-screen p-4 md:p-6 space-y-6 max-w-6xl mx-auto">

      {/* ── Header ───────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-50/80 to-white rounded-2xl border border-indigo-100/50 p-5 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <FileBarChart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">דוחות בעלים</h1>
            <span className="text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full">PRO</span>
          </div>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed sm:mr-12">
          הפק דוחות אוטומטיים לבעלי הנכסים שלך — הכנסות, הוצאות, עמלות וסכום לתשלום. שלח בלחיצה אחת.
        </p>
      </div>

      {/* ── Quick Stats ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'סה״כ שולם לבעלים השנה', value: formatCurrency(142300), icon: CreditCard, gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50' },
          { label: 'עמלות ניהול שנצברו', value: formatCurrency(25100), icon: DollarSign, gradient: 'from-indigo-500 to-purple-500', bg: 'bg-indigo-50' },
          { label: 'מספר נכסים בניהול', value: '8', icon: Building2, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
        ].map((s) => (
          <div key={s.label} className={cn('rounded-2xl border border-gray-100 p-4', s.bg)}>
            <div className="flex items-center gap-3 mb-2">
              <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center', s.gradient)}>
                <s.icon className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-xs text-gray-500 font-medium">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mr-12">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Owner Selector ───────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          בחר בעל נכס
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {OWNERS.map((owner) => (
            <button
              key={owner.id}
              onClick={() => setSelectedOwner(owner)}
              className={cn(
                'text-right rounded-2xl border-2 p-4 transition-all duration-200 hover:shadow-md',
                selectedOwner.id === owner.id
                  ? 'border-indigo-500 bg-indigo-50/60 shadow-md ring-2 ring-indigo-200'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                  selectedOwner.id === owner.id
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                )}>
                  {owner.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{owner.name}</p>
                  <p className="text-xs text-gray-500">{owner.properties.length} נכסים</p>
                </div>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">הכנסות החודש</span>
                <span className="font-bold text-gray-800">{formatCurrency(owner.totalRevenue)}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-500">לתשלום</span>
                <span className="font-bold text-emerald-600">{formatCurrency(owner.payout)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Statement Preview ────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <FileBarChart className="w-5 h-5 text-indigo-500" />
          תצוגה מקדימה — דוח חודשי
        </h2>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Statement Header */}
          <div className="bg-gradient-to-l from-indigo-600 to-indigo-700 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold mb-1">דוח חודשי — מרץ 2026</h3>
                <p className="text-indigo-200 text-sm">תאריך הפקה: 17 במרץ 2026</p>
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
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h4 className="text-sm font-bold text-gray-700 mb-3">פרטי בעל הנכס</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500 text-xs">שם</span>
                <p className="font-semibold text-gray-900">{selectedOwner.name}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">ת.ז.</span>
                <p className="font-semibold text-gray-900">{selectedOwner.idNumber}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">אימייל</span>
                <p className="font-semibold text-gray-900">{selectedOwner.email}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">טלפון</span>
                <p className="font-semibold text-gray-900">{selectedOwner.phone}</p>
              </div>
            </div>
          </div>

          {/* Property Breakdown Table */}
          <div className="p-6">
            <h4 className="text-sm font-bold text-gray-700 mb-4">פירוט לפי נכס</h4>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-right py-3 px-3 font-bold text-gray-700">נכס</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-700">לילות מאוכלסים</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-700">הכנסות ברוטו</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-700">הוצאות</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-700">עמלת ניהול ({feePercent}%)</th>
                    <th className="text-center py-3 px-3 font-bold text-gray-700">נטו לבעלים</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((p, idx) => {
                    const propCommission = Math.round(p.gross * feePercent / 100);
                    const propNet = p.gross - p.expenses - propCommission;
                    return (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-3 font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <Home className="w-4 h-4 text-indigo-400 shrink-0" />
                            {p.name}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center text-gray-700">{p.nights}</td>
                        <td className="py-3 px-3 text-center font-medium text-gray-900">{formatCurrency(p.gross)}</td>
                        <td className="py-3 px-3 text-center text-red-600">-{formatCurrency(p.expenses)}</td>
                        <td className="py-3 px-3 text-center text-amber-600">-{formatCurrency(propCommission)}</td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-600">{formatCurrency(propNet)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50/80">
                    <td className="py-3 px-3 font-bold text-gray-900">סה״כ</td>
                    <td className="py-3 px-3 text-center font-bold text-gray-900">{totalNights}</td>
                    <td className="py-3 px-3 text-center font-bold text-gray-900">{formatCurrency(totalGross)}</td>
                    <td className="py-3 px-3 text-center font-bold text-red-600">-{formatCurrency(totalExpenses)}</td>
                    <td className="py-3 px-3 text-center font-bold text-amber-600">-{formatCurrency(commission)}</td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-600">{formatCurrency(netPayout)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Summary & Net Payout */}
          <div className="mx-6 mb-6 rounded-2xl bg-gradient-to-l from-emerald-50 to-teal-50 border border-emerald-200 p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <span className="text-xs text-gray-500 block mb-1">הכנסות ברוטו</span>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalGross)}</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 block mb-1">הוצאות + עמלה</span>
                <p className="text-lg font-bold text-red-500">-{formatCurrency(totalExpenses + commission)}</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 block mb-1">עמלת ניהול ({feePercent}%)</span>
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
            <button className="flex items-center gap-2 bg-gradient-to-l from-indigo-600 to-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all duration-200">
              <Send className="w-4 h-4" />
              שלח דוח לבעלים
            </button>
            <button className="flex items-center gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-emerald-200 transition-all duration-200">
              <MessageCircle className="w-4 h-4" />
              שלח ב-WhatsApp
            </button>
            <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-all duration-200">
              <Download className="w-4 h-4" />
              הורד PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Payout History ───────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" />
          היסטוריית תשלומים — {selectedOwner.name}
        </h2>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-right py-3 px-4 font-bold text-gray-700">חודש</th>
                  <th className="text-center py-3 px-4 font-bold text-gray-700">הכנסות</th>
                  <th className="text-center py-3 px-4 font-bold text-gray-700">הוצאות</th>
                  <th className="text-center py-3 px-4 font-bold text-gray-700">עמלה</th>
                  <th className="text-center py-3 px-4 font-bold text-gray-700">נטו לתשלום</th>
                  <th className="text-center py-3 px-4 font-bold text-gray-700">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {PAYOUT_HISTORY.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">{row.month}</td>
                    <td className="py-3 px-4 text-center text-gray-700">{formatCurrency(row.revenue)}</td>
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
          className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3 hover:text-indigo-600 transition-colors"
        >
          <Settings className="w-5 h-5 text-indigo-500" />
          הגדרות דוחות
          <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform duration-200', showSettings && 'rotate-180')} />
        </button>

        {showSettings && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">

            {/* Fee Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-indigo-500" />
                  אחוז עמלת ניהול
                </label>
                <span className="text-lg font-bold text-indigo-600">{feePercent}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={25}
                step={1}
                value={feePercent}
                onChange={(e) => setFeePercent(Number(e.target.value))}
                className="w-full h-2 bg-indigo-100 rounded-full appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>10%</span>
                <span>25%</span>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    שליחה אוטומטית ב-1 לחודש
                  </p>
                  <p className="text-xs text-gray-500 mr-6">הדוח ישלח אוטומטית לבעלי הנכסים מדי חודש</p>
                </div>
                <button
                  onClick={() => setAutoSend(!autoSend)}
                  className={cn(
                    'relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0',
                    autoSend ? 'bg-indigo-500' : 'bg-gray-300'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-200',
                    autoSend ? 'right-0.5' : 'right-[calc(100%-1.625rem)]'
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-indigo-500" />
                    כלול פירוט הוצאות
                  </p>
                  <p className="text-xs text-gray-500 mr-6">הצג פירוט מלא של כל ההוצאות בדוח</p>
                </div>
                <button
                  onClick={() => setIncludeExpenses(!includeExpenses)}
                  className={cn(
                    'relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0',
                    includeExpenses ? 'bg-indigo-500' : 'bg-gray-300'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-200',
                    includeExpenses ? 'right-0.5' : 'right-[calc(100%-1.625rem)]'
                  )} />
                </button>
              </div>
            </div>

            {/* Owner Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-indigo-500" />
                  אימייל בעלים
                </label>
                <input
                  type="email"
                  value={selectedOwner.email}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-indigo-500" />
                  WhatsApp בעלים
                </label>
                <input
                  type="tel"
                  value={selectedOwner.phone}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
