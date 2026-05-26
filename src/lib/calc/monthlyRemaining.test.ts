import { describe, expect, it } from 'vitest';
import type { Expense, Income } from '@/types';
import { calcMonthlyRemaining } from './monthlyRemaining';

const makeIncome = (id: string, amount: number): Income => ({
  id,
  name: 'テスト収入',
  amount,
  payDay: 25,
  source: 'salary',
});

const makeExpense = (id: string, amount: number): Expense => ({
  id,
  name: 'テスト支出',
  amount,
  accountId: 'acc-1',
  category: 'other',
  frequency: 'monthly',
});

describe('calcMonthlyRemaining', () => {
  it('remaining > 50000 のとき status = comfortable', () => {
    const incomes = [makeIncome('i1', 200000)];
    const expenses = [makeExpense('e1', 149999)];

    const result = calcMonthlyRemaining(incomes, expenses);

    expect(result.remaining).toBe(50001);
    expect(result.status).toBe('comfortable');
  });

  it('境界値: remaining = 50001 のとき comfortable', () => {
    const incomes = [makeIncome('i1', 50001)];
    const expenses: Expense[] = [];

    const result = calcMonthlyRemaining(incomes, expenses);

    expect(result.remaining).toBe(50001);
    expect(result.status).toBe('comfortable');
  });

  it('境界値: remaining = 50000 のとき tight', () => {
    const incomes = [makeIncome('i1', 50000)];
    const expenses: Expense[] = [];

    const result = calcMonthlyRemaining(incomes, expenses);

    expect(result.remaining).toBe(50000);
    expect(result.status).toBe('tight');
  });

  it('境界値: remaining = 0 のとき tight', () => {
    const incomes: Income[] = [];
    const expenses: Expense[] = [];

    const result = calcMonthlyRemaining(incomes, expenses);

    expect(result.remaining).toBe(0);
    expect(result.status).toBe('tight');
  });

  it('境界値: remaining = -1 のとき over', () => {
    const incomes: Income[] = [];
    const expenses = [makeExpense('e1', 1)];

    const result = calcMonthlyRemaining(incomes, expenses);

    expect(result.remaining).toBe(-1);
    expect(result.status).toBe('over');
  });

  it('空配列のとき remaining = 0、status = tight', () => {
    const result = calcMonthlyRemaining([], []);

    expect(result.income).toBe(0);
    expect(result.expense).toBe(0);
    expect(result.remaining).toBe(0);
    expect(result.status).toBe('tight');
  });

  it('複数の収入と支出を正しく集計する', () => {
    const incomes = [makeIncome('i1', 250000), makeIncome('i2', 30000)];
    const expenses = [makeExpense('e1', 80000), makeExpense('e2', 50000)];

    const result = calcMonthlyRemaining(incomes, expenses);

    expect(result.income).toBe(280000);
    expect(result.expense).toBe(130000);
    expect(result.remaining).toBe(150000);
    expect(result.status).toBe('comfortable');
  });
});
