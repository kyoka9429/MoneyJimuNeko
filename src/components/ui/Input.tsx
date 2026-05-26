'use client';

// Thin wrapper around <input> with project design tokens.
// Accepts all standard input attributes via forwardRef.
import React from 'react';
import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-border bg-card px-3 py-2.5',
          'text-sm text-foreground placeholder:text-muted-foreground',
          'outline-none transition-colors',
          'focus:border-ring focus:ring-2 focus:ring-ring/30',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // aria-invalid styling
          'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30',
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
