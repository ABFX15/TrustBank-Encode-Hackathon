"use client";

import { useState } from "react";
import { LendingInterface } from "./LendingInterface";
import { GaslessPaymentInterface } from "./GaslessPaymentInterface";
import { AdvancedAnalyticsDashboard } from "./AdvancedAnalyticsDashboard";
import { TrustNetwork } from "./TrustNetwork";
import { UserYieldDashboard } from "./UserYieldDashboard";

interface Tab {
  id: string;
  name: string;
  icon: string;
  component: React.ComponentType;
  description: string;
}

export const defaultTabs: Tab[] = [
  {
    id: "trust",
    name: "Trust Network",
    icon: "🤝",
    component: TrustNetwork,
    description: "Build your reputation and vouch for friends",
  },
  {
    id: "lending",
    name: "Banking",
    icon: "🏦",
    component: LendingInterface,
    description: "Get uncollateralized loans based on your trust score",
  },
  {
    id: "analytics",
    name: "Analytics",
    icon: "📊",
    component: AdvancedAnalyticsDashboard,
    description: "Track your trust score and network growth",
  },
  {
    id: "gasless",
    name: "Gasless Payments",
    icon: "🎮",
    component: GaslessPaymentInterface,
    description: "Send payments and vouch for friends without gas fees",
  },
  {
    id: "yield",
    name: "Yield Dashboard",
    icon: "📈",
    component: UserYieldDashboard,
    description: "Track your auto-compound yield strategies",
  },
];

interface TabbedInterfaceProps {
  tabs?: Tab[];
  defaultTab?: string;
}

export function TabbedInterface({
  tabs = defaultTabs,
  defaultTab = "lending",
}: TabbedInterfaceProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const currentTab = tabs.find((tab) => tab.id === activeTab) || tabs[0];
  const CurrentComponent = currentTab.component;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Enhanced Tab Navigation */}
      <div className="flex flex-wrap justify-center gap-2 mb-8 p-2 card-miami rounded-2xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`group relative px-6 py-4 rounded-xl transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-cyan-400 via-pink-500 to-orange-400 text-black shadow-lg shadow-cyan-400/25"
                : "text-gray-300 hover:text-white hover:bg-black/20"
            }`}
          >
            <div className="flex items-center space-x-3">
              <span
                className={`text-2xl transition-transform group-hover:scale-110 ${
                  activeTab === tab.id ? "" : "grayscale"
                }`}
              >
                {tab.icon}
              </span>
              <div className="text-left">
                <div
                  className={`font-bold text-lg ${
                    activeTab === tab.id ? "text-black" : ""
                  }`}
                >
                  {tab.name}
                </div>
                <div
                  className={`text-sm ${
                    activeTab === tab.id ? "text-black/70" : "text-gray-400"
                  }`}
                >
                  {tab.description}
                </div>
              </div>
            </div>

            {/* Active Tab Indicator */}
            {activeTab === tab.id && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-black rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content with Animation */}
      <div className="relative">
        <div className="card-miami-premium p-8 min-h-[600px]">
          {/* Tab Header */}
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold text-miami-gradient mb-2">
              {currentTab.name}
            </h2>
            <p className="text-gray-400 text-lg">{currentTab.description}</p>
          </div>

          {/* Component Content */}
          <div className="relative">
            <CurrentComponent />
          </div>
        </div>

        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-xl animate-pulse"></div>
          <div
            className="absolute bottom-10 right-10 w-24 h-24 bg-pink-500/10 rounded-full blur-xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
