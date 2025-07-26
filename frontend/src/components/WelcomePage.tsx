"use client";

import { useState, useEffect } from "react";
import { Typewriter } from "./Typewriter";

interface WelcomePageProps {
  onWelcomeComplete: () => void;
}

export function WelcomePage({ onWelcomeComplete }: WelcomePageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showContinue, setShowContinue] = useState(false);

  const welcomeSteps = [
    "Get $50,000 Loans Without Collateral",
    "Your Trust Score = Your Credit Limit",
    "Built on Real Relationships",
    "Zero Liquidation Risk",
    "Ready to Build Your Trust Network?",
  ];

  useEffect(() => {
    if (currentStep < welcomeSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 3500);
      return () => clearTimeout(timer);
    } else {
      // Show continue button after last message
      setTimeout(() => setShowContinue(true), 1000);
    }
  }, [currentStep]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-miami-gradient">
      {/* Subtle Palm Tree Silhouettes */}
      <div className="absolute top-20 left-10 palm-tree"></div>
      <div className="absolute top-40 right-10 palm-tree scale-x-[-1]"></div>
      <div className="absolute bottom-20 left-20 palm-tree scale-75"></div>
      <div className="absolute bottom-40 right-20 palm-tree scale-75 scale-x-[-1]"></div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Logo */}
        <div className="mb-8 animate-gentle-float">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-r from-cyan-400 via-pink-500 to-orange-400 flex items-center justify-center shadow-2xl shadow-cyan-400/50">
            <span className="text-4xl font-black text-black">TB</span>
          </div>
        </div>

        {/* Main Message */}
        <div className="text-center mb-16 max-w-6xl">
          <div className="card-miami-premium p-12 shadow-2xl shadow-pink-400/30">
            <div className="mb-8">
              <Typewriter
                text={welcomeSteps[currentStep]}
                className="text-4xl md:text-6xl font-bold text-white leading-tight"
                speed={50}
              />
            </div>

            {currentStep === 0 && (
              <div className="text-xl md:text-2xl text-gray-300 leading-relaxed">
                <span className="text-red-400 font-bold line-through">
                  No more 150% collateral
                </span>
                <br />
                <span className="text-neon-cyan font-bold">
                  Borrow based on who trusts you
                </span>
              </div>
            )}

            {currentStep === 1 && (
              <div className="text-xl md:text-2xl text-gray-300 leading-relaxed">
                <span className="text-miami-gradient font-bold">
                  Trust Score 850 = $50,000 credit limit
                </span>
                <br />
                <span className="text-neon-pink">
                  Build reputation, unlock borrowing power
                </span>
              </div>
            )}

            {currentStep === 2 && (
              <div className="text-xl md:text-2xl text-gray-300 leading-relaxed">
                <span className="text-neon-cyan font-bold">
                  Friends vouch for you on-chain
                </span>
                <br />
                <span className="text-miami-gradient">
                  Real relationships = Real credit
                </span>
              </div>
            )}

            {currentStep === 3 && (
              <div className="text-xl md:text-2xl text-gray-300 leading-relaxed">
                <span className="text-neon-pink font-bold">
                  No liquidations, no stress
                </span>
                <br />
                <span className="text-neon-cyan">
                  Your reputation is your safety net
                </span>
              </div>
            )}

            {currentStep === 4 && (
              <div className="text-xl md:text-2xl text-gray-300 leading-relaxed">
                <span className="text-miami-gradient font-bold">
                  Join the future of decentralized banking
                </span>
                <br />
                <span className="text-neon-pink">
                  Where trust meets technology
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Step Cards */}
        {showContinue && (
          <div className="mb-16 max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card-miami p-6 text-center">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-xl font-bold text-neon-cyan mb-2">
                  Build Network
                </h3>
                <p className="text-gray-300 text-sm">
                  Connect & vouch for friends
                </p>
                <div className="text-neon-cyan/80 text-xs mt-2">Step 1</div>
              </div>

              <div className="card-miami p-6 text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-neon-pink mb-2">
                  Earn Trust Score
                </h3>
                <p className="text-gray-300 text-sm">
                  0-1000 reputation points
                </p>
                <div className="text-neon-pink/80 text-xs mt-2">Step 2</div>
              </div>

              <div className="card-miami p-6 text-center">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-miami-gradient mb-2">
                  Get Loans
                </h3>
                <p className="text-gray-300 text-sm">
                  Up to $50k, no collateral
                </p>
                <div className="text-miami-gradient/80 text-xs mt-2">
                  Step 3
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showContinue && (
          <div className="text-center space-y-6">
            <button
              onClick={onWelcomeComplete}
              className="btn-miami-primary text-2xl px-16 py-6 shadow-2xl shadow-cyan-400/30"
            >
              🚀 Start Building Trust Score
            </button>

            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Join thousands earning credit through real relationships.
              <br />
              <span className="text-neon-cyan font-semibold">
                Your reputation is your collateral.
              </span>
            </p>
          </div>
        )}

        {/* Progress Indicators */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-3">
            {welcomeSteps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index <= currentStep
                    ? "bg-gradient-to-r from-cyan-400 to-pink-400 shadow-lg shadow-cyan-400/50"
                    : "bg-gray-600"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Social Proof Footer */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
          <p className="text-xs text-gray-400">
            Trusted by 5,000+ users • $2.4M+ in uncollateralized loans
          </p>
        </div>
      </div>
    </div>
  );
}
