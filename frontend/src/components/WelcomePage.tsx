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
        {/* Revolutionary Badge */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center px-8 py-4 rounded-full bg-emerald-900/40 border border-emerald-500/50 backdrop-blur-sm animate-pulse">
            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-ping mr-4"></div>
            <span className="text-emerald-400 text-lg font-bold tracking-wide uppercase">
              Revolutionary DeFi Protocol
            </span>
          </div>
        </div>

        {/* Logo/Brand */}
        <div className="mb-16 text-center">
          <div className="w-32 h-32 rounded-2xl border-4 border-cyan-400 bg-black/80 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-cyan-500/30 backdrop-blur-sm">
            <span className="text-cyan-400 font-black text-6xl">TB</span>
          </div>
          <h1 className="text-7xl md:text-8xl font-black gradient-text mb-4 leading-tight">
            TRUSTBANK
          </h1>
          <div className="text-2xl md:text-3xl text-white/90 font-bold mb-6">
            Uncollateralized Lending Protocol
          </div>
        </div>

        {/* Main Message Carousel */}
        <div className="text-center mb-16 max-w-6xl">
          <div className="bg-black/80 backdrop-blur-xl rounded-3xl border border-cyan-500/30 p-12 shadow-2xl shadow-cyan-500/20">
            <div className="mb-8">
              <Typewriter
                text={welcomeSteps[currentStep]}
                className="text-4xl md:text-6xl font-bold text-white leading-tight"
                speed={50}
              />
            </div>

            {currentStep === 0 && (
              <div className="text-xl md:text-2xl text-gray-300 leading-relaxed animate-fadeIn">
                <span className="text-red-400 font-bold line-through">
                  No more 150% collateral
                </span>
                <br />
                <span className="text-emerald-400 font-bold">
                  Borrow based on who trusts you
                </span>
              </div>
            )}

            {currentStep === 1 && (
              <div className="text-xl md:text-2xl text-gray-300 leading-relaxed animate-fadeIn">
                <span className="text-cyan-400 font-bold">
                  Trust Score 850 = $50,000 credit limit
                </span>
                <br />
                <span className="text-purple-400">
                  Build reputation, unlock borrowing power
                </span>
              </div>
            )}

            {currentStep === 2 && (
              <div className="text-xl md:text-2xl text-gray-300 leading-relaxed animate-fadeIn">
                <span className="text-emerald-400 font-bold">
                  Friends vouch for you on-chain
                </span>
                <br />
                <span className="text-cyan-400">
                  Real relationships = Real credit
                </span>
              </div>
            )}

            {currentStep === 3 && (
              <div className="text-xl md:text-2xl text-gray-300 leading-relaxed animate-fadeIn">
                <span className="text-emerald-400 font-bold">
                  Your reputation can't be liquidated
                </span>
                <br />
                <span className="text-purple-400">
                  Trust-based lending, not asset-based
                </span>
              </div>
            )}

            {currentStep === 4 && (
              <div className="text-xl md:text-2xl text-gray-300 leading-relaxed animate-fadeIn">
                <span className="text-cyan-400 font-bold">
                  Connect wallet to start building
                </span>
                <br />
                <span className="text-emerald-400">
                  Your first vouch is just one click away
                </span>
              </div>
            )}
          </div>
        </div>

        {/* How It Works Preview */}
        {showContinue && (
          <div className="mb-16 max-w-5xl animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-black/60 backdrop-blur-sm rounded-2xl border border-emerald-500/30 p-6 text-center">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-xl font-bold text-emerald-400 mb-2">
                  Build Network
                </h3>
                <p className="text-gray-300 text-sm">
                  Connect & vouch for friends
                </p>
                <div className="text-emerald-400/80 text-xs mt-2">Step 1</div>
              </div>

              <div className="bg-black/60 backdrop-blur-sm rounded-2xl border border-cyan-500/30 p-6 text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-cyan-400 mb-2">
                  Earn Trust Score
                </h3>
                <p className="text-gray-300 text-sm">
                  0-1000 reputation points
                </p>
                <div className="text-cyan-400/80 text-xs mt-2">Step 2</div>
              </div>

              <div className="bg-black/60 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6 text-center">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-purple-400 mb-2">
                  Get Loans
                </h3>
                <p className="text-gray-300 text-sm">
                  Up to $50k, no collateral
                </p>
                <div className="text-purple-400/80 text-xs mt-2">Step 3</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showContinue && (
          <div className="text-center space-y-6 animate-fadeIn">
            <button
              onClick={onWelcomeComplete}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold text-2xl px-16 py-6 rounded-2xl shadow-2xl shadow-emerald-500/30 transform hover:scale-105 transition-all duration-300 border-2 border-white/20"
            >
              🚀 Start Building Trust Score
            </button>

            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Join thousands earning credit through real relationships.
              <br />
              <span className="text-emerald-400 font-semibold">
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
                    ? "bg-cyan-400 shadow-lg shadow-cyan-400/50"
                    : "bg-gray-600"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Social Proof Footer */}
        {showContinue && (
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 animate-fadeIn">
            <div className="flex items-center space-x-8 text-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">
                  $2.4M+
                </div>
                <div className="text-xs text-gray-400">Uncollateralized</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">98.7%</div>
                <div className="text-xs text-gray-400">Repayment Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">5,200+</div>
                <div className="text-xs text-gray-400">Trust Connections</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
