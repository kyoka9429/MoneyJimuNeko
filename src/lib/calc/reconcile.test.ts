import { describe, expect, it } from 'vitest';
import type { MonthlyIncome, MonthlyTask } from '@/types';
import {
  calcReconciledRemaining,
  effectiveAmount,
  summarizeAccountFromTasks,
} from './reconcile';

const task = (over: Partial<MonthlyTask> = {}): MonthlyTask => ({
  id: 't1',
  yearMonth: '2026-06',
  expenseId: 'e1',
  accountId: 'acc-1',
  plannedAmount: 8000,
  actualAmount: 0,
  status: 'pending',
  ...over,
});

const monthlyIncome = (over: Partial<MonthlyIncome> = {}): MonthlyIncome => ({
  id: 'mi1',
  yearMonth: '2026-06',
  incomeId: 'i1',
  plannedAmount: 300000,
  actualAmount: 0,
  status: 'pending',
  ...over,
});

describe('effectiveAmount', () => {
  it('未確保(pending)なら予定額を返す', () => {
    expect(effectiveAmount(task({ plannedAmount: 8000, actualAmount: 0 }))).toBe(
      8000,
    );
  });
  it('確保済(done)なら実際額を返す', () => {
    expect(
      effectiveAmount(
        task({ status: 'done', plannedAmount: 8000, actualAmount: 7800 }),
      ),
    ).toBe(7800);
  });
});

describe('calcReconciledRemaining', () => {
  it('全て未確保なら予定ベースで集計（差額補完前）', () => {
    const incomes = [monthlyIncome({ plannedAmount: 300000 })];
    const tasks = [
      task({ id: 't1', plannedAmount: 80000 }),
      task({ id: 't2', plannedAmount: 80000 }),
    ];
    const r = calcReconciledRemaining(incomes, tasks);
    expect(r.income).toBe(300000);
    expect(r.expense).toBe(160000);
    expect(r.remaining).toBe(140000);
    expect(r.status).toBe('comfortable');
  });

  it('確保済みの項目は実際額で集計（差額が余りに反映）', () => {
    const incomes = [
      monthlyIncome({ status: 'done', plannedAmount: 300000, actualAmount: 305000 }),
    ];
    const tasks = [
      task({ id: 't1', status: 'done', plannedAmount: 80000, actualAmount: 78000 }),
      task({ id: 't2', plannedAmount: 80000 }), // 未確保 → 予定額
    ];
    const r = calcReconciledRemaining(incomes, tasks);
    expect(r.income).toBe(305000); // 実際
    expect(r.expense).toBe(78000 + 80000); // 実際 + 予定
    expect(r.remaining).toBe(305000 - 158000);
  });
});

describe('summarizeAccountFromTasks', () => {
  it('required=予定合計 / secured=確保済みの実際合計', () => {
    const tasks = [
      task({ id: 't1', accountId: 'acc-1', plannedAmount: 80000, status: 'done', actualAmount: 78000 }),
      task({ id: 't2', accountId: 'acc-1', plannedAmount: 20000 }), // 未確保
      task({ id: 't3', accountId: 'acc-2', plannedAmount: 50000 }), // 別口座
    ];
    const s = summarizeAccountFromTasks('acc-1', tasks);
    expect(s.required).toBe(100000); // 8万 + 2万
    expect(s.secured).toBe(78000); // 確保済みの実際額のみ
    expect(s.shortfall).toBe(22000);
    expect(s.progress).toBeCloseTo(0.78, 2);
  });

  it('タスクが無い口座は required=0, progress=1', () => {
    const s = summarizeAccountFromTasks('acc-x', []);
    expect(s.required).toBe(0);
    expect(s.progress).toBe(1);
  });
});
