import type { Income, MonthlyIncome, MonthlyIncomeDraft } from '@/types';
import { filterIncomesForMonth } from './incomeOccurrence';

// 指定月に入金される収入から MonthlyIncome の下書きを生成する。
// plannedAmount は収入マスタの想定額。actualAmount は STEP2 で確定するため 0 で初期化。
export function generateMonthlyIncomeDrafts(
  incomes: Income[],
  yearMonth: string,
): MonthlyIncomeDraft[] {
  return filterIncomesForMonth(incomes, yearMonth).map((income) => ({
    yearMonth,
    incomeId: income.id,
    plannedAmount: income.amount,
    actualAmount: 0,
    status: 'pending' as const,
  }));
}

// 二重生成防止: 既存の (yearMonth, incomeId) と突き合わせて新規分のみ返す。
export function dedupeIncomeDraftsAgainstExisting(
  drafts: MonthlyIncomeDraft[],
  existing: Pick<MonthlyIncome, 'yearMonth' | 'incomeId'>[],
): MonthlyIncomeDraft[] {
  const existingKeys = new Set(
    existing.map((m) => `${m.yearMonth}::${m.incomeId}`),
  );
  return drafts.filter(
    (d) => !existingKeys.has(`${d.yearMonth}::${d.incomeId}`),
  );
}
