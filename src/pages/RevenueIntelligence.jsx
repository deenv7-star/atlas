import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign, Calendar, Home, Zap, AlertTriangle, Sparkles, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHS_HEB = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];

const MONTHLY_DATA = [
  { month: 'ינואר',   revenue: 18200, prev: 15400 },
  { month: 'פברואר',  revenue: 21500, prev: 17800 },
  { month: 'מרץ',     revenue: 24800, prev: 20100 },
  { month: 'אפריל',   revenue: 22100, prev: 19500 },
  { month: 'מאי',     revenue: 26300, prev: 22000 },
  { month: 'יוני',    revenue: 29400, prev: 24600 },
  { month: 'יולי',    revenue: 35800, prev: 28900 },
  { month: 'אוגוסט',  revenue: 42300, prev: 33100 },
  { month: 'ספטמבר',  revenue: 28700, prev: 25200 },
  { month: 'אוקטובר', revenue: 19600, prev: 18700 },
  { month: 'נובמבר',  revenue: 16200, prev: 15900 },
  { month: 'דצמבר',   revenue: 22500, prev: 20300 },
];

const PROPERTIES = [
  { name: 'פנטהאוז הכרמל',       revenue: 72400, nights: 78,  avgNight: 928,  occupancy: 91, revpar: 845, trend: 'up' },
  { name: 'סוויטת נמל תל אביב',  revenue: 64200, nights: 82,  avgNight: 783,  occupancy: 94, revpar: 736, trend: 'up' },
  { name: 'לופט פלורנטין',        revenue: 58100, nights: 71,  avgNight: 818,  occupancy: 88, revpar: 720, trend: 'up' },
  { name: 'וילה הגליל',           revenue: 51800, nights: 54,  avgNight: 959,  occupancy: 79, revpar: 758, trend: 'down' },
  { name: 'סוויטת הכרמל',        revenue: 40900, nights: 62,  avgNight: 660,  occupancy: 72, revpar: 475, trend: 'down' },
];

const FORECAST = [
  { month: 'ינואר 2026',  predicted: 24500, confidence: 91 },
  { month: 'פברואר 2026', predicted: 31200, confidence: 89 },
  { month: 'מרץ 2026',    predicted: 39300, confidence: 84 },
];

function Sparkline({ data, color = 'from-indigo-400 to-violet-400' }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-[3px] h-8">
      {data.map((v, i) => (
        <div
          key={i}
          className={cn('w-[5px] rounded-full bg-gradient-to-t', color)}
          style={{ height: `${Math.max((v / max) * 100, 12)}%` }}
        />
      ))}
    </div>
  );
}

function CircularProgress({ value, size = 48, strokeWidth = 5 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="url(#gaugeGrad)" strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" className="transition-all duration-700"
      />
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function KPICard({ icon: Icon, label, value, suffix, change, positive, sparkData, isCircular, circularValue }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center group-hover:from-indigo-100 group-hover:to-violet-100 transition-colors">
            <Icon className="w-[18px] h-[18px] text-indigo-600" />
          </div>
          <span className="text-sm text-gray-500 font-medium">{label}</span>
        </div>
        {change !== undefined && (
          <div className={cn(
            'flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full',
            positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
          )}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}%
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900 tracking-tight">
            {value}{suffix && <span className="text-base font-medium text-gray-400 mr-0.5">{suffix}</span>}
          </div>
        </div>
        {isCircular ? (
          <div className="relative">
            <CircularProgress value={circularValue} />
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-indigo-600">{circularValue}%</span>
          </div>
        ) : (
          sparkData && <Sparkline data={sparkData} />
        )}
      </div>
    </div>
  );
}

export default function RevenueIntelligence() {
  const [chartTab, setChartTab] = useState('monthly');
  const maxRevenue = Math.max(...MONTHLY_DATA.map(d => d.revenue));
  const maxForecast = Math.max(...FORECAST.map(f => f.predicted));

  const chartTabs = [
    { id: 'monthly', label: 'חודשי' },
    { id: 'weekly', label: 'שבועי' },
    { id: 'daily', label: 'יומי' },
  ];

  return (
    <div className="min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Header ──────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-indigo-50/80 to-white rounded-2xl border border-indigo-100/50 p-5 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">מודיעין הכנסות</h1>
              <span className="text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full">PRO</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed mr-[3.25rem]">
            תמונת מצב מלאה על ההכנסות שלך — ניתוח מגמות, חיזוי הכנסות, השוואת ביצועים בין נכסים ותובנות AI חכמות.
          </p>
        </div>

        {/* ── KPI Row ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={DollarSign} label="סה״כ הכנסות" value="₪287,400" change={18} positive
            sparkData={[18, 21, 25, 22, 26, 29, 36]}
          />
          <KPICard
            icon={Calendar} label="ממוצע ללילה" value="₪842" change={12} positive
            sparkData={[72, 78, 81, 79, 84, 85, 88]}
          />
          <KPICard
            icon={Home} label="תפוסה" value="87" suffix="%" change={5} positive
            isCircular circularValue={87}
          />
          <KPICard
            icon={Target} label="RevPAR" value="₪733" change={14} positive
            sparkData={[62, 68, 71, 69, 73, 76, 79]}
          />
        </div>

        {/* ── Revenue Chart ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 pt-5 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">סקירת הכנסות</h2>
              <p className="text-xs text-gray-400 mt-0.5">2025 מול 2024</p>
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {chartTabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setChartTab(t.id)}
                  className={cn(
                    'px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200',
                    chartTab === t.id
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 pb-2">
            <div className="flex items-center gap-5 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-gradient-to-r from-indigo-500 to-violet-500" /> 2025</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-t-2 border-dashed border-gray-300" /> 2024</span>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="relative h-64">
              {/* Y-axis grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                <div key={i} className="absolute left-0 right-0 border-t border-gray-50" style={{ bottom: `${pct * 100}%` }}>
                  <span className="absolute -top-2.5 left-0 text-[10px] text-gray-300 font-mono">
                    {Math.round(maxRevenue * pct / 1000)}K
                  </span>
                </div>
              ))}

              <div className="relative h-full flex items-end justify-between gap-2 pr-8">
                {MONTHLY_DATA.map((d, i) => {
                  const barH = (d.revenue / maxRevenue) * 100;
                  const prevH = (d.prev / maxRevenue) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar relative">
                      {/* Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 z-10
                        bg-gray-900 text-white text-[10px] font-medium px-2 py-1 rounded-lg whitespace-nowrap pointer-events-none">
                        ₪{d.revenue.toLocaleString()} | שנה קודמת: ₪{d.prev.toLocaleString()}
                      </div>
                      <div className="w-full relative" style={{ height: '100%' }}>
                        {/* Previous year dashed marker */}
                        <div
                          className="absolute left-1/2 -translate-x-1/2 w-[70%] border-t-2 border-dashed border-gray-300/70 z-10"
                          style={{ bottom: `${prevH}%` }}
                        />
                        {/* Current year bar */}
                        <div
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] rounded-t-lg bg-gradient-to-t from-indigo-600 to-violet-400
                            group-hover/bar:from-indigo-500 group-hover/bar:to-violet-300 transition-all duration-300 cursor-pointer"
                          style={{ height: `${barH}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium mt-1 shrink-0">{MONTHS_HEB[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Insight */}
          <div className="mx-6 mb-6 p-4 rounded-xl border-2 border-violet-200 bg-gradient-to-r from-violet-50/80 to-indigo-50/50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-xs font-bold text-violet-700 uppercase tracking-wider">AI Insight</span>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                  📈 ההכנסות עלו ב-18% לעומת השנה שעברה. החודש הכי חזק: <span className="font-semibold text-indigo-700">אוגוסט (₪42,300)</span>. המלצה: העלה מחירים בסופי שבוע ב-15%.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Property Performance Table ──────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-lg font-bold text-gray-900">ביצועי נכסים</h2>
            <p className="text-xs text-gray-400 mt-0.5">השוואת ביצועים בין כל הנכסים</p>
          </div>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-gray-50/80">
                  {['נכס', 'הכנסות', 'לילות', 'ממוצע ללילה', 'תפוסה', 'RevPAR', 'מגמה'].map((h, i) => (
                    <th key={i} className="px-5 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 transition-colors select-none">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {PROPERTIES.map((p, i) => {
                  const isBest = i === 0;
                  return (
                    <tr
                      key={i}
                      className={cn(
                        'hover:bg-gray-50/60 transition-colors',
                        isBest && 'bg-emerald-50/40'
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                            isBest
                              ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'
                              : 'bg-gray-100 text-gray-500'
                          )}>
                            {i + 1}
                          </div>
                          <span className="font-medium text-gray-900 text-sm">{p.name}</span>
                          {isBest && (
                            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                              Top
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900 text-sm">₪{p.revenue.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-gray-600 text-sm">{p.nights}</td>
                      <td className="px-5 py-3.5 text-gray-600 text-sm">₪{p.avgNight}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                p.occupancy >= 85 ? 'bg-emerald-400' : p.occupancy >= 70 ? 'bg-amber-400' : 'bg-red-400'
                              )}
                              style={{ width: `${p.occupancy}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{p.occupancy}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 text-sm">₪{p.revpar}</td>
                      <td className="px-5 py-3.5">
                        <div className={cn(
                          'inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full',
                          p.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                        )}>
                          {p.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {p.trend === 'up' ? 'עולה' : 'יורד'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── AI Insights Panel ──────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Opportunity */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
            <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
            <div className="p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Zap className="w-[18px] h-[18px] text-emerald-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">חלון הזדמנות</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                יש <span className="font-semibold text-emerald-700">12 לילות פנויים</span> בחודש הבא שיכולים לייצר <span className="font-semibold text-emerald-700">₪10,000+</span> אם תוריד מחיר ב-20%.
              </p>
              <button className="w-full py-2 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors">
                בצע אופטימיזציה
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
            <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
            <div className="p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <AlertTriangle className="w-[18px] h-[18px] text-amber-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">אזהרת ביצועים</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                הנכס <span className="font-semibold text-amber-700">׳סוויטת הכרמל׳</span> ירד ב-30% בתפוסה. בדוק מחיר מול מתחרים.
              </p>
              <button className="w-full py-2 rounded-xl text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors">
                בדוק עכשיו
              </button>
            </div>
          </div>

          {/* Forecast */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
            <div className="h-1 bg-gradient-to-r from-violet-400 to-indigo-400" />
            <div className="p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Sparkles className="w-[18px] h-[18px] text-violet-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">חיזוי</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                לפי המגמה הנוכחית, ההכנסות ברבעון הבא צפויות להיות <span className="font-semibold text-violet-700">₪95,000</span>.
              </p>
              <button className="w-full py-2 rounded-xl text-sm font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors">
                צפה בפירוט
              </button>
            </div>
          </div>
        </div>

        {/* ── Revenue Forecast ───────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">חיזוי הכנסות</h2>
              <p className="text-xs text-gray-400 mt-0.5">תחזית ל-3 חודשים הבאים מבוססת AI</p>
            </div>
            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-xs font-semibold text-indigo-700">רמת דיוק: 89%</span>
            </div>
          </div>

          <div className="px-6 py-6">
            {/* Timeline bar */}
            <div className="relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-100 z-0" />
              <div className="grid grid-cols-3 gap-4 relative z-10">
                {FORECAST.map((f, i) => {
                  const barH = (f.predicted / maxForecast) * 100;
                  return (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-white border-2 border-indigo-200 flex items-center justify-center mb-4 shadow-sm">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div className="w-full bg-gradient-to-br from-indigo-50/80 to-violet-50/50 rounded-xl p-4 border border-indigo-100/50 text-center">
                        <p className="text-xs text-gray-400 font-medium mb-1">{f.month}</p>
                        <div className="h-24 flex items-end justify-center mb-3">
                          <div
                            className="w-12 rounded-t-lg bg-gradient-to-t from-indigo-400/50 to-violet-300/50 border border-indigo-200/50 border-b-0"
                            style={{ height: `${barH}%` }}
                          />
                        </div>
                        <p className="text-lg font-bold text-gray-900">₪{f.predicted.toLocaleString()}</p>
                        <div className="flex items-center justify-center gap-1 mt-1.5">
                          <div className="h-1 flex-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400"
                              style={{ width: `${f.confidence}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-indigo-600">{f.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom summary */}
            <div className="mt-6 flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50/60 to-violet-50/40 rounded-xl border border-indigo-100/30">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <span className="text-sm text-gray-600">
                  סה״כ תחזית רבעונית: <span className="font-bold text-indigo-700">₪95,000</span>
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +22% מהרבעון הנוכחי
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
