import type { Expense } from '@/types';

// yearMonth の正規表現: YYYY-MM 形式のみ許可
const YEAR_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/u;

// quarterly の対象月
const QUARTERLY_MONTHS = new Set([1, 4, 7, 10]);

// yearly の対象月
const YEARLY_MONTH = 1;

function parseYearMonth(yearMonth: string): number {
  if (!YEAR_MONTH_PATTERN.test(yearMonth)) {
    throw new Error(`Invalid yearMonth format: "${yearMonth}". Expected YYYY-MM.`);
  }
  return parseInt(yearMonth.slice(5, 7), 10);
}

export function isExpenseInMonth(expense: Expense, yearMonth: string): boolean {
  const month = parseYearMonth(yearMonth);

  switch (expense.frequency) {
    case 'monthly':
      return true;
    case 'bimonthly':
      return month % 2 === 0;
    case 'quarterly':
      return QUARTERLY_MONTHS.has(month);
    case 'yearly':
      return month === YEARLY_MONTH;
  }
}

export function filterExpensesForMonth(expenses: Expense[], yearMonth: string): Expense[] {
  // yearMonth の検証を先に行う（空配列でもエラーを throw させる）
  if (!YEAR_MONTH_PATTERN.test(yearMonth)) {
    throw new Error(`Invalid yearMonth format: "${yearMonth}". Expected YYYY-MM.`);
  }
  return expenses.filter((expense) => isExpenseInMonth(expense, yearMonth));
}
