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
          {/* Welcome Banner */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 font-cyber">
              <span className="gradient-text">TrustBank</span>
              <br />
              <span className="text-3xl md:text-4xl text-cyan-300/80 font-tech font-medium">
                Decentralized Banking
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed font-futura">
              TrustBank is a next-generation DeFi protocol powered by Chainlink
              CCIP for seamless cross-chain operations.{" "}
              <br className="hidden md:inline" />
              <span className="text-cyan-400 font-medium font-tech">
                Lend, borrow, and earn
              </span>{" "}
              across multiple blockchains with a unique trust-based credit
              network.
              <br className="hidden md:inline" />
              <span className="text-cyan-400 font-medium font-tech">
                No collateral required
              </span>{" "}
              when you build your on-chain reputation and trust score.
              <br className="hidden md:inline" />
              <span className="text-cyan-400 font-medium font-tech">
                Aggregate yields
              </span>{" "}
              from top DeFi strategies, track your real returns, and move assets
              securely between chains.
              <br className="hidden md:inline" />
              <span className="text-cyan-400 font-medium font-tech">
                Your reputation, your network, your DeFi bank.
              </span>
            </p>
          </div>

          {/* Stats Overview */}
          <div className="mb-12">
            <StatsOverview />
          </div>

          {/* Tabbed Interface */}
          <div className="max-w-6xl mx-auto">
            <TabbedInterface tabs={defaultTabs} defaultTab="lending" />
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
