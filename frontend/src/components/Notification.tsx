"use client";

import { useState, useEffect } from "react";
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

interface NotificationProps {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  onClose: () => void;
  isVisible: boolean;
}

export function Notification({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  isVisible,
}: NotificationProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const typeConfig = {
    success: {
      bgColor: "bg-green-900/90",
      borderColor: "border-green-500/30",
      iconColor: "text-green-400",
      icon: CheckCircleIcon,
    },
    error: {
      bgColor: "bg-red-900/90",
      borderColor: "border-red-500/30",
      iconColor: "text-red-400",
      icon: ExclamationTriangleIcon,
    },
    warning: {
      bgColor: "bg-yellow-900/90",
      borderColor: "border-yellow-500/30",
      iconColor: "text-yellow-400",
      icon: ExclamationTriangleIcon,
    },
    info: {
      bgColor: "bg-cyan-900/90",
      borderColor: "border-cyan-500/30",
      iconColor: "text-cyan-400",
      icon: InformationCircleIcon,
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div
        className={`${config.bgColor} ${config.borderColor} border backdrop-blur-md rounded-xl p-4 shadow-2xl transform transition-all duration-300 ease-in-out`}
      >
        <div className="flex items-start space-x-3">
          <Icon
            className={`h-6 w-6 ${config.iconColor} flex-shrink-0 mt-0.5`}
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-semibold font-tech text-sm">
              {title}
            </h4>
            {message && (
              <p className="text-gray-300 text-sm mt-1 font-futura">
                {message}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for managing notifications
export function useNotification() {
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "warning" | "info";
    title: string;
    message?: string;
    isVisible: boolean;
  } | null>(null);

  const showNotification = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    message?: string
  ) => {
    setNotification({ type, title, message, isVisible: true });
  };

  const hideNotification = () => {
    setNotification((prev) => (prev ? { ...prev, isVisible: false } : null));
  };

  return {
    notification,
    showNotification,
    hideNotification,
  };
}
