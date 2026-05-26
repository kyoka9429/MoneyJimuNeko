// New income form — Server Component shell.
import { PageHeader } from '@/components/ui/PageHeader';
import { IncomeFormClient } from '@/components/settings/IncomeFormClient';

export default function NewIncomePage() {
  return (
    <>
      <PageHeader title="収入項目を追加" backHref="/settings/incomes" backLabel="収入マスタに戻る" />
      <main className="flex-1 px-4 pb-4">
        <IncomeFormClient mode="create" />
      </main>
    </>
  );
}
