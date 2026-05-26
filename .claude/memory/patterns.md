# Discovered Patterns — MoneyJimuNeko

## Good Patterns

- **Server Component shell + `*Client.tsx`**: `page.tsx` は薄いシェル、IndexedDB を触る実体は client 側に寄せる。SSR エラー回避と Server Components の利点を両立。
- **4状態 UI (loading/empty/error/ready)**: データ取得を要する画面は判別可能な `discriminated union` の `state` で持つと UI 分岐が明確になる。失敗時のメッセージとリトライまでセットで提供。
- **楽観的更新 + previous state ロールバック**: `await` 失敗時に previous スナップショットへ setState。CLAUDE.md "Fail loud" にも合致（ユーザーには `setError` で見せる）。
- **`reloadKey` カウンタによる再フェッチ**: `useEffect` の依存配列に組み込むだけで、mutation 後の再取得が制御しやすい。useCallback の罠回避。
- **`cancelled` flag**: 全 `useEffect` の async 初期化に必須。unmount 後 setState を防ぐ。AbortController が使えない外部 SDK (Dexie 等) でも機能する。
- **`as const` 配列 → union 型 + ラベルマップ**: `EXPENSE_CATEGORIES = [...] as const` から `(typeof X)[number]` で型導出。日本語ラベルは `Record<X, string>` で別ファイル管理。drift 防止。
- **純粋関数化してから Repository に組み込む**: ロールオーバー重複防止のような副作用混じりロジックも、`dedupeDraftsAgainstExisting(drafts, existing)` のような純粋関数を切り出せば Vitest 単体テスト可能。

## Anti-Patterns

- **env フォールバックに `??` を使うと GitHub Actions の空 vars で壊れる**: GitHub Actions の `${{ vars.X }}` は未設定時に空文字列 `''` を渡す。`process.env.FOO ?? default` は `''` を弾かない（nullish のみ）ため、空文字列がそのまま採用される。`next.config.ts` の `basePath` でこれを踏み、本番ビルドで `basePath=''` → 全アセットが `/_next/...`（ルート参照）→ GitHub Pages 配下では 404 → **hydration 失敗（入力欄に打てるがボタン/トグルが無反応）**。対策: env フォールバックは `||` を使う。検証: `pnpm build` 後 `out/index.html` の `_next` パスに basePath が付いているか grep で確認。
- **hydration 失敗の見分け方**: 「静的 HTML は表示されるが、入力欄に文字は打てるのにボタンやトグルが一切反応しない」= JS が動いていないサイン。まず本番 HTML の `<script src>` パスが 404 になっていないか（basePath ズレ）を疑う。

## Recurring Issues → Rule Candidates

- **Dexie インデックス漏れ**: `repository.list()` で `orderBy('field')` を使うとき、その field が `version(N).stores({...})` のインデックス文字列に含まれていないと `SchemaError` で実行時失敗する。型では検出できず、unit テストでもスタブ越しでは見えない。E2E が初回検出。**新規 repository メソッド追加時はスキーマと並走で確認するルール候補**。
  - 修復方法: `version(M)` を併記（M = N + 1）、`.stores({...})` でインデックス追加。Dexie が自動 migration。

## Recovery Recipes

### フォルダ移動でファイル消失したとき

1. `git status` で deleted のみ・追加変更なしを確認（HEAD に残っていれば復元可能）
2. `git restore -- <消失パス>...` で working tree を HEAD と一致させる
3. `node_modules` の bin が壊れていることが多いので `CI=true pnpm install --frozen-lockfile` で再構築
   - pnpm v10 は TTY なしだと `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` を出すため CI=true が必須
   - Bash tool は POSIX シェルなので `CI=true cmd` 形式、PowerShell ではない
4. 検証: typecheck → lint → test:unit → build の順で全部緑を確認
