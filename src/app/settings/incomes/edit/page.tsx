'use client';

// Edit income form page.
// Uses query string (?id=xxx) instead of dynamic segment to support static export.
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { IncomeFormClient } from '@/components/settings/IncomeFormClient';

function EditIncomeInner(): React.JSX.Element {
  const sp = useSearchParams();
  const id = sp.get('id') ?? '';
  return (
    <>
      <PageHeader title="収入項目を編集" backHref="/settings/incomes" backLabel="収入マスタに戻る" />
      <main className="flex-1 px-4 pb-4">
        <IncomeFormClient mode="edit" incomeId={id} />
      </main>
    </>
  );
}

export default function EditIncomePage(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <EditIncomeInner />
    </Suspense>
  );
}
