"use client";

import { useEffect, useState, useRef } from "react";

interface MatrixBackgroundProps {
  density?: number;
  speed?: number;
  glitchEffect?: boolean;
}

export function MatrixBackground({
  density = 20,
  speed = 50,
  glitchEffect = true,
}: MatrixBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Matrix characters (mix of letters, numbers, and symbols)
    const matrixChars =
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);

    // Initialize drops
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -canvas.height;
    }

    let glitchTimer = 0;
    let lastTime = 0;

    const draw = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Semi-transparent black background for trailing effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Matrix rain effect
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < columns; i++) {
        const char =
          matrixChars[Math.floor(Math.random() * matrixChars.length)];

        // Gradient effect - brighter at the front of the drop
        const opacity = Math.min(
          1,
          Math.max(0.1, 1 - (drops[i] / canvas.height) * 2)
        );

        // Different shades of green for depth
        if (Math.random() > 0.98) {
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.8})`; // Bright white highlights
        } else if (Math.random() > 0.95) {
          ctx.fillStyle = `rgba(0, 255, 65, ${opacity})`; // Bright green
        } else {
          ctx.fillStyle = `rgba(0, 255, 65, ${opacity * 0.6})`; // Dimmer green
        }

        // Glitch effect
        let x = i * fontSize;
        let y = drops[i];

        if (glitchEffect && Math.random() > 0.99) {
          x += (Math.random() - 0.5) * 4;
          y += (Math.random() - 0.5) * 4;
          ctx.fillStyle = `rgba(255, 0, 100, ${opacity * 0.7})`; // Pink glitch
        }

        ctx.fillText(char, x, y);

        // Reset drop if it's gone past the screen
        if (drops[i] > canvas.height && Math.random() > 0.99) {
          drops[i] = Math.random() * -100;
        }

        // Move drop down
        drops[i] += speed / 10;
      }

      // Occasional screen-wide glitch effect - disabled to prevent shaking
      /* glitchTimer += deltaTime;
      if (glitchEffect && glitchTimer > 5000 && Math.random() > 0.995) {
        ctx.fillStyle = `rgba(255, 0, 100, 0.1)`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        glitchTimer = 0;
      } */

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [density, speed, glitchEffect]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "linear-gradient(135deg, #000000 0%, #001100 50%, #000000 100%)",
        }}
      />

      {/* Additional digital overlay effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Scan lines - disabled to prevent shaking */}
        {/* <div
          className="absolute inset-0 opacity-10"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 65, 0.3) 2px, rgba(0, 255, 65, 0.3) 4px)",
            animation: "scanLines 0.1s linear infinite",
          }}
        /> */}

        {/* Corner terminals */}
        <div className="absolute top-4 left-4 text-green-400 text-xs font-mono opacity-70">
          <div>SYSTEM_STATUS: ONLINE</div>
          <div>ENCRYPTION: ACTIVE</div>
          <div>UPTIME: 01:23:45</div>
        </div>

        <div className="absolute top-4 right-4 text-cyan-400 text-xs font-mono opacity-70 text-right">
          <div>NET_ID: 0xTRUST</div>
          <div>PROTOCOL: SECURE</div>
          <div>CHAIN: ETHERLINK</div>
        </div>

        <div className="absolute bottom-4 left-4 text-purple-400 text-xs font-mono opacity-70">
          <div>TRUST_SCORE: 9.7/10</div>
          <div>ZK_PROOF: VERIFIED</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scanLines {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(4px);
          }
        }
      `}</style>
    </>
  );
}
