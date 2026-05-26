import type { Expense, Income } from '@/types';

export type RemainingStatus = 'comfortable' | 'tight' | 'over';

export type MonthlyRemaining = {
  income: number;
  expense: number;
  remaining: number;
  status: RemainingStatus;
};

// PROJECTSPEC 5.1 の閾値定数
const COMFORTABLE_THRESHOLD = 50000;

function calcStatus(remaining: number): RemainingStatus {
  if (remaining > COMFORTABLE_THRESHOLD) return 'comfortable';
  if (remaining >= 0) return 'tight';
  return 'over';
}

export function calcMonthlyRemaining(
  incomesInMonth: Income[],
  expensesInMonth: Expense[],
): MonthlyRemaining {
  const income = incomesInMonth.reduce((sum, i) => sum + i.amount, 0);
  const expense = expensesInMonth.reduce((sum, e) => sum + e.amount, 0);
  const remaining = income - expense;
  const status = calcStatus(remaining);

  return { income, expense, remaining, status };
}
