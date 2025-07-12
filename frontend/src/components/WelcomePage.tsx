"use client";

import { useState, useEffect } from "react";
import { SpaceBackground } from "@/components/SpaceBackground";
import { Typewriter } from "@/components/Typewriter";

interface WelcomePageProps {
  onWelcomeComplete: () => void;
}

export function WelcomePage({ onWelcomeComplete }: WelcomePageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showContinue, setShowContinue] = useState(false);

  const welcomeSteps = [
    "Welcome to TrustBank Protocol",
    "The Future of Cross-Chain DeFi",
    "Experience Zero-Knowledge Privacy",
    "Build Your Trust Network",
    "Ready to Begin?",
  ];

  useEffect(() => {
    if (currentStep < welcomeSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      // Show continue button after last message
      setTimeout(() => setShowContinue(true), 1000);
    }
  }, [currentStep]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Space Background */}
      <SpaceBackground
        starCount={300}
        showShootingStars={true}
        showNebula={true}
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 z-10" />

      {/* Main content */}
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Logo/Brand */}
        <div className="mb-12 text-center">
          <div className="text-6xl md:text-8xl font-cyber font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-4">
            TrustBank
          </div>
          <div className="text-xl md:text-2xl font-tech text-cyan-300/80">
            Cross-Chain DeFi Protocol
          </div>
        </div>

        {/* Animated welcome messages */}
        <div className="h-32 flex items-center justify-center mb-16">
          <div className="text-2xl md:text-4xl font-tech text-center max-w-4xl">
            {currentStep < welcomeSteps.length && (
              <Typewriter
                key={currentStep}
                text={welcomeSteps[currentStep]}
                speed={80}
                className="text-white"
              />
            )}
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mb-16">
          <div className="text-center p-6 bg-gradient-to-b from-cyan-900/20 to-blue-900/20 rounded-2xl border border-cyan-500/20 backdrop-blur-sm">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-xl font-tech text-cyan-300 mb-2">
              Cross-Chain
            </h3>
            <p className="text-gray-300 font-futura">
              Seamlessly interact across multiple blockchains with Chainlink
              CCIP
            </p>
          </div>

          <div className="text-center p-6 bg-gradient-to-b from-purple-900/20 to-blue-900/20 rounded-2xl border border-purple-500/20 backdrop-blur-sm">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-tech text-purple-300 mb-2">
              Zero-Knowledge
            </h3>
            <p className="text-gray-300 font-futura">
              Maintain privacy while building verifiable trust networks
            </p>
          </div>

          <div className="text-center p-6 bg-gradient-to-b from-blue-900/20 to-cyan-900/20 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
            <div className="text-4xl mb-4">💎</div>
            <h3 className="text-xl font-tech text-blue-300 mb-2">
              Premium DeFi
            </h3>
            <p className="text-gray-300 font-futura">
              Advanced lending, borrowing, and yield strategies
            </p>
          </div>
        </div>

        {/* Continue button */}
        {showContinue && (
          <div className="animate-fadeIn">
            <button
              onClick={onWelcomeComplete}
              className="btn-primary text-xl px-12 py-4 font-tech relative group overflow-hidden"
            >
              <span className="relative z-10">Enter TrustBank</span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>
        )}

        {/* Skip option */}
        <div className="mt-8 text-center">
          <button
            onClick={onWelcomeComplete}
            className="text-gray-400 hover:text-cyan-300 transition-colors font-futura text-sm"
          >
            Skip Introduction →
          </button>
        </div>
      </div>

      {/* Floating orbs for visual interest */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-xl animate-float-slow" />
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-xl animate-float-reverse" />
      <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-full blur-2xl animate-float" />
    </div>
  );
}
