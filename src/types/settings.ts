import { z } from 'zod';

export const LOCAL_USER_ID = 'local-user' as const;

export const settingsSchema = z.object({
  userId: z.literal(LOCAL_USER_ID),
  catEnabled: z.boolean(),
  monthStartDay: z.number().int().min(1).max(28),
  colorPreset: z.string().min(1),
});

export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  userId: LOCAL_USER_ID,
  catEnabled: true,
  monthStartDay: 1,
  colorPreset: 'default',
};
