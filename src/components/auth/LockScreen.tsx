'use client';

// パスワード入力画面。LockGate からのみ呼ばれる。
// PBKDF2 は 100k 回反復で 100-300ms 程度かかるため busy 表示は重要。
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { CatFace } from '@/components/cat';

type Props = {
  onUnlock: () => void;
  verify: (input: string) => Promise<boolean>;
};

export function LockScreen({ onUnlock, verify }: Props): React.JSX.Element {
  const [password, setPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isBusy) return;
    setIsBusy(true);
    setError(null);
    try {
      const ok = await verify(password);
      if (ok) {
        onUnlock();
      } else {
        setError('合言葉が違います');
      }
    } catch {
      setError('認証処理に失敗しました');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main
      data-testid="lock-screen"
      className="flex flex-1 flex-col items-center justify-center px-6 py-12"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <CatFace
          variant={error ? 'worried' : 'neutral'}
          className="size-24 text-brown"
          label="MoneyJimuNeko"
        />

        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-xl font-bold text-foreground">合言葉を教えて</h1>
          <p className="text-sm text-muted-foreground">
            このおさいふは家族専用です
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
          <Field label="合言葉" htmlFor="lock-password" error={error ?? undefined} required>
            <Input
              id="lock-password"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isBusy}
              aria-invalid={!!error}
            />
          </Field>

          <Button
            type="submit"
            size="lg"
            disabled={isBusy || password.length === 0}
            className="w-full"
          >
            {isBusy ? '確認中…' : '鍵を開ける'}
          </Button>
        </form>
      </div>
    </main>
  );
}
