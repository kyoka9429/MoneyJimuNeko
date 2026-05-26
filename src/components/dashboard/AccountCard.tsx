'use client';

// Account card showing required/secured amounts and a progress bar.
// Tapping navigates to /accounts/[accountId] (PROJECTSPEC §5.2).
import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatYen } from '@/lib/format';
import type { Account } from '@/types';
import type { AccountSummary } from '@/lib/calc';

type Props = {
  account: Account;
  summary: AccountSummary;
};

const PROGRESS_COMPLETE = 1;
const MIN_TAP_SIZE = 'min-h-[44px]'; // PROJECTSPEC §0: 44x44px tap target

export function AccountCard({ account, summary }: Props): React.JSX.Element {
  const { required, secured, shortfall, surplus, progress } = summary;
  const isComplete = progress >= PROGRESS_COMPLETE;
  const progressPercent = Math.min(Math.round(progress * 100), 100);

  return (
    <Link
      href={`/account?id=${account.id}`}
      aria-label={`${account.name} の振り分け詳細`}
      className={cn(
        'block rounded-2xl bg-card px-4 py-4 shadow-sm',
        'active:opacity-70 transition-opacity',
        MIN_TAP_SIZE,
      )}
    >
      {/* Header: account name + badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-foreground truncate">{account.name}</span>
        <CompletionBadge isComplete={isComplete} shortfall={shortfall} />
      </div>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`確保進捗 ${progressPercent}%`}
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border"
      >
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isComplete ? 'bg-status-comfortable' : 'bg-status-tight',
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Detail row: required / secured / diff */}
      <dl className="mt-2 flex items-baseline justify-between text-xs text-muted-foreground">
        <div className="flex flex-col gap-0.5">
          <dt>必要額</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {formatYen(required)}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5 text-right">
          <dt>確保済</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {formatYen(secured)}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5 text-right">
          <dt>{isComplete ? '余剰' : '不足'}</dt>
          <dd
            className={cn(
              'font-bold tabular-nums',
              isComplete ? 'text-status-comfortable' : 'text-status-over',
            )}
          >
            {isComplete ? formatYen(surplus) : formatYen(-shortfall)}
          </dd>
        </div>
      </dl>
    </Link>
  );
}

type BadgeProps = {
  isComplete: boolean;
  shortfall: number;
};

function CompletionBadge({ isComplete, shortfall }: BadgeProps): React.JSX.Element {
  if (isComplete) {
    return (
      <span className="shrink-0 rounded-full bg-status-comfortable px-2 py-0.5 text-xs font-bold text-white">
        OK
      </span>
    );
  }

  return (
    <span className="shrink-0 rounded-full bg-status-tight px-2 py-0.5 text-xs font-medium text-white">
      あと {formatYen(shortfall)}
    </span>
  );
}
