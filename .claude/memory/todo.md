# Session Handoff — MoneyJimuNeko

## Last Session

- Date: 2026-05-26
- Summary: Phase 0 完了。Next.js 16 + Tailwind v4 + shadcn/ui + Vitest + Playwright + Prettier の雛形を作成し、`pnpm typecheck/lint/build/test:unit` 全て緑。git init + 2 commits（`ba0fab7` 雛形、`f46458a` ヘルパ削除）。
- Branch: `main`
- 次回開始時の注意: ユーザーが日本語パス問題回避のためプロジェクトフォルダをリネーム予定。再開時にパスを確認すること。

## Recovery Session (2026-05-26 後半)

- 現在パス: `d:\dev_zatsh\MoneyJimuNeko`（リネーム後）
- フォルダ移動中に `src/`, `public/`, `tests/e2e/` 配下のファイルが working tree から消失（HEAD には残存）。`git restore -- public/ src/ tests/` で完全復元。
- `node_modules` の bin が壊れていたため `CI=true pnpm install --frozen-lockfile` で再構築（pnpm v10 は TTY なしだと再構築前に確認を求めるため CI=true が必要）。
- 再検証結果（全て緑）:
  - `pnpm typecheck` ✅
  - `pnpm lint` ✅
  - `pnpm test:unit` ✅ 3/3 pass
  - `pnpm build` ✅ Turbopack 1.5s + TS 2.0s、静的生成 4 ページ
- 結論: Phase 0 完了状態に完全復帰。git に未追跡の変更は memory ファイルの編集のみ。

## Pending Tasks (MVP まで)

### Phase 0: プロジェクト雛形 ✅ COMPLETED

- [x] Next.js **16** (App Router, TypeScript, Tailwind v4, src-dir, Turbopack) を初期化
- [x] runtime deps 追加: dexie / zustand / zod / clsx / cva / tailwind-merge / lucide-react / recharts
- [x] dev deps 追加: vitest / @vitejs/plugin-react / happy-dom / testing-library / @playwright/test / prettier / prettier-plugin-tailwindcss
- [x] vitest.config.ts / vitest.setup.ts / playwright.config.ts / .prettierrc.json
- [x] shadcn/ui 初期化（defaults、neutral base、shadcn v4 系の `shadcn/tailwind.css` import）
- [x] page.tsx / layout.tsx を最小スタブ化（ja lang、Noto Sans JP、tabular-nums）
- [x] `.env.example` 作成、`.gitignore` に `!.env.example` 追加
- [x] git init + 初回コミット 2 件
- [x] 検証: `pnpm typecheck` / `pnpm lint` / `pnpm build` (Turbopack 1.5s) / `pnpm test:unit` (3/3 pass)

### Phase 1: データ層 ✅ COMPLETED

- [x] `src/types/` で型定義 (Account / Expense / Income / MonthlyTask / Settings) — Zod + `z.infer` で型導出、`as const` 配列で union 型
- [x] `src/lib/db/schema.ts` で Dexie スキーマ定義 (バージョン 1) — `getDb()` 遅延初期化で SSR ガード
- [x] `src/lib/db/repositories/` 配下に各エンティティのリポジトリ — Expense/Account 削除時のカスケード対応、`ensureDraftsForMonth` で重複防止
- [x] `src/lib/calc/` に必要額・余り・月次ロールオーバーロジック (純粋関数 + Vitest)
  - `summarizeAccount` / `calcMonthlyRemaining` / `isExpenseInMonth` / `filterExpensesForMonth` / `generateMonthlyTaskDrafts` / `dedupeDraftsAgainstExisting`
  - test-engineer エージェントで TDD 実装 → code-reviewer で品質チェック → high 3 件を修正
  - 検証: typecheck / lint / build / test:unit (59 件全件 pass)

### Phase 1 残課題 (Phase 2 以降で対応)

- [ ] Repository 層の統合テスト整備（`fake-indexeddb` 導入 or Playwright で代替）
- [ ] `MonthlyTask.completedAt` の Zod `datetime()` 仕様（TZ オフセット要求）をコメントで明記
- [ ] `monthlyTaskRepository.update` の汎用 Partial 型を絞り込み（`markDone`/`markPending` の使用を強制）
- [ ] `Settings.monthStartDay` の max=28 の根拠（2 月末日考慮）をコメント化

### Phase 2: 画面 ✅ COMPLETED

- [x] PROJECTSPEC カラーパレット適用（`globals.css`、`bg-cream`/`text-brown`/`bg-paw-pink`/`text-status-*` 等）
- [x] `src/lib/format/` 通貨フォーマッタ + yearMonth ヘルパ（Vitest 12 件）
- [x] `src/components/cat/CatFace.tsx` 8bit ドット風ねこ SVG（3 表情、`currentColor` 継承）
- [x] `src/components/dashboard/` ヒーロー余り + 口座カード（mobile-first、4状態 loading/error/empty/ready）
- [x] `src/components/layout/BottomNav.tsx` ボトムナビ（ホーム / 振り分け / 設定、`usePathname` でアクティブ判定）
- [x] `src/app/page.tsx` ダッシュボード（Server Component + DashboardClient）
- [x] `src/app/settings/` 設定ハブ + 口座/支出/収入 CRUD（11 ルート、Zod validation、cascade delete 既存活用）
- [x] `src/app/accounts/[accountId]/page.tsx` チェックリスト（楽観的更新 + ロールバック、CatToast）
- [x] `src/stores/uiStore.ts` Zustand で yearMonth 管理
- [x] frontend-developer 3 回 + code-reviewer 1 回。high 4 件 + medium 主要を修正:
  - DashboardClient: summaries の位置依存 → accountId で find に変更
  - 3 つの FormClient: useEffect の cancelled flag 追加、保存失敗時のエラー表示 (`_form`)
  - 3 つの ListClient: handleDelete の try/catch + エラー表示
  - SettingsClient: 楽観的更新 + ロールバック追加
  - 5 箇所の `animate-pulse` → `motion-reduce:animate-none` 付与
  - カラープリセットボタン: 32px → 44x44px ヒット領域
  - データ管理ボタンの文字列リテラル配列を定数化
- 検証: typecheck / lint / test:unit (75/75) / build (12 ルート) すべて緑

### Phase 3: 仕上げ（部分完了）

- [x] JSON エクスポート / インポート（`src/lib/backup/`、純粋関数とブラウザ I/O を分離、Vitest 9 件）
- [x] BottomNav の `/allocate` を実装（`/allocate` 振り分けハブ画面、口座カード + 未完了件数バッジ）
- [x] CatFace に `label` props を追加（指定時 `role="img" + aria-label`、未指定時は `aria-hidden`）
- [x] E2E テスト（mobile-chrome project で 4 spec pass: 空状態 / 登録動線 / チェックリスト / BottomNav 遷移）
- [x] Dexie schema v2 migration: `expenses.name` と `incomes.payDay` のインデックス追加（E2E が SchemaError を炙り出し → migration で自動修復）

### Phase 3 残課題

- [ ] 月次ロールオーバーの能動的スケジューラ（現状: 画面アクセス時に `ensureDraftsForMonth` で受動生成、MVP 機能としては動作する）
- [ ] Repository 層の統合テスト (fake-indexeddb)
- [ ] BottomNav の safe-area-inset を本体高さに反映（iPhone home indicator 領域考慮）
- [ ] ChecklistClient の toggle 失敗時 UI フィードバック（console.error のみから昇格）
- [ ] フォーム必須マーク (`*`) の aria-required 連動
- [ ] Settings インポート成功時に画面リロード or 各 Client の reloadKey を bump する仕組み

### Phase 4: GitHub Pages 配信 + パスワードガード ✅ COMPLETED

- [x] パスワード認証層（PBKDF2-SHA256, 100k iterations）
  - `scripts/hash-password.mjs` で hash/salt 生成 CLI（`pnpm hash-password "<pw>"`）
  - `src/lib/auth/lock.ts` で WebCrypto API 利用の verify、11 件 unit テスト
  - `src/components/auth/LockGate.tsx` + `LockScreen.tsx` でアプリ全体をラップ
  - 「毎回認証」設計（React state のみで持つ、リロード再認証要求）
  - 環境変数 `NEXT_PUBLIC_AUTH_HASH` / `NEXT_PUBLIC_AUTH_SALT` 未設定なら認証スキップ（dev 開発しやすさ）
- [x] 動的ルート → クエリ文字列化（output: export 対応）
  - `/accounts/[accountId]` → `/account?id=xxx`
  - `/settings/accounts/[id]/edit` → `/settings/accounts/edit?id=xxx`（expenses / incomes も同様）
  - 4 つの Link href 更新（AccountCard, AccountsClient, ExpensesClient, IncomesClient）
  - 各ページ `'use client'` + `useSearchParams` + `Suspense` パターン
- [x] `next.config.ts`: `output: 'export'` + `basePath` + `trailingSlash: true` + `images.unoptimized: true`
- [x] `public/.nojekyll` 追加
- [x] `.github/workflows/deploy.yml` 作成（pnpm build + upload-pages-artifact + deploy-pages、AUTH_HASH/SALT は Repository Secrets、BASE_PATH は vars）
- [x] E2E を trailingSlash + クエリルートに適合
- 検証: typecheck/lint/test:unit (95件)/build (14 ルート全て静的)/e2e (4/4 pass) すべて緑

### Phase 4 デプロイ ✅ COMPLETED (2026-05-27)

- [x] GitHub リポジトリ作成（public、`gh repo create`、push 時 workflow scope 追加が必要だった）
- [x] GitHub Actions secrets 登録: `AUTH_HASH` `AUTH_SALT`（ユーザーが手元で設定）
- [x] GitHub Pages 設定（Source = GitHub Actions）
- [x] デプロイ成功（build+deploy 両ジョブ緑）。本番でパスワードガード動作確認済み（合言葉画面表示）

### Phase 4 残課題

- [ ] 独自ドメインを使う場合は `public/CNAME` + `BASE_PATH=''` に上書き
- [ ] README に「設定→デプロイ手順」セクションを追記（hash-password.mjs の使い方、secrets の入れ方）
- [ ] deploy.yml の Node.js 20 → 24 移行（GitHub Actions が 2026-06-02 以降 Node24 を強制。setup-node の node-version: 20 を 24 へ）

## Context for Next Session

- **Next.js 16 採用済み**（async params、middleware→proxy、`next lint` 撤廃、Turbopack 既定が新挙動）
- **Tailwind v4 採用済み**（`@import "tailwindcss"` 形式、`@theme inline` でトークン定義）
- **shadcn/ui v4 系** は `src/components/ui/button.tsx` と `src/lib/utils.ts` (cn ヘルパ) を生成済み
- 仕様の正は `PROJECTSPEC.md`、設計判断は `decisions.md`
- スマホ主体 (375px mobile-first)、金額は整数 (円)、IndexedDB (Dexie) ローカル完結、ねこはアクセントのみ
- Playwright プロジェクト: `mobile-chrome` (Pixel 7) / `mobile-safari` (iPhone 13) / `desktop`

## Blockers

- なし

## Open Questions（実装にすぐ影響しない、Phase 2 までに確認したい）

- 口座1・口座2 の実銀行名（設定画面のシード値）
- 妻のメイン端末（iPhone / Android）→ Playwright のデフォルトプロジェクト選択に影響
- ボーナス月の扱い（年 2 回の臨時収入を月割するか別建てか）
- ねこのスタイル方向性（線画 / 水彩 / ドット）
- **`bimonthly`（隔月）の発生月ルール**：暫定で偶数月固定。「最初の登録月を基準に隔月」にするなら Expense に `startMonth` フィールドが必要。
- **`yearly`（年次）の発生月ルール**：暫定で 1 月固定。年度始め（4 月）や任意月の年次支出を扱うなら同上。

## Memory Notes

- 日本語パス問題が出たら Node spawn (shell:false) で回避（[[japanese-path-workaround]] 参照）。ただしリネーム後は不要になる可能性。
