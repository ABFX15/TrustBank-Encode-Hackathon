"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "cyan" | "blue" | "white";
  text?: string;
}

export function LoadingSpinner({
  size = "md",
  color = "cyan",
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const colorClasses = {
    cyan: "border-cyan-400 border-t-transparent",
    blue: "border-blue-400 border-t-transparent",
    white: "border-white border-t-transparent",
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div
        className={`${sizeClasses[size]} border-2 ${colorClasses[color]} rounded-full animate-spin`}
      />
      {text && (
        <p className="text-sm text-gray-400 font-tech animate-pulse">{text}</p>
      )}
    </div>
  );
}

interface LoadingOverlayProps {
  text?: string;
  isVisible: boolean;
}

export function LoadingOverlay({
  text = "Loading...",
  isVisible,
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-dark-900 border border-cyan-500/20 rounded-2xl p-8 max-w-sm mx-4">
        <LoadingSpinner size="lg" color="cyan" text={text} />
      </div>
    </div>
  );
}
