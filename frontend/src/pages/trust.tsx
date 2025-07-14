import { TrustNetwork } from "@/components/TrustNetwork";
import { DynamicHeader } from "@/components/DynamicComponents";

export default function TrustPage() {
  return (
    <>
      <DynamicHeader />
      <main className="container mx-auto px-4 py-8">
        <TrustNetwork />
      </main>
    </>
  );
}
