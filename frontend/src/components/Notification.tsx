"use client";

import { useState, useEffect } from "react";

export interface NotificationData {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  isVisible: boolean;
}

interface NotificationProps extends NotificationData {
  onClose: () => void;
}

export function Notification({
  type,
  title,
  message,
  isVisible,
  onClose,
}: NotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "ℹ️";
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return "border-green-400/30 shadow-green-400/20";
      case "error":
        return "border-red-400/30 shadow-red-400/20";
      case "warning":
        return "border-yellow-400/30 shadow-yellow-400/20";
      case "info":
        return "border-cyan-400/30 shadow-cyan-400/20";
      default:
        return "border-cyan-400/30 shadow-cyan-400/20";
    }
  };

  const getTypeTextColor = () => {
    switch (type) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      case "info":
        return "text-cyan-400";
      default:
        return "text-cyan-400";
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
        isAnimating ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className={`notification-miami ${getTypeStyles()} max-w-sm`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <span className="text-2xl">{getIcon()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-bold ${getTypeTextColor()}`}>
              {title}
            </h3>
            {message && <p className="text-sm text-gray-300 mt-1">{message}</p>}
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useNotification() {
  const [notification, setNotification] = useState<NotificationData>({
    type: "info",
    title: "",
    message: "",
    isVisible: false,
  });

  const showNotification = (
    type: NotificationData["type"],
    title: string,
    message?: string
  ) => {
    setNotification({
      type,
      title,
      message,
      isVisible: true,
    });
  };

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, isVisible: false }));
  };

  return {
    notification,
    showNotification,
    hideNotification,
  };
}
