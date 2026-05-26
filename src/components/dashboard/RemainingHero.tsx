'use client';

// Hero section showing the allocation-period remaining amount + cat expression.
// 隔月（年金）収入の世帯では「この 2 ヶ月のあと余り」を表示する（calc/allocationView）。
// Numbers are kept separate from the cat (PROJECTSPEC §9).
import React from 'react';
import { cn } from '@/lib/utils';
import { formatYen, isNegativeAmount } from '@/lib/format';
import type { RemainingStatus } from '@/lib/calc';
import type { CatVariant } from '@/components/cat';
import { CatPhoto } from '@/components/cat';

type Props = {
  // 実績補完済みの余り（calc/reconcile）
  amount: number;
  status: RemainingStatus;
  // 隔月収入の世帯か（表示ラベルの切替）
  isBimonthly: boolean;
  // 表示中の月が入金（振り分け）月か
  isIncomeMonth: boolean;
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

export function RemainingHero({
  amount,
  status,
  isBimonthly,
  isIncomeMonth,
}: Props): React.JSX.Element {
  const isNegative = isNegativeAmount(amount);
  const colorClass = STATUS_TO_COLOR[status];
  const catVariant = STATUS_TO_VARIANT[status];

  // 隔月収入なら 2 ヶ月分の余りを表示。奇数月は「先月に確保済み」を補足する。
  const heading = isBimonthly ? 'この 2 ヶ月のあと余り' : '今月のあと余り';
  const note = isBimonthly
    ? isIncomeMonth
      ? '今月＋翌月の 2 ヶ月分'
      : '先月に 2 ヶ月分を確保済み'
    : null;

  return (
    <section
      aria-label={heading}
      className="flex items-center justify-between rounded-2xl bg-card px-5 py-4 shadow-sm"
    >
      {/* Left: label + amount */}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-muted-foreground">
          {heading}
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
        {note && (
          <span className="text-xs text-muted-foreground">{note}</span>
        )}
      </div>

      {/* 事務猫さん: 状態に応じて表情が変わる。数字には重ねない（PROJECTSPEC §9）。
          余り額は aria-live で読み上げるため、ここは装飾(alt="")。 */}
      <CatPhoto
        character="jimu"
        variant={catVariant}
        className="size-16 shrink-0 sm:size-20"
        priority
      />
    </section>
  );
}
