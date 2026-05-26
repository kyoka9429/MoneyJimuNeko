'use client';

// Account master list client component.
// Loads accounts from IndexedDB and renders the list with edit/delete actions.
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { accountRepository } from '@/lib/db/repositories';
import type { Account } from '@/types';
import { ACCOUNT_TYPE_LABELS } from '@/components/settings/labels';
import { cn } from '@/lib/utils';
import { CatPhoto } from '@/components/cat';

export function AccountsClient(): React.JSX.Element {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Increment to trigger a reload after delete
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const list = await accountRepository.list();
      if (cancelled) return;
      setAccounts(list);
      setIsLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [reloadKey]);

  async function handleDelete(account: Account) {
    const confirmed = window.confirm(
      `「${account.name}」を削除しますか？\n紐づく支出マスタも削除されます。`,
    );
    if (!confirmed) return;
    setDeleteError(null);
    try {
      await accountRepository.remove(account.id);
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
      {accounts.length === 0 ? (
        <EmptyView />
      ) : (
        <ul className="flex flex-col gap-2" aria-label="口座一覧">
          {accounts.map((account) => (
            <li key={account.id}>
              <AccountRow account={account} onDelete={handleDelete} />
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/settings/accounts/new"
        className={cn(
          'flex min-h-[44px] items-center justify-center gap-2 rounded-2xl',
          'border-2 border-dashed border-border',
          'text-sm font-medium text-muted-foreground',
          'transition-colors hover:border-primary hover:text-primary active:opacity-70',
          'px-4 py-3',
        )}
      >
        <Plus size={18} aria-hidden="true" />
        口座を追加
      </Link>
    </div>
  );
}

type AccountRowProps = {
  account: Account;
  onDelete: (account: Account) => void;
};

function AccountRow({ account, onDelete }: AccountRowProps): React.JSX.Element {
  return (
    <div className="flex min-h-[56px] items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-sm">
      {/* Color preview */}
      <div
        className="h-8 w-8 shrink-0 rounded-full border border-border"
        style={{ backgroundColor: account.color }}
        aria-label={`カラー: ${account.color}`}
      />

      {/* Name and type */}
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <span className="truncate font-semibold text-foreground">{account.name}</span>
        <span className="text-xs text-muted-foreground">
          {ACCOUNT_TYPE_LABELS[account.type]}
        </span>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <Link
          href={`/settings/accounts/edit?id=${account.id}`}
          aria-label={`${account.name} を編集`}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground active:opacity-70"
        >
          <Pencil size={16} aria-hidden="true" />
        </Link>
        <button
          onClick={() => onDelete(account)}
          aria-label={`${account.name} を削除`}
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
      <p className="text-sm text-muted-foreground">口座がまだ登録されていません</p>
    </div>
  );
}
