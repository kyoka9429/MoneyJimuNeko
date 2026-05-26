'use client';

// Expense master list client component.
// Shows all expenses with account name, amount (right-aligned), edit/delete.
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { accountRepository, expenseRepository } from '@/lib/db/repositories';
import type { Account, Expense } from '@/types';
import { formatYen } from '@/lib/format';
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_FREQUENCY_LABELS,
} from '@/components/settings/labels';
import { cn } from '@/lib/utils';
import { CatFace } from '@/components/cat';

export function ExpensesClient(): React.JSX.Element {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accountMap, setAccountMap] = useState<Map<string, Account>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [expList, accList] = await Promise.all([
        expenseRepository.list(),
        accountRepository.list(),
      ]);
      if (cancelled) return;
      setExpenses(expList);
      setAccountMap(new Map(accList.map((a) => [a.id, a])));
      setIsLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [reloadKey]);

  async function handleDelete(expense: Expense) {
    const confirmed = window.confirm(`「${expense.name}」を削除しますか？`);
    if (!confirmed) return;
    setDeleteError(null);
    try {
      await expenseRepository.remove(expense.id);
      setReloadKey((k) => k + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : '削除に失敗しました';
      setDeleteError(message);
    }
  }

  if (isLoading) {
    return <LoadingView />;
  }

  // No accounts registered yet — prompt to create one first
  if (accountMap.size === 0) {
    return <NoAccountView />;
  }

  return (
    <div className="flex flex-col gap-4">
      {deleteError && (
        <p role="alert" className="text-sm text-status-over">
          {deleteError}
        </p>
      )}
      {expenses.length === 0 ? (
        <EmptyView />
      ) : (
        <ul className="flex flex-col gap-2" aria-label="支出一覧">
          {expenses.map((expense) => (
            <li key={expense.id}>
              <ExpenseRow
                expense={expense}
                account={accountMap.get(expense.accountId)}
                onDelete={handleDelete}
              />
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/settings/expenses/new"
        className={cn(
          'flex min-h-[44px] items-center justify-center gap-2 rounded-2xl',
          'border-2 border-dashed border-border',
          'text-sm font-medium text-muted-foreground',
          'transition-colors hover:border-primary hover:text-primary active:opacity-70',
          'px-4 py-3',
        )}
      >
        <Plus size={18} aria-hidden="true" />
        支出項目を追加
      </Link>
    </div>
  );
}

type ExpenseRowProps = {
  expense: Expense;
  account: Account | undefined;
  onDelete: (expense: Expense) => void;
};

function ExpenseRow({ expense, account, onDelete }: ExpenseRowProps): React.JSX.Element {
  return (
    <div className="flex min-h-[56px] items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-sm">
      {/* Name, account name, category / frequency */}
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <span className="truncate font-semibold text-foreground">{expense.name}</span>
        <span className="text-xs text-muted-foreground">
          {account?.name ?? '口座不明'} ·{' '}
          {EXPENSE_CATEGORY_LABELS[expense.category]} ·{' '}
          {EXPENSE_FREQUENCY_LABELS[expense.frequency]}
        </span>
      </div>

      {/* Amount (right-aligned) */}
      <span className="shrink-0 font-semibold tabular-nums text-foreground">
        {formatYen(expense.amount)}
      </span>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <Link
          href={`/settings/expenses/edit?id=${expense.id}`}
          aria-label={`${expense.name} を編集`}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground active:opacity-70"
        >
          <Pencil size={16} aria-hidden="true" />
        </Link>
        <button
          onClick={() => onDelete(expense)}
          aria-label={`${expense.name} を削除`}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-destructive active:opacity-70"
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
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

function EmptyView(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-5 py-8 text-center shadow-sm">
      <CatFace variant="neutral" className="size-12 text-brown" />
      <p className="text-sm text-muted-foreground">支出項目がまだ登録されていません</p>
    </div>
  );
}

function NoAccountView(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-card px-5 py-10 text-center shadow-sm">
      <CatFace variant="worried" className="size-14 text-status-tight" />
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-foreground">口座が登録されていません</p>
        <p className="text-sm text-muted-foreground">
          支出項目を追加するには、先に口座を登録してください
        </p>
      </div>
      <Link
        href="/settings/accounts/new"
        className="mt-1 inline-flex min-h-[44px] items-center rounded-xl bg-primary px-6 py-2 font-semibold text-primary-foreground transition-opacity active:opacity-70"
      >
        口座を追加する
      </Link>
    </div>
  );
}
