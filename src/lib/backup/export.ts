import {
  accountRepository,
  expenseRepository,
  incomeRepository,
  monthlyTaskRepository,
  settingsRepository,
} from '@/lib/db/repositories';
import type {
  Account,
  Expense,
  Income,
  MonthlyTask,
  Settings,
} from '@/types';
import { BACKUP_VERSION, type BackupPayload } from './schema';

// 純粋関数: 各テーブルのスナップショットから BackupPayload を組み立てる。
// 副作用なし。Vitest で容易にテスト可能。
export function buildBackupPayload(args: {
  accounts: Account[];
  expenses: Expense[];
  incomes: Income[];
  monthlyTasks: MonthlyTask[];
  settings: Settings;
  exportedAt?: Date;
}): BackupPayload {
  const exportedAt = (args.exportedAt ?? new Date()).toISOString();
  return {
    version: BACKUP_VERSION,
    exportedAt,
    data: {
      accounts: args.accounts,
      expenses: args.expenses,
      incomes: args.incomes,
      monthlyTasks: args.monthlyTasks,
      settings: args.settings,
    },
  };
}

// IndexedDB から全データを取得して BackupPayload を返す。
export async function exportAllAsBackup(): Promise<BackupPayload> {
  const [accounts, expenses, incomes, monthlyTasks, settings] =
    await Promise.all([
      accountRepository.list(),
      expenseRepository.list(),
      incomeRepository.list(),
      monthlyTaskRepository.list(),
      settingsRepository.get(),
    ]);
  return buildBackupPayload({
    accounts,
    expenses,
    incomes,
    monthlyTasks,
    settings,
  });
}

// 純粋関数: ファイル名を組み立てる。'moneyjimuneko-YYYY-MM-DD.json' 形式。
export function buildBackupFilename(now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `moneyjimuneko-${yyyy}-${mm}-${dd}.json`;
}

// 副作用: ブラウザでバックアップ JSON をダウンロードさせる。
// `URL.createObjectURL` を使い、anchor 要素のクリックでファイル保存ダイアログを起動。
export function downloadBackup(payload: BackupPayload, filename?: string): void {
  if (typeof document === 'undefined') {
    throw new Error('downloadBackup must be called in the browser.');
  }
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename ?? buildBackupFilename();
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    URL.revokeObjectURL(url);
  }
}
