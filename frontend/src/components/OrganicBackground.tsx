"use client";

import { useEffect, useState } from "react";

interface OrganicBackgroundProps {
  shapeCount?: number;
  animated?: boolean;
}

export function OrganicBackground({
  shapeCount = 8,
  animated = true,
}: OrganicBackgroundProps) {
  const [shapes, setShapes] = useState<
    Array<{
      id: number;
      size: number;
      x: number;
      y: number;
      color: string;
      delay: number;
      duration: number;
    }>
  >([]);

  const colors = [
    "bg-pink-200/15",
    "bg-purple-200/15",
    "bg-blue-200/15",
    "bg-teal-200/15",
    "bg-indigo-200/15",
    "bg-violet-200/15",
    "bg-orange-200/15",
    "bg-cyan-200/15",
  ];

  useEffect(() => {
    const newShapes = Array.from({ length: shapeCount }, (_, i) => ({
      id: i,
      size: Math.random() * 300 + 150, // 150-450px
      x: Math.random() * 100, // 0-100%
      y: Math.random() * 100, // 0-100%
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * -8, // Random start time
      duration: Math.random() * 4 + 6, // 6-10 seconds
    }));
    setShapes(newShapes);
  }, [shapeCount]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {shapes.map((shape) => (
        <div
          key={shape.id}
          className={`
            absolute rounded-full blur-3xl opacity-40
            ${shape.color}
            ${animated ? "animate-float" : ""}
          `}
          style={{
            width: `${shape.size}px`,
            height: `${shape.size}px`,
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            animationDelay: `${shape.delay}s`,
            animationDuration: `${shape.duration}s`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {/* Additional larger shapes for depth */}
      <div
        className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-r from-pink-200/8 to-purple-200/8 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "-2s", animationDuration: "12s" }}
      />
      <div
        className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-blue-200/8 to-teal-200/8 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "-6s", animationDuration: "14s" }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-72 h-72 bg-gradient-to-r from-violet-200/8 to-indigo-200/8 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "-4s", animationDuration: "10s" }}
      />
    </div>
  );
}
