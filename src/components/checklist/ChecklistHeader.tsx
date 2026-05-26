// Server Component — static header for the checklist page.
// Uses PageHeader with back link to home (PROJECTSPEC §5.3).
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';

export function ChecklistHeader(
  // accountId is threaded through from page.tsx for future extensibility
  // (e.g. showing the account name in the header).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _props: { accountId: string },
): React.JSX.Element {
  return (
    <PageHeader
      title="振り分けチェックリスト"
      backHref="/"
      backLabel="ダッシュボードに戻る"
    />
  );
}
