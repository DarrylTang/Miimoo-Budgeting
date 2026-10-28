import type { MonthlyBudget, Transaction } from '@/types';

export const EMPTY_BUDGET: MonthlyBudget = { amounts: {}, updatedAt: 0 };

/** Budget in effect for `month` ('YYYY-MM'): the latest amount set at or before it. 0 = none. */
export function budgetForMonth(budget: MonthlyBudget, month: string): number {
  const from = Object.keys(budget.amounts).filter((m) => m <= month).sort().pop();
  return from ? budget.amounts[from] : 0;
}

/** Set the budget from `month` onwards; earlier months keep their amount, later overrides are dropped. */
export function setBudgetFrom(budget: MonthlyBudget, month: string, amount: number): MonthlyBudget {
  const amounts = Object.fromEntries(Object.entries(budget.amounts).filter(([m]) => m < month));
  amounts[month] = amount;
  return { amounts, updatedAt: Date.now() };
}

/** Expenses in `month` counted against the budget (all accounts, minus excluded entries). */
export function budgetSpent(transactions: Transaction[], month: string): number {
  return transactions
    .filter((t) => t.type === 'expense' && !t.excludeFromBudget && t.date.startsWith(month))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
}
