import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import DemoDataBanner from '@/components/common/DemoDataBanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TrendingUp, ArrowUp, ArrowDown, Calendar, Zap, Sun, Moon, Star, DollarSign, Settings } from 'lucide-react';

const SAMPLE_PROPERTIES = [
  { id: 1, name: 'דירת נופש תל אביב - מרכז', currentPrice: 450, recommendedPrice: 520, occupancy: 78, season: 'high' },
  { id: 2, name: 'וילה אילת - ים', currentPrice: 680, recommendedPrice: 620, occupancy: 45, season: 'medium' },
  { id: 3, name: 'סטודיו חיפה', currentPrice: 320, recommendedPrice: 380, occupancy: 92, season: 'peak' },
  { id: 4, name: 'דירת 3 חדרים ירושלים', currentPrice: 550, recommendedPrice: 550, occupancy: 65, season: 'low' },
];

const SEASON_LABELS = {
  high: { label: 'עונה גבוהה', color: 'bg-purple-100 text-purple-700', icon: Sun },
  medium: { label: 'עונה בינונית', color: 'bg-blue-100 text-blue-700', icon: Moon },
  peak: { label: 'שיא עונה', color: 'bg-red-100 text-red-700', icon: Star },
  low: { label: 'עונה נמוכה', color: 'bg-green-100 text-green-700', icon: Moon },
};

const PRICE_LEVELS = ['low', 'medium', 'high', 'peak'];
const PRICE_COLORS = {
  low: 'bg-green-400',
  medium: 'bg-blue-400',
  high: 'bg-purple-400',
  peak: 'bg-red-500',
};

// Generate 7 days x 4 weeks of sample price levels
const generateCalendarData = () => {
  const days = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
  const weeks = [];
  for (let w = 0; w < 4; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const rand = Math.random();
      if (rand < 0.2) week.push('low');
      else if (rand < 0.5) week.push('medium');
      else if (rand < 0.8) week.push('high');
      else week.push('peak');
    }
    weeks.push(week);
  }
  return { days, weeks };
};

const SMART_TIPS = [
  {
    title: 'חגים ומועדים',
    text: 'מחירים יכולים לעלות עד 40%',
    icon: Star,
    color: 'bg-amber-50 border-amber-200',
    iconColor: 'text-amber-600',
  },
  {
    title: 'ימי חול',
    text: 'הורד מחיר ב-15% למילוי תפוסה',
    icon: Sun,
    color: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600',
  },
  {
    title: 'הזמנות דקה אחרונה',
    text: 'הנח 10% למילוי חורים ביומן',
    icon: Zap,
    color: 'bg-emerald-50 border-emerald-200',
    iconColor: 'text-emerald-600',
  },
];

export default function DynamicPricing() {
  const [autoPricing, setAutoPricing] = useState(false);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [minPrice, setMinPrice] = useState('200');
  const [maxPrice, setMaxPrice] = useState('1200');
  const [calendarData] = useState(() => generateCalendarData());

  return (
    <div className="min-h-screen bg-gray-50/50" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-50/80 to-white rounded-2xl border border-indigo-100/50 p-5 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">תמחור דינאמי</h1>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed mr-[3.25rem]">מקסם את ההכנסות שלך עם תמחור חכם. המערכת ממליצה על מחירים אופטימליים לפי עונה, ביקוש ותחרות.</p>
          <p className="text-indigo-500 text-xs mt-1 mr-[3.25rem]">💡 טיפ: הפעל תמחור אוטומטי כדי למקסם הכנסות בלי מאמץ</p>
        </div>

        <DemoDataBanner message="נתוני דוגמה — המחירים וההמלצות המוצגים הם לצורך המחשה. חבר את הנכסים שלך כדי לראות המלצות אמיתיות." />

        {/* Revenue Impact Card */}
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">הכנסות יכולות לעלות ב-25% עם תמחור חכם</h2>
              <p className="text-white/90 text-sm mt-1">בהתבסס על נתוני השוק והביקוש באזור שלך</p>
            </div>
          </div>
        </div>

        {/* Property Pricing Cards */}
        <h3 className="text-lg font-semibold text-gray-900 mb-3">מחירי נכסים</h3>
        <div className="grid gap-4 mb-8 sm:grid-cols-1 md:grid-cols-2">
          {SAMPLE_PROPERTIES.map((prop) => {
            const seasonInfo = SEASON_LABELS[prop.season];
            const SeasonIcon = seasonInfo.icon;
            const isHigher = prop.recommendedPrice > prop.currentPrice;
            const isSame = prop.recommendedPrice === prop.currentPrice;
            return (
              <Card key={prop.id} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{prop.name}</h4>
                    <span className={`text-xs px-2.5 py-1 rounded-full ${seasonInfo.color} flex items-center gap-1`}>
                      <SeasonIcon className="w-3 h-3" />
                      {seasonInfo.label}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">מחיר נוכחי:</span>
                      <span className="font-medium">₪{prop.currentPrice} / לילה</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-500">מחיר מומלץ:</span>
                      <span className={`font-semibold flex items-center gap-1 ${isHigher ? 'text-emerald-600' : isSame ? 'text-gray-600' : 'text-red-600'}`}>
                        {isHigher && <ArrowUp className="w-4 h-4" />}
                        {!isHigher && !isSame && <ArrowDown className="w-4 h-4" />}
                        ₪{prop.recommendedPrice} / לילה
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">תפוסה:</span>
                      <span className="font-medium">{prop.occupancy}%</span>
                    </div>
                  </div>
                  <Button size="sm" className="w-full">עדכן מחיר</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pricing Calendar */}
        <h3 className="text-lg font-semibold text-gray-900 mb-3">לוח מחירים שבועי</h3>
        <Card className="mb-8">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span className="text-sm text-gray-600">ירוק = נמוך | כחול = בינוני | סגול = גבוה | אדום = שיא</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {calendarData.days.map((d, i) => (
                      <th key={i} className="text-center text-xs font-medium text-gray-500 pb-2">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {calendarData.weeks.map((week, wi) => (
                    <tr key={wi}>
                      {week.map((level, di) => (
                        <td key={di} className="p-1">
                          <div className={`w-8 h-8 rounded-lg ${PRICE_COLORS[level]} min-w-[2rem]`} title={level} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Settings Section */}
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          הגדרות
        </h3>
        <Card className="mb-8">
          <CardContent className="p-5 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-pricing" className="text-base font-medium">תמחור אוטומטי</Label>
                <p className="text-sm text-gray-500 mt-0.5">המערכת תעדכן מחירים אוטומטית לפי ביקוש ותחרות</p>
              </div>
              <Switch id="auto-pricing" checked={autoPricing} onCheckedChange={setAutoPricing} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="price-alerts" className="text-base font-medium">התראות על שינויי מחיר</Label>
                <p className="text-sm text-gray-500 mt-0.5">קבל התראה כשהמערכת ממליצה על שינוי משמעותי</p>
              </div>
              <Switch id="price-alerts" checked={priceAlerts} onCheckedChange={setPriceAlerts} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div>
                <Label htmlFor="min-price">מחיר מינימום (₪)</Label>
                <Input id="min-price" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="max-price">מחיר מקסימום (₪)</Label>
                <Input id="max-price" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Smart Tips Section */}
        <h3 className="text-lg font-semibold text-gray-900 mb-3">טיפים חכמים</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {SMART_TIPS.map((tip, i) => {
            const Icon = tip.icon;
            return (
              <Card key={i} className={`border ${tip.color}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tip.iconColor} bg-white/80`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{tip.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">— {tip.text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
