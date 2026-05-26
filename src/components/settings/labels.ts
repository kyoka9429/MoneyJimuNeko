// Japanese label mappings for domain constants.
// Centralised here so all settings pages share the same translations.
import type { AccountType, ExpenseCategory, ExpenseFrequency } from '@/types';

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  bank: '銀行',
  cash: '現金',
  other: 'その他',
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  housing: '住居',
  utilities: '光熱',
  communication: '通信',
  insurance: '保険',
  education: '教育',
  other: 'その他',
};

export const EXPENSE_FREQUENCY_LABELS: Record<ExpenseFrequency, string> = {
  monthly: '毎月',
  bimonthly: '隔月',
  quarterly: '四半期',
  yearly: '年次',
};

// Color palette presets from PROJECTSPEC §6.2 for the color picker.
export const ACCOUNT_COLOR_PRESETS = [
  '#F4A6A6', // paw pink
  '#7FB77E', // status comfortable
  '#E6B450', // status tight
  '#D26B6B', // status over
  '#7EAFD4', // soft blue
  '#B4A7D6', // soft purple
  '#A8D5BA', // soft green
  '#F9CB9C', // soft orange
] as const;
