import type { Metadata, Viewport } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import { cn } from '@/lib/utils';
import { BottomNav } from '@/components/layout/BottomNav';
import { LockGate } from '@/components/auth';
import './globals.css';

const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MoneyJimuNeko',
  description: '給料日にこれを開けば、口座への振り分けと今月の余りが 30 秒でわかる',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={cn('h-full antialiased font-sans tabular-nums', notoSansJp.variable)}
    >
      {/*
        pb-16 ensures content is not hidden behind the fixed BottomNav (h-16).
        Additional safe-area inset is handled inside BottomNav itself.
        LockGate wraps everything so unlock screen replaces the entire UI
        before authentication.
      */}
      <body className="flex min-h-full flex-col pb-16">
        <LockGate>
          {children}
          <BottomNav />
        </LockGate>
      </body>
    </html>
  );
}
