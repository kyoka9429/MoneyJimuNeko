import type { Expense, MonthlyTask } from '@/types';

export type AccountSummary = {
  accountId: string;
  required: number;
  secured: number;
  shortfall: number;
  surplus: number;
  progress: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function summarizeAccount(
  accountId: string,
  expensesInMonth: Expense[],
  tasksInMonth: MonthlyTask[],
): AccountSummary {
  const required = expensesInMonth
    .filter((e) => e.accountId === accountId)
    .reduce((sum, e) => sum + e.amount, 0);

  const secured = tasksInMonth
    .filter((t) => t.accountId === accountId && t.status === 'done')
    .reduce((sum, t) => sum + t.actualAmount, 0);

  const shortfall = Math.max(required - secured, 0);
  const surplus = Math.max(secured - required, 0);

  // required = 0 は「支出なし = 達成済み」とみなして 1
  const progress = required === 0 ? 1 : clamp(secured / required, 0, 1);

  return { accountId, required, secured, shortfall, surplus, progress };
}
