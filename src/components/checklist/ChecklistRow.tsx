'use client';

// Single checklist row: checkbox + expense name + amount + status badge.
// Hit area is 44x44px minimum (PROJECTSPEC §0).
// Keyboard accessible via role="checkbox" + Space/Enter handler.
import React from 'react';
import { cn } from '@/lib/utils';
import { formatYen } from '@/lib/format';
import type { MonthlyTask } from '@/types';

type Props = {
  task: MonthlyTask;
  expenseName: string;
  onToggle: (taskId: string, nextDone: boolean) => void;
};

const STATUS_LABEL: Record<'pending' | 'done', string> = {
  pending: '未確保',
  done: '確保済',
};

export function ChecklistRow({
  task,
  expenseName,
  onToggle,
}: Props): React.JSX.Element {
  const isDone = task.status === 'done';

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onToggle(task.id, !isDone);
    }
  }

  return (
    <div
      role="checkbox"
      aria-checked={isDone}
      tabIndex={0}
      onClick={() => onToggle(task.id, !isDone)}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex min-h-[56px] cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 shadow-sm',
        'bg-card transition-opacity active:opacity-70',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      )}
    >
      {/* Visual checkbox (44x44 hit area handled by parent row) */}
      <div
        aria-hidden="true"
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
          isDone
            ? 'border-accent bg-accent'
            : 'border-border bg-transparent',
        )}
      >
        {isDone && (
          // Simple paw-pink checkmark rendered as SVG
          <svg
            viewBox="0 0 12 12"
            className="size-4 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="2,6 5,9 10,3" />
          </svg>
        )}
      </div>

      {/* Expense name */}
      <span
        className={cn(
          'flex-1 truncate text-sm font-medium',
          isDone ? 'text-muted-foreground line-through' : 'text-foreground',
        )}
      >
        {expenseName}
      </span>

      {/* Amount */}
      <span
        className={cn(
          'shrink-0 tabular-nums text-sm font-semibold',
          isDone ? 'text-muted-foreground' : 'text-foreground',
        )}
      >
        {formatYen(task.plannedAmount)}
      </span>

      {/* Status badge */}
      <span
        className={cn(
          'shrink-0 rounded-full px-2 py-0.5 text-xs font-bold',
          isDone
            ? 'bg-status-comfortable text-white'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {STATUS_LABEL[task.status]}
      </span>
    </div>
  );
}
