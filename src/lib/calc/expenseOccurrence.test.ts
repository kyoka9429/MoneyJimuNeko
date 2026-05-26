import { describe, expect, it } from 'vitest';
import type { Expense } from '@/types';
import { filterExpensesForMonth, isExpenseInMonth } from './expenseOccurrence';

const makeExpense = (frequency: Expense['frequency']): Expense => ({
  id: 'e1',
  name: 'テスト費用',
  amount: 10000,
  accountId: 'acc-1',
  category: 'other',
  frequency,
});

describe('isExpenseInMonth', () => {
  describe('monthly: 毎月発生', () => {
    it('1 月に発生する', () => {
      expect(isExpenseInMonth(makeExpense('monthly'), '2026-01')).toBe(true);
    });
    it('6 月に発生する', () => {
      expect(isExpenseInMonth(makeExpense('monthly'), '2026-06')).toBe(true);
    });
    it('12 月に発生する', () => {
      expect(isExpenseInMonth(makeExpense('monthly'), '2026-12')).toBe(true);
    });
  });

  describe('bimonthly: 偶数月のみ発生', () => {
    it('2 月に発生する', () => {
      expect(isExpenseInMonth(makeExpense('bimonthly'), '2026-02')).toBe(true);
    });
    it('4 月に発生する', () => {
      expect(isExpenseInMonth(makeExpense('bimonthly'), '2026-04')).toBe(true);
    });
    it('3 月（奇数月）には発生しない', () => {
      expect(isExpenseInMonth(makeExpense('bimonthly'), '2026-03')).toBe(false);
    });
    it('1 月（奇数月）には発生しない', () => {
      expect(isExpenseInMonth(makeExpense('bimonthly'), '2026-01')).toBe(false);
    });
    it('12 月（偶数月）に発生する', () => {
      expect(isExpenseInMonth(makeExpense('bimonthly'), '2026-12')).toBe(true);
    });
  });

  describe('quarterly: 1, 4, 7, 10 月のみ発生', () => {
    it('1 月に発生する', () => {
      expect(isExpenseInMonth(makeExpense('quarterly'), '2026-01')).toBe(true);
    });
    it('4 月に発生する', () => {
      expect(isExpenseInMonth(makeExpense('quarterly'), '2026-04')).toBe(true);
    });
    it('7 月に発生する', () => {
      expect(isExpenseInMonth(makeExpense('quarterly'), '2026-07')).toBe(true);
    });
    it('10 月に発生する', () => {
      expect(isExpenseInMonth(makeExpense('quarterly'), '2026-10')).toBe(true);
    });
    it('2 月には発生しない', () => {
      expect(isExpenseInMonth(makeExpense('quarterly'), '2026-02')).toBe(false);
    });
    it('5 月には発生しない', () => {
      expect(isExpenseInMonth(makeExpense('quarterly'), '2026-05')).toBe(false);
    });
  });

  describe('yearly: 1 月のみ発生', () => {
    it('1 月に発生する', () => {
      expect(isExpenseInMonth(makeExpense('yearly'), '2026-01')).toBe(true);
    });
    it('2 月には発生しない', () => {
      expect(isExpenseInMonth(makeExpense('yearly'), '2026-02')).toBe(false);
    });
    it('12 月には発生しない', () => {
      expect(isExpenseInMonth(makeExpense('yearly'), '2026-12')).toBe(false);
    });
  });

  describe('不正な yearMonth で Error を throw する', () => {
    it("月が 13 の場合 ('2026-13')", () => {
      expect(() => isExpenseInMonth(makeExpense('monthly'), '2026-13')).toThrow();
    });
    it("月が 1 桁の場合 ('2026-1')", () => {
      expect(() => isExpenseInMonth(makeExpense('monthly'), '2026-1')).toThrow();
    });
    it("任意の文字列 ('abc')", () => {
      expect(() => isExpenseInMonth(makeExpense('monthly'), 'abc')).toThrow();
    });
    it("空文字 ('')", () => {
      expect(() => isExpenseInMonth(makeExpense('monthly'), '')).toThrow();
    });
  });
});

describe('filterExpensesForMonth', () => {
  it('該当月の Expense のみ返す', () => {
    const expenses: Expense[] = [
      makeExpense('monthly'),
      { ...makeExpense('yearly'), id: 'e2' },
    ];

    // 2026-06 は monthly のみ発生（yearly は 1 月のみ）
    const result = filterExpensesForMonth(expenses, '2026-06');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('e1');
  });

  it('空配列を渡すと空配列が返る', () => {
    expect(filterExpensesForMonth([], '2026-05')).toEqual([]);
  });

  it('不正な yearMonth で Error を throw する', () => {
    expect(() => filterExpensesForMonth([makeExpense('monthly')], 'invalid')).toThrow();
  });
});
