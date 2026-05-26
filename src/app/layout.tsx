import type { Metadata, Viewport } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import { cn } from '@/lib/utils';
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
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
