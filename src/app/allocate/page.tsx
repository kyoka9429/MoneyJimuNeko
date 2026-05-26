import { AllocateClient } from '@/components/allocate/AllocateClient';
import { PageHeader } from '@/components/ui/PageHeader';

export default function AllocatePage() {
  return (
    <>
      <PageHeader title="振り分け" />
      <main className="flex-1 px-4 pb-4">
        <AllocateClient />
      </main>
    </>
  );
}
