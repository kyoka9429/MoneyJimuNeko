import { describe, expect, it } from 'vitest';
import {
  addMonths,
  currentYearMonth,
  formatYearMonthJa,
  isEvenMonth,
  isValidYearMonth,
  monthNumber,
} from './yearMonth';

describe('currentYearMonth', () => {
  it('Date を渡せばその年月を YYYY-MM で返す', () => {
    expect(currentYearMonth(new Date('2026-05-15T10:00:00Z'))).toBe('2026-05');
  });

  it('1月など 1 桁月は 0 埋め', () => {
    expect(currentYearMonth(new Date('2026-01-01T00:00:00Z'))).toBe('2026-01');
  });
});

describe('isValidYearMonth', () => {
  it('正しい形式で true', () => {
    expect(isValidYearMonth('2026-05')).toBe(true);
    expect(isValidYearMonth('2026-01')).toBe(true);
    expect(isValidYearMonth('2026-12')).toBe(true);
  });

  it('範囲外の月で false', () => {
    expect(isValidYearMonth('2026-00')).toBe(false);
    expect(isValidYearMonth('2026-13')).toBe(false);
  });

  it('ゼロ埋めなし / 不正形式で false', () => {
    expect(isValidYearMonth('2026-5')).toBe(false);
    expect(isValidYearMonth('abc')).toBe(false);
    expect(isValidYearMonth('')).toBe(false);
  });
});

describe('formatYearMonthJa', () => {
  it('日本語表記に変換', () => {
    expect(formatYearMonthJa('2026-05')).toBe('2026 年 5 月');
    expect(formatYearMonthJa('2026-12')).toBe('2026 年 12 月');
  });

  it('不正値はそのまま返す（フォールバック）', () => {
    expect(formatYearMonthJa('invalid')).toBe('invalid');
  });
});

describe('monthNumber', () => {
  it('月番号を返す', () => {
    expect(monthNumber('2026-05')).toBe(5);
    expect(monthNumber('2026-12')).toBe(12);
  });
  it('不正値で throw', () => {
    expect(() => monthNumber('2026-13')).toThrow();
  });
});

describe('isEvenMonth', () => {
  it('偶数月で true', () => {
    expect(isEvenMonth('2026-02')).toBe(true);
    expect(isEvenMonth('2026-12')).toBe(true);
  });
  it('奇数月で false', () => {
    expect(isEvenMonth('2026-05')).toBe(false);
    expect(isEvenMonth('2026-01')).toBe(false);
  });
});

describe('addMonths', () => {
  it('翌月を返す', () => {
    expect(addMonths('2026-05', 1)).toBe('2026-06');
  });
  it('前月を返す', () => {
    expect(addMonths('2026-05', -1)).toBe('2026-04');
  });
  it('年跨ぎ（12 月 + 1 = 翌年 1 月）', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
  });
  it('年跨ぎ（1 月 - 1 = 前年 12 月）', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });
  it('複数月の加算', () => {
    expect(addMonths('2026-11', 3)).toBe('2027-02');
  });
  it('0 を加算すると同じ月', () => {
    expect(addMonths('2026-05', 0)).toBe('2026-05');
  });
  it('不正値で throw', () => {
    expect(() => addMonths('invalid', 1)).toThrow();
  });
});
