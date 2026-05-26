import { describe, expect, it } from 'vitest';
import type {
  Account,
  Expense,
  Income,
  MonthlyTask,
  Settings,
} from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import {
  BACKUP_VERSION,
  buildBackupFilename,
  buildBackupPayload,
  parseBackup,
} from './';

const account: Account = {
  id: 'acc-1',
  name: 'みずほ',
  type: 'bank',
  color: '#7fb77e',
};

const expense: Expense = {
  id: 'exp-1',
  name: '電気代',
  amount: 8000,
  accountId: 'acc-1',
  category: 'utilities',
  frequency: 'monthly',
};

const income: Income = {
  id: 'inc-1',
  name: '月給',
  amount: 280000,
  payDay: 25,
  source: '給与',
  frequency: 'monthly',
};

const task: MonthlyTask = {
  id: 'task-1',
  yearMonth: '2026-05',
  expenseId: 'exp-1',
  accountId: 'acc-1',
  plannedAmount: 8000,
  actualAmount: 0,
  status: 'pending',
};

const settings: Settings = DEFAULT_SETTINGS;

describe('buildBackupPayload', () => {
  it('全エンティティを version + exportedAt 付きで包む', () => {
    const now = new Date('2026-05-26T10:00:00Z');
    const payload = buildBackupPayload({
      accounts: [account],
      expenses: [expense],
      incomes: [income],
      monthlyTasks: [task],
      settings,
      exportedAt: now,
    });

    expect(payload.version).toBe(BACKUP_VERSION);
    expect(payload.exportedAt).toBe('2026-05-26T10:00:00.000Z');
    expect(payload.data.accounts).toEqual([account]);
    expect(payload.data.expenses).toEqual([expense]);
    expect(payload.data.incomes).toEqual([income]);
    expect(payload.data.monthlyTasks).toEqual([task]);
    expect(payload.data.settings).toEqual(settings);
  });

  it('exportedAt を省略しても ISO 形式の現在時刻が入る', () => {
    const payload = buildBackupPayload({
      accounts: [],
      expenses: [],
      incomes: [],
      monthlyTasks: [],
      settings,
    });

    expect(payload.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('buildBackupFilename', () => {
  it('moneyjimuneko-YYYY-MM-DD.json 形式', () => {
    expect(buildBackupFilename(new Date('2026-05-09T00:00:00Z'))).toBe(
      'moneyjimuneko-2026-05-09.json',
    );
  });

  it('月日は 0 埋め', () => {
    expect(buildBackupFilename(new Date('2026-01-03T00:00:00Z'))).toBe(
      'moneyjimuneko-2026-01-03.json',
    );
  });
});

describe('parseBackup', () => {
  const validPayload = buildBackupPayload({
    accounts: [account],
    expenses: [expense],
    incomes: [income],
    monthlyTasks: [task],
    settings,
    exportedAt: new Date('2026-05-26T10:00:00Z'),
  });

  it('正しい payload は parse 成功', () => {
    const json = JSON.stringify(validPayload);
    const parsed = parseBackup(json);
    expect(parsed.version).toBe(BACKUP_VERSION);
    expect(parsed.data.accounts[0].id).toBe('acc-1');
  });

  it('不正な JSON 文字列で Error', () => {
    expect(() => parseBackup('{not json')).toThrow(/JSON として読み込め/);
  });

  it('schema 違反（version 不一致）で Error', () => {
    const broken = { ...validPayload, version: 99 };
    expect(() => parseBackup(JSON.stringify(broken))).toThrow(
      /バックアップの形式が不正/,
    );
  });

  it('schema 違反（金額が負）で Error', () => {
    const broken = {
      ...validPayload,
      data: {
        ...validPayload.data,
        expenses: [{ ...expense, amount: -1 }],
      },
    };
    expect(() => parseBackup(JSON.stringify(broken))).toThrow(
      /バックアップの形式が不正/,
    );
  });

  it('必須フィールド欠落で Error', () => {
    const broken = {
      ...validPayload,
      data: {
        ...validPayload.data,
        accounts: [{ id: 'acc-1', name: 'みずほ' }], // type / color 欠落
      },
    };
    expect(() => parseBackup(JSON.stringify(broken))).toThrow(
      /バックアップの形式が不正/,
    );
  });
});
