"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { LoadingSpinner } from "./LoadingSpinner";
import { Notification, useNotification } from "./Notification";

export function GaslessPaymentInterface() {
  const { address, isConnected } = useAccount();
  const [paymentAmount, setPaymentAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [vouchAmount, setVouchAmount] = useState("");
  const [vouchRecipient, setVouchRecipient] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { notification, showNotification, hideNotification } =
    useNotification();

  const handleGaslessPayment = async () => {
    if (!paymentAmount || !recipient || !isConnected) return;

    setIsLoading(true);
    try {
      // Mock gasless payment - would integrate with Sequence for production
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call

      showNotification(
        "info",
        "Demo Mode",
        "Gasless payments require Sequence integration setup"
      );

      // Reset form
      setPaymentAmount("");
      setRecipient("");
      setMessage("");
    } catch (error) {
      console.error("Gasless payment failed:", error);
      showNotification(
        "error",
        "Payment Failed",
        "Failed to send gasless payment"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGaslessVouch = async () => {
    if (!vouchAmount || !vouchRecipient || !isConnected) return;

    setIsLoading(true);
    try {
      // Mock gasless vouch - would integrate with Sequence for production
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call

      showNotification(
        "info",
        "Demo Mode",
        "Gasless vouching requires Sequence integration setup"
      );

      // Reset form
      setVouchAmount("");
      setVouchRecipient("");
    } catch (error) {
      console.error("Gasless vouch failed:", error);
      showNotification(
        "error",
        "Vouch Failed",
        "Failed to create gasless vouch"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-cyan-500/20">
        <h3 className="text-xl font-semibold text-cyan-400 mb-4">
          🎮 Gasless Banking
        </h3>
        <p className="text-gray-300 mb-6">
          Connect your wallet to access gasless transaction features.
        </p>
        <div className="text-center text-gray-400">
          Please connect your wallet first
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Notification
        type={notification?.type || "info"}
        title={notification?.title || ""}
        message={notification?.message}
        isVisible={notification?.isVisible || false}
        onClose={hideNotification}
      />

      {/* Trust Score Overview */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-cyan-500/20 p-6">
        <h3 className="text-xl font-semibold text-cyan-400 mb-4">
          🎮 Gasless Banking (Demo Mode)
        </h3>
        <div className="text-gray-300 mb-4">
          <p>Connected Address: {address}</p>
          <p className="text-sm text-yellow-400 mt-2">
            Note: Gasless features require Sequence wallet integration
          </p>
        </div>
      </div>

      {/* Gasless Payment Section */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-green-500/20 p-6">
        <h4 className="text-lg font-semibold text-green-400 mb-4">
          💸 Send Gasless Payment
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Amount (USDC)
            </label>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Message (Optional)
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Payment message..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleGaslessPayment}
            disabled={!paymentAmount || !recipient || isLoading}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : "Send Gasless Payment"}
          </button>
        </div>
      </div>

      {/* Gasless Vouch Section */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
        <h4 className="text-lg font-semibold text-purple-400 mb-4">
          🤝 Create Gasless Vouch
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              User to Vouch For
            </label>
            <input
              type="text"
              value={vouchRecipient}
              onChange={(e) => setVouchRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Vouch Amount (Trust Points)
            </label>
            <input
              type="number"
              value={vouchAmount}
              onChange={(e) => setVouchAmount(e.target.value)}
              placeholder="100"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleGaslessVouch}
            disabled={!vouchAmount || !vouchRecipient || isLoading}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : "Create Gasless Vouch"}
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-900/20 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
        <h4 className="text-lg font-semibold text-blue-400 mb-2">
          ℹ️ About Gasless Transactions
        </h4>
        <div className="text-gray-300 text-sm space-y-2">
          <p>
            • Gasless transactions eliminate the need for users to hold ETH for
            gas fees
          </p>
          <p>• Powered by account abstraction and meta-transactions</p>
          <p>• Perfect for mainstream adoption of DeFi applications</p>
          <p>
            • This demo shows the UI - full integration requires Sequence setup
          </p>
        </div>
      </div>
    </div>
  );
}
