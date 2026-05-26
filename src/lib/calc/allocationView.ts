import type { Expense, Income } from '@/types';
import { addMonths, isEvenMonth } from '@/lib/format/yearMonth';
import { filterExpensesForMonth } from './expenseOccurrence';
import { filterIncomesForMonth } from './incomeOccurrence';
import { calcRemainingStatus, type RemainingStatus } from './monthlyRemaining';

// 隔月（公的年金）収入に対応した「振り分け期間」ビュー。
//
// 隔月収入がある世帯では、偶数月に入金される収入で「当月＋翌月（奇数月）」の
// 2 ヶ月分の支出をまかなう必要がある。そのため余り計算と振り分けは
// 2 ヶ月を 1 期間として扱う:
//   - 偶数月 (incomeMonth): 入金月。当月＋翌月の支出をまとめて振り分ける。
//   - 奇数月: 入金なし。支出は前の偶数月に確保済み（= isIncomeMonth: false）。
//
// 隔月収入が無い（毎月収入のみの）世帯では従来どおり当月単独を 1 期間とする。
// 振り分け期間（収入の集計をともなわない、月の構成だけ）。
export type AllocationPeriod = {
  // この世帯に隔月収入が存在するか
  isBimonthly: boolean;
  // 集計対象の月。隔月: [偶数月, 翌奇数月] / 毎月: [当月]
  periodMonths: string[];
  // 入金（＝振り分け作業）が発生する月
  incomeMonth: string;
  // 表示中の月が入金月か（隔月の偶数月 = true、奇数月 = false、毎月は常に true）
  isIncomeMonth: boolean;
};

export type AllocationView = AllocationPeriod & {
  // 期間の収入合計（期間中に入金される収入の合算）
  income: number;
  // 期間の支出合計
  expense: number;
  // 余り（income - expense）
  remaining: number;
  status: RemainingStatus;
};

// 表示中の月から振り分け期間を決定する。
// 偶数月ならその月が入金月。奇数月なら直前の偶数月を入金月とし、同じ 2 ヶ月期間を参照する。
export function getAllocationPeriod(
  yearMonth: string,
  hasBimonthly: boolean,
): AllocationPeriod {
  const incomeMonth =
    !hasBimonthly || isEvenMonth(yearMonth)
      ? yearMonth
      : addMonths(yearMonth, -1);

  const periodMonths = hasBimonthly
    ? [incomeMonth, addMonths(incomeMonth, 1)]
    : [yearMonth];

  return {
    isBimonthly: hasBimonthly,
    periodMonths,
    incomeMonth,
    isIncomeMonth: !hasBimonthly || isEvenMonth(yearMonth),
  };
}

// 収入リストに隔月収入が含まれるか。
export function hasBimonthlyIncome(incomes: Income[]): boolean {
  return incomes.some((i) => i.frequency === 'bimonthly');
}

function sumIncomeOverMonths(incomes: Income[], months: string[]): number {
  return months.reduce(
    (total, month) =>
      total +
      filterIncomesForMonth(incomes, month).reduce((s, i) => s + i.amount, 0),
    0,
  );
}

function sumExpenseOverMonths(expenses: Expense[], months: string[]): number {
  return months.reduce(
    (total, month) =>
      total +
      filterExpensesForMonth(expenses, month).reduce((s, e) => s + e.amount, 0),
    0,
  );
}

export function calcAllocationView(
  yearMonth: string,
  incomes: Income[],
  expenses: Expense[],
): AllocationView {
  const period = getAllocationPeriod(yearMonth, hasBimonthlyIncome(incomes));

  const income = sumIncomeOverMonths(incomes, period.periodMonths);
  const expense = sumExpenseOverMonths(expenses, period.periodMonths);
  const remaining = income - expense;

  return {
    ...period,
    income,
    expense,
    remaining,
    status: calcRemainingStatus(remaining),
  };
}
