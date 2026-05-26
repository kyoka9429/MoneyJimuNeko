# MoneyJimuNeko

## Project Identity

- **Name**: MoneyJimuNeko
- **Type**: web-app
- **Language**: TypeScript
- **Framework**: Next.js 16 (App Router, Turbopack default, React 19)
- **Package Manager**: pnpm
- **Runtime**: Node.js 20+

## Operating Principles

### Core Rules

1. **Read before write** — 変更対象のコードを必ず読んでから編集する。推測で書かない。
2. **Minimal change** — 要求された範囲だけを変更する。関連しそうだが依頼されていないリファクタは提案に留める。
3. **Evidence-based** — 推奨には根拠（ファイル:行番号、ドキュメントURL、テスト結果）を示す。
4. **Fail loud** — エラーを握りつぶさない。問題があれば即座に報告する。
5. **Ask, don't assume** — 要件が曖昧なら確認する。3つ以上の解釈が可能なら必ず聞く。
6. **Verify, don't trust** — 実装後は必ずテスト/ビルドで検証する。動作確認なしに完了を宣言しない。
7. **Decide and document** — 重要な判断には理由を記録する。将来の自分（と次のセッション）のために。

### Quality Standards

- テストカバレッジ目標: 70%
- コミット前に lint + type-check + テスト を通す
- セキュリティ: ハードコードされた秘密情報は絶対にコミットしない
- 型安全: any/unknown の使用は最小限に
- 不変性: オブジェクトの直接変更を避ける
- エラーハンドリング: 例外を握りつぶさず適切に処理

### Communication

- 日本語で応答（コード内コメントは英語）
- 技術的な説明は簡潔に、背景が必要なときだけ詳しく
- 進捗は TODO リストで可視化
- 重要な設計判断は Memory に記録

## Architecture

```
src/
├── app/                # Next.js App Router (page.tsx, layout.tsx)
│   ├── (dashboard)/    # ダッシュボード画面
│   ├── settings/       # 支出マスタ管理
│   └── api/            # 必要に応じて (MVP は最小限)
├── components/         # UI コンポーネント
│   ├── ui/             #   shadcn/ui ベース
│   ├── cat/            #   ねこ SVG・表情コンポーネント
│   └── dashboard/      #   口座カード・余り表示
├── lib/
│   ├── db/             #   Dexie (IndexedDB) スキーマ・リポジトリ
│   ├── calc/           #   必要額・余り計算ロジック
│   └── format/         #   通貨フォーマッタ
├── stores/             # Zustand ストア
├── types/              # 型定義
└── styles/             # globals.css (Tailwind)
```

### Key Files

| ファイル | 役割 |
|---------|------|
| src/app/page.tsx | エントリーポイント |
| next.config.mjs | メイン設定 |
| .env.example | 環境変数テンプレート |
| .claude/memory/ | セッション間メモリ |

### Module Dependencies

- `components/dashboard/` → `lib/calc/`, `lib/db/`, `stores/`
- `lib/calc/` → `lib/db/` (純粋関数として実装)
- `stores/` → `lib/db/` (リポジトリ経由のみ)
- `components/cat/` は他に依存しない (純粋なプレゼンテーション)

## Commands

```bash
pnpm dev          # 開発サーバー
pnpm test         # テスト（全体）
pnpm test:unit    # 単体テスト
pnpm test:e2e     # E2Eテスト
pnpm build        # ビルド
pnpm lint         # Lint
pnpm typecheck    # 型チェック
pnpm format       # フォーマット
```

## Git Conventions

- ブランチ: `feature/MJN-short-description`
- コミット: Conventional Commits 形式
- PR: 変更要約 + テスト計画 + 影響範囲

### Commit Metadata

重要なコミットには以下のトレーラーを付与:

```
Constraint: 制約条件（なぜこの方法でなければならないか）
Rejected: 検討して却下した代替案 | 却下理由
Confidence: high | medium | low
Scope-risk: narrow | moderate | broad
```

## Coding Style

- 関数は 50 行以下を目標
- Server Components をデフォルトに。`'use client'` は必要最小限
- 金額は内部的に整数 (円単位) で扱い、丸め誤差を回避
- Dexie 操作は `lib/db/repositories/` に集約。コンポーネントから直接 IndexedDB を触らない
- Tailwind クラスは `clsx` / `cva` でバリアント管理、長大なクラス文字列を避ける
- フォーム入力は Zod でバリデーション

### Universal Rules

- 関数は 50 行以下を目標（超える場合は分割を検討）
- ネスト深度は最大 3
- 早期リターンを優先
- マジックナンバー禁止（定数化する）
- コメントは「なぜ」を書く（「何を」はコードで表現）

## Agent System

### Model Routing

| モデル | 用途 | 起動条件 |
|-------|------|---------|
| haiku | 軽量検索・情報収集 | knowledge-explorer, 単純な検索タスク |
| sonnet | 標準的な実装・レビュー | code-reviewer, debugger, executor, test-engineer |
| opus | アーキテクチャ分析・深い推論 | planner, architect, project-orchestrator |

### Agent Catalog

#### Core Agents (全プリセット共通)

| エージェント | モデル | 役割 |
|------------|-------|------|
| planner | opus | タスクの実行計画を作成。インタビュー→探索→計画生成 |
| code-reviewer | sonnet | コード品質レビュー（READ-ONLY）。severity + file:line |
| debugger | sonnet | バグ診断と修正。Reproduce→Diagnose→Fix→Verify |
| executor | sonnet | 計画に従ったタスク実行。テスト実行→完了報告 |

#### Quality Agents (standard 以上)

| エージェント | モデル | 役割 |
|------------|-------|------|
| architect | opus | アーキテクチャ分析（READ-ONLY）。根本原因特定 + trade-off |
| security-reviewer | sonnet | セキュリティ監査。OWASP準拠、脆弱性検出 |
| test-engineer | sonnet | テスト作成・実行。TDD: Red→Green→Refactor |
| chaos-engineer | sonnet | 障害注入・レジリエンス検証。blast radius制御 + 自動rollback |

#### Knowledge Agents (Second Brain)

| エージェント | モデル | 役割 |
|------------|-------|------|
| knowledge-explorer | haiku | プロジェクト知識の並列検索・統合 |
| note-writer | sonnet | 思考の構造化、memory ファイル管理 |
| project-orchestrator | opus | 自律タスクチェーン。優先度スコアリング + ガードレール |

#### Specialist Agent (プロジェクトタイプ: web-app)

| エージェント | モデル | 役割 |
|------------|-------|------|
| frontend-developer | sonnet | web-app プロジェクト専門の実装支援 |

### Delegation Rules

| タスク種別 | 戦略 | 使用エージェント |
|-----------|------|----------------|
| 単純な修正・追加 | 直接実行 | — |
| 複数ファイルの変更 | plan → implement → verify | planner → executor → code-reviewer |
| バグ修正 | diagnose → fix → verify | debugger |
| アーキテクチャ判断 | 分析 → 選択肢提示 → 承認後 | architect → planner |
| セキュリティ関連 | audit → fix → re-audit | security-reviewer → executor → security-reviewer |
| テスト追加 | coverage分析 → 作成 → 実行 | test-engineer |
| 知識検索 | 並列探索 → 統合 | knowledge-explorer |
| ドキュメント更新 | 構造化 → 記録 | note-writer |
| 自律タスクチェーン | 優先度判定 → 連鎖実行 | project-orchestrator |

### Verification Protocol

実装完了後のチェックリスト:

1. テストが通るか（既存 + 新規）
2. 型チェックが通るか
3. lint エラーがないか
4. セキュリティ上の懸念がないか
5. パフォーマンスへの影響がないか
6. ドキュメントの更新が必要か

## Memory & Knowledge Management

### Session Memory (.claude/memory/)

| ファイル | 用途 | 更新タイミング |
|---------|------|--------------|
| `decisions.md` | 設計判断ログ | 重要な判断のたびに |
| `patterns.md` | パターン/アンチパターン | 発見時 |
| `todo.md` | セッション引き継ぎ | セッション終了前 |
| `sessions.log` | セッション履歴 | 自動 |

### Memory Security

**memory ファイルに以下の情報を絶対に記録しないこと:**
- API キー、トークン、秘密鍵
- パスワード、認証情報
- 個人情報（メールアドレス、ユーザーID等）
- 本番環境の接続先URL・認証情報

### Knowledge Lifecycle

```
発見 → 記録（memory/patterns.md）
  → 反復確認（3回以上）
    → ルール昇格（CLAUDE.md に追記）
      → 定期見直し（月1回、不要なルールを整理）
```

### Session Start Protocol

1. `.claude/memory/todo.md` を読み込む
2. 未完了タスクの状態を確認
3. 前回の decisions.md から文脈を復元
4. 今回のセッションの目標を確認

### Session End Protocol

1. 完了タスクを記録
2. 未完了タスクと次のステップを todo.md に記録
3. 今回の設計判断を decisions.md に追記
4. 発見したパターンを patterns.md に追記
5. sessions.log にエントリを追加

## Project-Specific Rules

### Primary Device (最重要前提)

- **このアプリはスマホでの使用が主体になる**。妻が片手で操作することを前提に設計する。
- ブレークポイント設計は **mobile-first**：375px (iPhone SE) を基準にレイアウトし、PC は後付けで適応。
- タップ領域は最低 44x44px。数字入力には `inputMode="numeric"` を必ず指定。
- スクロールせずに「今月のあと余り」＋「口座カード 3 枚」がファーストビューに収まることを目標とする。
- `viewport` メタタグで `user-scalable=no` は使わない（アクセシビリティ配慮）。
- PWA 化は v0.2 で検討（ホーム画面追加・オフライン対応）。

### Domain Rules

- 通貨は日本円固定。表示は `¥1,234,567` 形式（千区切り）、負値は赤＋括弧表記。
- 金額は内部的に整数（円）で持つ。`100.1` のような小数を発生させない。
- 月次データは `yearMonth`（`YYYY-MM`）をキーに管理。月初 1 日にロールオーバー処理を走らせる。
- 口座種別は `bank` / `cash` / `other` の 3 種に固定（MVP）。

### Cat Accent Rules

- ねこ要素はアクセントのみ。金額表示やフォームには重ねない。
- 表情パターンは 3 種（笑顔・ふつう・困り顔）。SVG はインライン、外部画像にしない。
- アニメーションは `prefers-reduced-motion` を尊重し、無効時は即座に静止状態に。

### Data Persistence Rules

- MVP は IndexedDB（Dexie）のみ。サーバー DB を持たない。
- JSON エクスポート / インポートのバックアップ機能を必ず用意する。
- 認証は MVP では実装しない。将来 Supabase Auth で拡張する前提で `userId` フィールドを残しておく（固定値 `local-user`）。

### Reference Documents

- 仕様の正：`PROJECTSPEC.md`（プロジェクトルート）
- 設計判断ログ：`.claude/memory/decisions.md`
- セッション間引き継ぎ：`.claude/memory/todo.md`

## Error Recovery

| エラー種別 | 対応 |
|-----------|------|
| ビルドエラー | エラーメッセージを分析 → 原因箇所を特定 → 修正 → 再ビルド |
| テスト失敗 | 失敗テストを読む → 期待値と実際値を比較 → コード修正 → 再実行 |
| 型エラー | 型定義を確認 → 不整合を解消 → 再チェック |
| Lint エラー | 自動修正を試行 → 手動修正が必要なら対応 |
| 3回失敗 | 手を止めて状況を報告。別のアプローチを提案。 |

## Claude Code Environment

### Hooks

このプロジェクトでは以下の hooks が設定されています:

| Hook | トリガー | 動作 |
|------|---------|------|
| SessionStart | セッション開始 | memory/todo.md と decisions.md を読み込み |
| PreToolUse (Bash) | git push 実行前 | ブランチとリモートの確認リマインド |
| PreToolUse (Bash) | 危険コマンド検出 | rm -rf /, sudo, curl\|bash をブロック |
| PostToolUse (Write\|Edit) | ファイル編集後 | lint 自動実行 |
| PostToolUse (Write\|Edit) | ファイル編集後 | 型チェック自動実行 |
| Stop | セッション終了 | sessions.log に記録を追加 |

### MCP Servers

利用可能な MCP サーバー:

- **sequential-thinking** — 複雑な推論を段階的に処理
- **github** — GitHub PR/Issue 操作（有効時のみ）
- **context7** — ライブラリ/フレームワーク最新ドキュメント参照（有効時のみ）

### Agent Execution

エージェントは `.claude/agents/` に定義されています。Task tool で起動:

```
Task tool → subagent_type に直接指定はできないため、
general-purpose エージェントを起動し、プロンプト内に
エージェント定義の指示を埋め込んで使用する。
```

利用可能なカスタムコマンド（.claude/commands/ 配下）:

| コマンド | 機能 |
|---------|------|
| `/plan` | タスクの計画を作成（planner エージェント起動） |
| `/review` | コードレビューを実行（code-reviewer エージェント起動） |
| `/debug` | バグの診断と修正（debugger エージェント起動） |
| `/test` | テスト作成・実行（test-engineer エージェント起動） |
| `/explore` | プロジェクト知識を並列検索（knowledge-explorer 起動） |
| `/orchestrate` | 自律タスクチェーン実行（project-orchestrator 起動） |

### Permissions

settings.json で以下を制御:
- **Allow**: パッケージマネージャ実行、Git 読み取り操作、ファイル操作
- **Deny**: 破壊的コマンド（rm -rf, force push, sudo）、機密ファイルアクセス

### 3-Layer Architecture (Claude Code)

```
┌─ Layer 3: Always-On（CI/CD 連携・将来拡張）────────────┐
│  GitHub Actions / cron での自動実行                      │
│  • 定期 Inbox 整理、週次レビュー、Issue 自動アサイン       │
└─────────────────────────────────────────────────────────┘
        ↑ triggers
┌─ Layer 2: Judgment（自律判断）──────────────────────────┐
│  project-orchestrator エージェント                       │
│  • todo.md → 優先度スコアリング → タスクチェーン実行      │
│  • ブロッカー自動検出 → スキップ or 人間に質問            │
│  • ガードレール: 最大3タスク/チェーン、3エラーで停止       │
└─────────────────────────────────────────────────────────┘
        ↑ executes
┌─ Layer 1: Execution（コマンド + エージェント群）─────────┐
│  /plan → /work → /review のワークフロー                 │
│  planner → executor → code-reviewer のチェーン           │
└─────────────────────────────────────────────────────────┘
```

---
<!-- Rule Factory v2.0 | Preset: full | Target: claude-code -->
