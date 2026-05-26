'use client';

// Edit account form page.
// Uses query string (?id=xxx) instead of dynamic segment to support static export.
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { AccountFormClient } from '@/components/settings/AccountFormClient';

function EditAccountInner(): React.JSX.Element {
  const sp = useSearchParams();
  const id = sp.get('id') ?? '';
  return (
    <>
      <PageHeader title="口座を編集" backHref="/settings/accounts" backLabel="口座マスタに戻る" />
      <main className="flex-1 px-4 pb-4">
        <AccountFormClient mode="edit" accountId={id} />
      </main>
    </>
  );
}

export default function EditAccountPage(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <EditAccountInner />
    </Suspense>
  );
}
