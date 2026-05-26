import Dexie, { type Table } from 'dexie';
import type {
  Account,
  Expense,
  Income,
  MonthlyIncome,
  MonthlyTask,
  Settings,
} from '@/types';

export const DB_NAME = 'MoneyJimuNeko';

export class MoneyJimuDB extends Dexie {
  accounts!: Table<Account, string>;
  expenses!: Table<Expense, string>;
  incomes!: Table<Income, string>;
  monthlyTasks!: Table<MonthlyTask, string>;
  monthlyIncomes!: Table<MonthlyIncome, string>;
  settings!: Table<Settings, string>;

  constructor(name: string = DB_NAME) {
    super(name);
    this.version(1).stores({
      accounts: 'id, name, type',
      expenses: 'id, accountId, frequency, category',
      incomes: 'id, source',
      monthlyTasks:
        'id, yearMonth, expenseId, accountId, [yearMonth+accountId], [yearMonth+status]',
      settings: 'userId',
    });
    // v2: add missing indexes required by orderBy calls in repositories
    this.version(2).stores({
      accounts: 'id, name, type',
      expenses: 'id, name, accountId, frequency, category',
      incomes: 'id, payDay, source',
      monthlyTasks:
        'id, yearMonth, expenseId, accountId, [yearMonth+accountId], [yearMonth+status]',
      settings: 'userId',
    });
    // v3: add Income.frequency (隔月収入対応). Index it for consistency with
    // expenses, and backfill existing rows to 'monthly' so pre-v3 data stays valid.
    this.version(3)
      .stores({
        accounts: 'id, name, type',
        expenses: 'id, name, accountId, frequency, category',
        incomes: 'id, payDay, source, frequency',
        monthlyTasks:
          'id, yearMonth, expenseId, accountId, [yearMonth+accountId], [yearMonth+status]',
        settings: 'userId',
      })
      .upgrade(async (tx) => {
        await tx
          .table('incomes')
          .toCollection()
          .modify((income: { frequency?: string }) => {
            if (income.frequency === undefined) {
              income.frequency = 'monthly';
            }
          });
      });
    // v4: add monthlyIncomes table (収入の予定/実際を入金月ごとに保持).
    // 新規テーブルのため backfill 不要。他テーブルは v3 のまま維持。
    this.version(4).stores({
      accounts: 'id, name, type',
      expenses: 'id, name, accountId, frequency, category',
      incomes: 'id, payDay, source, frequency',
      monthlyTasks:
        'id, yearMonth, expenseId, accountId, [yearMonth+accountId], [yearMonth+status]',
      monthlyIncomes: 'id, yearMonth, incomeId, [yearMonth+incomeId]',
      settings: 'userId',
    });
  }
}

let instance: MoneyJimuDB | null = null;

export function getDb(): MoneyJimuDB {
  if (typeof window === 'undefined') {
    throw new Error(
      'IndexedDB is only available in the browser. Call getDb() from client code.',
    );
  }
  if (!instance) {
    instance = new MoneyJimuDB();
  }
  return instance;
}

export function resetDbForTesting(): void {
  instance = null;
}
