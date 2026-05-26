// Account master list — Server Component shell.
import { PageHeader } from '@/components/ui/PageHeader';
import { AccountsClient } from '@/components/settings/AccountsClient';

export default function AccountsPage() {
  return (
    <>
      <PageHeader title="口座マスタ" backHref="/settings" backLabel="設定に戻る" />
      <main className="flex-1 px-4 pb-4">
        <AccountsClient />
      </main>
    </>
  );
}
