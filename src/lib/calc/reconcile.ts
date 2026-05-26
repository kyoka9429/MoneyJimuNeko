import type { MonthlyIncome, MonthlyTask } from '@/types';
import type { AccountSummary } from './accountSummary';
import {
  calcRemainingStatus,
  type MonthlyRemaining,
} from './monthlyRemaining';

// 予定/実際を持つレコード（MonthlyTask / MonthlyIncome 共通の形）。
type Reconcilable = {
  status: 'pending' | 'done';
  plannedAmount: number;
  actualAmount: number;
};

// 「差額補完」の核: 確保済み(done)なら実際額、未確保なら予定額を採用する。
// 振り分けが進むにつれ余りが予定ベース → 実際ベースへ自動で更新される。
export function effectiveAmount(record: Reconcilable): number {
  return record.status === 'done' ? record.actualAmount : record.plannedAmount;
}

// 期間の収入レコード・支出タスクから、実績補完済みの余りを計算する。
export function calcReconciledRemaining(
  monthlyIncomes: MonthlyIncome[],
  monthlyTasks: MonthlyTask[],
): MonthlyRemaining {
  const income = monthlyIncomes.reduce((s, i) => s + effectiveAmount(i), 0);
  const expense = monthlyTasks.reduce((s, t) => s + effectiveAmount(t), 0);
  const remaining = income - expense;
  return { income, expense, remaining, status: calcRemainingStatus(remaining) };
}

// 口座サマリーを MonthlyTask ベースで算出する（期間タスクを渡す）。
// required = その口座の予定額合計 / secured = 確保済みの実際額合計。
// STEP1 で予定額を調整した場合もマスタではなくタスクの値を反映する。
export function summarizeAccountFromTasks(
  accountId: string,
  tasksInPeriod: MonthlyTask[],
): AccountSummary {
  const accountTasks = tasksInPeriod.filter((t) => t.accountId === accountId);

  const required = accountTasks.reduce((sum, t) => sum + t.plannedAmount, 0);
  const secured = accountTasks
    .filter((t) => t.status === 'done')
    .reduce((sum, t) => sum + t.actualAmount, 0);

  const shortfall = Math.max(required - secured, 0);
  const surplus = Math.max(secured - required, 0);
  const progress =
    required === 0 ? 1 : Math.min(Math.max(secured / required, 0), 1);

  return { accountId, required, secured, shortfall, surplus, progress };
}
