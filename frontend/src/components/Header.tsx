"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  return (
    <header className="bg-dark-900/90 backdrop-blur-md border-b border-cyan-600/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            {/* Logo */}
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
                <h1 className="text-2xl font-bold font-cyber text-cyber gradient-text">
                  TrustBank
                </h1>
                <p className="text-xs text-cyan-400/70 -mt-1 font-mono-tech text-mono-tech">
                  Premium DeFi
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#"
              className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 font-tech text-tech font-medium"
            >
              Lend
            </a>
            <a
              href="#"
              className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 font-tech text-tech font-medium"
            >
              Borrow
            </a>
            <a
              href="#"
              className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 font-tech text-tech font-medium"
            >
              Trust Network
            </a>
            <a
              href="#"
              className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 font-tech text-tech font-medium"
            >
              Yield
            </a>
          </nav>

          {/* Connect Button */}
          <div className="flex items-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
