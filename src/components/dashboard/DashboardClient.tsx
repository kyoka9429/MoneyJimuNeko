'use client';

// Client component that fetches data from IndexedDB (Dexie) and renders
// the full dashboard. Kept in components/ so page.tsx stays a Server Component.
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  accountRepository,
  expenseRepository,
  incomeRepository,
  monthlyTaskRepository,
} from '@/lib/db/repositories';
import {
  calcMonthlyRemaining,
  filterExpensesForMonth,
  generateMonthlyTaskDrafts,
  summarizeAccount,
} from '@/lib/calc';
import { useUiStore } from '@/stores/uiStore';
import type { Account, MonthlyTask } from '@/types';
import type { AccountSummary, MonthlyRemaining } from '@/lib/calc';
import { RemainingHero } from './RemainingHero';
import { AccountCard } from './AccountCard';
import { CatFace } from '@/components/cat';

type DashboardData = {
  accounts: Account[];
  summaries: AccountSummary[];
  remaining: MonthlyRemaining;
};

type LoadState =
  | { phase: 'loading' }
  | { phase: 'empty' }
  | { phase: 'ready'; data: DashboardData }
  | { phase: 'error'; message: string };

export function DashboardClient(): React.JSX.Element {
  const yearMonth = useUiStore((s) => s.yearMonth);
  const [state, setState] = useState<LoadState>({ phase: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [accounts, expenses, incomes] = await Promise.all([
          accountRepository.list(),
          expenseRepository.list(),
          incomeRepository.list(),
        ]);

        if (cancelled) return;

        if (accounts.length === 0) {
          setState({ phase: 'empty' });
          return;
        }

        // Ensure monthly task drafts exist for this month (rollover)
        const drafts = generateMonthlyTaskDrafts(expenses, yearMonth);
        await monthlyTaskRepository.ensureDraftsForMonth(yearMonth, drafts);

        if (cancelled) return;

        const tasks: MonthlyTask[] =
          await monthlyTaskRepository.listByYearMonth(yearMonth);
        const expensesInMonth = filterExpensesForMonth(expenses, yearMonth);
        const remaining = calcMonthlyRemaining(incomes, expensesInMonth);
        const summaries = accounts.map((acc) =>
          summarizeAccount(acc.id, expensesInMonth, tasks),
        );

        setState({ phase: 'ready', data: { accounts, summaries, remaining } });
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

  if (state.phase === 'loading') {
    return <LoadingView />;
  }

  if (state.phase === 'error') {
    return <ErrorView message={state.message} />;
  }

  if (state.phase === 'empty') {
    return <EmptyView />;
  }

  const { accounts, summaries, remaining } = state.data;

  return (
    <div className="flex flex-col gap-4">
      <RemainingHero remaining={remaining} />

      <section aria-label="口座カード一覧" className="flex flex-col gap-3">
        {accounts.map((account) => {
          const summary = summaries.find((s) => s.accountId === account.id);
          if (!summary) return null;
          return (
            <AccountCard key={account.id} account={account} summary={summary} />
          );
        })}
      </section>
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
      <button
        onClick={() => window.location.reload()}
        className="mt-1 text-sm underline underline-offset-2 text-muted-foreground"
      >
        再読み込み
      </button>
    </div>
  );
}

function EmptyView(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-card px-5 py-10 text-center shadow-sm">
      <CatFace variant="neutral" className="size-16 text-brown" />
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-foreground">まだ口座が登録されていません</p>
        <p className="text-sm text-muted-foreground">
          設定画面から口座と支出項目を登録してください
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
