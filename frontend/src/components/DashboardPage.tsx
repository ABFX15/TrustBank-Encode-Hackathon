"use client";

import { StatsOverview } from "@/components/StatsOverview";
import { TabbedInterface, defaultTabs } from "@/components/TabbedInterface";

export function DashboardPage() {
  return (
    <div className="min-h-screen relative overflow-hidden synthwave-gradient">
      {/* Palm Trees */}
      <div className="absolute left-0 bottom-0 z-5 opacity-20">
        <svg
          width="200"
          height="300"
          viewBox="0 0 300 400"
          fill="none"
          className="palm-tree-left"
        >
          <path
            d="M140 400 Q145 380 142 360 Q148 340 144 320 Q150 300 146 280 Q152 260 148 240 Q154 220 150 200 Q156 180 152 160 Q158 140 154 120 Q160 100 156 80"
            stroke="black"
            strokeWidth="6"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M156 80 Q120 40 80 20 Q60 10 40 15"
            stroke="black"
            strokeWidth="3"
            fill="none"
            opacity="0.4"
          />
          <path
            d="M156 80 Q180 45 220 25 Q240 15 260 20"
            stroke="black"
            strokeWidth="3"
            fill="none"
            opacity="0.4"
          />
        </svg>
      </div>
      <div className="absolute right-0 bottom-0 z-5 opacity-20">
        <svg
          width="200"
          height="300"
          viewBox="0 0 300 400"
          fill="none"
          className="palm-tree-right"
        >
          <path
            d="M160 400 Q155 380 158 360 Q152 340 156 320 Q150 300 154 280 Q148 260 152 240 Q146 220 150 200 Q144 180 148 160 Q142 140 146 120 Q140 100 144 80"
            stroke="black"
            strokeWidth="6"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M144 80 Q180 40 220 20 Q240 10 260 15"
            stroke="black"
            strokeWidth="3"
            fill="none"
            opacity="0.4"
          />
          <path
            d="M144 80 Q120 45 80 25 Q60 15 40 20"
            stroke="black"
            strokeWidth="3"
            fill="none"
            opacity="0.4"
          />
        </svg>
      </div>

      {/* Grid lines for retro effect */}
      <div className="absolute bottom-0 left-0 w-full h-32 grid-lines opacity-10 z-5"></div>

      <div className="relative z-10">
        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Compact Hero Section - Post-Welcome */}
          <div className="text-center mb-12 py-12 relative">
            {/* Compact Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="chrome-text">TrustBank</span>
              <span className="text-2xl md:text-3xl text-pink-400 font-medium block script-text">
                dashboard
              </span>
            </h1>

            <p className="text-lg text-gray-200 mb-6 max-w-2xl mx-auto">
              Build your trust network, earn credit, and access uncollateralized
              loans up to $50,000
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="card-synthwave p-4">
                <div className="text-2xl font-bold text-cyan-400 mb-1">
                  $2.4M+
                </div>
                <div className="text-xs text-gray-300">Uncollateralized</div>
              </div>
              <div className="card-synthwave p-4">
                <div className="text-2xl font-bold text-pink-400 mb-1">
                  5,200+
                </div>
                <div className="text-xs text-gray-300">Trust Connections</div>
              </div>
              <div className="card-synthwave p-4">
                <div className="text-2xl font-bold text-purple-300 mb-1">
                  98.7%
                </div>
                <div className="text-xs text-gray-300">Repayment Rate</div>
              </div>
              <div className="card-synthwave p-4">
                <div className="text-2xl font-bold text-cyan-400 mb-1">850</div>
                <div className="text-xs text-gray-300">Avg Trust Score</div>
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
        <footer className="text-center py-8 text-pink-300/60 text-sm">
          <p>💎 TrustBank • DeFi Banking • Built on Etherlink</p>
        </footer>
      </div>
    </div>
  );
}
