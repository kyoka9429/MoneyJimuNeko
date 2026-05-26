// Server Component — data fetching is delegated to DashboardClient
// which accesses IndexedDB (Dexie) on the client side.
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export default function HomePage() {
  return (
    <>
      <DashboardHeader />
      <main className="flex-1 px-4 pb-4">
        <DashboardClient />
      </main>
    </>
  );
}
