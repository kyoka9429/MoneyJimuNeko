'use client';

// パスワード入力画面。LockGate からのみ呼ばれる。
// PBKDF2 は 100k 回反復で 100-300ms 程度かかるため busy 表示は重要。
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
  // 合言葉はひらがなも許容するため、デフォルトは表示状態にして IME を効かせる。
  // type="password" だとブラウザが IME を強制オフにして日本語が打てない。
  const [reveal, setReveal] = useState(true);

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
            <div className="relative">
              <Input
                id="lock-password"
                type={reveal ? 'text' : 'password'}
                autoComplete="off"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isBusy}
                aria-invalid={!!error}
                placeholder="ひらがなの合言葉"
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setReveal((v) => !v)}
                aria-label={reveal ? '合言葉を隠す' : '合言葉を表示'}
                aria-pressed={reveal}
                className="absolute inset-y-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              >
                {reveal ? (
                  <EyeOff size={18} aria-hidden="true" />
                ) : (
                  <Eye size={18} aria-hidden="true" />
                )}
              </button>
            </div>
          </Field>

          <Button
            type="submit"
            size="lg"
            disabled={isBusy || password.trim().length === 0}
            className="w-full"
          >
            {isBusy ? '確認中…' : '鍵を開ける'}
          </Button>
        </form>
      </div>
    </main>
  );
}
