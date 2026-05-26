import { describe, expect, it } from 'vitest';
import type { Income } from '@/types';
import { filterIncomesForMonth, isIncomeInMonth } from './incomeOccurrence';

const makeIncome = (frequency: Income['frequency']): Income => ({
  id: 'i1',
  name: 'テスト収入',
  amount: 200000,
  payDay: 15,
  source: '年金',
  frequency,
});

describe('isIncomeInMonth', () => {
  describe('monthly: 毎月入金', () => {
    it('1 月に入金される', () => {
      expect(isIncomeInMonth(makeIncome('monthly'), '2026-01')).toBe(true);
    });
    it('5 月に入金される', () => {
      expect(isIncomeInMonth(makeIncome('monthly'), '2026-05')).toBe(true);
    });
  });

  describe('bimonthly: 偶数月のみ入金（公的年金）', () => {
    it('2 月に入金される', () => {
      expect(isIncomeInMonth(makeIncome('bimonthly'), '2026-02')).toBe(true);
    });
    it('4 月に入金される', () => {
      expect(isIncomeInMonth(makeIncome('bimonthly'), '2026-04')).toBe(true);
    });
    it('12 月（偶数月）に入金される', () => {
      expect(isIncomeInMonth(makeIncome('bimonthly'), '2026-12')).toBe(true);
    });
    it('5 月（奇数月）には入金されない', () => {
      expect(isIncomeInMonth(makeIncome('bimonthly'), '2026-05')).toBe(false);
    });
    it('1 月（奇数月）には入金されない', () => {
      expect(isIncomeInMonth(makeIncome('bimonthly'), '2026-01')).toBe(false);
    });
  });

  describe('不正な yearMonth で Error を throw する', () => {
    it("月が 13 の場合 ('2026-13')", () => {
      expect(() => isIncomeInMonth(makeIncome('monthly'), '2026-13')).toThrow();
    });
    it("空文字 ('')", () => {
      expect(() => isIncomeInMonth(makeIncome('monthly'), '')).toThrow();
    });
  });
});

describe('filterIncomesForMonth', () => {
  it('奇数月は bimonthly を除外し monthly のみ返す', () => {
    const incomes: Income[] = [
      makeIncome('monthly'),
      { ...makeIncome('bimonthly'), id: 'i2' },
    ];

    const result = filterIncomesForMonth(incomes, '2026-05');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('i1');
  });

  it('偶数月は monthly と bimonthly の両方を返す', () => {
    const incomes: Income[] = [
      makeIncome('monthly'),
      { ...makeIncome('bimonthly'), id: 'i2' },
    ];

    const result = filterIncomesForMonth(incomes, '2026-06');

    expect(result).toHaveLength(2);
  });

  it('空配列を渡すと空配列が返る', () => {
    expect(filterIncomesForMonth([], '2026-05')).toEqual([]);
  });

  it('不正な yearMonth で Error を throw する', () => {
    expect(() => filterIncomesForMonth([makeIncome('monthly')], 'invalid')).toThrow();
  });
});
