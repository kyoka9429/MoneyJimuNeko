'use client';

// Checklist page for a specific account.
// Uses query string (?id=xxx) instead of dynamic segment to support static export.
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChecklistHeader, ChecklistClient } from '@/components/checklist';

function AccountInner(): React.JSX.Element {
  const sp = useSearchParams();
  const id = sp.get('id') ?? '';
  return (
    <>
      <ChecklistHeader accountId={id} />
      <main className="flex-1 px-4 pb-4">
        <ChecklistClient accountId={id} />
      </main>
    </>
  );
}

export default function AccountPage(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <AccountInner />
    </Suspense>
  );
}
