// New expense form — Server Component shell.
import { PageHeader } from '@/components/ui/PageHeader';
import { ExpenseFormClient } from '@/components/settings/ExpenseFormClient';

export default function NewExpensePage() {
  return (
    <>
      <PageHeader title="支出項目を追加" backHref="/settings/expenses" backLabel="支出マスタに戻る" />
      <main className="flex-1 px-4 pb-4">
        <ExpenseFormClient mode="create" />
      </main>
    </>
  );
}
