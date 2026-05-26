import { getDb } from '@/lib/db/schema';
import type { Account, AccountDraft } from '@/types';

export const accountRepository = {
  async list(): Promise<Account[]> {
    return getDb().accounts.orderBy('name').toArray();
  },

  async findById(id: string): Promise<Account | undefined> {
    return getDb().accounts.get(id);
  },

  async create(draft: AccountDraft): Promise<Account> {
    const account: Account = { id: crypto.randomUUID(), ...draft };
    await getDb().accounts.add(account);
    return account;
  },

  async update(id: string, patch: Partial<AccountDraft>): Promise<void> {
    await getDb().accounts.update(id, patch);
  },

  // Account 削除時は紐づく Expense と MonthlyTask（accountId 経由）も連鎖削除し、孤児を防ぐ。
  async remove(id: string): Promise<void> {
    const db = getDb();
    await db.transaction(
      'rw',
      db.accounts,
      db.expenses,
      db.monthlyTasks,
      async () => {
        const expenses = await db.expenses
          .where('accountId')
          .equals(id)
          .toArray();
        const expenseIds = expenses.map((e) => e.id);
        if (expenseIds.length > 0) {
          await db.monthlyTasks
            .where('expenseId')
            .anyOf(expenseIds)
            .delete();
        }
        await db.monthlyTasks.where('accountId').equals(id).delete();
        await db.expenses.where('accountId').equals(id).delete();
        await db.accounts.delete(id);
      },
    );
  },
};
