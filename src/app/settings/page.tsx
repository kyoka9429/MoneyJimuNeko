// Settings hub — Server Component shell.
// Actual state-dependent content (toggle, select) is delegated to SettingsClient.
import { PageHeader } from '@/components/ui/PageHeader';
import { SettingsClient } from '@/components/settings/SettingsClient';

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="設定" />
      <main className="flex-1 px-4 pb-4">
        <SettingsClient />
      </main>
    </>
  );
}
