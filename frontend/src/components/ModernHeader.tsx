"use client";

import { useAccount, useDisconnect } from "wagmi";
import { useAppKit } from "@reown/appkit/react";

export function ModernHeader() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  const handleConnect = () => {
    open();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="relative z-30 border-b border-white/10 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-black text-xl">TB</span>
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 text-modern">
                TrustBank
              </h1>
              <p className="text-sm text-gray-600 text-clean">
                Decentralized Banking
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#"
              className="text-gray-700 hover:text-gray-900 font-semibold text-clean transition-colors"
            >
              Dashboard
            </a>
            <a
              href="#"
              className="text-gray-700 hover:text-gray-900 font-semibold text-clean transition-colors"
            >
              Lending
            </a>
            <a
              href="#"
              className="text-gray-700 hover:text-gray-900 font-semibold text-clean transition-colors"
            >
              Borrowing
            </a>
            <a
              href="#"
              className="text-gray-700 hover:text-gray-900 font-semibold text-clean transition-colors"
            >
              Analytics
            </a>
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
                  <span className="text-sm font-semibold text-gray-700 text-clean">
                    {formatAddress(address!)}
                  </span>
                </div>
                <button onClick={() => disconnect()} className="btn-outline">
                  Disconnect
                </button>
              </div>
            ) : (
              <button onClick={handleConnect} className="btn-primary">
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
