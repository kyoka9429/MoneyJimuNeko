import { describe, expect, it } from 'vitest';
import type { Income, MonthlyIncome } from '@/types';
import {
  dedupeIncomeDraftsAgainstExisting,
  generateMonthlyIncomeDrafts,
} from './incomeRollover';

const income = (
  id: string,
  frequency: Income['frequency'],
  amount = 300000,
): Income => ({
  id,
  name: '年金',
  amount,
  payDay: 15,
  source: '年金',
  frequency,
});

describe('generateMonthlyIncomeDrafts', () => {
  it('偶数月は bimonthly 収入の下書きを生成する', () => {
    const drafts = generateMonthlyIncomeDrafts(
      [income('i1', 'bimonthly')],
      '2026-06',
    );
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({
      yearMonth: '2026-06',
      incomeId: 'i1',
      plannedAmount: 300000,
      actualAmount: 0,
      status: 'pending',
    });
  });

  it('奇数月は bimonthly 収入の下書きを生成しない', () => {
    const drafts = generateMonthlyIncomeDrafts(
      [income('i1', 'bimonthly')],
      '2026-05',
    );
    expect(drafts).toHaveLength(0);
  });

  it('monthly 収入はどの月でも生成する', () => {
    expect(
      generateMonthlyIncomeDrafts([income('i2', 'monthly')], '2026-05'),
    ).toHaveLength(1);
  });
});

describe('dedupeIncomeDraftsAgainstExisting', () => {
  it('既存の (yearMonth, incomeId) と重複する下書きを除外する', () => {
    const drafts = generateMonthlyIncomeDrafts(
      [income('i1', 'bimonthly'), income('i2', 'monthly')],
      '2026-06',
    );
    const existing: Pick<MonthlyIncome, 'yearMonth' | 'incomeId'>[] = [
      { yearMonth: '2026-06', incomeId: 'i1' },
    ];
    const result = dedupeIncomeDraftsAgainstExisting(drafts, existing);
    expect(result).toHaveLength(1);
    expect(result[0].incomeId).toBe('i2');
  });

  it('既存が空なら全て返す', () => {
    const drafts = generateMonthlyIncomeDrafts([income('i1', 'monthly')], '2026-06');
    expect(dedupeIncomeDraftsAgainstExisting(drafts, [])).toHaveLength(1);
  });
});
