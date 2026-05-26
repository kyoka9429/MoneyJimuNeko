'use client';

// Edit expense form page.
// Uses query string (?id=xxx) instead of dynamic segment to support static export.
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { ExpenseFormClient } from '@/components/settings/ExpenseFormClient';

function EditExpenseInner(): React.JSX.Element {
  const sp = useSearchParams();
  const id = sp.get('id') ?? '';
  return (
    <>
      <PageHeader title="支出項目を編集" backHref="/settings/expenses" backLabel="支出マスタに戻る" />
      <main className="flex-1 px-4 pb-4">
        <ExpenseFormClient mode="edit" expenseId={id} />
      </main>
    </>
  );
}

export default function EditExpensePage(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <EditExpenseInner />
    </Suspense>
  );
}
