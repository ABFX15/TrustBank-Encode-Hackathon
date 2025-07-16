"use client";

import { ReactNode } from "react";

interface BaseCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function ModernCard({
  children,
  className = "",
  hover = true,
}: BaseCardProps) {
  return (
    <div
      className={`
        card
        ${hover ? "hover:scale-[1.02]" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  accent?: "orange" | "teal" | "purple" | "pink";
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  accent = "orange",
}: MetricCardProps) {
  const accentColors = {
    orange: "text-orange-600 bg-orange-100",
    teal: "text-teal-600 bg-teal-100",
    purple: "text-purple-600 bg-purple-100",
    pink: "text-pink-600 bg-pink-100",
  };

  const trendColors = {
    up: "text-emerald-600 bg-emerald-100",
    down: "text-red-600 bg-red-100",
    neutral: "text-gray-600 bg-gray-100",
  };

  return (
    <ModernCard>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-600 mb-1 text-clean">
            {title}
          </h3>
          <div className="text-4xl font-black text-gray-900 text-bold-modern">
            {value}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1 text-clean">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-2xl ${accentColors[accent]}`}>
            {icon}
          </div>
        )}
      </div>

      {trend && trendValue && (
        <div className="flex items-center">
          <span
            className={`px-3 py-1 rounded-full text-sm font-bold ${trendColors[trend]}`}
          >
            {trend === "up" ? "↗" : trend === "down" ? "↘" : "→"} {trendValue}
          </span>
          <span className="text-sm text-gray-500 ml-2 text-clean">
            vs last period
          </span>
        </div>
      )}
    </ModernCard>
  );
}

interface RankingCardProps {
  rank: number;
  name: string;
  username?: string;
  avatar?: string;
  value: string;
  subtitle: string;
  badges?: Array<{
    label: string;
    type: "high-risk" | "medium-risk" | "low-risk" | "verified";
    count?: number;
  }>;
}

export function RankingCard({
  rank,
  name,
  username,
  avatar,
  value,
  subtitle,
  badges = [],
}: RankingCardProps) {
  const getRankColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-500";
    if (rank === 2) return "bg-gray-400";
    if (rank === 3) return "bg-orange-600";
    return "bg-orange-500";
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case "high-risk":
        return "bg-red-100 text-red-700";
      case "medium-risk":
        return "bg-yellow-100 text-yellow-700";
      case "low-risk":
        return "bg-green-100 text-green-700";
      case "verified":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <ModernCard>
      {/* Rank Header */}
      <div className="flex items-center justify-between mb-6">
        <div
          className={`
            ${getRankColor(
              rank
            )} text-white font-black text-xl px-4 py-2 rounded-xl
            text-bold-modern shadow-lg hover:shadow-xl transition-all duration-200
            transform hover:scale-105 hover:-translate-y-0.5
          `}
          style={{
            boxShadow:
              "0 8px 20px -4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
          }}
        >
          {rank === 1
            ? "1st"
            : rank === 2
            ? "2nd"
            : rank === 3
            ? "3rd"
            : `${rank}th`}
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-gray-900 text-bold-modern">
            {value}
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="flex items-center space-x-4 mb-6">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-16 h-16 rounded-full border-4 border-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            style={{
              boxShadow:
                "0 12px 25px -5px rgba(0, 0, 0, 0.2), 0 4px 15px -2px rgba(0, 0, 0, 0.1)",
            }}
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            style={{
              boxShadow:
                "0 12px 25px -5px rgba(147, 51, 234, 0.3), 0 4px 15px -2px rgba(147, 51, 234, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
            }}
          >
            {name.charAt(0)}
          </div>
        )}
        <div>
          <h3 className="text-xl font-bold text-gray-900 text-modern">
            {name}
          </h3>
          {username && <p className="text-gray-600 text-clean">{username}</p>}
          <p className="text-sm text-gray-500 text-clean">{subtitle}</p>
        </div>
      </div>

      {/* Action Button */}
      <button className="btn-primary w-full mb-4">Payout</button>

      <div className="text-center">
        <span className="text-sm font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-clean">
          Rank {rank}
        </span>
      </div>

      {/* Risk Badges */}
      {badges.length > 0 && (
        <div className="mt-4 space-y-2">
          {badges.map((badge, index) => (
            <div key={index} className="flex items-center justify-between">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${getBadgeStyle(
                  badge.type
                )}`}
              >
                {badge.label}
              </span>
              {badge.count !== undefined && (
                <span className="text-lg font-bold text-gray-900">
                  {badge.count}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </ModernCard>
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  buttonText: string;
  buttonVariant?: "primary" | "secondary";
  icon?: ReactNode;
  onAction?: () => void;
}

export function ActionCard({
  title,
  description,
  buttonText,
  buttonVariant = "primary",
  icon,
  onAction,
}: ActionCardProps) {
  return (
    <ModernCard>
      <div className="text-center">
        {icon && (
          <div className="mb-6 flex justify-center">
            <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-100 to-pink-100">
              {icon}
            </div>
          </div>
        )}

        <h3 className="text-2xl font-bold text-gray-900 mb-4 text-modern">
          {title}
        </h3>

        <p className="text-gray-600 mb-8 leading-relaxed text-clean">
          {description}
        </p>

        <button
          className={
            buttonVariant === "primary"
              ? "btn-primary w-full"
              : "btn-secondary w-full"
          }
          onClick={onAction}
        >
          {buttonText}
        </button>
      </div>
    </ModernCard>
  );
}
