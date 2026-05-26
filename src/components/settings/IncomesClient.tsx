'use client';

// Income master list client component.
// Lists incomes ordered by payDay with edit/delete actions.
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { incomeRepository } from '@/lib/db/repositories';
import type { Income } from '@/types';
import { formatYen } from '@/lib/format';
import { cn } from '@/lib/utils';
import { CatPhoto } from '@/components/cat';
import { INCOME_FREQUENCY_LABELS } from '@/components/settings/labels';

export function IncomesClient(): React.JSX.Element {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const list = await incomeRepository.list();
      if (cancelled) return;
      setIncomes(list);
      setIsLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [reloadKey]);

  async function handleDelete(income: Income) {
    const confirmed = window.confirm(`「${income.name}」を削除しますか？`);
    if (!confirmed) return;
    setDeleteError(null);
    try {
      await incomeRepository.remove(income.id);
      setReloadKey((k) => k + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : '削除に失敗しました';
      setDeleteError(message);
    }
  }

  if (isLoading) {
    return <LoadingView />;
  }

  return (
    <div className="flex flex-col gap-4">
      {deleteError && (
        <p role="alert" className="text-sm text-status-over">
          {deleteError}
        </p>
      )}
      {incomes.length === 0 ? (
        <EmptyView />
      ) : (
        <ul className="flex flex-col gap-2" aria-label="収入一覧">
          {incomes.map((income) => (
            <li key={income.id}>
              <IncomeRow income={income} onDelete={handleDelete} />
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/settings/incomes/new"
        className={cn(
          'flex min-h-[44px] items-center justify-center gap-2 rounded-2xl',
          'border-2 border-dashed border-border',
          'text-sm font-medium text-muted-foreground',
          'transition-colors hover:border-primary hover:text-primary active:opacity-70',
          'px-4 py-3',
        )}
      >
        <Plus size={18} aria-hidden="true" />
        収入項目を追加
      </Link>
    </div>
  );
}

type IncomeRowProps = {
  income: Income;
  onDelete: (income: Income) => void;
};

function IncomeRow({ income, onDelete }: IncomeRowProps): React.JSX.Element {
  return (
    <div className="flex min-h-[56px] items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-sm">
      {/* Name, source, payDay */}
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <span className="truncate font-semibold text-foreground">{income.name}</span>
        <span className="text-xs text-muted-foreground">
          {income.source} · {INCOME_FREQUENCY_LABELS[income.frequency]}{' '}
          {income.payDay} 日
        </span>
      </div>

      {/* Amount (right-aligned) */}
      <span className="shrink-0 font-semibold tabular-nums text-status-comfortable">
        {formatYen(income.amount)}
      </span>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <Link
          href={`/settings/incomes/edit?id=${income.id}`}
          aria-label={`${income.name} を編集`}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground active:opacity-70"
        >
          <Pencil size={16} aria-hidden="true" />
        </Link>
        <button
          onClick={() => onDelete(income)}
          aria-label={`${income.name} を削除`}
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
      <CatPhoto
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
      <CatPhoto variant="neutral" className="size-12 text-brown" />
      <p className="text-sm text-muted-foreground">収入項目がまだ登録されていません</p>
    </div>
  );
}
