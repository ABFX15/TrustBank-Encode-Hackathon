"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useWriteContract } from "wagmi";
import {
  BanknotesIcon,
  CreditCardIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { LendingInterface } from "./LendingInterface";
import { TrustNetwork } from "./TrustNetwork";
import { useNotification } from "./Notification";

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
}

interface TabbedInterfaceProps {
  tabs: Tab[];
  defaultTab?: string;
}

export function TabbedInterface({ tabs, defaultTab }: TabbedInterfaceProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeTabData = tabs.find((tab) => tab.id === activeTab);
  const ActiveComponent = activeTabData?.component;

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center mb-8 bg-dark-900/50 backdrop-blur-md rounded-2xl p-2 border border-cyan-500/20">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center space-x-2 px-6 py-3 rounded-xl font-tech text-sm transition-all duration-300
                ${
                  isActive
                    ? "bg-cyan-gradient text-dark-900 shadow-cyan-lg transform scale-105"
                    : "text-gray-300 hover:text-white hover:bg-dark-800/50"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="relative">
        {ActiveComponent && (
          <div className="animate-fadeIn">
            <ActiveComponent />
          </div>
        )}
      </div>
    </div>
  );
}

// Tab components
export function LendingTab() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text font-cyber mb-2">
          Lending & Deposits
        </h2>
        <p className="text-gray-400 font-futura">
          Earn yield by providing liquidity to the protocol
        </p>
      </div>
      <LendingInterface />
    </div>
  );
}

export function BorrowingTab() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text font-cyber mb-2">
          Borrowing
        </h2>
        <p className="text-gray-400 font-futura">
          Borrow against your trust network and collateral
        </p>
      </div>
      <div className="card-premium p-6">
        <h3 className="text-xl font-semibold text-cyan-400 mb-4 font-tech">
          Borrow USDC
        </h3>
        <div className="space-y-4">
          <div className="input-group">
            <label className="text-sm text-gray-400 mb-2 block">
              Amount to Borrow
            </label>
            <input
              type="number"
              placeholder="0.00"
              className="input-premium w-full"
            />
          </div>
          <button className="btn-primary w-full">Request Loan</button>
        </div>
      </div>
    </div>
  );
}

export function TrustNetworkTab() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text font-cyber mb-2">
          Trust Network
        </h2>
        <p className="text-gray-400 font-futura">
          Build your decentralized credit network
        </p>
      </div>
      <TrustNetwork />
    </div>
  );
}

export function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text font-cyber mb-2">
          Analytics
        </h2>
        <p className="text-gray-400 font-futura">
          Track your portfolio and network performance
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4 font-tech">
            Portfolio Overview
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Deposited</span>
              <span className="text-white font-mono">$0.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Borrowed</span>
              <span className="text-white font-mono">$0.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Net Yield</span>
              <span className="text-green-400 font-mono">+$0.00</span>
            </div>
          </div>
        </div>
        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4 font-tech">
            Trust Network
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Trust Score</span>
              <span className="text-cyan-400 font-mono">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Vouches Given</span>
              <span className="text-white font-mono">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Vouches Received</span>
              <span className="text-white font-mono">0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsTab() {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const { showNotification } = useNotification();

  const handleGetTestUSDC = async () => {
    if (!isConnected || !address) {
      showNotification(
        "error",
        "Wallet Not Connected",
        "Please connect your wallet first"
      );
      return;
    }

    try {
      // This would typically mint test USDC - implementation depends on your MockUSDC contract
      showNotification("info", "Requesting Test USDC", "Processing request...");
      // Add actual contract call here when needed
    } catch (error) {
      showNotification(
        "error",
        "Failed to Get Test USDC",
        "Please try again later"
      );
    }
  };

  const handleResetDemo = () => {
    localStorage.removeItem("trustbank-seen-welcome");
    showNotification("success", "Demo Reset", "Refreshing page...");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text font-cyber mb-2">
          Settings
        </h2>
        <p className="text-gray-400 font-futura">
          Configure your TrustBank experience
        </p>
      </div>
      <div className="card-premium p-6">
        <h3 className="text-xl font-semibold text-cyan-400 mb-4 font-tech">
          Developer Tools
        </h3>
        <div className="space-y-4">
          <button
            onClick={handleGetTestUSDC}
            disabled={!isConnected || isPending}
            className="btn-secondary w-full"
          >
            {isPending ? "Processing..." : "Get Test USDC"}
          </button>
          <button onClick={handleResetDemo} className="btn-secondary w-full">
            Reset Demo State
          </button>
          <div className="text-xs text-gray-500 mt-4 p-3 bg-dark-800/50 rounded-lg">
            <p className="font-mono">Network: Etherlink Testnet</p>
            <p className="font-mono">Chain ID: 128123</p>
            <p className="font-mono">
              Status: {isConnected ? "Connected" : "Disconnected"}
            </p>
            {address && (
              <p className="font-mono">
                Address: {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Default tabs configuration
export const defaultTabs: Tab[] = [
  {
    id: "lending",
    label: "Lending",
    icon: BanknotesIcon,
    component: LendingTab,
  },
  {
    id: "borrowing",
    label: "Borrowing",
    icon: CreditCardIcon,
    component: BorrowingTab,
  },
  {
    id: "trust",
    label: "Trust Network",
    icon: UserGroupIcon,
    component: TrustNetworkTab,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: ChartBarIcon,
    component: AnalyticsTab,
  },
  {
    id: "settings",
    label: "Settings",
    icon: Cog6ToothIcon,
    component: SettingsTab,
  },
];
