import { z } from 'zod';

export const ACCOUNT_TYPES = ['bank', 'cash', 'other'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const accountSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(40),
  type: z.enum(ACCOUNT_TYPES),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'color must be a #RRGGBB hex string'),
});

export type Account = z.infer<typeof accountSchema>;

export const accountDraftSchema = accountSchema.omit({ id: true });
export type AccountDraft = z.infer<typeof accountDraftSchema>;
