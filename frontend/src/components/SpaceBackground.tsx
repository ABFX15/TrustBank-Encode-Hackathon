"use client";

import { useEffect, useState } from "react";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  color: string;
}

interface SpaceBackgroundProps {
  starCount?: number;
  showShootingStars?: boolean;
  showNebula?: boolean;
}

export function SpaceBackground({
  starCount = 150,
  showShootingStars = true,
  showNebula = true,
}: SpaceBackgroundProps) {
  const [stars, setStars] = useState<Star[]>([]);
  const [shootingStars, setShootingStars] = useState<number>(0);

  // Generate stars
  useEffect(() => {
    const newStars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      const colors = [
        "#ffffff",
        "#ffd700",
        "#87ceeb",
        "#f0f8ff",
        "#e6e6fa",
        "#fffacd",
      ];
      newStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    setStars(newStars);
  }, [starCount]);

  // Shooting stars animation
  useEffect(() => {
    if (!showShootingStars) return;

    const interval = setInterval(() => {
      setShootingStars((prev) => prev + 1);
      setTimeout(() => {
        setShootingStars((prev) => Math.max(0, prev - 1));
      }, 1500);
    }, 8000 + Math.random() * 12000);

    return () => clearInterval(interval);
  }, [showShootingStars]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Deep space gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

      {/* Nebula clouds */}
      {showNebula && (
        <>
          <div
            className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-900/20 via-blue-900/15 to-transparent rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: "8s" }}
          />
          <div
            className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-gradient-to-l from-cyan-900/15 via-indigo-900/10 to-transparent rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: "12s", animationDelay: "4s" }}
          />
          <div
            className="absolute top-1/2 left-0 w-64 h-64 bg-gradient-to-r from-violet-900/10 to-transparent rounded-full blur-2xl animate-pulse"
            style={{ animationDuration: "15s", animationDelay: "8s" }}
          />
        </>
      )}

      {/* Stars */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full animate-pulse"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: star.color,
              opacity: star.opacity,
              animationDuration: `${star.twinkleSpeed}s`,
              animationDelay: `${Math.random() * 5}s`,
              boxShadow: `0 0 ${star.size * 2}px ${star.color}`,
            }}
          />
        ))}
      </div>

      {/* Shooting stars */}
      {showShootingStars &&
        Array.from({ length: shootingStars }).map((_, i) => (
          <div
            key={`shooting-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 50}%`,
              animation: "shootingStar 1.5s linear forwards",
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}

      {/* Distant galaxies */}
      <div className="absolute inset-0 opacity-30">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`galaxy-${i}`}
            className="absolute w-2 h-2 bg-gradient-to-r from-white/40 to-transparent rounded-full blur-sm animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${4 + Math.random() * 6}s`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Cosmic dust */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="w-full h-full"
          style={{
            background: `
              radial-gradient(1px 1px at 20px 30px, #fff, transparent),
              radial-gradient(1px 1px at 40px 70px, #fff, transparent),
              radial-gradient(1px 1px at 90px 40px, #fff, transparent),
              radial-gradient(1px 1px at 130px 80px, #fff, transparent),
              radial-gradient(1px 1px at 160px 30px, #fff, transparent)
            `,
            backgroundRepeat: "repeat",
            backgroundSize: "200px 100px",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes shootingStar {
          0% {
            transform: translateX(0) translateY(0) scale(1);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateX(300px) translateY(300px) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
