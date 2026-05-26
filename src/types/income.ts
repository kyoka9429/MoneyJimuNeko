import { z } from 'zod';

export const incomeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(40),
  amount: z.number().int().nonnegative(),
  payDay: z.number().int().min(1).max(31),
  source: z.string().min(1).max(40),
});

export type Income = z.infer<typeof incomeSchema>;

export const incomeDraftSchema = incomeSchema.omit({ id: true });
export type IncomeDraft = z.infer<typeof incomeDraftSchema>;
