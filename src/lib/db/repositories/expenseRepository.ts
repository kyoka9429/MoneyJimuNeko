import { getDb } from '@/lib/db/schema';
import type { Expense, ExpenseDraft } from '@/types';

export const expenseRepository = {
  async list(): Promise<Expense[]> {
    return getDb().expenses.orderBy('name').toArray();
  },

  async findById(id: string): Promise<Expense | undefined> {
    return getDb().expenses.get(id);
  },

  async listByAccount(accountId: string): Promise<Expense[]> {
    return getDb().expenses.where('accountId').equals(accountId).toArray();
  },

  async create(draft: ExpenseDraft): Promise<Expense> {
    const expense: Expense = { id: crypto.randomUUID(), ...draft };
    await getDb().expenses.add(expense);
    return expense;
  },

  async update(id: string, patch: Partial<ExpenseDraft>): Promise<void> {
    await getDb().expenses.update(id, patch);
  },

  // Expense 削除時は紐づく MonthlyTask も同一トランザクションで削除し、孤児を防ぐ。
  async remove(id: string): Promise<void> {
    const db = getDb();
    await db.transaction('rw', db.expenses, db.monthlyTasks, async () => {
      await db.monthlyTasks.where('expenseId').equals(id).delete();
      await db.expenses.delete(id);
    });
  },
};
