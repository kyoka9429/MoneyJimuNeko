import { z } from 'zod';

export const MONTHLY_TASK_STATUSES = ['pending', 'done'] as const;
export type MonthlyTaskStatus = (typeof MONTHLY_TASK_STATUSES)[number];

export const yearMonthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/u, 'yearMonth must be in YYYY-MM format');

export const monthlyTaskSchema = z.object({
  id: z.string().min(1),
  yearMonth: yearMonthSchema,
  expenseId: z.string().min(1),
  accountId: z.string().min(1),
  plannedAmount: z.number().int().nonnegative(),
  actualAmount: z.number().int().nonnegative(),
  status: z.enum(MONTHLY_TASK_STATUSES),
  completedAt: z.string().datetime().optional(),
});

export type MonthlyTask = z.infer<typeof monthlyTaskSchema>;

export const monthlyTaskDraftSchema = monthlyTaskSchema.omit({ id: true });
export type MonthlyTaskDraft = z.infer<typeof monthlyTaskDraftSchema>;
