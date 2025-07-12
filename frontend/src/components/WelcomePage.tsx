"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Typewriter } from "./Typewriter";
import { FloatingElement } from "./FloatingElement";

interface WelcomePageProps {
  onWelcomeComplete: () => void;
}

export function WelcomePage({ onWelcomeComplete }: WelcomePageProps) {
  const { isConnected } = useAccount();
  const [step, setStep] = useState(0);
  const [showConnectButton, setShowConnectButton] = useState(false);

  const messages = [
    "Welcome to TrustBank",
    "The Future of Decentralized Banking",
    "Connect your wallet to start banking",
  ];

  useEffect(() => {
    if (isConnected && showConnectButton) {
      // Small delay before transitioning to main app
      const timer = setTimeout(() => {
        onWelcomeComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, showConnectButton, onWelcomeComplete]);

  const handleTypewriterComplete = () => {
    if (step < messages.length - 1) {
      setTimeout(() => setStep((prev) => prev + 1), 800);
    } else {
      setTimeout(() => setShowConnectButton(true), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 relative overflow-hidden flex items-center justify-center">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-cyan-600/10 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-l from-cyan-600/15 to-cyan-400/8 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-0 w-64 h-64 bg-gradient-to-r from-cyan-400/10 to-transparent rounded-full blur-2xl animate-float"
          style={{ animationDelay: "4s" }}
        ></div>

        {/* Geometric patterns */}
        <div
          className="absolute top-20 right-20 w-32 h-32 border border-cyan-500/10 rotate-45 animate-spin"
          style={{ animationDuration: "20s" }}
        ></div>
        <div
          className="absolute bottom-40 left-20 w-24 h-24 border border-cyan-400/15 rotate-12 animate-spin"
          style={{ animationDuration: "15s", animationDirection: "reverse" }}
        ></div>

        {/* Particle effect simulation */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {/* Enhanced Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <FloatingElement
              key={i}
              delay={i * 0.5}
              duration={4 + Math.random() * 2}
              size={
                ["sm", "md", "lg"][Math.floor(Math.random() * 3)] as
                  | "sm"
                  | "md"
                  | "lg"
              }
              color={
                ["cyan", "blue", "indigo"][Math.floor(Math.random() * 3)] as
                  | "cyan"
                  | "blue"
                  | "indigo"
              }
              shape={
                ["circle", "square", "diamond"][
                  Math.floor(Math.random() * 3)
                ] as "circle" | "square" | "diamond"
              }
              opacity={0.1 + Math.random() * 0.15}
            />
          ))}
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        {/* Logo */}
        <div className="mb-12">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-cyan-gradient flex items-center justify-center shadow-cyan-lg mb-6">
            <svg
              className="w-12 h-12 text-dark-900"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>

        {/* Welcome Messages */}
        <div className="space-y-8 mb-16">
          {step >= 0 && (
            <h1 className="text-6xl md:text-8xl font-bold gradient-text font-cyber text-cyber">
              <Typewriter
                text={messages[0]}
                speed={80}
                delay={500}
                onComplete={step === 0 ? handleTypewriterComplete : undefined}
              />
            </h1>
          )}

          {step >= 1 && (
            <h2 className="text-2xl md:text-4xl text-cyan-300/80 font-tech text-tech font-medium">
              <Typewriter
                text={messages[1]}
                speed={60}
                delay={200}
                onComplete={step === 1 ? handleTypewriterComplete : undefined}
              />
            </h2>
          )}

          {step >= 2 && (
            <p className="text-xl md:text-2xl text-gray-300 font-futura text-futura">
              <Typewriter
                text={messages[2]}
                speed={50}
                delay={200}
                onComplete={step === 2 ? handleTypewriterComplete : undefined}
              />
            </p>
          )}
        </div>

        {/* Connect Button */}
        <div
          className={`transition-all duration-1000 ${
            showConnectButton
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          {showConnectButton && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <ConnectButton.Custom>
                  {({
                    account,
                    chain,
                    openAccountModal,
                    openChainModal,
                    openConnectModal,
                    authenticationStatus,
                    mounted,
                  }) => {
                    const ready = mounted && authenticationStatus !== "loading";
                    const connected =
                      ready &&
                      account &&
                      chain &&
                      (!authenticationStatus ||
                        authenticationStatus === "authenticated");

                    return (
                      <div
                        {...(!ready && {
                          "aria-hidden": true,
                          style: {
                            opacity: 0,
                            pointerEvents: "none",
                            userSelect: "none",
                          },
                        })}
                      >
                        {(() => {
                          if (!connected) {
                            return (
                              <button
                                onClick={openConnectModal}
                                type="button"
                                className="btn-primary text-xl px-12 py-6 font-semibold tracking-wide shadow-2xl hover:shadow-cyan-xl transform hover:scale-105 transition-all duration-300"
                              >
                                <span className="mr-3">🚀</span>
                                Connect Wallet
                              </button>
                            );
                          }

                          if (chain.unsupported) {
                            return (
                              <button
                                onClick={openChainModal}
                                type="button"
                                className="btn-outline text-xl px-12 py-6 font-semibold tracking-wide"
                              >
                                Wrong network
                              </button>
                            );
                          }

                          return (
                            <div className="flex gap-3">
                              <button
                                onClick={openChainModal}
                                type="button"
                                className="btn-outline text-lg px-6 py-4"
                              >
                                {chain.hasIcon && (
                                  <div
                                    style={{
                                      background: chain.iconBackground,
                                      width: 12,
                                      height: 12,
                                      borderRadius: 999,
                                      overflow: "hidden",
                                      marginRight: 4,
                                    }}
                                  >
                                    {chain.iconUrl && (
                                      <img
                                        alt={chain.name ?? "Chain icon"}
                                        src={chain.iconUrl}
                                        style={{ width: 12, height: 12 }}
                                      />
                                    )}
                                  </div>
                                )}
                                {chain.name}
                              </button>

                              <button
                                onClick={openAccountModal}
                                type="button"
                                className="btn-primary text-lg px-6 py-4"
                              >
                                {account.displayName}
                                {account.displayBalance
                                  ? ` (${account.displayBalance})`
                                  : ""}
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  }}
                </ConnectButton.Custom>
              </div>

              {!isConnected && (
                <p className="text-cyan-400/70 text-sm animate-pulse">
                  💡 First time? We'll guide you through the setup
                </p>
              )}
            </div>
          )}
        </div>

        {/* Features Preview */}
        {showConnectButton && (
          <div
            className={`mt-20 transition-all duration-1000 delay-500 ${
              showConnectButton
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="bg-dark-900/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
                <div className="text-3xl mb-3">💎</div>
                <h3 className="text-cyan-400 font-semibold mb-2">Earn Yield</h3>
                <p className="text-gray-400 text-sm">
                  Up to 12.5% APY on deposits
                </p>
              </div>
              <div className="bg-dark-900/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
                <div className="text-3xl mb-3">🏦</div>
                <h3 className="text-cyan-400 font-semibold mb-2">Borrow</h3>
                <p className="text-gray-400 text-sm">Uncollateralized loans</p>
              </div>
              <div className="bg-dark-900/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
                <div className="text-3xl mb-3">🤝</div>
                <h3 className="text-cyan-400 font-semibold mb-2">
                  Trust Network
                </h3>
                <p className="text-gray-400 text-sm">
                  Build reputation on-chain
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
