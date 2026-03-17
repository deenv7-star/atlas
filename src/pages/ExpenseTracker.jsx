import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import DemoDataBanner from '@/components/common/DemoDataBanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, Plus, TrendingDown, Building2, Calendar, DollarSign, Wallet, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'ניקיון', label: 'ניקיון', color: 'bg-emerald-100 text-emerald-700', barColor: 'bg-emerald-500' },
  { value: 'תחזוקה', label: 'תחזוקה', color: 'bg-amber-100 text-amber-700', barColor: 'bg-amber-500' },
  { value: 'ארנונה', label: 'ארנונה', color: 'bg-blue-100 text-blue-700', barColor: 'bg-blue-500' },
  { value: 'חשמל', label: 'חשמל', color: 'bg-yellow-100 text-yellow-700', barColor: 'bg-yellow-500' },
  { value: 'מים', label: 'מים', color: 'bg-cyan-100 text-cyan-700', barColor: 'bg-cyan-500' },
  { value: 'ציוד', label: 'ציוד', color: 'bg-purple-100 text-purple-700', barColor: 'bg-purple-500' },
  { value: 'שיווק', label: 'שיווק', color: 'bg-pink-100 text-pink-700', barColor: 'bg-pink-500' },
  { value: 'אחר', label: 'אחר', color: 'bg-gray-100 text-gray-700', barColor: 'bg-gray-500' },
];

const DEMO_PROPERTIES = ['דירה תל אביב', 'וילה צפון', 'סטודיו אילת', 'דירת גן הרצליה'];

const DEMO_EXPENSES = [
  { id: 1, date: '2025-03-15', property: 'דירה תל אביב', category: 'ניקיון', amount: 450, description: 'ניקיון מעבר אורחים' },
  { id: 2, date: '2025-03-12', property: 'וילה צפון', category: 'תחזוקה', amount: 1200, description: 'תיקון מזגן' },
  { id: 3, date: '2025-03-10', property: 'דירה תל אביב', category: 'ארנונה', amount: 850, description: 'תשלום ארנונה חודשי' },
  { id: 4, date: '2025-03-08', property: 'סטודיו אילת', category: 'חשמל', amount: 320, description: 'חשבון חשמל' },
  { id: 5, date: '2025-03-05', property: 'וילה צפון', category: 'ציוד', amount: 680, description: 'מצעים וכלי מיטה' },
  { id: 6, date: '2025-03-02', property: 'דירת גן הרצליה', category: 'מים', amount: 95, description: 'חשבון מים' },
];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getCategoryColor(category) {
  return CATEGORIES.find(c => c.value === category)?.color || 'bg-gray-100 text-gray-700';
}

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState(DEMO_EXPENSES);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    property: '',
    category: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const now = new Date();
  const thisMonth = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthTotal = thisMonth.reduce((sum, e) => sum + (e.amount || 0), 0);
  const uniqueProperties = [...new Set(expenses.map(e => e.property))];
  const avgPerProperty = uniqueProperties.length > 0 ? Math.round(totalExpenses / uniqueProperties.length) : 0;
  const mockRevenue = 75000;
  const netProfitEstimate = mockRevenue - totalExpenses;

  const categoryTotals = CATEGORIES.reduce((acc, c) => {
    acc[c.value] = expenses.filter(e => e.category === c.value).reduce((s, e) => s + (e.amount || 0), 0);
    return acc;
  }, {});
  const maxCategoryAmount = Math.max(...Object.values(categoryTotals), 1);

  const handleAddExpense = () => {
    if (!form.property || !form.category || !form.amount) return;
    const newExpense = {
      id: Date.now(),
      date: form.date,
      property: form.property,
      category: form.category,
      amount: parseFloat(form.amount) || 0,
      description: form.description || '',
    };
    setExpenses(prev => [newExpense, ...prev]);
    setForm({ property: '', category: '', amount: '', date: new Date().toISOString().slice(0, 10), description: '' });
    setDialogOpen(false);
  };

  return (
    <div className="min-h-full p-4 md:p-6 space-y-6 max-w-6xl mx-auto" dir="rtl" style={{ fontFamily: 'Heebo, sans-serif' }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-50/80 to-white rounded-2xl border border-indigo-100/50 p-5 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">מעקב הוצאות</h1>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed mr-[3.25rem]">עקוב אחר כל ההוצאות לפי נכס — ניקיון, תחזוקה, ארנונה, ציוד ועוד. ראה את הרווח הנקי האמיתי שלך.</p>
        <p className="text-indigo-500 text-xs mt-1 mr-[3.25rem]">💡 טיפ: הוסף הוצאות באופן שוטף כדי לדעת בדיוק כמה אתה מרוויח מכל נכס</p>
      </div>

      <DemoDataBanner message="נתוני דוגמה — ההוצאות המוצגות הן לצורך המחשה. הוסף הוצאות אמיתיות כדי לעקוב אחר הרווח הנקי שלך." />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-rose-50 to-white border-rose-100/60">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">סה״כ הוצאות</p>
              <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">₪{totalExpenses.toLocaleString('he-IL')}</p>
            <p className="text-xs text-gray-500 mt-1">כל ההוצאות שנרשמו</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100/60">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">החודש</p>
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">₪{thisMonthTotal.toLocaleString('he-IL')}</p>
            <p className="text-xs text-gray-500 mt-1">{thisMonth.length} הוצאות החודש</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-50 to-white border-violet-100/60">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">ממוצע לנכס</p>
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-violet-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">₪{avgPerProperty.toLocaleString('he-IL')}</p>
            <p className="text-xs text-gray-500 mt-1">{uniqueProperties.length} נכסים</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100/60">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">רווח נקי משוער</p>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <p className={cn(
              "text-2xl font-bold",
              netProfitEstimate >= 0 ? "text-emerald-700" : "text-rose-600"
            )}>
              ₪{netProfitEstimate.toLocaleString('he-IL')}
            </p>
            <p className="text-xs text-gray-500 mt-1">הכנסות פחות הוצאות</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Expense Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
        >
          <Plus className="w-4 h-4 ml-2" />
          הוסף הוצאה
        </Button>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardContent className="p-0">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">הוצאות אחרונות</h2>
          </div>
          {expenses.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-600 font-medium mb-1">אין הוצאות עדיין</p>
              <p className="text-sm text-gray-400 mb-4">התחל להוסיף הוצאות כדי לעקוב אחרי הנכסים שלך</p>
              <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 ml-2" />
                הוסף הוצאה ראשונה
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500">תאריך</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500">נכס</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500">קטגוריה</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500">סכום</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500">תיאור</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(exp.date)}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-800">{exp.property}</td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          "inline-flex text-xs font-medium px-2.5 py-1 rounded-full",
                          getCategoryColor(exp.category)
                        )}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-rose-600">₪{exp.amount.toLocaleString('he-IL')}</td>
                      <td className="py-3 px-4 text-sm text-gray-500 max-w-[200px] truncate">{exp.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-800">פירוט לפי קטגוריה</h2>
          </div>
          <div className="space-y-4">
            {CATEGORIES.filter(c => categoryTotals[c.value] > 0).map((cat) => (
              <div key={cat.value}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-gray-700">{cat.label}</span>
                  <span className="text-gray-600">₪{categoryTotals[cat.value].toLocaleString('he-IL')}</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", cat.barColor)}
                    style={{ width: `${(categoryTotals[cat.value] / maxCategoryAmount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {Object.values(categoryTotals).every(v => v === 0) && (
              <p className="text-sm text-gray-400 text-center py-4">אין הוצאות לפירוט</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>הוסף הוצאה חדשה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>נכס</Label>
              <Select value={form.property} onValueChange={v => setForm(f => ({ ...f, property: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר נכס" />
                </SelectTrigger>
                <SelectContent>
                  {DEMO_PROPERTIES.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>קטגוריה</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר קטגוריה" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>סכום (₪)</Label>
              <Input
                type="number"
                placeholder="0"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div>
              <Label>תאריך</Label>
              <Input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div>
              <Label>תיאור (אופציונלי)</Label>
              <Input
                placeholder="פרטים נוספים..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <Label>קבלה (אופציונלי)</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-indigo-300 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">גרור קובץ לכאן או לחץ להעלאה</p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — עד 5MB</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                ביטול
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                onClick={handleAddExpense}
                disabled={!form.property || !form.category || !form.amount}
              >
                שמור הוצאה
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
