import { describe, expect, it } from 'vitest';
import type { Expense, MonthlyTask } from '@/types';
import { summarizeAccount } from './accountSummary';

const makeExpense = (overrides: Partial<Expense> & Pick<Expense, 'id' | 'accountId' | 'amount'>): Expense => ({
  name: 'テスト費用',
  category: 'other',
  frequency: 'monthly',
  ...overrides,
});

const makeTask = (overrides: Partial<MonthlyTask> & Pick<MonthlyTask, 'id' | 'accountId' | 'actualAmount' | 'status'>): MonthlyTask => ({
  yearMonth: '2026-05',
  expenseId: 'expense-1',
  plannedAmount: 10000,
  ...overrides,
});

describe('summarizeAccount', () => {
  it('通常ケース: secured < required のとき shortfall が正、surplus が 0、progress < 1', () => {
    const expenses: Expense[] = [
      makeExpense({ id: 'e1', accountId: 'acc-1', amount: 50000 }),
    ];
    const tasks: MonthlyTask[] = [
      makeTask({ id: 't1', accountId: 'acc-1', actualAmount: 30000, status: 'done' }),
    ];

    const result = summarizeAccount('acc-1', expenses, tasks);

    expect(result.accountId).toBe('acc-1');
    expect(result.required).toBe(50000);
    expect(result.secured).toBe(30000);
    expect(result.shortfall).toBe(20000);
    expect(result.surplus).toBe(0);
    expect(result.progress).toBeCloseTo(0.6);
  });

  it('余剰ケース: secured > required のとき shortfall が 0、surplus が正、progress が 1 にクランプ', () => {
    const expenses: Expense[] = [
      makeExpense({ id: 'e1', accountId: 'acc-1', amount: 20000 }),
    ];
    const tasks: MonthlyTask[] = [
      makeTask({ id: 't1', accountId: 'acc-1', actualAmount: 30000, status: 'done' }),
    ];

    const result = summarizeAccount('acc-1', expenses, tasks);

    expect(result.shortfall).toBe(0);
    expect(result.surplus).toBe(10000);
    expect(result.progress).toBe(1);
  });

  it('required = 0 のとき progress = 1（達成扱い）', () => {
    const result = summarizeAccount('acc-1', [], []);

    expect(result.required).toBe(0);
    expect(result.secured).toBe(0);
    expect(result.progress).toBe(1);
  });

  it('secured = 0 かつ required > 0 のとき progress = 0（下限クランプ）', () => {
    const expenses: Expense[] = [
      makeExpense({ id: 'e1', accountId: 'acc-1', amount: 50000 }),
    ];

    const result = summarizeAccount('acc-1', expenses, []);

    expect(result.required).toBe(50000);
    expect(result.secured).toBe(0);
    expect(result.shortfall).toBe(50000);
    expect(result.surplus).toBe(0);
    expect(result.progress).toBe(0);
  });

  it('他口座の Expense は集計に含まれない', () => {
    const expenses: Expense[] = [
      makeExpense({ id: 'e1', accountId: 'acc-1', amount: 30000 }),
      makeExpense({ id: 'e2', accountId: 'acc-OTHER', amount: 99999 }),
    ];
    const tasks: MonthlyTask[] = [];

    const result = summarizeAccount('acc-1', expenses, tasks);

    expect(result.required).toBe(30000);
  });

  it('他口座の MonthlyTask は secured に含まれない', () => {
    const expenses: Expense[] = [
      makeExpense({ id: 'e1', accountId: 'acc-1', amount: 30000 }),
    ];
    const tasks: MonthlyTask[] = [
      makeTask({ id: 't1', accountId: 'acc-OTHER', actualAmount: 99999, status: 'done' }),
    ];

    const result = summarizeAccount('acc-1', expenses, tasks);

    expect(result.secured).toBe(0);
  });

  it("status='pending' の Task は secured に含まれない", () => {
    const expenses: Expense[] = [
      makeExpense({ id: 'e1', accountId: 'acc-1', amount: 30000 }),
    ];
    const tasks: MonthlyTask[] = [
      makeTask({ id: 't1', accountId: 'acc-1', actualAmount: 30000, status: 'pending' }),
    ];

    const result = summarizeAccount('acc-1', expenses, tasks);

    expect(result.secured).toBe(0);
    expect(result.shortfall).toBe(30000);
  });

  it('複数 Expense と複数 done Task を正しく集計する', () => {
    const expenses: Expense[] = [
      makeExpense({ id: 'e1', accountId: 'acc-1', amount: 20000 }),
      makeExpense({ id: 'e2', accountId: 'acc-1', amount: 15000 }),
    ];
    const tasks: MonthlyTask[] = [
      makeTask({ id: 't1', accountId: 'acc-1', actualAmount: 10000, status: 'done' }),
      makeTask({ id: 't2', accountId: 'acc-1', actualAmount: 5000, status: 'done' }),
      makeTask({ id: 't3', accountId: 'acc-1', actualAmount: 3000, status: 'pending' }),
    ];

    const result = summarizeAccount('acc-1', expenses, tasks);

    expect(result.required).toBe(35000);
    expect(result.secured).toBe(15000);
    expect(result.shortfall).toBe(20000);
    expect(result.surplus).toBe(0);
  });
});
