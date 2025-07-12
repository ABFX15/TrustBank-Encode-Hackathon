"use client";

import { useEffect, useState } from "react";

interface FloatingElementProps {
  delay?: number;
  duration?: number;
  size?: "sm" | "md" | "lg";
  color?: "cyan" | "blue" | "indigo";
  shape?: "circle" | "square" | "diamond";
  opacity?: number;
}

export function FloatingElement({
  delay = 0,
  duration = 3,
  size = "md",
  color = "cyan",
  shape = "circle",
  opacity = 0.1,
}: FloatingElementProps) {
  const [position, setPosition] = useState({
    x: Math.random() * 100,
    y: Math.random() * 100,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition({
        x: Math.random() * 100,
        y: Math.random() * 100,
      });
    }, (duration + Math.random() * 2) * 1000);

    return () => clearInterval(interval);
  }, [duration]);

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-4 h-4",
    lg: "w-6 h-6",
  };

  const colorClasses = {
    cyan: "bg-cyan-400",
    blue: "bg-blue-400",
    indigo: "bg-indigo-400",
  };

  const shapeClasses = {
    circle: "rounded-full",
    square: "rounded-none",
    diamond: "rotate-45 rounded-sm",
  };

  return (
    <div
      className={`absolute ${sizeClasses[size]} ${colorClasses[color]} ${shapeClasses[shape]} transition-all duration-[3000ms] ease-in-out animate-pulse`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        opacity,
        animationDelay: `${delay}s`,
        transitionDelay: `${delay}s`,
      }}
    />
  );
}
