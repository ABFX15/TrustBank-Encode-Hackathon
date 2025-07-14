"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { getTrustNetworkAnalytics } from "@/lib/goldsky";

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: string;
  color: string;
  suffix?: string;
}

interface SystemMetrics {
  networkGrowth: number;
  transactionVolume: number;
  activeUsers: number;
  yieldGenerated: number;
  trustScoreAvg: number;
  liquidityUtilization: number;
  systemHealth: number;
  gasOptimization: number;
}

function MetricCard({
  title,
  value,
  change,
  icon,
  color,
  suffix = "",
}: MetricCardProps) {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-${color}-500/20 relative overflow-hidden`}
    >
      {/* Background glow effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-${color}-500/5 to-transparent`}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{icon}</span>
            <h3 className={`text-lg font-semibold text-${color}-400`}>
              {title}
            </h3>
          </div>
          <div
            className={`flex items-center space-x-1 text-sm ${
              isPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            <span>{isPositive ? "↗" : "↙"}</span>
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        </div>

        <div className="flex items-end space-x-2">
          <span className={`text-3xl font-bold text-${color}-400`}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
          {suffix && <span className="text-gray-400 pb-1">{suffix}</span>}
        </div>

        {/* Animated progress bar */}
        <div className="mt-4 h-1 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r from-${color}-500 to-${color}-400`}
            initial={{ width: 0 }}
            animate={{ width: "75%" }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export function RealTimeMetrics() {
  const { address } = useAccount();
  const [metrics, setMetrics] = useState<SystemMetrics>({
    networkGrowth: 0,
    transactionVolume: 0,
    activeUsers: 0,
    yieldGenerated: 0,
    trustScoreAvg: 0,
    liquidityUtilization: 0,
    systemHealth: 0,
    gasOptimization: 0,
  });
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadMetrics();

    // Simulate live updates every 5 seconds
    const interval = setInterval(() => {
      updateMetrics();
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      // Simulate real-time metrics (in production, this would come from Goldsky)
      const mockMetrics: SystemMetrics = {
        networkGrowth: 12.7,
        transactionVolume: 2847590,
        activeUsers: 1247,
        yieldGenerated: 45672.89,
        trustScoreAvg: 189.4,
        liquidityUtilization: 76.3,
        systemHealth: 98.7,
        gasOptimization: 94.2,
      };

      setMetrics(mockMetrics);
      setIsLive(true);
    } catch (error) {
      console.error("Failed to load metrics:", error);
    }
  };

  const updateMetrics = () => {
    setMetrics((prev) => ({
      networkGrowth: prev.networkGrowth + (Math.random() - 0.5) * 2,
      transactionVolume:
        prev.transactionVolume + Math.floor(Math.random() * 10000),
      activeUsers: prev.activeUsers + Math.floor(Math.random() * 20) - 10,
      yieldGenerated: prev.yieldGenerated + Math.random() * 100,
      trustScoreAvg: prev.trustScoreAvg + (Math.random() - 0.5) * 5,
      liquidityUtilization: Math.max(
        0,
        Math.min(100, prev.liquidityUtilization + (Math.random() - 0.5) * 10)
      ),
      systemHealth: Math.max(
        85,
        Math.min(100, prev.systemHealth + (Math.random() - 0.5) * 2)
      ),
      gasOptimization: Math.max(
        85,
        Math.min(100, prev.gasOptimization + (Math.random() - 0.5) * 3)
      ),
    }));
  };

  const getSystemStatus = () => {
    if (metrics.systemHealth >= 95)
      return { status: "Excellent", color: "green", icon: "🟢" };
    if (metrics.systemHealth >= 90)
      return { status: "Good", color: "blue", icon: "🔵" };
    if (metrics.systemHealth >= 80)
      return { status: "Fair", color: "yellow", icon: "🟡" };
    return { status: "Needs Attention", color: "red", icon: "🔴" };
  };

  const systemStatus = getSystemStatus();

  return (
    <div className="space-y-6">
      {/* Header with Live Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-cyan-400">
            📊 Real-Time System Metrics
          </h2>
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isLive ? "bg-green-400 animate-pulse" : "bg-red-400"
              }`}
            />
            <span
              className={`text-sm ${
                isLive ? "text-green-400" : "text-red-400"
              }`}
            >
              {isLive ? "Live" : "Offline"}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <span>Last Update: {lastUpdate.toLocaleTimeString()}</span>
          <div
            className={`flex items-center space-x-2 px-3 py-1 rounded-full bg-${systemStatus.color}-500/20`}
          >
            <span>{systemStatus.icon}</span>
            <span className={`text-${systemStatus.color}-400 font-medium`}>
              {systemStatus.status}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Network Growth"
          value={metrics.networkGrowth.toFixed(1)}
          change={5.2}
          icon="📈"
          color="cyan"
          suffix="%"
        />

        <MetricCard
          title="Transaction Volume"
          value={`$${(metrics.transactionVolume / 1000000).toFixed(1)}M`}
          change={8.7}
          icon="💰"
          color="green"
        />

        <MetricCard
          title="Active Users"
          value={metrics.activeUsers}
          change={12.3}
          icon="👥"
          color="purple"
        />

        <MetricCard
          title="Yield Generated"
          value={`$${metrics.yieldGenerated.toLocaleString()}`}
          change={6.8}
          icon="🏦"
          color="yellow"
        />

        <MetricCard
          title="Avg Trust Score"
          value={metrics.trustScoreAvg.toFixed(1)}
          change={2.4}
          icon="🤝"
          color="blue"
        />

        <MetricCard
          title="Liquidity Utilization"
          value={metrics.liquidityUtilization.toFixed(1)}
          change={-1.2}
          icon="🌊"
          color="teal"
          suffix="%"
        />

        <MetricCard
          title="System Health"
          value={metrics.systemHealth.toFixed(1)}
          change={0.3}
          icon="💚"
          color="green"
          suffix="%"
        />

        <MetricCard
          title="Gas Optimization"
          value={metrics.gasOptimization.toFixed(1)}
          change={4.1}
          icon="⚡"
          color="orange"
          suffix="%"
        />
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">
            🚀 Sponsor Technology Performance
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-cyan-400">🔍</span>
                <span className="text-gray-300">Goldsky Indexing</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 h-2 bg-gray-700 rounded-full">
                  <div className="w-[95%] h-2 bg-cyan-400 rounded-full" />
                </div>
                <span className="text-cyan-400 text-sm">95%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-green-400">🎮</span>
                <span className="text-gray-300">Sequence Gasless</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 h-2 bg-gray-700 rounded-full">
                  <div className="w-[98%] h-2 bg-green-400 rounded-full" />
                </div>
                <span className="text-green-400 text-sm">98%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-purple-400">🔮</span>
                <span className="text-gray-300">RedStone Oracles</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 h-2 bg-gray-700 rounded-full">
                  <div className="w-[92%] h-2 bg-purple-400 rounded-full" />
                </div>
                <span className="text-purple-400 text-sm">92%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">
            ⚡ Live Activity Feed
          </h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            <AnimatePresence>
              {[
                {
                  time: "2s ago",
                  action: "New user joined network",
                  type: "success",
                },
                {
                  time: "5s ago",
                  action: "Gasless payment sent via Sequence",
                  type: "info",
                },
                {
                  time: "8s ago",
                  action: "Trust score updated via Goldsky",
                  type: "info",
                },
                {
                  time: "12s ago",
                  action: "Yield strategy optimized",
                  type: "success",
                },
                {
                  time: "15s ago",
                  action: "New vouch connection created",
                  type: "success",
                },
                {
                  time: "18s ago",
                  action: "RedStone price feed updated",
                  type: "info",
                },
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center space-x-3 p-2 rounded-lg bg-gray-700/30"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activity.type === "success"
                        ? "bg-green-400"
                        : "bg-cyan-400"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="text-sm text-gray-300">
                      {activity.action}
                    </div>
                    <div className="text-xs text-gray-500">{activity.time}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">
          🎛️ System Controls
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => {
              /* Refresh all data */
            }}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
          >
            🔄 Refresh Data
          </button>
          <button
            onClick={() => {
              /* Export analytics */
            }}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            📊 Export Analytics
          </button>
          <button
            onClick={() => {
              /* Toggle live updates */
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            📡 Toggle Live Feed
          </button>
          <button
            onClick={() => {
              /* System diagnostics */
            }}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
          >
            🔧 Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}
