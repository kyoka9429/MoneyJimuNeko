import { z } from 'zod';

// 収入の入金周期。MVP は「毎月」と「隔月（偶数月）」の 2 種。
// bimonthly は公的年金を想定し、支出側の bimonthly と同じく偶数月固定とする
// （発生月の判定は lib/calc/incomeOccurrence.ts）。任意月の隔月が必要になったら
// startMonth/parity フィールドを追加する（decisions.md 参照）。
export const INCOME_FREQUENCIES = ['monthly', 'bimonthly'] as const;
export type IncomeFrequency = (typeof INCOME_FREQUENCIES)[number];

export const incomeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(40),
  amount: z.number().int().nonnegative(),
  payDay: z.number().int().min(1).max(31),
  source: z.string().min(1).max(40),
  // 既存データ（v3 migration 前に作られた行）には存在しないため default を持たせる。
  // Dexie v3 upgrade でも 'monthly' を backfill する（二重の安全策）。
  frequency: z.enum(INCOME_FREQUENCIES).default('monthly'),
});

export type Income = z.infer<typeof incomeSchema>;

export const incomeDraftSchema = incomeSchema.omit({ id: true });
export type IncomeDraft = z.infer<typeof incomeDraftSchema>;
