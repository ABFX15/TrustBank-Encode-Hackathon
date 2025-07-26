"use client";

import { StatsOverview } from "@/components/StatsOverview";
import { TabbedInterface, defaultTabs } from "@/components/TabbedInterface";

export function DashboardPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-miami-gradient">
      {/* Subtle Palm Tree Silhouettes */}
      <div className="absolute top-20 left-10 palm-tree"></div>
      <div className="absolute top-40 right-10 palm-tree scale-x-[-1]"></div>
      <div className="absolute bottom-20 left-20 palm-tree scale-75"></div>
      <div className="absolute bottom-40 right-20 palm-tree scale-75 scale-x-[-1]"></div>

      <div className="relative z-10">
        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Compact Hero Section - Post-Welcome */}
          <div className="text-center mb-12 py-12 relative">
            {/* Compact Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-miami-gradient">TrustBank</span>
              <span className="text-2xl md:text-3xl text-neon-cyan font-medium block">
                MIAMI DASHBOARD
              </span>
            </h1>

            <p className="text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
              Build your trust network, earn credit, and access uncollateralized
              loans up to $50,000
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="card-miami p-4">
                <div className="text-2xl font-bold text-neon-cyan mb-1">
                  $2.4M+
                </div>
                <div className="text-xs text-gray-400">Uncollateralized</div>
              </div>
              <div className="card-miami p-4">
                <div className="text-2xl font-bold text-neon-pink mb-1">
                  5,200+
                </div>
                <div className="text-xs text-gray-400">Trust Connections</div>
              </div>
              <div className="card-miami p-4">
                <div className="text-2xl font-bold text-miami-gradient mb-1">
                  98.7%
                </div>
                <div className="text-xs text-gray-400">Repayment Rate</div>
              </div>
              <div className="card-miami p-4">
                <div className="text-2xl font-bold text-neon-cyan mb-1">
                  850
                </div>
                <div className="text-xs text-gray-400">Avg Trust Score</div>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="mb-12">
            <StatsOverview />
          </div>

          {/* Tabbed Interface */}
          <div className="max-w-6xl mx-auto">
            <TabbedInterface tabs={defaultTabs} defaultTab="trust" />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 text-gray-400 text-sm">
          <p>TrustBank • Miami DeFi • Built on Etherlink</p>
        </footer>
      </div>
    </div>
  );
}
