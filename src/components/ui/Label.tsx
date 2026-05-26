// Thin wrapper around <label> with project design tokens.
import React from 'react';
import { cn } from '@/lib/utils';

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, children, ...props }: LabelProps): React.JSX.Element {
  return (
    <label
      className={cn('block text-sm font-medium text-foreground', className)}
      {...props}
    >
      {children}
    </label>
  );
}
