'use client';

// Client component for the /accounts/[accountId] checklist page.
// Fetches account, expenses, and monthly tasks from IndexedDB.
// Implements optimistic updates with rollback on failure (CLAUDE.md "Fail loud").
import React, { useCallback, useEffect, useState } from 'react';
import {
  accountRepository,
  expenseRepository,
  incomeRepository,
  monthlyTaskRepository,
} from '@/lib/db/repositories';
import {
  getAllocationPeriod,
  hasBimonthlyIncome,
  summarizeAccountFromTasks,
} from '@/lib/calc';
import { formatYen } from '@/lib/format';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import type { Account, Expense, MonthlyTask } from '@/types';
import type { AccountSummary } from '@/lib/calc';
import { CatPhoto } from '@/components/cat';
import { ChecklistRow } from './ChecklistRow';
import { CatToast } from './CatToast';

type PageData = {
  account: Account;
  tasks: MonthlyTask[];
  expenseMap: Map<string, Expense>;
  summary: AccountSummary;
};

type LoadState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; data: PageData };

type Props = {
  accountId: string;
};

// Task sort order: by dueDay ascending; tasks without dueDay come last.
const NO_DUE_DAY_SENTINEL = 999;

function sortByDueDay(tasks: MonthlyTask[], expenseMap: Map<string, Expense>): MonthlyTask[] {
  return [...tasks].sort((a, b) => {
    const dayA = expenseMap.get(a.expenseId)?.dueDay ?? NO_DUE_DAY_SENTINEL;
    const dayB = expenseMap.get(b.expenseId)?.dueDay ?? NO_DUE_DAY_SENTINEL;
    return dayA - dayB;
  });
}

function buildSummary(
  accountId: string,
  tasks: MonthlyTask[],
): AccountSummary {
  // 必要額=予定合計 / 確保済=確保済みの実際額合計（差額補完済み）。
  return summarizeAccountFromTasks(accountId, tasks);
}

export function ChecklistClient({ accountId }: Props): React.JSX.Element {
  const yearMonth = useUiStore((s) => s.yearMonth);
  const [state, setState] = useState<LoadState>({ phase: 'loading' });
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [account, allExpenses, incomes] = await Promise.all([
          accountRepository.findById(accountId),
          expenseRepository.listByAccount(accountId),
          incomeRepository.list(),
        ]);

        if (cancelled) return;

        if (!account) {
          setState({ phase: 'error', message: '口座が見つかりませんでした' });
          return;
        }

        // 隔月収入なら期間（2 ヶ月）分のタスクをこの口座について読む。
        const period = getAllocationPeriod(yearMonth, hasBimonthlyIncome(incomes));
        const tasksByMonth = await Promise.all(
          period.periodMonths.map((m) =>
            monthlyTaskRepository.listByYearMonthAccount(m, accountId),
          ),
        );
        if (cancelled) return;
        const tasks = tasksByMonth.flat();

        const expenseMap = new Map(allExpenses.map((e) => [e.id, e]));
        const summary = buildSummary(accountId, tasks);

        setState({
          phase: 'ready',
          data: { account, tasks, expenseMap, summary },
        });
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : 'データ取得に失敗しました';
        setState({ phase: 'error', message });
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [accountId, yearMonth]);

  const handleToggle = useCallback(
    async (taskId: string, nextDone: boolean) => {
      if (state.phase !== 'ready') return;

      const { data } = state;
      const original = data.tasks;

      // Optimistic update: swap status in local state immediately
      const updated = original.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: nextDone ? ('done' as const) : ('pending' as const),
              actualAmount: nextDone ? t.plannedAmount : 0,
            }
          : t,
      );

      const newSummary = buildSummary(accountId, updated);

      setState({
        phase: 'ready',
        data: { ...data, tasks: updated, summary: newSummary },
      });

      if (nextDone) {
        setToastOpen(true);
      }

      try {
        if (nextDone) {
          const task = original.find((t) => t.id === taskId);
          const amount = task?.plannedAmount ?? 0;
          await monthlyTaskRepository.markDone(taskId, amount);
        } else {
          await monthlyTaskRepository.markPending(taskId);
        }
      } catch (err) {
        // Rollback: restore previous tasks and summary on DB failure
        const rolledBackSummary = buildSummary(accountId, original);
        setState({
          phase: 'ready',
          data: { ...data, tasks: original, summary: rolledBackSummary },
        });
        // Fail loud: report to console so it surfaces in devtools
        console.error('[ChecklistClient] toggle failed, rolled back:', err);
      }
    },
    [state, accountId],
  );

  const handleToastClose = useCallback(() => {
    setToastOpen(false);
  }, []);

  if (state.phase === 'loading') {
    return <LoadingView />;
  }

  if (state.phase === 'error') {
    return <ErrorView message={state.message} />;
  }

  const { account, tasks, expenseMap, summary } = state.data;
  const sorted = sortByDueDay(tasks, expenseMap);
  const allDone = tasks.length > 0 && tasks.every((t) => t.status === 'done');

  return (
    <>
      {/* Account summary card */}
      <AccountSummaryCard account={account} summary={summary} />

      {/* Checklist */}
      <section aria-label="振り分けタスク" className="mt-4 flex flex-col gap-2">
        {tasks.length === 0 ? (
          <EmptyTasksView />
        ) : (
          sorted.map((task) => (
            <ChecklistRow
              key={task.id}
              task={task}
              expenseName={expenseMap.get(task.expenseId)?.name ?? '(不明)'}
              onToggle={handleToggle}
            />
          ))
        )}
      </section>

      {/* All-done celebration (PROJECTSPEC §9) */}
      {allDone && <AllDoneView />}

      {/* Micro toast */}
      <CatToast open={toastOpen} onClose={handleToastClose} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-views
// ---------------------------------------------------------------------------

type SummaryCardProps = {
  account: Account;
  summary: AccountSummary;
};

function AccountSummaryCard({ account, summary }: SummaryCardProps): React.JSX.Element {
  const { required, secured, progress } = summary;
  const progressPercent = Math.min(Math.round(progress * 100), 100);
  const isComplete = progress >= 1;

  return (
    <div className="rounded-2xl bg-card px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-foreground">{account.name}</span>
        <span
          className={cn(
            'shrink-0 text-sm font-bold tabular-nums',
            isComplete ? 'text-status-comfortable' : 'text-status-tight',
          )}
        >
          {progressPercent}%
        </span>
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

      {/* Required / secured amounts */}
      <dl className="mt-2 flex items-baseline justify-between text-xs text-muted-foreground">
        <div className="flex flex-col gap-0.5">
          <dt>必要額</dt>
          <dd className="font-medium tabular-nums text-foreground">{formatYen(required)}</dd>
        </div>
        <div className="flex flex-col gap-0.5 text-right">
          <dt>確保済</dt>
          <dd className="font-medium tabular-nums text-foreground">{formatYen(secured)}</dd>
        </div>
      </dl>
    </div>
  );
}

function LoadingView(): React.JSX.Element {
  return (
    <div
      role="status"
      aria-label="読み込み中"
      className="flex flex-col items-center gap-3 py-16 text-muted-foreground"
    >
      <CatPhoto
        variant="neutral"
        className="size-12 text-brown animate-pulse motion-reduce:animate-none"
      />
      <span className="text-sm">読み込み中…</span>
    </div>
  );
}

function ErrorView({ message }: { message: string }): React.JSX.Element {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl bg-card px-5 py-8 text-center shadow-sm"
    >
      <CatPhoto variant="worried" className="size-14 text-status-over" />
      <p className="text-sm text-status-over">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-1 text-sm underline underline-offset-2 text-muted-foreground"
      >
        再読み込み
      </button>
    </div>
  );
}

function EmptyTasksView(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-5 py-8 text-center shadow-sm">
      <CatPhoto variant="neutral" className="size-12 text-brown" />
      <p className="text-sm text-muted-foreground">この口座のタスクはまだありません</p>
    </div>
  );
}

function AllDoneView(): React.JSX.Element {
  return (
    <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-card px-5 py-8 text-center shadow-sm">
      {/* Cat curled up / sleeping to represent completion (PROJECTSPEC §9) */}
      <CatPhoto variant="smile" className="size-16 text-brown" />
      <p className="font-semibold text-foreground">今月の振り分けはおわり</p>
      <p className="text-sm text-muted-foreground">すべての振り分けが完了しました</p>
    </div>
  );
}
