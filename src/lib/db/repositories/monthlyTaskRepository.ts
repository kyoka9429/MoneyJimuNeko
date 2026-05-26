import { dedupeDraftsAgainstExisting } from '@/lib/calc/rollover';
import { getDb } from '@/lib/db/schema';
import type {
  MonthlyTask,
  MonthlyTaskDraft,
  MonthlyTaskStatus,
} from '@/types';

export const monthlyTaskRepository = {
  async list(): Promise<MonthlyTask[]> {
    return getDb().monthlyTasks.toArray();
  },

  async listByYearMonth(yearMonth: string): Promise<MonthlyTask[]> {
    return getDb().monthlyTasks.where('yearMonth').equals(yearMonth).toArray();
  },

  async listByYearMonthAccount(
    yearMonth: string,
    accountId: string,
  ): Promise<MonthlyTask[]> {
    return getDb()
      .monthlyTasks.where('[yearMonth+accountId]')
      .equals([yearMonth, accountId])
      .toArray();
  },

  async listByYearMonthStatus(
    yearMonth: string,
    status: MonthlyTaskStatus,
  ): Promise<MonthlyTask[]> {
    return getDb()
      .monthlyTasks.where('[yearMonth+status]')
      .equals([yearMonth, status])
      .toArray();
  },

  async findById(id: string): Promise<MonthlyTask | undefined> {
    return getDb().monthlyTasks.get(id);
  },

  async create(draft: MonthlyTaskDraft): Promise<MonthlyTask> {
    const task: MonthlyTask = { id: crypto.randomUUID(), ...draft };
    await getDb().monthlyTasks.add(task);
    return task;
  },

  async bulkCreate(drafts: MonthlyTaskDraft[]): Promise<MonthlyTask[]> {
    const tasks: MonthlyTask[] = drafts.map((draft) => ({
      id: crypto.randomUUID(),
      ...draft,
    }));
    await getDb().monthlyTasks.bulkAdd(tasks);
    return tasks;
  },

  // ロールオーバーの二重実行で同じ yearMonth × expenseId のタスクが重複しないよう
  // 既存タスクを読んでから差分のみ追加する。重複判定は calc 層の純粋関数に委譲。
  async ensureDraftsForMonth(
    yearMonth: string,
    drafts: MonthlyTaskDraft[],
  ): Promise<MonthlyTask[]> {
    const existing = await getDb()
      .monthlyTasks.where('yearMonth')
      .equals(yearMonth)
      .toArray();
    const newDrafts = dedupeDraftsAgainstExisting(
      drafts.filter((d) => d.yearMonth === yearMonth),
      existing,
    );
    if (newDrafts.length === 0) return [];
    return this.bulkCreate(newDrafts);
  },

  async update(id: string, patch: Partial<MonthlyTaskDraft>): Promise<void> {
    await getDb().monthlyTasks.update(id, patch);
  },

  async markDone(
    id: string,
    actualAmount: number,
    completedAt: string = new Date().toISOString(),
  ): Promise<void> {
    await getDb().monthlyTasks.update(id, {
      status: 'done',
      actualAmount,
      completedAt,
    });
  },

  async markPending(id: string): Promise<void> {
    await getDb().monthlyTasks.update(id, {
      status: 'pending',
      actualAmount: 0,
      completedAt: undefined,
    });
  },

  async remove(id: string): Promise<void> {
    await getDb().monthlyTasks.delete(id);
  },
};
