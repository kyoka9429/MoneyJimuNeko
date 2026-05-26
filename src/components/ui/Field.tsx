// Field layout component: Label + input area + optional error message.
// Error text is announced via role="alert" for accessibility.
import React from 'react';
import { cn } from '@/lib/utils';

type FieldProps = {
  label: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Field({
  label,
  htmlFor,
  error,
  required,
  className,
  children,
}: FieldProps): React.JSX.Element {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-foreground"
      >
        {label}
        {required && (
          <span className="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
