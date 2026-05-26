import { z } from 'zod';
import {
  accountSchema,
  expenseSchema,
  incomeSchema,
  monthlyTaskSchema,
  settingsSchema,
} from '@/types';

export const BACKUP_VERSION = 1;

// 全エンティティを含むバックアップ JSON のスキーマ。
// version は将来のマイグレーション識別子（v2 以降で互換性破壊が起きたら昇格）。
export const backupSchema = z.object({
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string().datetime(),
  data: z.object({
    accounts: z.array(accountSchema),
    expenses: z.array(expenseSchema),
    incomes: z.array(incomeSchema),
    monthlyTasks: z.array(monthlyTaskSchema),
    settings: settingsSchema,
  }),
});

export type BackupPayload = z.infer<typeof backupSchema>;
