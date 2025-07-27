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
    <div className="min-h-screen relative overflow-hidden synthwave-gradient">
      {/* Palm Trees */}
      <div className="absolute left-0 bottom-0 z-5 opacity-15">
        <svg
          width="200"
          height="300"
          viewBox="0 0 300 400"
          fill="none"
          className="palm-tree-left"
        >
          <path
            d="M140 400 Q145 380 142 360 Q148 340 144 320 Q150 300 146 280 Q152 260 148 240 Q154 220 150 200 Q156 180 152 160 Q158 140 154 120 Q160 100 156 80"
            stroke="black"
            strokeWidth="6"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M156 80 Q120 40 80 20 Q60 10 40 15"
            stroke="black"
            strokeWidth="3"
            fill="none"
            opacity="0.4"
          />
          <path
            d="M156 80 Q180 45 220 25 Q240 15 260 20"
            stroke="black"
            strokeWidth="3"
            fill="none"
            opacity="0.4"
          />
        </svg>
      </div>
      <div className="absolute right-0 bottom-0 z-5 opacity-15">
        <svg
          width="200"
          height="300"
          viewBox="0 0 300 400"
          fill="none"
          className="palm-tree-right"
        >
          <path
            d="M160 400 Q155 380 158 360 Q152 340 156 320 Q150 300 154 280 Q148 260 152 240 Q146 220 150 200 Q144 180 148 160 Q142 140 146 120 Q140 100 144 80"
            stroke="black"
            strokeWidth="6"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M144 80 Q180 40 220 20 Q240 10 260 15"
            stroke="black"
            strokeWidth="3"
            fill="none"
            opacity="0.4"
          />
          <path
            d="M144 80 Q120 45 80 25 Q60 15 40 20"
            stroke="black"
            strokeWidth="3"
            fill="none"
            opacity="0.4"
          />
        </svg>
      </div>

      {/* Grid lines for retro effect */}
      <div className="absolute bottom-0 left-0 w-full h-32 grid-lines opacity-10 z-5"></div>

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
          <div className="card-synthwave-premium p-12 shadow-2xl shadow-pink-500/40">
            <div className="mb-8">
              <Typewriter
                text={welcomeSteps[currentStep]}
                className="text-4xl md:text-6xl font-bold text-white leading-tight"
                speed={50}
              />
            </div>

            {currentStep === 0 && (
              <div className="text-xl md:text-2xl text-gray-200 leading-relaxed">
                <span className="text-red-400 font-bold line-through">
                  No more 150% collateral
                </span>
                <br />
                <span className="text-cyan-400 font-bold">
                  Borrow based on who trusts you
                </span>
              </div>
            )}

            {currentStep === 1 && (
              <div className="text-xl md:text-2xl text-gray-200 leading-relaxed">
                <span className="text-cyan-400 font-bold">
                  Trust Score 850 = $50,000 credit limit
                </span>
                <br />
                <span className="text-pink-400">
                  Build reputation, unlock borrowing power
                </span>
              </div>
            )}

            {currentStep === 2 && (
              <div className="text-xl md:text-2xl text-gray-200 leading-relaxed">
                <span className="text-cyan-400 font-bold">
                  Friends vouch for you on-chain
                </span>
                <br />
                <span className="text-purple-300">
                  Real relationships = Real credit
                </span>
              </div>
            )}

            {currentStep === 3 && (
              <div className="text-xl md:text-2xl text-gray-200 leading-relaxed">
                <span className="text-pink-400 font-bold">
                  No liquidations, no stress
                </span>
                <br />
                <span className="text-cyan-400">
                  Your reputation is your safety net
                </span>
              </div>
            )}

            {currentStep === 4 && (
              <div className="text-xl md:text-2xl text-gray-200 leading-relaxed">
                <span className="text-purple-300 font-bold">
                  Join the future of decentralized banking
                </span>
                <br />
                <span className="text-pink-400">
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
              <div className="card-synthwave p-6 text-center">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-xl font-bold text-cyan-400 mb-2">
                  Build Network
                </h3>
                <p className="text-gray-200 text-sm">
                  Connect & vouch for friends
                </p>
                <div className="text-cyan-400/70 text-xs mt-2">Step 1</div>
              </div>

              <div className="card-synthwave p-6 text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-pink-400 mb-2">
                  Earn Trust Score
                </h3>
                <p className="text-gray-200 text-sm">
                  0-1000 reputation points
                </p>
                <div className="text-pink-400/70 text-xs mt-2">Step 2</div>
              </div>

              <div className="card-synthwave p-6 text-center">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-purple-300 mb-2">
                  Get Loans
                </h3>
                <p className="text-gray-200 text-sm">
                  Up to $50k, no collateral
                </p>
                <div className="text-purple-300/70 text-xs mt-2">Step 3</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showContinue && (
          <div className="text-center space-y-6">
            <button
              onClick={onWelcomeComplete}
              className="bg-gradient-to-r from-pink-500 to-cyan-400 text-black font-bold text-2xl px-16 py-6 rounded-lg shadow-2xl shadow-pink-500/40 hover:scale-105 transition-all duration-300"
            >
              🚀 Start Building Trust Score
            </button>

            <p className="text-gray-200 text-lg max-w-2xl mx-auto">
              Join thousands earning credit through real relationships.
              <br />
              <span className="text-cyan-400 font-semibold">
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
                    ? "bg-gradient-to-r from-pink-500 to-cyan-400 shadow-lg shadow-pink-500/50"
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
