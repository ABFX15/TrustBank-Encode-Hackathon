"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";
import dynamic from "next/dynamic";
import {
  getUserTrustNetwork,
  getTrustNetworkAnalytics,
  calculateTrustScore,
  calculateMaxLoanAmount,
  goldskyClient,
  GET_REAL_TIME_TRUST_UPDATES,
} from "@/lib/goldsky";
import { LoadingSpinner } from "./LoadingSpinner";
import { LiveTrustNetworkGraph } from "./LiveTrustNetworkGraph";
import { RealTimeMetrics } from "./RealTimeMetrics";

// Dynamic import for ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface AnalyticsData {
  userMetrics: {
    trustScore: number;
    trustScoreHistory: Array<{ date: string; score: number; event: string }>;
    totalPayments: number;
    totalVouches: number;
    maxLoanAmount: number;
    networkReach: number;
    riskScore: number;
  };
  networkMetrics: {
    totalUsers: number;
    totalTVL: number;
    averageTrustScore: number;
    activeLoans: number;
    defaultRate: number;
    networkGrowth: Array<{ date: string; users: number; volume: number }>;
  };
  paymentAnalytics: {
    dailyVolume: Array<{ date: string; volume: number; count: number }>;
    topRecipients: Array<{ address: string; amount: number; count: number }>;
    averagePaymentSize: number;
    paymentFrequency: string;
  };
  loanAnalytics: {
    loanDistribution: Array<{ range: string; count: number; value: number }>;
    repaymentRate: number;
    averageLoanSize: number;
    interestEarned: number;
  };
  yieldAnalytics: {
    portfolioPerformance: Array<{ date: string; apy: number; value: number }>;
    strategyAllocation: Array<{
      strategy: string;
      allocation: number;
      apy: number;
    }>;
    totalYieldEarned: number;
    bestPerformingStrategy: string;
  };
  trustNetwork: {
    nodes: Array<{
      id: string;
      name: string;
      trustScore: number;
      group: number;
    }>;
    links: Array<{
      source: string;
      target: string;
      value: number;
      type: string;
    }>;
  };
}

const COLORS = {
  primary: "#00d4ff",
  secondary: "#00ff88",
  accent: "#ff6b6b",
  warning: "#ffd93d",
  purple: "#8b5cf6",
  pink: "#ec4899",
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.warning,
  COLORS.purple,
  COLORS.pink,
];

export function AdvancedAnalyticsDashboard() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState("overview");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeUpdates, setRealtimeUpdates] = useState(0);

  useEffect(() => {
    if (address) {
      loadAnalyticsData();
      // Set up real-time updates
      const interval = setInterval(() => {
        setRealtimeUpdates((prev) => prev + 1);
        loadAnalyticsData();
      }, 10000); // Update every 10 seconds

      return () => clearInterval(interval);
    }
  }, [address]);

  const loadAnalyticsData = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      // Simulate comprehensive analytics data (in production, this would come from Goldsky)
      const mockData: AnalyticsData = {
        userMetrics: {
          trustScore: 247,
          trustScoreHistory: [
            { date: "2024-01-01", score: 100, event: "SIGNUP" },
            { date: "2024-01-05", score: 130, event: "PAYMENT" },
            { date: "2024-01-10", score: 165, event: "VOUCH" },
            { date: "2024-01-15", score: 195, event: "LOAN_REPAY" },
            { date: "2024-01-20", score: 220, event: "ZK_BOOST" },
            { date: "2024-01-25", score: 247, event: "PAYMENT" },
          ],
          totalPayments: 23,
          totalVouches: 8,
          maxLoanAmount: calculateMaxLoanAmount(247),
          networkReach: 156,
          riskScore: 15,
        },
        networkMetrics: {
          totalUsers: 1247,
          totalTVL: 2847590,
          averageTrustScore: 189,
          activeLoans: 89,
          defaultRate: 2.3,
          networkGrowth: [
            { date: "Week 1", users: 145, volume: 12500 },
            { date: "Week 2", users: 289, volume: 28900 },
            { date: "Week 3", users: 467, volume: 56700 },
            { date: "Week 4", users: 723, volume: 125600 },
            { date: "Week 5", users: 1024, volume: 234500 },
            { date: "Week 6", users: 1247, volume: 284759 },
          ],
        },
        paymentAnalytics: {
          dailyVolume: [
            { date: "Mon", volume: 45600, count: 23 },
            { date: "Tue", volume: 52300, count: 31 },
            { date: "Wed", volume: 38900, count: 19 },
            { date: "Thu", volume: 67800, count: 42 },
            { date: "Fri", volume: 89200, count: 56 },
            { date: "Sat", volume: 71500, count: 38 },
            { date: "Sun", volume: 34200, count: 18 },
          ],
          topRecipients: [
            { address: "0x1234...5678", amount: 12500, count: 8 },
            { address: "0xabcd...efgh", amount: 9800, count: 12 },
            { address: "0x9876...4321", amount: 7650, count: 6 },
          ],
          averagePaymentSize: 156.7,
          paymentFrequency: "2.3/day",
        },
        loanAnalytics: {
          loanDistribution: [
            { range: "$0-50", count: 145, value: 4200 },
            { range: "$50-200", count: 89, value: 12800 },
            { range: "$200-500", count: 34, value: 13600 },
            { range: "$500-1000", count: 12, value: 8900 },
          ],
          repaymentRate: 97.7,
          averageLoanSize: 187.5,
          interestEarned: 1240.56,
        },
        yieldAnalytics: {
          portfolioPerformance: [
            { date: "Jan", apy: 5.2, value: 1000 },
            { date: "Feb", apy: 5.8, value: 1045 },
            { date: "Mar", apy: 6.1, value: 1089 },
            { date: "Apr", apy: 5.9, value: 1134 },
            { date: "May", apy: 6.4, value: 1178 },
            { date: "Jun", apy: 6.2, value: 1223 },
          ],
          strategyAllocation: [
            { strategy: "Aave USDC", allocation: 40, apy: 5.2 },
            { strategy: "Compound USDC", allocation: 35, apy: 4.8 },
            { strategy: "Uniswap V3", allocation: 25, apy: 6.8 },
          ],
          totalYieldEarned: 223.45,
          bestPerformingStrategy: "Uniswap V3",
        },
        trustNetwork: {
          nodes: [
            { id: address, name: "You", trustScore: 247, group: 1 },
            { id: "user1", name: "Alice", trustScore: 189, group: 2 },
            { id: "user2", name: "Bob", trustScore: 234, group: 2 },
            { id: "user3", name: "Charlie", trustScore: 156, group: 3 },
            { id: "user4", name: "Diana", trustScore: 298, group: 2 },
            { id: "user5", name: "Eve", trustScore: 134, group: 3 },
          ],
          links: [
            { source: address, target: "user1", value: 150, type: "vouch" },
            { source: address, target: "user2", value: 75, type: "payment" },
            { source: "user1", target: "user4", value: 200, type: "vouch" },
            { source: "user2", target: "user3", value: 100, type: "payment" },
            { source: "user4", target: "user5", value: 50, type: "payment" },
          ],
        },
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error("Failed to load analytics data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "overview", name: "Overview", icon: "📊" },
    { id: "trust", name: "Trust Network", icon: "🤝" },
    { id: "payments", name: "Payments", icon: "💸" },
    { id: "loans", name: "Loans", icon: "🏦" },
    { id: "yield", name: "Yield", icon: "📈" },
    { id: "risk", name: "Risk Analytics", icon: "⚡" },
  ];

  if (isLoading || !analyticsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 mt-4">Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-cyan-400 mb-2">
              🔍 Advanced Analytics Dashboard
            </h1>
            <p className="text-gray-400">
              Real-time insights powered by Goldsky • Last update:{" "}
              {new Date().toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm">Live Data</span>
            </div>
            <div className="bg-gray-800 px-4 py-2 rounded-lg">
              <span className="text-cyan-400 font-bold text-2xl">
                {analyticsData.userMetrics.trustScore}
              </span>
              <span className="text-gray-400 text-sm ml-1">Trust Score</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mt-6 bg-gray-800/50 p-1 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? "bg-cyan-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "overview" && <OverviewTab data={analyticsData} />}
          {activeTab === "trust" && <TrustNetworkTab data={analyticsData} />}
          {activeTab === "payments" && <PaymentsTab data={analyticsData} />}
          {activeTab === "loans" && <LoansTab data={analyticsData} />}
          {activeTab === "yield" && <YieldTab data={analyticsData} />}
          {activeTab === "risk" && <RiskAnalyticsTab data={analyticsData} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-8">
      {/* Real-Time System Metrics */}
      <RealTimeMetrics />
      
      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Key Metrics Cards */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">
          User Performance
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Trust Score</span>
            <span className="text-2xl font-bold text-cyan-400">
              {data.userMetrics.trustScore}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Max Loan</span>
            <span className="text-xl font-bold text-green-400">
              ${data.userMetrics.maxLoanAmount}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Network Reach</span>
            <span className="text-lg font-bold text-purple-400">
              {data.userMetrics.networkReach}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Risk Score</span>
            <span className="text-lg font-bold text-yellow-400">
              {data.userMetrics.riskScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Trust Score History Chart */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20 col-span-2">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">
          Trust Score Evolution
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.userMetrics.trustScoreHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #00d4ff",
                borderRadius: "8px",
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke={COLORS.primary}
              fill={COLORS.primary}
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Network Growth */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20 col-span-2">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">
          Network Growth
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.networkMetrics.networkGrowth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #00d4ff",
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="users"
              stroke={COLORS.primary}
              strokeWidth={2}
              name="Users"
            />
            <Line
              type="monotone"
              dataKey="volume"
              stroke={COLORS.secondary}
              strokeWidth={2}
              name="Volume ($)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Protocol Stats */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">
          Protocol Health
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Total Users</span>
            <span className="text-xl font-bold text-cyan-400">
              {data.networkMetrics.totalUsers.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Total TVL</span>
            <span className="text-xl font-bold text-green-400">
              ${data.networkMetrics.totalTVL.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Active Loans</span>
            <span className="text-lg font-bold text-purple-400">
              {data.networkMetrics.activeLoans}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Default Rate</span>
            <span className="text-lg font-bold text-yellow-400">
              {data.networkMetrics.defaultRate}%
            </span>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

// Trust Network Tab Component
function TrustNetworkTab({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-6">
      {/* Advanced Live Trust Network Visualization */}
      <LiveTrustNetworkGraph />

      {/* Additional Trust Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">
            Network Health
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Network Density</span>
              <span className="text-cyan-400 font-bold">
                {(
                  (data.trustNetwork.links.length /
                    (data.trustNetwork.nodes.length *
                      (data.trustNetwork.nodes.length - 1))) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Connections</span>
              <span className="text-green-400 font-bold">
                {(
                  (data.trustNetwork.links.length /
                    data.trustNetwork.nodes.length) *
                  2
                ).toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Trust Velocity</span>
              <span className="text-purple-400 font-bold">High</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">
            Connection Types
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={[
                  {
                    name: "Vouches",
                    value: data.trustNetwork.links.filter(
                      (l) => l.type === "vouch"
                    ).length,
                    fill: COLORS.primary,
                  },
                  {
                    name: "Payments",
                    value: data.trustNetwork.links.filter(
                      (l) => l.type === "payment"
                    ).length,
                    fill: COLORS.secondary,
                  },
                  {
                    name: "Loans",
                    value: data.trustNetwork.links.filter(
                      (l) => l.type === "loan"
                    ).length,
                    fill: COLORS.accent,
                  },
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
              >
                <Cell fill={COLORS.primary} />
                <Cell fill={COLORS.secondary} />
                <Cell fill={COLORS.accent} />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">
            Trust Score Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={[
                {
                  range: "0-100",
                  count: data.trustNetwork.nodes.filter(
                    (n) => n.trustScore < 100
                  ).length,
                },
                {
                  range: "100-200",
                  count: data.trustNetwork.nodes.filter(
                    (n) => n.trustScore >= 100 && n.trustScore < 200
                  ).length,
                },
                {
                  range: "200-300",
                  count: data.trustNetwork.nodes.filter(
                    (n) => n.trustScore >= 200 && n.trustScore < 300
                  ).length,
                },
                {
                  range: "300+",
                  count: data.trustNetwork.nodes.filter(
                    (n) => n.trustScore >= 300
                  ).length,
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="range" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #00d4ff",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Payments Tab Component
function PaymentsTab({ data }: { data: AnalyticsData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily Volume Chart */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">
          Daily Payment Volume
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.paymentAnalytics.dailyVolume}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #00d4ff",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="volume" fill={COLORS.primary} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Payment Stats */}
      <div className="space-y-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">
            Payment Statistics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Average Payment</span>
              <span className="text-cyan-400 font-bold">
                ${data.paymentAnalytics.averagePaymentSize}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Frequency</span>
              <span className="text-green-400 font-bold">
                {data.paymentAnalytics.paymentFrequency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Payments</span>
              <span className="text-purple-400 font-bold">
                {data.userMetrics.totalPayments}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">
            Top Recipients
          </h3>
          <div className="space-y-3">
            {data.paymentAnalytics.topRecipients.map((recipient, index) => (
              <div
                key={recipient.address}
                className="flex justify-between items-center"
              >
                <div>
                  <div className="text-white font-medium">
                    {recipient.address}
                  </div>
                  <div className="text-sm text-gray-400">
                    {recipient.count} payments
                  </div>
                </div>
                <div className="text-cyan-400 font-bold">
                  ${recipient.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Loans Tab Component
function LoansTab({ data }: { data: AnalyticsData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Loan Distribution */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">
          Loan Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.loanAnalytics.loanDistribution}
              dataKey="count"
              nameKey="range"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
            >
              {data.loanAnalytics.loanDistribution.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Loan Performance */}
      <div className="space-y-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">
            Loan Performance
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Repayment Rate</span>
              <span className="text-green-400 font-bold">
                {data.loanAnalytics.repaymentRate}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Average Loan</span>
              <span className="text-cyan-400 font-bold">
                ${data.loanAnalytics.averageLoanSize}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Interest Earned</span>
              <span className="text-purple-400 font-bold">
                ${data.loanAnalytics.interestEarned}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">
            Credit Utilization
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Available Credit</span>
                <span className="text-cyan-400">
                  ${data.userMetrics.maxLoanAmount}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-green-400 h-2 rounded-full"
                  style={{ width: "30%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Yield Tab Component
function YieldTab({ data }: { data: AnalyticsData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Portfolio Performance */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">
          Portfolio Performance
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.yieldAnalytics.portfolioPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #00d4ff",
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={COLORS.secondary}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="apy"
              stroke={COLORS.primary}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Strategy Allocation */}
      <div className="space-y-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">
            Strategy Allocation
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.yieldAnalytics.strategyAllocation}
                dataKey="allocation"
                nameKey="strategy"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
              >
                {data.yieldAnalytics.strategyAllocation.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">
            Yield Summary
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Earned</span>
              <span className="text-green-400 font-bold">
                ${data.yieldAnalytics.totalYieldEarned}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Best Strategy</span>
              <span className="text-cyan-400 font-bold">
                {data.yieldAnalytics.bestPerformingStrategy}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Risk Analytics Tab Component
function RiskAnalyticsTab({ data }: { data: AnalyticsData }) {
  const riskMetrics = [
    { name: "Credit Risk", value: 15, color: COLORS.secondary },
    { name: "Liquidity Risk", value: 8, color: COLORS.primary },
    { name: "Market Risk", value: 12, color: COLORS.accent },
    { name: "Network Risk", value: 5, color: COLORS.warning },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Risk Metrics */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">
          Risk Assessment
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadialBarChart data={riskMetrics}>
            <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
            <Tooltip />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>

      {/* Risk Breakdown */}
      <div className="space-y-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">
            Risk Factors
          </h3>
          <div className="space-y-4">
            {riskMetrics.map((metric) => (
              <div key={metric.name}>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">{metric.name}</span>
                  <span className="text-white font-bold">{metric.value}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${metric.value}%`,
                      backgroundColor: metric.color,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">
            Risk Score
          </h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-400 mb-2">
              {data.userMetrics.riskScore}%
            </div>
            <div className="text-green-400">Low Risk</div>
            <p className="text-gray-400 text-sm mt-2">
              Based on payment history, network connections, and loan
              performance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
