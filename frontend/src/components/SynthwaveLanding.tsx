"use client";

import { useState, useEffect } from "react";

export function SynthwaveLanding() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen relative overflow-hidden synthwave-gradient">
      {/* Palm Trees */}
      <div className="absolute left-0 bottom-0 z-10">
        <svg
          width="300"
          height="400"
          viewBox="0 0 300 400"
          fill="none"
          className="palm-tree-left"
        >
          {/* Palm tree trunk */}
          <path
            d="M140 400 Q145 380 142 360 Q148 340 144 320 Q150 300 146 280 Q152 260 148 240 Q154 220 150 200 Q156 180 152 160 Q158 140 154 120 Q160 100 156 80"
            stroke="black"
            strokeWidth="8"
            fill="none"
            opacity="0.8"
          />
          {/* Palm fronds */}
          <path
            d="M156 80 Q120 40 80 20 Q60 10 40 15"
            stroke="black"
            strokeWidth="4"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M156 80 Q180 45 220 25 Q240 15 260 20"
            stroke="black"
            strokeWidth="4"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M156 80 Q130 30 90 10 Q70 0 50 5"
            stroke="black"
            strokeWidth="3"
            fill="none"
            opacity="0.5"
          />
          <path
            d="M156 80 Q185 35 225 15 Q245 5 265 10"
            stroke="black"
            strokeWidth="3"
            fill="none"
            opacity="0.5"
          />
          <path
            d="M156 80 Q140 25 100 5 Q80 -5 60 0"
            stroke="black"
            strokeWidth="3"
            fill="none"
            opacity="0.4"
          />
        </svg>
      </div>

      <div className="absolute right-0 bottom-0 z-10">
        <svg
          width="300"
          height="400"
          viewBox="0 0 300 400"
          fill="none"
          className="palm-tree-right"
        >
          {/* Palm tree trunk */}
          <path
            d="M160 400 Q155 380 158 360 Q152 340 156 320 Q150 300 154 280 Q148 260 152 240 Q146 220 150 200 Q144 180 148 160 Q142 140 146 120 Q140 100 144 80"
            stroke="black"
            strokeWidth="8"
            fill="none"
            opacity="0.8"
          />
          {/* Palm fronds */}
          <path
            d="M144 80 Q180 40 220 20 Q240 10 260 15"
            stroke="black"
            strokeWidth="4"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M144 80 Q120 45 80 25 Q60 15 40 20"
            stroke="black"
            strokeWidth="4"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M144 80 Q170 30 210 10 Q230 0 250 5"
            stroke="black"
            strokeWidth="3"
            fill="none"
            opacity="0.5"
          />
          <path
            d="M144 80 Q115 35 75 15 Q55 5 35 10"
            stroke="black"
            strokeWidth="3"
            fill="none"
            opacity="0.5"
          />
          <path
            d="M144 80 Q160 25 200 5 Q220 -5 240 0"
            stroke="black"
            strokeWidth="3"
            fill="none"
            opacity="0.4"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4">
        {/* TrustBank Logo */}
        <div className="mb-8">
          <div className="text-cyan-400 text-2xl font-bold tracking-wider mb-4">
            💎 TRUSTBANK
          </div>
        </div>

        {/* Main Title */}
        <div className="text-center mb-12">
          <h1 className="chrome-text text-6xl md:text-8xl lg:text-[10rem] font-black tracking-wider mb-6 transform -skew-y-1">
            DEFI
          </h1>
          <div className="script-text text-6xl md:text-7xl lg:text-8xl text-pink-400 mb-8 italic">
            banking
          </div>
        </div>

        {/* Bottom Text */}
        <div className="text-center">
          <div className="text-white text-xl md:text-2xl font-bold tracking-[0.2em] uppercase mb-4">
            One-Click Banking for Everyone
          </div>
          <div className="text-cyan-300 text-lg md:text-xl tracking-wider">
            Trust-Based Lending • Auto-Yield • Cross-Chain
          </div>
        </div>
      </div>

      {/* Grid lines for extra retro effect */}
      <div className="absolute bottom-0 left-0 w-full h-32 grid-lines opacity-20 z-5"></div>
    </div>
  );
}
