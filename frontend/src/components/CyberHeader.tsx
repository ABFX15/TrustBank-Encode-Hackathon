"use client";

import { useAccount, useDisconnect } from "wagmi";
import { useAppKit } from "@reown/appkit/react";

export function CyberHeader() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  const handleConnect = () => {
    open();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <header className="relative z-30 border-b border-green-400/20 backdrop-blur-md">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Cyber Logo */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 rounded border-2 border-green-400 bg-black flex items-center justify-center glow-green">
                <div className="text-green-400 font-bold text-xl text-cyber animate-neon-glow">
                  TB
                </div>
              </div>
              {/* Terminal cursor effect */}
              <div className="absolute -right-1 -bottom-1 w-2 h-2 bg-green-400 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-3xl font-black text-cyber animate-neon-glow">
                TRUSTBANK
              </h1>
              <div className="text-xs text-green-400/80 text-terminal">
                [ DECENTRALIZED_BANKING_PROTOCOL ]
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <a
              href="#"
              className="px-4 py-2 text-green-400 hover:text-white hover:bg-green-400/10 
                         border border-transparent hover:border-green-400/30 
                         transition-all duration-300 text-terminal uppercase tracking-wider
                         hover:glow-green"
            >
              &gt; DASHBOARD
            </a>
            <a
              href="#"
              className="px-4 py-2 text-cyan-400 hover:text-white hover:bg-cyan-400/10 
                         border border-transparent hover:border-cyan-400/30 
                         transition-all duration-300 text-terminal uppercase tracking-wider
                         hover:glow-cyan"
            >
              &gt; LENDING
            </a>
            <a
              href="#"
              className="px-4 py-2 text-purple-400 hover:text-white hover:bg-purple-400/10 
                         border border-transparent hover:border-purple-400/30 
                         transition-all duration-300 text-terminal uppercase tracking-wider
                         hover:glow-purple"
            >
              &gt; BORROWING
            </a>
            <a
              href="#"
              className="px-4 py-2 text-yellow-400 hover:text-white hover:bg-yellow-400/10 
                         border border-transparent hover:border-yellow-400/30 
                         transition-all duration-300 text-terminal uppercase tracking-wider"
            >
              &gt; ANALYTICS
            </a>
          </nav>

          {/* Wallet Connection Terminal */}
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                {/* Connection indicator */}
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400 text-terminal">
                    CONNECTED
                  </span>
                </div>

                {/* Address display */}
                <div className="bg-black/80 border border-green-400/30 rounded px-4 py-2 font-mono">
                  <div className="text-xs text-green-400/60">WALLET_ADDR:</div>
                  <div className="text-green-400 font-bold text-terminal">
                    {formatAddress(address!)}
                  </div>
                </div>

                <button
                  onClick={() => disconnect()}
                  className="btn-outline text-sm px-4 py-2"
                >
                  DISCONNECT
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                {/* Disconnection indicator */}
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-red-400 text-terminal">
                    DISCONNECTED
                  </span>
                </div>

                <button onClick={handleConnect} className="btn-primary">
                  &gt; CONNECT_WALLET
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Terminal status bar */}
      <div className="border-t border-green-400/20 bg-black/50 px-6 py-1">
        <div className="flex justify-between items-center text-xs text-green-400/60 text-terminal">
          <div className="flex space-x-6">
            <span>STATUS: ONLINE</span>
            <span>NETWORK: ETHERLINK</span>
            <span>BLOCK: #1,234,567</span>
          </div>
          <div className="flex space-x-6">
            <span>GAS: 15 GWEI</span>
            <span>TPS: 2,847</span>
            <span className="animate-pulse">█</span>
          </div>
        </div>
      </div>
    </header>
  );
}
