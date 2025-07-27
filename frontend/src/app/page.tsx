"use client";

import { useState } from "react";
import { SynthwaveLanding } from "@/components/SynthwaveLanding";
import { Header } from "@/components/Header";
import { WelcomePage } from "@/components/WelcomePage";
import { DashboardPage } from "@/components/DashboardPage";
import { Notification, useNotification } from "@/components/Notification";

export default function Home() {
  const [currentView, setCurrentView] = useState<
    "landing" | "welcome" | "dashboard"
  >("landing");
  const { notification, showNotification, hideNotification } =
    useNotification();

  const handleEnterApp = () => {
    setCurrentView("welcome");
  };

  const handleWelcomeComplete = () => {
    setCurrentView("dashboard");
    showNotification(
      "success",
      "Welcome to TrustBank!",
      "Your DeFi journey begins now."
    );
  };

  if (currentView === "landing") {
    return (
      <div className="relative">
        <SynthwaveLanding />
        {/* Enter App Button */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30">
          <button
            onClick={handleEnterApp}
            className="bg-gradient-to-r from-pink-500 to-cyan-400 text-black font-bold py-4 px-8 rounded-lg text-xl hover:scale-105 transition-all duration-300 shadow-lg shadow-pink-500/25"
          >
            Enter TrustBank
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden synthwave-gradient">
      {/* Subtle Palm Tree Silhouettes */}
      <div className="absolute top-20 left-10 palm-tree"></div>
      <div className="absolute top-40 right-10 palm-tree scale-x-[-1]"></div>
      <div className="absolute bottom-20 left-20 palm-tree scale-75"></div>
      <div className="absolute bottom-40 right-20 palm-tree scale-75 scale-x-[-1]"></div>

      <div className="relative z-10">
        <Header />

        {currentView === "welcome" ? (
          <WelcomePage onWelcomeComplete={handleWelcomeComplete} />
        ) : (
          <DashboardPage />
        )}
      </div>

      {/* Notification */}
      <Notification {...notification} onClose={hideNotification} />
    </main>
  );
}
