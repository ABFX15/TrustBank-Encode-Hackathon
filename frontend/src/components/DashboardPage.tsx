"use client";

import { StatsOverview } from "@/components/StatsOverview";
import {
  DynamicHeader,
  DynamicLendingInterface,
  DynamicTrustNetwork,
} from "@/components/DynamicComponents";

export function DashboardPage() {
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

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>

      {/* Header */}
      <DynamicHeader />

      {/* Main Content */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Welcome Banner */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 font-cyber text-cyber">
              <span className="gradient-text">TrustBank</span>
              <br />
              <span className="text-3xl md:text-4xl text-cyan-300/80 font-tech text-tech font-medium">
                Decentralized Banking
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed font-futura text-futura">
              Experience the future of decentralized finance with our
              <span className="text-cyan-400 font-medium font-tech text-tech">
                {" "}
                revolutionary trust network
              </span>
              . Borrow without collateral, earn premium yields, and build your
              reputation on-chain.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="mb-16">
            <StatsOverview />
          </div>

          {/* Main Banking Interface */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold gradient-text mb-8 text-center font-cyber text-cyber">
              Banking Services
            </h2>
            <DynamicLendingInterface />
          </div>

          {/* Trust Network */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold gradient-text mb-8 text-center font-cyber text-cyber">
              Trust Network
            </h2>
            <DynamicTrustNetwork />
          </div>
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
  );
}
