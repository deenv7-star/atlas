/** Real expenses (Expense entity → public.expenses, migration 009) for the expense tracker and monthly report. */
import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { STAY_KEYS } from '@/hooks/useStayData';
import { STALE_REFERENCE_MS } from '@/lib/queryStaleTimes';
import { DB_FEATURES } from '@/config/dbFeatures';

export function useExpenses({ orgId } = {}) {
  const qc = useQueryClient();
  const expensesQ = useQuery({
    queryKey: STAY_KEYS.expenses,
    queryFn: () => base44.entities.Expense.filter({}, '-expense_date', 3000).catch(() => []),
    staleTime: STALE_REFERENCE_MS,
    enabled: DB_FEATURES.expenses,
  });
  const propertiesQ = useQuery({
    queryKey: STAY_KEYS.properties,
    queryFn: () => base44.entities.Property.list({}, { limit: 500 }),
    staleTime: STALE_REFERENCE_MS,
  });
  const properties = propertiesQ.data || [];
  const nameById = useMemo(() => new Map(properties.map((p) => [p.id, p.name])), [properties]);

  /** Legacy row shape used by the ExpenseTracker screen. */
  const expenses = useMemo(() => (expensesQ.data || []).map((x) => ({
    id: x.id,
    date: String(x.expense_date || x.date || '').slice(0, 10),
    property: nameById.get(x.property_id) || x.property_name || x.property || '',
    category: x.category || 'אחר',
    amount: Number(x.amount) || 0,
    description: x.description || '',
  })), [expensesQ.data, nameById]);

  const create = useMutation({
    mutationFn: ({ date, propertyName, category, amount, description }) => {
      const prop = properties.find((p) => p.name === propertyName);
      return base44.entities.Expense.create({
        ...(orgId ? { org_id: orgId } : {}),
        property_id: prop?.id || null,
        category,
        amount,
        description,
        expense_date: date,
        created_at: new Date().toISOString(),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: STAY_KEYS.expenses }),
  });

  return {
    expenses,
    propertyNames: properties.map((p) => p.name),
    addExpense: create.mutateAsync,
    isLoading: DB_FEATURES.expenses && expensesQ.isLoading,
    available: DB_FEATURES.expenses,
  };
}
