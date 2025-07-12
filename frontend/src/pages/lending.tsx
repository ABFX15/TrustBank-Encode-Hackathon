import { LendingTab } from "@/components/TabbedInterface";
import { DynamicHeader } from "@/components/DynamicComponents";

export default function LendingPage() {
  return (
    <>
      <DynamicHeader />
      <main className="container mx-auto px-4 py-8">
        <LendingTab />
      </main>
    </>
  );
}
