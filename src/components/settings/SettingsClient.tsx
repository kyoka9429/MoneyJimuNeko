'use client';

// Settings hub client component.
// Loads app settings from IndexedDB and renders:
//   1. Master data navigation links
//   2. App settings (cat toggle, month start day)
//   3. Data management placeholders (Phase 3)
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Wallet,
  TrendingDown,
  TrendingUp,
  Download,
  Upload,
} from 'lucide-react';
import { settingsRepository } from '@/lib/db/repositories';
import type { Settings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import {
  downloadBackup,
  exportAllAsBackup,
  parseBackup,
  replaceAllFromBackup,
} from '@/lib/backup';
import { cn } from '@/lib/utils';

const MIN_MONTH_DAY = 1;
const MAX_MONTH_DAY = 28;

type NavCardItem = {
  href: string;
  label: string;
  description: string;
  Icon: typeof Wallet;
};

const NAV_ITEMS: NavCardItem[] = [
  {
    href: '/settings/accounts',
    label: '口座マスタ',
    description: '引き落とし口座の登録・編集',
    Icon: Wallet,
  },
  {
    href: '/settings/expenses',
    label: '支出マスタ',
    description: '固定費・引き落とし項目の登録・編集',
    Icon: TrendingDown,
  },
  {
    href: '/settings/incomes',
    label: '収入マスタ',
    description: '月次収入の登録・編集',
    Icon: TrendingUp,
  },
];

type BackupState =
  | { phase: 'idle' }
  | { phase: 'busy'; action: 'export' | 'import' }
  | { phase: 'success'; message: string }
  | { phase: 'error'; message: string };

export function SettingsClient(): React.JSX.Element {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backup, setBackup] = useState<BackupState>({ phase: 'idle' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    settingsRepository.get().then((s) => {
      if (cancelled) return;
      setSettings(s);
      setIsLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCatToggle(enabled: boolean) {
    const previous = settings;
    setError(null);
    setSettings({ ...previous, catEnabled: enabled }); // 楽観的更新
    try {
      const updated = await settingsRepository.update({ catEnabled: enabled });
      setSettings(updated);
    } catch (err) {
      setSettings(previous); // ロールバック
      const message = err instanceof Error ? err.message : '保存に失敗しました';
      setError(message);
    }
  }

  async function handleMonthStartDay(day: number) {
    if (day < MIN_MONTH_DAY || day > MAX_MONTH_DAY) return;
    const previous = settings;
    setError(null);
    setSettings({ ...previous, monthStartDay: day });
    try {
      const updated = await settingsRepository.update({ monthStartDay: day });
      setSettings(updated);
    } catch (err) {
      setSettings(previous);
      const message = err instanceof Error ? err.message : '保存に失敗しました';
      setError(message);
    }
  }

  async function handleExport() {
    setBackup({ phase: 'busy', action: 'export' });
    try {
      const payload = await exportAllAsBackup();
      downloadBackup(payload);
      setBackup({
        phase: 'success',
        message: 'バックアップを書き出しました',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'エクスポートに失敗しました';
      setBackup({ phase: 'error', message });
    }
  }

  function triggerImport() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(file: File) {
    setBackup({ phase: 'busy', action: 'import' });
    try {
      const text = await file.text();
      const payload = parseBackup(text);
      const confirmed = window.confirm(
        '既存のデータをすべて置き換えます。元に戻せません。よろしいですか？',
      );
      if (!confirmed) {
        setBackup({ phase: 'idle' });
        return;
      }
      await replaceAllFromBackup(payload);
      // 設定はインポート結果で上書きされたので再読込
      const fresh = await settingsRepository.get();
      setSettings(fresh);
      setBackup({
        phase: 'success',
        message: 'バックアップを読み込みました。画面を再読み込みしてください',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'インポートに失敗しました';
      setBackup({ phase: 'error', message });
    }
  }

  const isBusy = backup.phase === 'busy';

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p role="alert" className="text-sm text-status-over">
          {error}
        </p>
      )}
      {/* Master data navigation */}
      <section aria-labelledby="master-heading">
        <h2
          id="master-heading"
          className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          マスタ管理
        </h2>
        <div className="flex flex-col gap-2">
          {NAV_ITEMS.map(({ href, label, description, Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-h-[56px] items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-sm',
                'transition-opacity active:opacity-70',
              )}
            >
              <Icon
                size={20}
                className="shrink-0 text-paw-pink"
                aria-hidden="true"
              />
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="font-semibold text-foreground">{label}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </div>
              <ChevronRight
                size={18}
                className="shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* App settings */}
      <section aria-labelledby="app-settings-heading">
        <h2
          id="app-settings-heading"
          className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          アプリ設定
        </h2>
        <div className="flex flex-col gap-3 rounded-2xl bg-card px-4 py-3 shadow-sm">
          {/* Cat feature toggle */}
          <div className="flex min-h-[44px] items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">ねこ機能</span>
              <span className="text-xs text-muted-foreground">
                アニメーションと表情を有効にする
              </span>
            </div>
            <button
              role="switch"
              aria-checked={settings.catEnabled}
              aria-label="ねこ機能の切り替え"
              disabled={!isLoaded}
              onClick={() => handleCatToggle(!settings.catEnabled)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                'disabled:opacity-50',
                settings.catEnabled ? 'bg-primary' : 'bg-border',
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
                  settings.catEnabled ? 'translate-x-5' : 'translate-x-0.5',
                )}
              />
            </button>
          </div>

          <div className="border-t border-border" />

          {/* Month start day */}
          <div className="flex min-h-[44px] items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">月初日</span>
              <span className="text-xs text-muted-foreground">
                1〜28 日（チェックリスト生成の基準日）
              </span>
            </div>
            <input
              type="number"
              min={MIN_MONTH_DAY}
              max={MAX_MONTH_DAY}
              inputMode="numeric"
              disabled={!isLoaded}
              value={settings.monthStartDay}
              onChange={(e) => handleMonthStartDay(Number(e.target.value))}
              aria-label="月初日"
              className={cn(
                'w-16 rounded-lg border border-border bg-background px-2 py-1.5',
                'text-center text-sm font-medium tabular-nums text-foreground',
                'outline-none focus:border-ring focus:ring-2 focus:ring-ring/30',
                'disabled:opacity-50',
              )}
            />
          </div>
        </div>
      </section>

      {/* Data management */}
      <section aria-labelledby="data-heading">
        <h2
          id="data-heading"
          className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          データ管理
        </h2>
        <div className="flex flex-col gap-2 rounded-2xl bg-card px-4 py-3 shadow-sm">
          <button
            type="button"
            onClick={handleExport}
            disabled={isBusy}
            className={cn(
              'flex min-h-[44px] w-full items-center gap-3 rounded-lg px-1 py-2 text-left',
              'text-sm text-foreground transition-opacity active:opacity-70',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            <Download size={18} className="text-paw-pink" aria-hidden="true" />
            <span className="flex-1">JSON エクスポート</span>
          </button>

          <button
            type="button"
            onClick={triggerImport}
            disabled={isBusy}
            className={cn(
              'flex min-h-[44px] w-full items-center gap-3 rounded-lg px-1 py-2 text-left',
              'text-sm text-foreground transition-opacity active:opacity-70',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            <Upload size={18} className="text-paw-pink" aria-hidden="true" />
            <span className="flex-1">JSON インポート</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImportFile(file);
              }
              // 同じファイルを再度選んだときも change が発火するようにリセット
              e.target.value = '';
            }}
          />

          {backup.phase === 'success' && (
            <p role="status" className="text-xs text-status-comfortable">
              {backup.message}
            </p>
          )}
          {backup.phase === 'error' && (
            <p role="alert" className="text-xs text-status-over">
              {backup.message}
            </p>
          )}
          {backup.phase === 'busy' && (
            <p role="status" className="text-xs text-muted-foreground">
              {backup.action === 'export' ? '書き出し中…' : '読み込み中…'}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
