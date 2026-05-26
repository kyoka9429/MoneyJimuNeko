import { describe, expect, it } from 'vitest';
import type { Expense, MonthlyTask, MonthlyTaskDraft } from '@/types';
import {
  dedupeDraftsAgainstExisting,
  generateMonthlyTaskDrafts,
} from './rollover';

const makeExpense = (id: string, overrides: Partial<Expense> = {}): Expense => ({
  name: `費用-${id}`,
  amount: 10000,
  accountId: 'acc-1',
  category: 'other',
  frequency: 'monthly',
  ...overrides,
  id,
});

describe('generateMonthlyTaskDrafts', () => {
  it('該当月の Expense からのみ draft が生成される', () => {
    const expenses: Expense[] = [
      makeExpense('e1', { frequency: 'monthly' }),
      makeExpense('e2', { frequency: 'yearly' }),  // 1 月以外は発生しない
    ];

    const drafts = generateMonthlyTaskDrafts(expenses, '2026-05');

    // 2026-05 は monthly のみ
    expect(drafts).toHaveLength(1);
    expect(drafts[0].expenseId).toBe('e1');
  });

  it('各 draft の status は pending', () => {
    const expenses = [makeExpense('e1')];
    const drafts = generateMonthlyTaskDrafts(expenses, '2026-05');

    expect(drafts[0].status).toBe('pending');
  });

  it('各 draft の actualAmount は 0', () => {
    const expenses = [makeExpense('e1', { amount: 50000 })];
    const drafts = generateMonthlyTaskDrafts(expenses, '2026-05');

    expect(drafts[0].actualAmount).toBe(0);
  });

  it('各 draft の plannedAmount は expense.amount と一致する', () => {
    const expenses = [makeExpense('e1', { amount: 33000 })];
    const drafts = generateMonthlyTaskDrafts(expenses, '2026-05');

    expect(drafts[0].plannedAmount).toBe(33000);
  });

  it('各 draft の completedAt は undefined', () => {
    const expenses = [makeExpense('e1')];
    const drafts = generateMonthlyTaskDrafts(expenses, '2026-05');

    expect(drafts[0].completedAt).toBeUndefined();
  });

  it('各 draft の yearMonth は引数の yearMonth と一致する', () => {
    const expenses = [makeExpense('e1')];
    const drafts = generateMonthlyTaskDrafts(expenses, '2026-05');

    expect(drafts[0].yearMonth).toBe('2026-05');
  });

  it('各 draft の accountId は expense.accountId と一致する', () => {
    const expenses = [makeExpense('e1', { accountId: 'acc-special' })];
    const drafts = generateMonthlyTaskDrafts(expenses, '2026-05');

    expect(drafts[0].accountId).toBe('acc-special');
  });

  it('入力の Expense の順序を保持する', () => {
    const expenses: Expense[] = [
      makeExpense('e3', { frequency: 'monthly' }),
      makeExpense('e1', { frequency: 'monthly' }),
      makeExpense('e2', { frequency: 'monthly' }),
    ];

    const drafts = generateMonthlyTaskDrafts(expenses, '2026-05');

    expect(drafts.map((d) => d.expenseId)).toEqual(['e3', 'e1', 'e2']);
  });

  it('expenses が空のとき空配列を返す', () => {
    expect(generateMonthlyTaskDrafts([], '2026-05')).toEqual([]);
  });

  it('quarterly の Expense は 4 月に draft を生成する', () => {
    const expenses = [makeExpense('e1', { frequency: 'quarterly' })];
    const drafts = generateMonthlyTaskDrafts(expenses, '2026-04');

    expect(drafts).toHaveLength(1);
    expect(drafts[0].expenseId).toBe('e1');
  });

  it('quarterly の Expense は 5 月に draft を生成しない', () => {
    const expenses = [makeExpense('e1', { frequency: 'quarterly' })];
    const drafts = generateMonthlyTaskDrafts(expenses, '2026-05');

    expect(drafts).toHaveLength(0);
  });

  it('不正な yearMonth では Error を throw する', () => {
    const expenses = [makeExpense('e1')];
    expect(() => generateMonthlyTaskDrafts(expenses, '2026-13')).toThrow();
    expect(() => generateMonthlyTaskDrafts(expenses, '2026-1')).toThrow();
    expect(() => generateMonthlyTaskDrafts(expenses, 'abc')).toThrow();
    expect(() => generateMonthlyTaskDrafts(expenses, '')).toThrow();
  });
});

describe('dedupeDraftsAgainstExisting', () => {
  const draft = (
    yearMonth: string,
    expenseId: string,
  ): MonthlyTaskDraft => ({
    yearMonth,
    expenseId,
    accountId: 'acc-1',
    plannedAmount: 10000,
    actualAmount: 0,
    status: 'pending',
  });

  const existingTask = (
    yearMonth: string,
    expenseId: string,
  ): Pick<MonthlyTask, 'yearMonth' | 'expenseId'> => ({
    yearMonth,
    expenseId,
  });

  it('既存タスクと同じ (yearMonth, expenseId) の draft は除外される', () => {
    const drafts = [draft('2026-05', 'e1'), draft('2026-05', 'e2')];
    const existing = [existingTask('2026-05', 'e1')];

    expect(dedupeDraftsAgainstExisting(drafts, existing)).toEqual([
      draft('2026-05', 'e2'),
    ]);
  });

  it('yearMonth が異なれば同じ expenseId でも残す', () => {
    const drafts = [draft('2026-06', 'e1')];
    const existing = [existingTask('2026-05', 'e1')];

    expect(dedupeDraftsAgainstExisting(drafts, existing)).toEqual(drafts);
  });

  it('既存が空のとき drafts をそのまま返す', () => {
    const drafts = [draft('2026-05', 'e1'), draft('2026-05', 'e2')];

    expect(dedupeDraftsAgainstExisting(drafts, [])).toEqual(drafts);
  });

  it('drafts が空のとき空配列を返す', () => {
    const existing = [existingTask('2026-05', 'e1')];

    expect(dedupeDraftsAgainstExisting([], existing)).toEqual([]);
  });

  it('入力 drafts の順序を保持する', () => {
    const drafts = [
      draft('2026-05', 'e3'),
      draft('2026-05', 'e1'),
      draft('2026-05', 'e2'),
    ];
    const existing = [existingTask('2026-05', 'e1')];

    expect(
      dedupeDraftsAgainstExisting(drafts, existing).map((d) => d.expenseId),
    ).toEqual(['e3', 'e2']);
  });
});
