import { getDb } from '@/lib/db/schema';
import type { Income, IncomeDraft } from '@/types';

export const incomeRepository = {
  async list(): Promise<Income[]> {
    return getDb().incomes.orderBy('payDay').toArray();
  },

  async findById(id: string): Promise<Income | undefined> {
    return getDb().incomes.get(id);
  },

  async create(draft: IncomeDraft): Promise<Income> {
    const income: Income = { id: crypto.randomUUID(), ...draft };
    await getDb().incomes.add(income);
    return income;
  },

  async update(id: string, patch: Partial<IncomeDraft>): Promise<void> {
    await getDb().incomes.update(id, patch);
  },

  async remove(id: string): Promise<void> {
    await getDb().incomes.delete(id);
  },
};
