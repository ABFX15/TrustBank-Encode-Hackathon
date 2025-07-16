"use client";

import { StatsOverview } from "@/components/StatsOverview";
import { DynamicHeader } from "@/components/DynamicComponents";
import { SpaceBackground } from "@/components/SpaceBackground";
import { TabbedInterface, defaultTabs } from "@/components/TabbedInterface";

export function DashboardPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Space Background */}
      <SpaceBackground
        starCount={200}
        showShootingStars={true}
        showNebula={true}
      />

      <div className="relative z-10">
        {/* Header */}
        <DynamicHeader />

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Compact Hero Section - Post-Welcome */}
          <div className="text-center mb-12 py-12 relative">
            {/* Compact Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">TrustBank</span>
              <span className="text-2xl md:text-3xl text-cyan-300/80 font-medium block">
                Dashboard
              </span>
            </h1>

            <p className="text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
              Build your trust network, earn credit, and access uncollateralized
              loans up to $50,000
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="bg-dark-800/50 rounded-xl p-4 border border-emerald-500/20">
                <div className="text-2xl font-bold text-emerald-400 mb-1">
                  $2.4M+
                </div>
                <div className="text-xs text-gray-400">Uncollateralized</div>
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 border border-cyan-500/20">
                <div className="text-2xl font-bold text-cyan-400 mb-1">
                  5,200+
                </div>
                <div className="text-xs text-gray-400">Trust Connections</div>
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 border border-purple-500/20">
                <div className="text-2xl font-bold text-purple-400 mb-1">
                  98.7%
                </div>
                <div className="text-xs text-gray-400">Repayment Rate</div>
              </div>
              <div className="bg-dark-800/50 rounded-xl p-4 border border-yellow-500/20">
                <div className="text-2xl font-bold text-yellow-400 mb-1">
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
        <footer className="border-t border-cyan-600/20 bg-dark-900/50 backdrop-blur-sm mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="flex justify-center items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-cyan-gradient flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-dark-900"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span className="text-2xl font-bold font-serif gradient-text">
                  TrustBank
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Revolutionizing DeFi through trust and innovation
              </p>
              <div className="flex justify-center space-x-6 text-sm text-gray-500">
                <a href="#" className="hover:text-cyan-400 transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="hover:text-cyan-400 transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="hover:text-cyan-400 transition-colors">
                  Documentation
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
