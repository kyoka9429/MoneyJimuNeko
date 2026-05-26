import { z } from 'zod';

export const EXPENSE_FREQUENCIES = [
  'monthly',
  'bimonthly',
  'quarterly',
  'yearly',
] as const;
export type ExpenseFrequency = (typeof EXPENSE_FREQUENCIES)[number];

export const EXPENSE_CATEGORIES = [
  'housing',
  'utilities',
  'communication',
  'insurance',
  'education',
  'other',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

const amountSchema = z
  .number()
  .int('amount must be an integer (yen)')
  .nonnegative('amount must be >= 0');

const dueDaySchema = z.number().int().min(1).max(31);

export const expenseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(40),
  amount: amountSchema,
  accountId: z.string().min(1),
  dueDay: dueDaySchema.optional(),
  category: z.enum(EXPENSE_CATEGORIES),
  frequency: z.enum(EXPENSE_FREQUENCIES),
});

export type Expense = z.infer<typeof expenseSchema>;

export const expenseDraftSchema = expenseSchema.omit({ id: true });
export type ExpenseDraft = z.infer<typeof expenseDraftSchema>;
