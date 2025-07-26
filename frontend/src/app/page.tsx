"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { WelcomePage } from "@/components/WelcomePage";
import { DashboardPage } from "@/components/DashboardPage";
import { Notification, useNotification } from "@/components/Notification";

export default function Home() {
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const { notification, showNotification, hideNotification } =
    useNotification();

  const handleWelcomeComplete = () => {
    setHasSeenWelcome(true);
    showNotification(
      "success",
      "Welcome to TrustBank!",
      "Your Miami DeFi journey begins now."
    );
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-miami-gradient">
      {/* Subtle Palm Tree Silhouettes */}
      <div className="absolute top-20 left-10 palm-tree"></div>
      <div className="absolute top-40 right-10 palm-tree scale-x-[-1]"></div>
      <div className="absolute bottom-20 left-20 palm-tree scale-75"></div>
      <div className="absolute bottom-40 right-20 palm-tree scale-75 scale-x-[-1]"></div>

      <div className="relative z-10">
        <Header />

        {!hasSeenWelcome ? (
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
