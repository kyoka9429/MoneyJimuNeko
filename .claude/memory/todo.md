# Session Handoff — MoneyJimuNeko

## Last Session
- Date: 2026-05-26
- Summary: Rule Factory v2 full preset を適用。CLAUDE.md / PROJECTSPEC.md / 12 体のエージェント定義を整備。

## Pending Tasks (MVP まで)

### Phase 0: プロジェクト雛形
- [x] Next.js **16** (App Router, TypeScript, Tailwind v4, src-dir, Turbopack) を初期化
- [x] runtime deps 追加: dexie / zustand / zod / clsx / class-variance-authority / tailwind-merge / lucide-react / recharts
- [x] dev deps 追加: vitest / @vitejs/plugin-react / happy-dom / testing-library (react+dom+jest-dom+user-event) / @playwright/test / prettier / prettier-plugin-tailwindcss
- [x] vitest.config.ts / vitest.setup.ts / playwright.config.ts / .prettierrc.json 作成
- [x] shadcn/ui 初期化 (defaults, neutral base)
- [x] `.env.example` 作成 (MVP では空)、`.gitignore` に `!.env.example` を追加
- [x] page.tsx / layout.tsx を MoneyJimuNeko 用に最小化 (ja lang、Noto Sans JP、ヒーロー文言)
- [ ] git init + 初回コミット
- [ ] Phase 0 検証: `pnpm typecheck` `pnpm lint` `pnpm build` `pnpm test:unit`

### Phase 1: データ層
- [ ] `lib/db/schema.ts` で Dexie スキーマ定義 (Account / Expense / Income / MonthlyTask / Settings)
- [ ] `lib/db/repositories/` 配下に各エンティティのリポジトリを実装
- [ ] `lib/calc/` に必要額・余り・月次ロールオーバーロジック (純粋関数 + Vitest)

### Phase 2: 画面
- [ ] `app/(dashboard)/page.tsx`：ヒーロー余り＋口座カード3枚
- [ ] `components/cat/` でねこ表情 SVG (笑顔・ふつう・困り顔)
- [ ] `app/settings/` で支出マスタ CRUD
- [ ] チェックリスト画面 (口座カード→タップで遷移)

### Phase 3: 仕上げ
- [ ] JSON エクスポート / インポート機能
- [ ] 月次ロールオーバーの自動化 (クライアント側スケジューラ)
- [ ] E2E テスト (主要動線：振り分け→チェック→余り更新)
- [ ] Vercel にデプロイ

## Context for Next Session
- 仕様の正は `PROJECTSPEC.md`
- **スマホ主体 (375px mobile-first) が最重要前提**
- 金額は整数 (円) で扱う
- ねこは「アクセントのみ」(金額・フォームには重ねない)
- IndexedDB(Dexie) + ローカル完結。サーバー DB なし。

## Blockers
- なし

## Open Questions (要確認)
- 口座1・口座2の実銀行名
- メイン端末 (iPhone / Android)
- ボーナス月の扱い
- ねこのスタイル方向性 (線画 / 水彩 / ドット)
