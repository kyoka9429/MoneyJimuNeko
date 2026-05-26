'use client';

// Thin wrapper around native <select> with project design tokens.
// Options are passed as children for maximum flexibility.
import React from 'react';
import { cn } from '@/lib/utils';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-border bg-card px-3 py-2.5',
          'text-sm text-foreground',
          'outline-none transition-colors appearance-none',
          'focus:border-ring focus:ring-2 focus:ring-ring/30',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Right padding for native arrow
          'pr-8',
          // Background arrow via bg-image trick (Tailwind v4 safe)
          "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237a7068' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_0.75rem_center]",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);

Select.displayName = 'Select';
