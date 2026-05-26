// YYYY-MM 形式 ('2026-05' など) を扱うユーティリティ。

const YEAR_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/u;

export function currentYearMonth(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function isValidYearMonth(value: string): boolean {
  return YEAR_MONTH_PATTERN.test(value);
}

export function formatYearMonthJa(yearMonth: string): string {
  if (!isValidYearMonth(yearMonth)) return yearMonth;
  const year = yearMonth.slice(0, 4);
  const month = Number(yearMonth.slice(5, 7));
  return `${year} 年 ${month} 月`;
}
