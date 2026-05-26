'use client';

// Allocate hub (PROJECTSPEC §5.1 ボトムナビ「振り分け」)
// Lists all accounts for the current month with pending task counts.
// Tapping an account navigates to /accounts/[accountId] for full checklist.
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  accountRepository,
  expenseRepository,
  monthlyTaskRepository,
} from '@/lib/db/repositories';
import {
  filterExpensesForMonth,
  generateMonthlyTaskDrafts,
  summarizeAccount,
} from '@/lib/calc';
import type { AccountSummary } from '@/lib/calc';
import { useUiStore } from '@/stores/uiStore';
import type { Account, MonthlyTask } from '@/types';
import { CatFace } from '@/components/cat';
import { AccountCard } from '@/components/dashboard/AccountCard';

type AllocateRow = {
  account: Account;
  summary: AccountSummary;
  pendingCount: number;
};

type State =
  | { phase: 'loading' }
  | { phase: 'empty' }
  | { phase: 'ready'; rows: AllocateRow[] }
  | { phase: 'error'; message: string };

export function AllocateClient(): React.JSX.Element {
  const yearMonth = useUiStore((s) => s.yearMonth);
  const [state, setState] = useState<State>({ phase: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [accounts, expenses] = await Promise.all([
          accountRepository.list(),
          expenseRepository.list(),
        ]);
        if (cancelled) return;

        if (accounts.length === 0) {
          setState({ phase: 'empty' });
          return;
        }

        const drafts = generateMonthlyTaskDrafts(expenses, yearMonth);
        await monthlyTaskRepository.ensureDraftsForMonth(yearMonth, drafts);
        if (cancelled) return;

        const tasks: MonthlyTask[] =
          await monthlyTaskRepository.listByYearMonth(yearMonth);
        const expensesInMonth = filterExpensesForMonth(expenses, yearMonth);

        const rows: AllocateRow[] = accounts.map((account) => ({
          account,
          summary: summarizeAccount(account.id, expensesInMonth, tasks),
          pendingCount: tasks.filter(
            (t) => t.accountId === account.id && t.status === 'pending',
          ).length,
        }));

        setState({ phase: 'ready', rows });
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
  }, [yearMonth]);

  if (state.phase === 'loading') return <LoadingView />;
  if (state.phase === 'error') return <ErrorView message={state.message} />;
  if (state.phase === 'empty') return <EmptyView />;

  const allDone = state.rows.every((r) => r.pendingCount === 0);

  return (
    <div className="flex flex-col gap-4">
      {allDone && <AllDoneBanner />}
      <ul aria-label="口座別チェックリスト" className="flex flex-col gap-3">
        {state.rows.map((row) => (
          <li key={row.account.id}>
            <AllocateCard row={row} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function AllocateCard({ row }: { row: AllocateRow }): React.JSX.Element {
  return (
    <div className="relative">
      <AccountCard account={row.account} summary={row.summary} />
      {row.pendingCount > 0 && (
        <span
          aria-label={`未完了タスク ${row.pendingCount} 件`}
          className="pointer-events-none absolute right-3 top-3 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-paw-pink px-1.5 text-xs font-bold text-white tabular-nums"
        >
          {row.pendingCount}
        </span>
      )}
    </div>
  );
}

function AllDoneBanner(): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-sm">
      <CatFace variant="smile" className="size-10 text-brown shrink-0" />
      <div className="flex flex-col gap-0.5">
        <p className="font-semibold text-foreground">今月の振り分けはおわり</p>
        <p className="text-xs text-muted-foreground">お疲れさまでした</p>
      </div>
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
      <CatFace
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
      <CatFace variant="worried" className="size-14 text-status-over" />
      <p className="text-sm text-status-over">{message}</p>
    </div>
  );
}

function EmptyView(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-card px-5 py-10 text-center shadow-sm">
      <CatFace variant="neutral" className="size-16 text-brown" />
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-foreground">口座が登録されていません</p>
        <p className="text-sm text-muted-foreground">
          設定画面から口座を登録してください
        </p>
      </div>
      <Link
        href="/settings"
        className="mt-1 inline-flex min-h-[44px] items-center rounded-xl bg-primary px-6 py-2 font-semibold text-primary-foreground transition-opacity active:opacity-70"
      >
        設定画面へ
      </Link>
    </div>
  );
}
