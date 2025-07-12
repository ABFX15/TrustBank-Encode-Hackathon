import { SettingsTab } from "@/components/TabbedInterface";
import { DynamicHeader } from "@/components/DynamicComponents";

export default function SettingsPage() {
  return (
    <>
      <DynamicHeader />
      <main className="container mx-auto px-4 py-8">
        <SettingsTab />
      </main>
    </>
  );
}
