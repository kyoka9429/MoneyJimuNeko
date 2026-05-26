import { describe, expect, it } from 'vitest';
import { formatYen, isNegativeAmount } from './currency';

describe('formatYen', () => {
  it('正の整数は ¥ + 千区切り形式', () => {
    expect(formatYen(1234567)).toBe('¥1,234,567');
  });

  it('0 は ¥0', () => {
    expect(formatYen(0)).toBe('¥0');
  });

  it('小さな値も千区切り基準で表示', () => {
    expect(formatYen(500)).toBe('¥500');
  });

  it('負値は括弧で囲まれる', () => {
    expect(formatYen(-1234)).toBe('(¥1,234)');
  });

  it('小数は切り捨てて整数として扱う', () => {
    expect(formatYen(1000.9)).toBe('¥1,000');
    expect(formatYen(-1000.9)).toBe('(¥1,000)');
  });

  it('NaN / Infinity は安全なフォールバック表示', () => {
    expect(formatYen(Number.NaN)).toBe('¥-');
    expect(formatYen(Number.POSITIVE_INFINITY)).toBe('¥-');
    expect(formatYen(Number.NEGATIVE_INFINITY)).toBe('¥-');
  });
});

describe('isNegativeAmount', () => {
  it('負値で true', () => {
    expect(isNegativeAmount(-1)).toBe(true);
  });

  it('0・正値で false', () => {
    expect(isNegativeAmount(0)).toBe(false);
    expect(isNegativeAmount(1000)).toBe(false);
  });

  it('NaN / Infinity は false（不正値は色付け対象外）', () => {
    expect(isNegativeAmount(Number.NaN)).toBe(false);
    expect(isNegativeAmount(Number.NEGATIVE_INFINITY)).toBe(false);
  });
});
