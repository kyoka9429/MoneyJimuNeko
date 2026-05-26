import { dedupeIncomeDraftsAgainstExisting } from '@/lib/calc/incomeRollover';
import { getDb } from '@/lib/db/schema';
import type { MonthlyIncome, MonthlyIncomeDraft } from '@/types';

export const monthlyIncomeRepository = {
  async listByYearMonth(yearMonth: string): Promise<MonthlyIncome[]> {
    return getDb().monthlyIncomes.where('yearMonth').equals(yearMonth).toArray();
  },

  async findById(id: string): Promise<MonthlyIncome | undefined> {
    return getDb().monthlyIncomes.get(id);
  },

  async bulkCreate(drafts: MonthlyIncomeDraft[]): Promise<MonthlyIncome[]> {
    const records: MonthlyIncome[] = drafts.map((draft) => ({
      id: crypto.randomUUID(),
      ...draft,
    }));
    await getDb().monthlyIncomes.bulkAdd(records);
    return records;
  },

  // 入金月の MonthlyIncome を、既存と重複しない分だけ生成する（収入版ロールオーバー）。
  async ensureDraftsForMonth(
    yearMonth: string,
    drafts: MonthlyIncomeDraft[],
  ): Promise<MonthlyIncome[]> {
    const existing = await getDb()
      .monthlyIncomes.where('yearMonth')
      .equals(yearMonth)
      .toArray();
    const newDrafts = dedupeIncomeDraftsAgainstExisting(
      drafts.filter((d) => d.yearMonth === yearMonth),
      existing,
    );
    if (newDrafts.length === 0) return [];
    return this.bulkCreate(newDrafts);
  },

  // 実際の入金額を確定する（STEP2「実際にいくら入った？」）。
  async confirmActual(
    id: string,
    actualAmount: number,
    completedAt: string = new Date().toISOString(),
  ): Promise<void> {
    await getDb().monthlyIncomes.update(id, {
      status: 'done',
      actualAmount,
      completedAt,
    });
  },

  async reset(id: string): Promise<void> {
    await getDb().monthlyIncomes.update(id, {
      status: 'pending',
      actualAmount: 0,
      completedAt: undefined,
    });
  },

  // 予定額の更新（STEP1「予定はいくら？」でマスタ額から調整した場合）。
  async updatePlanned(id: string, plannedAmount: number): Promise<void> {
    await getDb().monthlyIncomes.update(id, { plannedAmount });
  },

  async remove(id: string): Promise<void> {
    await getDb().monthlyIncomes.delete(id);
  },
};
