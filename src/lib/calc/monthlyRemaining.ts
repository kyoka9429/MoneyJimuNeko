import type { Expense, Income } from '@/types';

export type RemainingStatus = 'comfortable' | 'tight' | 'over';

export type MonthlyRemaining = {
  income: number;
  expense: number;
  remaining: number;
  status: RemainingStatus;
};

// PROJECTSPEC 5.1 の閾値定数。
// 余りバッファの「余裕」しきい値。隔月（2ヶ月）集計でも同じ閾値を用いる
// （= 全支出を引いた手残りが 5 万円超なら余裕、という意味は期間長に依らず成り立つ）。
export const COMFORTABLE_THRESHOLD = 50000;

// 余り額 → ステータス（余裕 / 注意 / 危険）。月次・2ヶ月集計で共有する。
export function calcRemainingStatus(remaining: number): RemainingStatus {
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
  const status = calcRemainingStatus(remaining);

  return { income, expense, remaining, status };
}
