import { BorrowingTab } from "@/components/TabbedInterface";
import { DynamicHeader } from "@/components/DynamicComponents";

export default function BorrowingPage() {
  return (
    <>
      <DynamicHeader />
      <main className="container mx-auto px-4 py-8">
        <BorrowingTab />
      </main>
    </>
  );
}
