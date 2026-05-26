// Income master list — Server Component shell.
import { PageHeader } from '@/components/ui/PageHeader';
import { IncomesClient } from '@/components/settings/IncomesClient';

export default function IncomesPage() {
  return (
    <>
      <PageHeader title="収入マスタ" backHref="/settings" backLabel="設定に戻る" />
      <main className="flex-1 px-4 pb-4">
        <IncomesClient />
      </main>
    </>
  );
}
