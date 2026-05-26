import { describe, expect, it } from 'vitest';
import type { Expense, Income } from '@/types';
import { calcAllocationView } from './allocationView';

const income = (
  frequency: Income['frequency'],
  amount: number,
  id = 'i1',
): Income => ({
  id,
  name: '年金',
  amount,
  payDay: 15,
  source: '年金',
  frequency,
});

const expense = (
  amount: number,
  frequency: Expense['frequency'] = 'monthly',
  id = 'e1',
): Expense => ({
  id,
  name: '費用',
  amount,
  accountId: 'acc-1',
  category: 'other',
  frequency,
});

describe('calcAllocationView', () => {
  describe('隔月収入がある世帯（偶数月＝入金・振り分け月）', () => {
    const incomes = [income('bimonthly', 300000)];
    const expenses = [expense(80000, 'monthly')]; // 毎月 8 万

    it('偶数月は当月＋翌月の 2 ヶ月分を 1 期間として集計する', () => {
      const view = calcAllocationView('2026-06', incomes, expenses);
      expect(view.isBimonthly).toBe(true);
      expect(view.isIncomeMonth).toBe(true);
      expect(view.incomeMonth).toBe('2026-06');
      expect(view.periodMonths).toEqual(['2026-06', '2026-07']);
      expect(view.income).toBe(300000); // 偶数月の年金 1 回分
      expect(view.expense).toBe(160000); // 8 万 × 2 ヶ月
      expect(view.remaining).toBe(140000);
      expect(view.status).toBe('comfortable');
    });

    it('奇数月は直前の偶数月を入金月とし、同じ期間を参照する（先月確保済み）', () => {
      const view = calcAllocationView('2026-07', incomes, expenses);
      expect(view.isIncomeMonth).toBe(false);
      expect(view.incomeMonth).toBe('2026-06');
      expect(view.periodMonths).toEqual(['2026-06', '2026-07']);
      expect(view.income).toBe(300000);
      expect(view.expense).toBe(160000);
      expect(view.remaining).toBe(140000);
    });

    it('年跨ぎ: 1 月（奇数月）は前年 12 月を入金月とする', () => {
      const view = calcAllocationView('2026-01', incomes, expenses);
      expect(view.incomeMonth).toBe('2025-12');
      expect(view.periodMonths).toEqual(['2025-12', '2026-01']);
    });

    it('隔月支出は偶数月のみ加算される', () => {
      const view = calcAllocationView('2026-06', incomes, [
        expense(80000, 'monthly'),
        expense(20000, 'bimonthly', 'e2'), // 偶数月のみ
      ]);
      // 6 月: monthly 8万 + bimonthly 2万 / 7 月: monthly 8万のみ
      expect(view.expense).toBe(80000 + 20000 + 80000);
    });
  });

  describe('毎月収入のみの世帯（当月単独を 1 期間）', () => {
    const incomes = [income('monthly', 250000)];
    const expenses = [expense(80000, 'monthly')];

    it('当月単独で集計する', () => {
      const view = calcAllocationView('2026-05', incomes, expenses);
      expect(view.isBimonthly).toBe(false);
      expect(view.isIncomeMonth).toBe(true);
      expect(view.periodMonths).toEqual(['2026-05']);
      expect(view.income).toBe(250000);
      expect(view.expense).toBe(80000);
      expect(view.remaining).toBe(170000);
    });
  });

  describe('ステータス判定', () => {
    it('余りがマイナスなら over（危険）', () => {
      const view = calcAllocationView(
        '2026-06',
        [income('bimonthly', 100000)],
        [expense(80000, 'monthly')], // 2 ヶ月で 16 万 > 10 万
      );
      expect(view.remaining).toBe(-60000);
      expect(view.status).toBe('over');
    });

    it('余り 0〜5万 は tight（注意）', () => {
      const view = calcAllocationView(
        '2026-06',
        [income('bimonthly', 180000)],
        [expense(80000, 'monthly')], // 2 ヶ月で 16 万 → 余り 2 万
      );
      expect(view.remaining).toBe(20000);
      expect(view.status).toBe('tight');
    });
  });
});
