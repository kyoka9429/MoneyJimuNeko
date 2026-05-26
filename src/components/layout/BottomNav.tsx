'use client';

// Fixed bottom navigation for mobile-first layout (PROJECTSPEC §5.1).
// Three tabs: home / allocate / settings.
// aria-current="page" indicates active tab for screen readers.
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardCheck, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  Icon: typeof Home;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'ホーム', Icon: Home },
  { href: '/allocate', label: '振り分け', Icon: ClipboardCheck },
  { href: '/settings', label: '設定', Icon: Settings },
];

// Minimum tap target: 44px height enforced via min-h (PROJECTSPEC §0)
const TAP_ITEM_CLASS =
  'flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 text-xs';

export function BottomNav(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <nav
      aria-label="メインナビゲーション"
      className={cn(
        'fixed inset-x-0 bottom-0 z-50',
        'flex h-16 items-stretch',
        'border-t border-border bg-card shadow-[0_-1px_8px_rgba(0,0,0,0.06)]',
        // safe-area inset for iPhone home indicator
        'pb-[env(safe-area-inset-bottom)]',
      )}
    >
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const isActive =
          href === '/' ? pathname === '/' : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              TAP_ITEM_CLASS,
              'transition-colors',
              isActive
                ? 'text-paw-pink'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.75}
              aria-hidden="true"
            />
            <span className={cn('leading-none', isActive && 'font-semibold')}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
