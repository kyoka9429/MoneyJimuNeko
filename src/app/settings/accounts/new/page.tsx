// New account form — Server Component shell.
import { PageHeader } from '@/components/ui/PageHeader';
import { AccountFormClient } from '@/components/settings/AccountFormClient';

export default function NewAccountPage() {
  return (
    <>
      <PageHeader title="口座を追加" backHref="/settings/accounts" backLabel="口座マスタに戻る" />
      <main className="flex-1 px-4 pb-4">
        <AccountFormClient mode="create" />
      </main>
    </>
  );
}
