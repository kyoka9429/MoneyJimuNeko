import { getDb } from '@/lib/db/schema';
import { backupSchema, type BackupPayload } from './schema';

// 純粋関数: JSON 文字列を BackupPayload にパース。
// 不正な JSON or schema 違反は Error を throw する（呼び出し側で UI に表示）。
export function parseBackup(jsonString: string): BackupPayload {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonString);
  } catch {
    throw new Error('JSON として読み込めませんでした');
  }
  const result = backupSchema.safeParse(raw);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const path = firstIssue.path.join('.');
    throw new Error(
      `バックアップの形式が不正です: ${path ? `${path} - ` : ''}${firstIssue.message}`,
    );
  }
  return result.data;
}

// 副作用: BackupPayload で既存データを置き換える。
// すべての書き込みを 1 つの transaction にまとめ、途中で失敗したらロールバックされる。
export async function replaceAllFromBackup(
  payload: BackupPayload,
): Promise<void> {
  const db = getDb();
  await db.transaction(
    'rw',
    [db.accounts, db.expenses, db.incomes, db.monthlyTasks, db.settings],
    async () => {
      await Promise.all([
        db.accounts.clear(),
        db.expenses.clear(),
        db.incomes.clear(),
        db.monthlyTasks.clear(),
        db.settings.clear(),
      ]);
      await Promise.all([
        db.accounts.bulkAdd(payload.data.accounts),
        db.expenses.bulkAdd(payload.data.expenses),
        db.incomes.bulkAdd(payload.data.incomes),
        db.monthlyTasks.bulkAdd(payload.data.monthlyTasks),
        db.settings.put(payload.data.settings),
      ]);
    },
  );
}
