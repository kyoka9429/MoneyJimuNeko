import { create } from 'zustand';
import { currentYearMonth } from '@/lib/format';

type UiState = {
  yearMonth: string;
  setYearMonth: (ym: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  yearMonth: currentYearMonth(),
  setYearMonth: (ym) => set({ yearMonth: ym }),
}));
