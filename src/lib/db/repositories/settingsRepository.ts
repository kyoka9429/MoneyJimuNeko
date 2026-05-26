import { getDb } from '@/lib/db/schema';
import { DEFAULT_SETTINGS, LOCAL_USER_ID, type Settings } from '@/types';

export const settingsRepository = {
  async get(): Promise<Settings> {
    const existing = await getDb().settings.get(LOCAL_USER_ID);
    if (existing) return existing;
    await getDb().settings.put(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  },

  async update(patch: Partial<Omit<Settings, 'userId'>>): Promise<Settings> {
    const current = await this.get();
    const next: Settings = { ...current, ...patch, userId: LOCAL_USER_ID };
    await getDb().settings.put(next);
    return next;
  },
};
