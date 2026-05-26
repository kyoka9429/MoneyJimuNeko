import { describe, expect, it } from 'vitest';
import {
  constantTimeEqual,
  hashPassword,
  verifyPassword,
} from './lock';

// 固定 salt で再現性のあるハッシュ値を確認する。
// 一度生成した値を「正解」として固定し、回帰検出に使う。
const FIXED_SALT_HEX = '0123456789abcdef0123456789abcdef';

describe('hashPassword', () => {
  it('同じ password + salt なら同じハッシュを生成する（決定的）', async () => {
    const h1 = await hashPassword('ねこの合言葉', FIXED_SALT_HEX);
    const h2 = await hashPassword('ねこの合言葉', FIXED_SALT_HEX);
    expect(h1).toBe(h2);
  });

  it('異なる password なら異なるハッシュ', async () => {
    const h1 = await hashPassword('aaa', FIXED_SALT_HEX);
    const h2 = await hashPassword('aab', FIXED_SALT_HEX);
    expect(h1).not.toBe(h2);
  });

  it('異なる salt なら異なるハッシュ（salt が機能している）', async () => {
    const otherSalt = 'fedcba9876543210fedcba9876543210';
    const h1 = await hashPassword('aaa', FIXED_SALT_HEX);
    const h2 = await hashPassword('aaa', otherSalt);
    expect(h1).not.toBe(h2);
  });

  it('出力は 64 文字の hex 文字列（256bit = 32 byte = 64 hex chars）', async () => {
    const h = await hashPassword('test', FIXED_SALT_HEX);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('verifyPassword', () => {
  it('正しい password で true', async () => {
    const expected = await hashPassword('ねこ123', FIXED_SALT_HEX);
    await expect(
      verifyPassword('ねこ123', expected, FIXED_SALT_HEX),
    ).resolves.toBe(true);
  });

  it('1 文字違う password で false', async () => {
    const expected = await hashPassword('ねこ123', FIXED_SALT_HEX);
    await expect(
      verifyPassword('ねこ124', expected, FIXED_SALT_HEX),
    ).resolves.toBe(false);
  });

  it('ハッシュ未設定で false（fail-closed）', async () => {
    await expect(verifyPassword('whatever', '', FIXED_SALT_HEX)).resolves.toBe(
      false,
    );
    await expect(verifyPassword('whatever', 'abc', '')).resolves.toBe(false);
  });
});

describe('constantTimeEqual', () => {
  it('同一文字列で true', () => {
    expect(constantTimeEqual('abc', 'abc')).toBe(true);
  });

  it('長さが違うと false（先頭一致でも）', () => {
    expect(constantTimeEqual('abc', 'abcd')).toBe(false);
  });

  it('内容が違うと false', () => {
    expect(constantTimeEqual('abc', 'abd')).toBe(false);
  });

  it('空文字列同士は true', () => {
    expect(constantTimeEqual('', '')).toBe(true);
  });
});
