'use client';

// Hero section showing monthly remaining amount + cat expression.
// Numbers are kept separate from the cat (PROJECTSPEC §9).
import React from 'react';
import { cn } from '@/lib/utils';
import { formatYen, isNegativeAmount } from '@/lib/format';
import type { MonthlyRemaining, RemainingStatus } from '@/lib/calc';
import type { CatVariant } from '@/components/cat';
import { CatFace } from '@/components/cat';

type Props = {
  remaining: MonthlyRemaining;
};

// Maps calc status → cat expression (PROJECTSPEC §5.1)
const STATUS_TO_VARIANT: Record<RemainingStatus, CatVariant> = {
  comfortable: 'smile',
  tight: 'neutral',
  over: 'worried',
};

// Maps calc status → Tailwind color class
const STATUS_TO_COLOR: Record<RemainingStatus, string> = {
  comfortable: 'text-status-comfortable',
  tight: 'text-status-tight',
  over: 'text-status-over',
};

export function RemainingHero({ remaining }: Props): React.JSX.Element {
  const { remaining: amount, status } = remaining;
  const isNegative = isNegativeAmount(amount);
  const colorClass = STATUS_TO_COLOR[status];
  const catVariant = STATUS_TO_VARIANT[status];

  return (
    <section
      aria-label="今月のあと余り"
      className="flex items-center justify-between rounded-2xl bg-card px-5 py-4 shadow-sm"
    >
      {/* Left: label + amount */}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-muted-foreground">
          今月のあと余り
        </span>
        <span
          className={cn(
            'font-bold tabular-nums leading-tight',
            'text-3xl sm:text-4xl',
            colorClass,
            isNegative && 'font-extrabold',
          )}
          aria-live="polite"
        >
          {formatYen(amount)}
        </span>
      </div>

      {/* Right: cat face (NOT overlaid on numbers — positioned separately) */}
      <CatFace
        variant={catVariant}
        className={cn('size-14 sm:size-16 text-brown', colorClass)}
        label={`ねこ表情: ${catVariant}`}
      />
    </section>
  );
}
