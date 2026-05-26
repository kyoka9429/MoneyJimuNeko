// Page header with optional back navigation.
// Used across all settings sub-pages for consistent layout.
import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: string;
  backHref?: string;
  backLabel?: string;
  className?: string;
};

export function PageHeader({
  title,
  backHref,
  backLabel = '戻る',
  className,
}: PageHeaderProps): React.JSX.Element {
  return (
    <header className={cn('flex items-center gap-2 px-4 py-3', className)}>
      {backHref && (
        // Minimum tap target 44x44px (PROJECTSPEC §0)
        <Link
          href={backHref}
          aria-label={backLabel}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center -ml-2 rounded-lg text-muted-foreground transition-colors hover:text-foreground active:opacity-70"
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </Link>
      )}
      <h1 className="text-lg font-bold text-foreground leading-tight">{title}</h1>
    </header>
  );
}
