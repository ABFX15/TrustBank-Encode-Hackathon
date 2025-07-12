"use client";

import { StatsOverview } from "@/components/StatsOverview";
import {
  DynamicHeader,
  DynamicLendingInterface,
  DynamicTrustNetwork,
} from "@/components/DynamicComponents";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-dark-950 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-cyan-600/10 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-l from-cyan-600/15 to-cyan-400/8 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-0 w-64 h-64 bg-gradient-to-r from-cyan-400/10 to-transparent rounded-full blur-2xl animate-float"
          style={{ animationDelay: "4s" }}
        ></div>

        {/* Geometric patterns */}
        <div
          className="absolute top-20 right-20 w-32 h-32 border border-cyan-500/10 rotate-45 animate-spin"
          style={{ animationDuration: "20s" }}
        ></div>
        <div
          className="absolute bottom-40 left-20 w-24 h-24 border border-cyan-400/15 rotate-12 animate-spin"
          style={{ animationDuration: "15s", animationDirection: "reverse" }}
        ></div>

        {/* Particle effect simulation */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      </div>

      <DynamicHeader />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 py-20 relative">
          {/* Floating elements */}
          <div className="absolute top-10 left-10 w-4 h-4 bg-cyan-400/20 rounded-full animate-float"></div>
          <div
            className="absolute top-20 right-20 w-6 h-6 bg-cyan-500/15 rounded-full animate-float"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-10 left-20 w-3 h-3 bg-cyan-600/25 rounded-full animate-float"
            style={{ animationDelay: "2s" }}
          ></div>

          <div className="inline-flex items-center px-6 py-3 rounded-full bg-cyan-900/20 border border-cyan-600/30 mb-12 backdrop-blur-sm">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse mr-3"></div>
            <span className="text-cyan-400 text-sm font-semibold tracking-wide uppercase">
              Live on Etherlink Testnet
            </span>
          </div>

          <div className="relative">
            <h1 className="hero-title mb-8">
              <span className="block">Trust-Based</span>
              <span className="block text-white font-display">
                DeFi Banking
              </span>
            </h1>

            {/* Decorative elements */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-30"></div>
          </div>

          <p className="text-xl md:text-2xl text-gray-300 mb-16 max-w-4xl mx-auto leading-relaxed font-light">
            Experience the future of decentralized finance with our
            <span className="text-cyan-400 font-medium">
              {" "}
              revolutionary trust network
            </span>
            . Borrow without collateral, earn premium yields, and build your
            reputation on-chain.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
            <button className="btn-primary text-lg px-10 py-4 font-semibold tracking-wide shadow-2xl hover:shadow-cyan-xl transform hover:scale-105 transition-all duration-300">
              <span className="mr-2">🚀</span>
              Start Banking
            </button>
            <button className="btn-outline text-lg px-10 py-4 font-medium tracking-wide hover:bg-cyan-500/10 transition-all duration-300">
              <span className="mr-2">📖</span>
              Learn More
            </button>
          </div>

          {/* Enhanced Floating Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
              <div className="relative bg-dark-900/60 backdrop-blur-xl rounded-2xl p-8 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-300">
                <div className="text-4xl font-bold gradient-text mb-3 font-display">
                  $2.4M+
                </div>
                <div className="text-gray-400 text-sm uppercase tracking-wider">
                  Total Value Locked
                </div>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
              <div className="relative bg-dark-900/60 backdrop-blur-xl rounded-2xl p-8 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-300">
                <div className="text-4xl font-bold gradient-text mb-3 font-display">
                  5,200+
                </div>
                <div className="text-gray-400 text-sm uppercase tracking-wider">
                  Trust Connections
                </div>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
              <div className="relative bg-dark-900/60 backdrop-blur-xl rounded-2xl p-8 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-300">
                <div className="text-4xl font-bold gradient-text mb-3 font-display">
                  12.5%
                </div>
                <div className="text-gray-400 text-sm uppercase tracking-wider">
                  Average APY
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 gradient-text font-display">
            Your Portfolio Overview
          </h2>
          <StatsOverview />
        </div>

        {/* Main Interface */}
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 gradient-text font-display">
            Banking Operations
          </h2>
          <DynamicLendingInterface />
        </div>

        {/* Trust Network */}
        <div>
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 gradient-text font-display">
            Trust Network
          </h2>
          <DynamicTrustNetwork />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-cyan-600/20 bg-dark-900/50 backdrop-blur-sm mt-20">
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
              <span className="text-xl font-bold gradient-text">TrustBank</span>
            </div>
            <p className="text-gray-400 mb-6">
              Revolutionizing DeFi through social trust networks
            </p>
            <div className="text-sm text-gray-500">
              © 2025 TrustBank Protocol. Built on Etherlink.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
