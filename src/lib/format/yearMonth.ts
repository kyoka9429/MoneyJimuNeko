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

function assertValidYearMonth(yearMonth: string): void {
  if (!isValidYearMonth(yearMonth)) {
    throw new Error(`Invalid yearMonth format: "${yearMonth}". Expected YYYY-MM.`);
  }
}

// 月番号 (1〜12) を返す。
export function monthNumber(yearMonth: string): number {
  assertValidYearMonth(yearMonth);
  return Number(yearMonth.slice(5, 7));
}

// 偶数月（公的年金の入金月／隔月支出の発生月）かどうか。
export function isEvenMonth(yearMonth: string): boolean {
  return monthNumber(yearMonth) % 2 === 0;
}

// yearMonth に n ヶ月（負値可）を加算した YYYY-MM を返す。年跨ぎを正しく処理する。
export function addMonths(yearMonth: string, n: number): string {
  assertValidYearMonth(yearMonth);
  const year = Number(yearMonth.slice(0, 4));
  const month = Number(yearMonth.slice(5, 7));
  // 0-indexed の月通算値で計算してから戻す（負の剰余を避けるため正規化）。
  const totalMonths = year * 12 + (month - 1) + n;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = totalMonths - newYear * 12 + 1;
  return `${String(newYear).padStart(4, '0')}-${String(newMonth).padStart(2, '0')}`;
}
