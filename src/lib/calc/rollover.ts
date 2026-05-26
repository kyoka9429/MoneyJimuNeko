import type { Expense, MonthlyTask, MonthlyTaskDraft } from '@/types';
import { filterExpensesForMonth } from './expenseOccurrence';

export function generateMonthlyTaskDrafts(
  expenses: Expense[],
  yearMonth: string,
): MonthlyTaskDraft[] {
  return filterExpensesForMonth(expenses, yearMonth).map((expense) => ({
    yearMonth,
    expenseId: expense.id,
    accountId: expense.accountId,
    plannedAmount: expense.amount,
    actualAmount: 0,
    status: 'pending' as const,
    // completedAt は省略（undefinedのままにする）
  }));
}

// ロールオーバーの二重実行で同じ (yearMonth, expenseId) の MonthlyTask が
// 重複生成されるのを防ぐ。既存タスクと突き合わせて新規分のみを返す。
export function dedupeDraftsAgainstExisting(
  drafts: MonthlyTaskDraft[],
  existing: Pick<MonthlyTask, 'yearMonth' | 'expenseId'>[],
): MonthlyTaskDraft[] {
  const existingKeys = new Set(
    existing.map((t) => `${t.yearMonth}::${t.expenseId}`),
  );
  return drafts.filter(
    (d) => !existingKeys.has(`${d.yearMonth}::${d.expenseId}`),
  );
}
