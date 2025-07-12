"use client";

import dynamic from "next/dynamic";

// Loading components with proper fallbacks
const LoadingCard = () => (
  <div className="premium-card p-8">
    <div className="animate-pulse">
      <div className="h-6 bg-cyan-600/20 rounded w-1/3 mb-4"></div>
      <div className="h-4 bg-gray-600/20 rounded w-2/3 mb-6"></div>
      <div className="space-y-4">
        <div className="h-12 bg-gray-600/20 rounded"></div>
        <div className="h-12 bg-gray-600/20 rounded"></div>
        <div className="h-12 bg-cyan-600/20 rounded"></div>
      </div>
    </div>
  </div>
);

const LoadingHeader = () => (
  <header className="bg-dark-900/90 backdrop-blur-md border-b border-cyan-600/20 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-20">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-gradient flex items-center justify-center shadow-cyan">
              <svg
                className="w-6 h-6 text-dark-900"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold font-serif gradient-text">
                TrustBank
              </h1>
              <p className="text-xs text-cyan-400/70 -mt-1">Premium DeFi</p>
            </div>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="h-10 bg-cyan-600/20 rounded-lg w-32"></div>
        </div>
      </div>
    </div>
  </header>
);

const LoadingInterface = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <LoadingCard />
    <LoadingCard />
  </div>
);

const LoadingTrustNetwork = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <div className="premium-card p-8">
      <div className="animate-pulse">
        <div className="h-6 bg-cyan-600/20 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-600/20 rounded w-3/4 mb-6"></div>
        <div className="space-y-3">
          <div className="h-10 bg-gray-600/20 rounded"></div>
          <div className="h-10 bg-gray-600/20 rounded"></div>
          <div className="h-10 bg-cyan-600/20 rounded"></div>
        </div>
      </div>
    </div>
    <div className="premium-card p-8">
      <div className="animate-pulse">
        <div className="h-6 bg-cyan-600/20 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-600/20 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-600/20 rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-gray-600/20 rounded w-1/3"></div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-600/20 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-600/20 rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-gray-600/20 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Dynamic components with SSR disabled
export const DynamicHeader = dynamic(
  () => import("./Header").then((mod) => ({ default: mod.Header })),
  {
    ssr: false,
    loading: LoadingHeader,
  }
);

export const DynamicLendingInterface = dynamic(
  () =>
    import("./LendingInterface").then((mod) => ({
      default: mod.LendingInterface,
    })),
  {
    ssr: false,
    loading: LoadingInterface,
  }
);

export const DynamicTrustNetwork = dynamic(
  () => import("./TrustNetwork").then((mod) => ({ default: mod.TrustNetwork })),
  {
    ssr: false,
    loading: LoadingTrustNetwork,
  }
);
