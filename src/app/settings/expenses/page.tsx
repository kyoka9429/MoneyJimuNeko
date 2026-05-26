// Expense master list — Server Component shell.
import { PageHeader } from '@/components/ui/PageHeader';
import { ExpensesClient } from '@/components/settings/ExpensesClient';

export default function ExpensesPage() {
  return (
    <>
      <PageHeader title="支出マスタ" backHref="/settings" backLabel="設定に戻る" />
      <main className="flex-1 px-4 pb-4">
        <ExpensesClient />
      </main>
    </>
  );
}
