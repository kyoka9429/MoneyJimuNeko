'use client';

// クライアントサイドのパスワードガード。
// アプリ全体を覆い、unlock 状態を React state にだけ保持する。
// 「毎回認証」設計のため永続ストレージは使わない（リロードで再認証要求）。
// 詳細は src/lib/auth/lock.ts ヘッダコメント参照。
import React, { useState } from 'react';
import { getConfiguredAuth, isAuthConfigured, verifyPassword } from '@/lib/auth';
import { LockScreen } from './LockScreen';

type Props = {
  children: React.ReactNode;
};

export function LockGate({ children }: Props): React.JSX.Element {
  // ハッシュ未設定（ローカル開発で .env.local が空）なら認証をスキップして
  // 開発体験を妨げない。本番ビルドは GitHub Actions が必ず env を渡す前提。
  const configured = isAuthConfigured();
  const [unlocked, setUnlocked] = useState(!configured);

  if (unlocked) {
    return <>{children}</>;
  }

  return <LockScreen onUnlock={() => setUnlocked(true)} verify={verify} />;
}

async function verify(input: string): Promise<boolean> {
  const { hash, salt } = getConfiguredAuth();
  if (!hash || !salt) return false;
  return verifyPassword(input, hash, salt);
}
