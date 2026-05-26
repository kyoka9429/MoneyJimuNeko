import type { NextConfig } from 'next';

// GitHub Pages 配信用の設定。
// - output: 'export' で 100% 静的サイトを書き出す（サーバ側機能を一切使わない）
// - basePath/assetPrefix はリポジトリ名（`<user>.github.io/<repo>/`）に合わせる
// - trailingSlash: true は GitHub Pages の URL 解決と相性が良い
// - images.unoptimized: true で next/image の最適化サーバを使わない
//
// ローカル開発（pnpm dev）では basePath を空にして / で動かす。
// 本番ビルドは NEXT_PUBLIC_BASE_PATH を渡すか、デフォルトの '/MoneyJimuNeko' を使う。
//
// `||` を使うのは意図的: GitHub Actions の `${{ vars.BASE_PATH }}` は未設定時に
// 空文字列 '' を渡す。`??` は '' を弾かないため basePath='' で誤ビルドされ、
// アセットがルート参照(/_next/...)になり 404 → hydration 失敗を招く。
// '' もフォールバック対象にするため `||` を使う。
// （独自ドメインで basePath='' にしたい場合は別途フラグで対応する。todo 参照）
const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ||
  (process.env.NODE_ENV === 'production' ? '/MoneyJimuNeko' : '');

const nextConfig: NextConfig = {
  output: 'export',
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
