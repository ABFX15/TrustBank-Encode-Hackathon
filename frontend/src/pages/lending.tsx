import { LendingInterface } from "@/components/LendingInterface";
import { DynamicHeader } from "@/components/DynamicComponents";

export default function LendingPage() {
  return (
    <>
      <DynamicHeader />
      <main className="container mx-auto px-4 py-8">
        <LendingInterface />
      </main>
    </>
  );
}
