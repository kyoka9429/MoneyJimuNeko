import { describe, expect, it } from 'vitest';
import {
  currentYearMonth,
  formatYearMonthJa,
  isValidYearMonth,
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
