import { AdvancedAnalyticsDashboard } from "@/components/AdvancedAnalyticsDashboard";
import { DynamicHeader } from "@/components/DynamicComponents";

export default function AnalyticsPage() {
  return (
    <>
      <DynamicHeader />
      <main className="container mx-auto px-4 py-8">
        <AdvancedAnalyticsDashboard />
      </main>
    </>
  );
}
