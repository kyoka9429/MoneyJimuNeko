// 画像 import（*.webp など → StaticImageData）の型宣言。
//
// 通常は Next.js が生成する next-env.d.ts が `next/image-types/global` を参照して
// 供給するが、next-env.d.ts は .gitignore 済みで、CI では `pnpm build` より前に
// `pnpm typecheck` が走るため未生成のまま落ちる（TS2307）。
// コミット済みのこのファイルで明示参照することで、build に依存せず型を解決する。
/// <reference types="next/image-types/global" />
