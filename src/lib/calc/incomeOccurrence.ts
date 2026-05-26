import type { Income } from '@/types';

// yearMonth の正規表現: YYYY-MM 形式のみ許可（expenseOccurrence と同じ規約）
const YEAR_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/u;

function parseMonth(yearMonth: string): number {
  if (!YEAR_MONTH_PATTERN.test(yearMonth)) {
    throw new Error(`Invalid yearMonth format: "${yearMonth}". Expected YYYY-MM.`);
  }
  return parseInt(yearMonth.slice(5, 7), 10);
}

// その収入が指定月に入金されるか。
// - monthly  : 毎月入金
// - bimonthly: 偶数月のみ（公的年金を想定。支出側の bimonthly と同じ規約）
export function isIncomeInMonth(income: Income, yearMonth: string): boolean {
  const month = parseMonth(yearMonth);

  switch (income.frequency) {
    case 'monthly':
      return true;
    case 'bimonthly':
      return month % 2 === 0;
  }
}

export function filterIncomesForMonth(incomes: Income[], yearMonth: string): Income[] {
  // yearMonth の検証を先に行う（空配列でもエラーを throw させる）
  if (!YEAR_MONTH_PATTERN.test(yearMonth)) {
    throw new Error(`Invalid yearMonth format: "${yearMonth}". Expected YYYY-MM.`);
  }
  return incomes.filter((income) => isIncomeInMonth(income, yearMonth));
}
