'use client';

// Dashboard header showing current yearMonth and cat logo (PROJECTSPEC §5.1).
// CatFace is small here and used as a logo accent — not on top of numbers.
import React from 'react';
import { CatFace } from '@/components/cat';
import { useUiStore } from '@/stores/uiStore';
import { formatYearMonthJa } from '@/lib/format';

export function DashboardHeader(): React.JSX.Element {
  const yearMonth = useUiStore((s) => s.yearMonth);
  const title = `${formatYearMonthJa(yearMonth)}のおさいふ`;

  return (
    <header className="flex items-center justify-between px-4 py-3">
      <h1 className="text-lg font-bold text-foreground leading-tight">
        {title}
      </h1>
      {/* Cat logo — accent only, not overlaid on numeric content */}
      <CatFace
        variant="neutral"
        className="size-8 text-brown"
        label="MoneyJimuNeko"
      />
    </header>
  );
}
