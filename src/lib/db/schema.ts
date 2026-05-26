import Dexie, { type Table } from 'dexie';
import type {
  Account,
  Expense,
  Income,
  MonthlyTask,
  Settings,
} from '@/types';

export const DB_NAME = 'MoneyJimuNeko';

export class MoneyJimuDB extends Dexie {
  accounts!: Table<Account, string>;
  expenses!: Table<Expense, string>;
  incomes!: Table<Income, string>;
  monthlyTasks!: Table<MonthlyTask, string>;
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
