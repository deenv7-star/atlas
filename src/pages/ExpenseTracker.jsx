import React, { useState } from 'react';
import FinanceTabs from '@/components/app/FinanceTabs';
import { PageHeader, StatTile, fmtMoney, ComingSoon } from '@/components/ds';
import { useStayData } from '@/hooks/useStayData';
import { Card, CardContent } from '@/components/ui/card';
import { useExpenses } from '@/hooks/useExpenses';
import { atlasToastApi } from '@/components/ui/AtlasToast/atlasToastApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, Plus, TrendingDown, Calendar, DollarSign, Wallet, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { todayIsrael } from '@/lib/localDate';

const CATEGORIES = [
  { value: 'ניקיון', label: 'ניקיון', color: 'bg-emerald-100 text-emerald-700', barColor: 'bg-emerald-500' },
  { value: 'תחזוקה', label: 'תחזוקה', color: 'bg-amber-100 text-amber-700', barColor: 'bg-brand-300' },
  { value: 'ארנונה', label: 'ארנונה', color: 'bg-brand-100 text-brand-700', barColor: 'bg-brand-500' },
  { value: 'חשמל', label: 'חשמל', color: 'bg-yellow-100 text-yellow-700', barColor: 'bg-navy-900' },
  { value: 'מים', label: 'מים', color: 'bg-brand-100 text-brand-700', barColor: 'bg-brand-500' },
  { value: 'ציוד', label: 'ציוד', color: 'bg-brand-100 text-brand-700', barColor: 'bg-brand-500' },
  { value: 'שיווק', label: 'שיווק', color: 'bg-pink-100 text-pink-700', barColor: 'bg-pink-500' },
  { value: 'אחר', label: 'אחר', color: 'bg-neutral-100 text-ink-600', barColor: 'bg-gray-500' },
];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getCategoryColor(category) {
  return CATEGORIES.find(c => c.value === category)?.color || 'bg-neutral-100 text-ink-600';
}

export default function ExpenseTracker({ orgId }) {
  const { expenses, propertyNames, addExpense, available } = useExpenses({ orgId });
  if (!available) {
    return (
      <div className="mx-auto w-full max-w-[1200px] space-y-8 px-5 pb-16 pt-6 md:px-10 md:pt-10" dir="rtl">
        <FinanceTabs className="!mb-0" />
        <PageHeader title="הוצאות" subtitle="כל ההוצאות לפי נכס, כדי לדעת כמה באמת נשאר." className="!mb-0" />
        <ComingSoon icon={Receipt} title="מעקב הוצאות יגיע בקרוב" description="נפתח לכם את המסך הזה ברגע שהוא מוכן. עד אז ההכנסות והתשלומים מחכים בכספים." />
      </div>
    );
  }
  return <ExpenseTrackerScreen expenses={expenses} propertyNames={propertyNames} addExpense={addExpense} />;
}

function ExpenseTrackerScreen({ expenses, propertyNames, addExpense }) {
  const stay = useStayData({ withCleaning: false });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    property: '',
    category: '',
    amount: '',
    date: todayIsrael(),
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
  const paidTotal = (stay.payments || [])
    .filter((p) => String(p.status).toUpperCase() === 'PAID')
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const netProfitEstimate = paidTotal - totalExpenses;

  const categoryTotals = CATEGORIES.reduce((acc, c) => {
    acc[c.value] = expenses.filter(e => e.category === c.value).reduce((s, e) => s + (e.amount || 0), 0);
    return acc;
  }, {});
  const maxCategoryAmount = Math.max(...Object.values(categoryTotals), 1);

  const handleAddExpense = () => {
    if (!form.property || !form.category || !form.amount) return;
    addExpense({
      date: form.date,
      propertyName: form.property,
      category: form.category,
      amount: parseFloat(form.amount) || 0,
      description: form.description || '',
    }).then(() => atlasToastApi.success('ההוצאה נשמרה'))
      .catch(() => atlasToastApi.error('ההוצאה לא נשמרה'));
    setForm({ property: '', category: '', amount: '', date: todayIsrael(), description: '' });
    setDialogOpen(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-8 px-5 pb-16 pt-6 md:px-10 md:pt-10" dir="rtl">
      {/* Header */}
      <FinanceTabs className="!mb-0" />
      <PageHeader
        title="הוצאות"
        subtitle="כל ההוצאות לפי נכס, כדי לדעת כמה באמת נשאר."
        className="!mb-0"
        actions={<Button onClick={() => setDialogOpen(true)}><Plus className="h-[18px] w-[18px]" strokeWidth={1.75} />הוצאה חדשה</Button>}
      />

      <div className="stat-row">
        <StatTile label="סה״כ הוצאות" value={fmtMoney(totalExpenses)} hint="כל ההוצאות שנרשמו" icon={TrendingDown} tone="danger" />
        <StatTile label="החודש" value={fmtMoney(thisMonthTotal)} hint={`${thisMonth.length} הוצאות החודש`} icon={Calendar} />
        <StatTile label="רווח נקי משוער" value={fmtMoney(netProfitEstimate)} hint="תשלומים שהתקבלו פחות הוצאות" icon={Wallet} tone="success" />
      </div>

      {/* Expenses Table */}
      <Card>
        <CardContent className="p-0">
          <div className="px-5 py-4 border-b border-line">
            <h2 className="text-base font-semibold text-navy-900">הוצאות אחרונות</h2>
          </div>
          {expenses.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-neutral-300" />
              </div>
              <p className="text-[17px] font-bold text-navy-900 mb-1">אין עדיין הוצאות</p>
              <p className="text-[15px] text-ink-600 mb-4">רשמו הוצאה כדי לראות כמה נשאר מכל נכס.</p>
              <Button onClick={() => setDialogOpen(true)} className="bg-brand-600 hover:bg-brand-700">
                <Plus className="w-4 h-4 ml-2" />
                הוצאה חדשה
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line bg-canvas">
                    <th className="text-right py-3 px-4 text-xs font-semibold text-ink-600">תאריך</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-ink-600">נכס</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-ink-600">קטגוריה</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-ink-600">סכום</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-ink-600">תיאור</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="border-b border-line hover:bg-canvas transition-colors">
                      <td className="py-3 px-4 text-sm text-ink-600">{formatDate(exp.date)}</td>
                      <td className="py-3 px-4 text-sm font-medium text-navy-900">{exp.property}</td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          "inline-flex text-xs font-medium px-2.5 py-1 rounded-full",
                          getCategoryColor(exp.category)
                        )}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-rose-600">₪{exp.amount.toLocaleString('he-IL')}</td>
                      <td className="py-3 px-4 text-sm text-ink-600 max-w-[200px] truncate">{exp.description || '—'}</td>
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
            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-brand-600" />
            </div>
            <h2 className="text-base font-semibold text-navy-900">פירוט לפי קטגוריה</h2>
          </div>
          <div className="space-y-4">
            {CATEGORIES.filter(c => categoryTotals[c.value] > 0).map((cat) => (
              <div key={cat.value}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-ink-600">{cat.label}</span>
                  <span className="text-ink-600">₪{categoryTotals[cat.value].toLocaleString('he-IL')}</span>
                </div>
                <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-[background-color,border-color,color,box-shadow,transform] duration-500", cat.barColor)}
                    style={{ width: `${(categoryTotals[cat.value] / maxCategoryAmount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {Object.values(categoryTotals).every(v => v === 0) && (
              <p className="text-sm text-ink-400 text-center py-4">אין הוצאות לפירוט</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>הוספת הוצאה חדשה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>נכס</Label>
              <Select value={form.property} onValueChange={v => setForm(f => ({ ...f, property: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="בחרו נכס" />
                </SelectTrigger>
                <SelectContent>
                  {propertyNames.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>קטגוריה</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="בחרו קטגוריה" />
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
              <div className="border-2 border-dashed border-line rounded-xl p-6 text-center hover:border-brand-100 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-ink-600">גררו קובץ לכאן או לחצו להעלאה</p>
                <p className="text-xs text-ink-400 mt-1">PDF, JPG, PNG, עד 5MB</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                ביטול
              </Button>
              <Button
                className="flex-1 bg-brand-600 hover:bg-brand-700"
                onClick={handleAddExpense}
                disabled={!form.property || !form.category || !form.amount}
              >
                שמירת ההוצאה
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
