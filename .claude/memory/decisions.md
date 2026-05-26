# Design Decisions — MoneyJimuNeko

| Date | Decision | Rationale | Rejected Alternatives |
|------|----------|-----------|----------------------|
| 2026-05-26 | Rule Factory v2 (full preset, claude-code target) を採用 | Claude Code + VSCode で開発するため、エージェント + hooks + MCP + Memory のフル装備が活きる | standard (specialist 抜き) / minimal (エージェントなし) |
| 2026-05-26 | フロントエンド = Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui | 短期間で完成度の高いスマホ UI を作れる。Vercel 即デプロイ可。当初 v15 を想定していたが Phase 0 着手時に `create-next-app@latest` が v16 を引いたため、破壊的変更の影響範囲（async params、middleware→proxy、キャッシュ刷新、`next lint` 撤廃）が本プロジェクト範囲では小さいことを確認のうえ v16 採用。 | v15 据え置き (新規 MVP なら最新が長持ち) / Vite + React (ルーティング・SSR を自前で持つコストが大きい) / SvelteKit (チームスキルから外れる) |
| 2026-05-26 | データ永続化 = IndexedDB (Dexie) のみ | MVP は妻一人。サーバー / 認証コストをゼロに。ローカルファーストで動作。 | Supabase 即導入 (オーバーエンジニアリング) / localStorage (件数・型に難) |
| 2026-05-26 | スマホファースト (mobile-first) を絶対前提 | 妻は普段スマホで家計を見る。PC は補助。 | デスクトップ優先設計 |
| 2026-05-26 | 金額は整数 (円) で保持 | 浮動小数点の丸め誤差を避ける | number (float) |
| 2026-05-26 | ねこ要素は「アクセントのみ」 | 数字を読み取る本体 UI を邪魔しないため | ゲーミフィケーション全振り (妻の嗜好と合うか不明) |
| 2026-05-26 | テスト基盤 = Vitest (unit) + Playwright (E2E) + happy-dom + testing-library | Vitest は Vite ベースで起動が高速、純粋関数の calc とコンポーネントの両方をカバー。Playwright は mobile-chrome/mobile-safari/desktop の 3 プロジェクトで主要動線を検証。 | Jest (Vite 連携でひと手間)、Cypress (E2E モバイル絵柄が弱め) |
| 2026-05-26 | フォーマッタ = Prettier + prettier-plugin-tailwindcss | Tailwind クラス並びの自動整列で diff ノイズを抑制。`pnpm format` で一括適用。 | Biome (現時点で ESLint との競合多い)、フォーマッタ非導入 |
| 2026-05-26 | shadcn/ui = defaults (Next.js テンプレ、neutral 基調)、`--src-dir` 構成、CSS variables | 後で PROJECTSPEC のクリーム/ブラウン/肉球ピンク配色に置き換える前提で、まず動く土台を確保。shadcn v4 系は `shadcn/tailwind.css` を npm パッケージ経由で読み込む仕様。 | カスタムテーマで初期化 (Phase 0 では過剰)、Radix UI 直接利用 (薄いラッパが欲しい) |
