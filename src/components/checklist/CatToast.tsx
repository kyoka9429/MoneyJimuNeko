'use client';

// Temporary toast shown when a task is marked done (PROJECTSPEC §5.3).
// Positioned fixed bottom-20 (above BottomNav) centred horizontally.
// Disappears after TOAST_DURATION_MS.
// prefers-reduced-motion: bounce is suppressed via motion-reduce:animate-none.
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { CatPhoto } from '@/components/cat';

type Props = {
  open: boolean;
  onClose: () => void;
};

// 1500 ms as specified in §5.3
const TOAST_DURATION_MS = 1500;

// Inline paw SVG used as the bouncing micro-animation accent.
// aria-hidden because it's purely decorative.
function PawIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      aria-hidden="true"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Central pad */}
      <ellipse cx="8" cy="10" rx="3.5" ry="2.5" />
      {/* Four toe pads */}
      <ellipse cx="4.5" cy="7" rx="1.3" ry="1" />
      <ellipse cx="7" cy="5.5" rx="1.3" ry="1" />
      <ellipse cx="9" cy="5.5" rx="1.3" ry="1" />
      <ellipse cx="11.5" cy="7" rx="1.3" ry="1" />
    </svg>
  );
}

export function CatToast({ open, onClose }: Props): React.JSX.Element | null {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;

    timerRef.current = setTimeout(() => {
      onClose();
    }, TOAST_DURATION_MS);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="ニャ！"
      className={cn(
        // Positioning: centred horizontally above BottomNav (bottom-20 = 80px)
        'fixed bottom-20 left-1/2 z-50 -translate-x-1/2',
        // Shape & colours
        'flex items-center gap-2 rounded-full bg-card px-4 py-2 shadow-lg',
        // Fade-in animation — always applied
        'animate-in fade-in duration-200',
      )}
    >
      <CatPhoto
        variant="smile"
        className="size-6 text-brown"
      />
      <span className="text-sm font-bold text-foreground">ニャ！</span>
      {/* Paw accent: bounce animation. motion-reduce disables bounce only */}
      <PawIcon
        className={cn(
          'size-5 text-accent',
          'animate-bounce motion-reduce:animate-none',
        )}
      />
    </div>
  );
}
