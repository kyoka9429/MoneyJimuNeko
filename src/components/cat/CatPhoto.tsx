'use client';

// 我が家の猫をモデルにした「事務猫さん(jimu)」「作業猫さん(sagyo)」の
// 写真ベースイラスト。笑顔/ふつう/困り顔の 3 表情を持つ。
//
// アセットは static import することで Next.js が basePath/assetPrefix を付与し、
// content hash も付く（GitHub Pages 配下の 404 / hydration 失敗の罠を回避。
// patterns.md「basePath/hydration」参照）。元 PNG は scripts/optimize-cats.mjs で
// 512px WebP（透過保持, 各 14〜24KB）へ最適化済み。
import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import jimuSmile from '@/assets/cats/jimu-smile.webp';
import jimuNeutral from '@/assets/cats/jimu-neutral.webp';
import jimuWorried from '@/assets/cats/jimu-worried.webp';
import sagyoSmile from '@/assets/cats/sagyo-smile.webp';
import sagyoNeutral from '@/assets/cats/sagyo-neutral.webp';
import sagyoWorried from '@/assets/cats/sagyo-worried.webp';

export type CatVariant = 'smile' | 'neutral' | 'worried';
export type CatCharacter = 'jimu' | 'sagyo';

const SOURCES: Record<
  CatCharacter,
  Record<CatVariant, typeof jimuSmile>
> = {
  jimu: { smile: jimuSmile, neutral: jimuNeutral, worried: jimuWorried },
  sagyo: { smile: sagyoSmile, neutral: sagyoNeutral, worried: sagyoWorried },
};

type Props = {
  // 事務猫(jimu, 既定) = マスコット / 作業猫(sagyo) = 振り分けの相棒
  character?: CatCharacter;
  variant: CatVariant;
  // サイズは Tailwind の size-N で指定（CatFace と同じ使い勝手）。
  className?: string;
  // alt を渡すと意味のある画像、未指定なら装飾扱い（alt=""）。
  alt?: string;
  priority?: boolean;
};

export function CatPhoto({
  character = 'jimu',
  variant,
  className,
  alt = '',
  priority,
}: Props): React.JSX.Element {
  return (
    <Image
      src={SOURCES[character][variant]}
      alt={alt}
      priority={priority}
      // 寸法は intrinsic(512) を className(size-N) で上書きして表示する。
      className={cn('object-contain', className)}
    />
  );
}
