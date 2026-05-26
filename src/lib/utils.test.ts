import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('resolves tailwind conflicts via tailwind-merge', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('applies clsx conditionals', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c');
  });
});
