import { z } from 'zod';
import { yearMonthSchema, MONTHLY_TASK_STATUSES } from './monthlyTask';

// 収入の「予定／実際」を入金月ごとに保持する。MonthlyTask の収入版。
// plannedAmount は収入マスタ (Income.amount) から seed し、actualAmount は
// 振り分けウィザード STEP2 で「実際にいくら入ったか」を記録する（収入のブレ対応）。
export const monthlyIncomeSchema = z.object({
  id: z.string().min(1),
  yearMonth: yearMonthSchema, // 入金月（隔月収入なら偶数月）
  incomeId: z.string().min(1),
  plannedAmount: z.number().int().nonnegative(),
  actualAmount: z.number().int().nonnegative(),
  status: z.enum(MONTHLY_TASK_STATUSES),
  completedAt: z.string().datetime().optional(),
});

export type MonthlyIncome = z.infer<typeof monthlyIncomeSchema>;

export const monthlyIncomeDraftSchema = monthlyIncomeSchema.omit({ id: true });
export type MonthlyIncomeDraft = z.infer<typeof monthlyIncomeDraftSchema>;
