"use client";

import { useState } from "react";
import { useAccount } from "wagmi";

export function TrustNetwork() {
  const { address, isConnected } = useAccount();
  const [vouchAddress, setVouchAddress] = useState("");
  const [trustAmount, setTrustAmount] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Mock data - will be replaced with real contract data
  const trustConnections = [
    {
      address: "0x1234...5678",
      name: "Alice.eth",
      trustScore: 920,
      mutualConnections: 12,
      vouchAmount: "5,000",
      status: "active",
    },
    {
      address: "0x8765...4321",
      name: "Bob.eth",
      trustScore: 875,
      mutualConnections: 8,
      vouchAmount: "2,500",
      status: "active",
    },
    {
      address: "0x9876...1234",
      name: "Charlie.eth",
      trustScore: 810,
      mutualConnections: 5,
      vouchAmount: "1,000",
      status: "pending",
    },
  ];

  const handleVouch = () => {
    if (!vouchAddress || !trustAmount) return;
    console.log("Vouching for:", vouchAddress, "Amount:", trustAmount);
  };

  if (!isConnected) {
    return (
      <div className="card-premium text-center py-12">
        <div className="text-6xl mb-6">🤝</div>
        <h2 className="text-2xl font-bold gradient-text mb-4">Trust Network</h2>
        <p className="text-gray-400 mb-8">
          Connect your wallet to view your trust network
        </p>
        <div className="inline-flex items-center px-6 py-3 bg-cyan-900/20 border border-cyan-600/30 rounded-lg">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse mr-3"></div>
          <span className="text-cyan-400 text-sm">Web3 wallet required</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Onboarding Tooltip */}
      {showOnboarding && (
        <div className="card-premium border-2 border-cyan-500/50 bg-cyan-900/10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-cyan-400 mb-2">
                🎯 How Trust Scoring Works
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-emerald-400">1</span>
                  </div>
                  <div>
                    <div className="font-medium text-emerald-400">
                      Vouch for Friends
                    </div>
                    <div className="text-xs text-gray-400">
                      Stake your reputation
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <span className="text-cyan-400">2</span>
                  </div>
                  <div>
                    <div className="font-medium text-cyan-400">
                      Build Trust Score
                    </div>
                    <div className="text-xs text-gray-400">0-1000 points</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-purple-400">3</span>
                  </div>
                  <div>
                    <div className="font-medium text-purple-400">Get Loans</div>
                    <div className="text-xs text-gray-400">
                      No collateral needed
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowOnboarding(false)}
              className="text-gray-400 hover:text-white ml-4"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Trust Network Overview */}
      <div className="card-premium">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-purple-900/30 flex items-center justify-center">
            <span className="text-2xl">🌐</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Your Trust Network</h2>
            <p className="text-gray-400 text-sm">
              Manage your social credit connections
            </p>
          </div>
        </div>

        {/* Network Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-dark-800/50 rounded-lg">
            <div className="text-2xl font-bold gradient-text">
              {trustConnections.length}
            </div>
            <div className="text-xs text-gray-400">Connections</div>
          </div>
          <div className="text-center p-4 bg-dark-800/50 rounded-lg">
            <div className="text-2xl font-bold gradient-text">$8,500</div>
            <div className="text-xs text-gray-400">Total Vouch</div>
          </div>
          <div className="text-center p-4 bg-dark-800/50 rounded-lg">
            <div className="text-2xl font-bold gradient-text">890</div>
            <div className="text-xs text-gray-400">Trust Score</div>
          </div>
        </div>

        {trustConnections.length > 0 ? (
          <div className="space-y-4">
            {trustConnections.map((connection, index) => (
              <div
                key={index}
                className="group p-4 bg-dark-800/30 rounded-lg border border-cyan-600/10 hover:border-cyan-500/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-cyan-gradient flex items-center justify-center shadow-cyan">
                      <span className="text-dark-900 font-bold text-lg">
                        {connection.name?.charAt(0) ||
                          connection.address.charAt(2).toUpperCase()}
                      </span>
                    </div>

                    {/* Info */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-white">
                          {connection.name || connection.address}
                        </p>
                        <div
                          className={`badge ${
                            connection.status === "active"
                              ? "badge-success"
                              : "badge-warning"
                          }`}
                        >
                          {connection.status}
                        </div>
                      </div>
                      <p className="text-sm text-gray-400">
                        {connection.mutualConnections} mutual connections • $
                        {connection.vouchAmount} vouched
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm text-gray-400">Trust Score</span>
                      <div className="badge badge-cyan">
                        {connection.trustScore}
                      </div>
                    </div>
                    <div className="w-20 bg-dark-700 rounded-full h-2">
                      <div
                        className="bg-cyan-gradient h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${(connection.trustScore / 1000) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🏗️</div>
            <p className="text-gray-400 mb-4">
              No trust connections yet. Start by vouching for trusted addresses.
            </p>
            <button className="btn-outline">Discover Users</button>
          </div>
        )}
      </div>

      {/* Vouch Form */}
      <div className="card-premium">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-900/30 flex items-center justify-center">
            <span className="text-2xl">🤝</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Vouch for Someone</h3>
            <p className="text-gray-400 text-sm">
              Extend trust to unlock undercollateralized lending
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Address or ENS name
              </label>
              <input
                type="text"
                value={vouchAddress}
                onChange={(e) => setVouchAddress(e.target.value)}
                placeholder="0x... or username.eth"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Trust amount (USDC)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={trustAmount}
                  onChange={(e) => setTrustAmount(e.target.value)}
                  placeholder="1000"
                  className="input-field pr-16"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-cyan-400 text-sm font-medium">
                    USDC
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                This is the maximum amount they can borrow from your vouch
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-dark-800/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-white mb-3">Vouch Details</h4>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Your Risk</span>
                <span className="text-red-400 font-medium">
                  {trustAmount ? `$${trustAmount}` : "$0"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Reputation Impact</span>
                <span className="text-emerald-400 font-medium">+25 points</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Can Revoke</span>
                <span className="text-cyan-400 font-medium">Anytime</span>
              </div>
            </div>

            <button
              onClick={handleVouch}
              disabled={!vouchAddress || !trustAmount}
              className="btn-primary w-full"
            >
              Create Vouch
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <p className="text-blue-400 text-sm">
            <span className="font-medium">💡 Pro Tip:</span> Start with smaller
            amounts to build trust gradually. You can always increase your vouch
            amount later.
          </p>
        </div>
      </div>
    </div>
  );
}
