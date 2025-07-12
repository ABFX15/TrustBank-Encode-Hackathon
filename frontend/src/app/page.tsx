"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { WelcomePage } from "@/components/WelcomePage";
import { DashboardPage } from "@/components/DashboardPage";

export default function HomePage() {
  const { isConnected } = useAccount();
  const [showDashboard, setShowDashboard] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  useEffect(() => {
    // Check if user has seen welcome before
    const seenWelcome = localStorage.getItem("trustbank-seen-welcome");
    if (seenWelcome === "true") {
      setHasSeenWelcome(true);
      if (isConnected) {
        setShowDashboard(true);
      }
    }
  }, [isConnected]);

  useEffect(() => {
    // If user connects wallet and has seen welcome, go to dashboard
    if (isConnected && hasSeenWelcome) {
      setShowDashboard(true);
    }
  }, [isConnected, hasSeenWelcome]);

  const handleWelcomeComplete = () => {
    localStorage.setItem("trustbank-seen-welcome", "true");
    setHasSeenWelcome(true);
    setShowDashboard(true);
  };

  // Debug function to reset welcome state (remove in production)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "R") {
        localStorage.removeItem("trustbank-seen-welcome");
        setHasSeenWelcome(false);
        setShowDashboard(false);
        window.location.reload();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  // Show welcome page if user hasn't seen it or isn't connected
  if (!hasSeenWelcome || (!isConnected && !showDashboard)) {
    return <WelcomePage onWelcomeComplete={handleWelcomeComplete} />;
  }

  // Show dashboard if connected or if they've completed welcome
  return <DashboardPage />;
}
