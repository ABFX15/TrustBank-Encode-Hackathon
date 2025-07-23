"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useChainId,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { CONTRACT_ADDRESSES } from "@/config/wagmi";
import {
  MockUSDCABI,
  LiquidityPoolABI,
  TrustBankCoreABI,
} from "@/contracts/abis";
import { LoadingSpinner } from "./LoadingSpinner";
import { Notification, useNotification } from "./Notification";

export function LendingInterface() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [amount, setAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [depositStep, setDepositStep] = useState<
    "idle" | "approving" | "depositing"
  >("idle");
  const { notification, showNotification, hideNotification } =
    useNotification();

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Get contract addresses for current chain
  const contracts =
    CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];

  // Read user's USDC balance
  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: contracts?.MockUSDC as `0x${string}`,
    abi: MockUSDCABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    query: { enabled: !!address && !!contracts },
  });

  // Read user's allowance for LiquidityPool
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: contracts?.MockUSDC as `0x${string}`,
    abi: MockUSDCABI,
    functionName: "allowance",
    args: [address as `0x${string}`, contracts?.LiquidityPool as `0x${string}`],
    query: { enabled: !!address && !!contracts },
  });

  const proceedToDeposit = useCallback(async () => {
    if (!amount || !contracts || !address) return;

    try {
      const depositAmount = parseUnits(amount, 6);

      // Add liquidity to LiquidityPool
      writeContract({
        address: contracts.LiquidityPool as `0x${string}`,
        abi: LiquidityPoolABI,
        functionName: "addLiquidity",
        args: [depositAmount],
      });
      showNotification("info", "Depositing", "Adding liquidity to pool...");
    } catch (err) {
      console.error("Deposit error:", err);
      showNotification(
        "error",
        "Deposit Failed",
        "Failed to process deposit transaction"
      );
      setDepositStep("idle");
    }
  }, [amount, contracts, address, writeContract, showNotification]);

  // Handle transaction completion and move to next step
  useEffect(() => {
    if (isConfirmed && hash) {
      if (depositStep === "approving") {
        // Approval completed, now do the actual deposit
        setDepositStep("depositing");
        refetchAllowance(); // Refresh allowance data

        setTimeout(() => {
          proceedToDeposit();
        }, 1000); // Small delay to ensure allowance is updated
      } else if (depositStep === "depositing") {
        // Deposit completed
        showNotification(
          "success",
          "Deposit Successful!",
          `Successfully deposited ${amount} USDC`
        );
        setAmount("");
        setDepositStep("idle");
        refetchBalance(); // Refresh balance
      }
    }
  }, [
    isConfirmed,
    hash,
    depositStep,
    amount,
    showNotification,
    refetchAllowance,
    refetchBalance,
    proceedToDeposit,
  ]);

  const handleDeposit = async () => {
    if (!amount || !contracts || !address) return;

    try {
      const depositAmount = parseUnits(amount, 6); // USDC has 6 decimals

      // Check if we need to approve first
      if (!allowance || (allowance as bigint) < depositAmount) {
        // Step 1: Approve USDC spend
        setDepositStep("approving");
        writeContract({
          address: contracts.MockUSDC as `0x${string}`,
          abi: MockUSDCABI,
          functionName: "approve",
          args: [contracts.LiquidityPool as `0x${string}`, depositAmount],
        });
        showNotification(
          "info",
          "Approval Required",
          "Approving USDC spending..."
        );
      } else {
        // Step 2: Add liquidity to LiquidityPool (already approved)
        setDepositStep("depositing");
        writeContract({
          address: contracts.LiquidityPool as `0x${string}`,
          abi: LiquidityPoolABI,
          functionName: "addLiquidity",
          args: [depositAmount],
        });
        showNotification("info", "Depositing", "Adding liquidity to pool...");
      }
    } catch (err) {
      console.error("Deposit error:", err);
      showNotification(
        "error",
        "Deposit Failed",
        "Failed to process deposit transaction"
      );
      setDepositStep("idle");
    }
  };

  const handleBorrow = async () => {
    if (!borrowAmount || !contracts || !address) return;

    try {
      const borrowAmountParsed = parseUnits(borrowAmount, 6);
      writeContract({
        address: contracts.TrustBankCore as `0x${string}`,
        abi: TrustBankCoreABI,
        functionName: "sendPayment",
        args: [address as `0x${string}`, borrowAmountParsed, "Loan request"],
      });
      showNotification("info", "Processing Loan", "Sending loan request...");
    } catch (err) {
      console.error("Borrow error:", err);
      showNotification(
        "error",
        "Loan Failed",
        "Failed to process loan request"
      );
    }
  };

  const handleGetTestUSDC = async () => {
    if (!contracts || !address) return;

    try {
      // Mint 1000 USDC for testing
      const mintAmount = parseUnits("1000", 6);
      writeContract({
        address: contracts.MockUSDC as `0x${string}`,
        abi: MockUSDCABI,
        functionName: "mint",
        args: [address, mintAmount],
      });
    } catch (err) {
      console.error("Mint error:", err);
    }
  };

  if (!isConnected) {
    return (
      <div className="card-premium text-center py-12">
        <div className="text-6xl mb-6">🔗</div>
        <h2 className="text-2xl font-bold gradient-text mb-4 font-cyber text-cyber">
          Connect Your Wallet
        </h2>
        <p className="text-gray-400 mb-8 font-futura text-futura">
          Connect your wallet to start banking with TrustBank
        </p>
        <div className="inline-flex items-center px-6 py-3 bg-cyan-900/20 border border-cyan-600/30 rounded-lg">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse mr-3"></div>
          <span className="text-cyan-400 text-sm font-mono-tech text-mono-tech">
            Web3 wallet required
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Quick Guide */}
      <div className="lg:col-span-2 card-premium bg-gradient-to-r from-cyan-900/20 to-purple-900/20">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <span className="text-xl">💡</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-cyan-400">
              How TrustBank Works
            </h3>
            <p className="text-gray-300 text-sm">
              Your trust score determines your borrowing power
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-emerald-400 text-xs">1</span>
            </div>
            <span className="text-gray-300">Deposit USDC to earn yield</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <span className="text-cyan-400 text-xs">2</span>
            </div>
            <span className="text-gray-300">
              Build trust score through vouching
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
              <span className="text-purple-400 text-xs">3</span>
            </div>
            <span className="text-gray-300">
              Borrow up to $50k without collateral
            </span>
          </div>
        </div>
      </div>

      {/* Deposit Section */}
      <div className="card-premium group">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-900/30 flex items-center justify-center">
            <span className="text-2xl">💎</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-tech text-tech">
              Deposit USDC
            </h2>
            <p className="text-gray-400 text-sm font-futura text-futura">
              Earn yield on your deposits
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3 font-tech text-tech">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="input-field text-2xl font-mono pr-20"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <span className="text-cyan-400 font-medium">USDC</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>
                Balance:{" "}
                {usdcBalance ? formatUnits(usdcBalance as bigint, 6) : "0.00"}{" "}
                USDC
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleGetTestUSDC}
                  className="text-blue-400 hover:text-blue-300"
                  disabled={isPending}
                >
                  Get Test USDC
                </button>
                <button
                  onClick={() =>
                    setAmount(
                      usdcBalance ? formatUnits(usdcBalance as bigint, 6) : "0"
                    )
                  }
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  MAX
                </button>
              </div>
            </div>
          </div>

          <div className="bg-dark-800/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Current APY</span>
              <span className="text-emerald-400 font-medium">12.5%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Est. Monthly Earnings</span>
              <span className="text-cyan-400 font-medium">
                {amount
                  ? `$${((parseFloat(amount) * 0.125) / 12).toFixed(2)}`
                  : "$0.00"}
              </span>
            </div>
          </div>

          <button
            onClick={handleDeposit}
            disabled={!amount || isPending || depositStep !== "idle"}
            className="btn-primary w-full group-hover:shadow-cyan-lg"
          >
            {isPending || depositStep !== "idle" ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-dark-900/20 border-t-dark-900 rounded-full animate-spin"></div>
                <span>
                  {depositStep === "approving"
                    ? "Approving..."
                    : depositStep === "depositing"
                    ? "Depositing..."
                    : "Processing..."}
                </span>
              </div>
            ) : (
              "Deposit USDC"
            )}
          </button>
        </div>
      </div>

      {/* Borrow Section */}
      <div className="card-premium group">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-900/30 flex items-center justify-center">
            <span className="text-2xl">🏦</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-tech text-tech">
              Borrow USDC
            </h2>
            <p className="text-gray-400 text-sm font-futura text-futura">
              Undercollateralized loans
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                placeholder="0.00"
                className="input-field text-2xl font-mono pr-20"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <span className="text-cyan-400 font-medium">USDC</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>Available: 5,000.00 USDC</span>
              <span className="text-cyan-400">Trust Score: 850</span>
            </div>
          </div>

          <div className="bg-dark-800/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Interest Rate</span>
              <span className="text-blue-400 font-medium">8.5%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Monthly Payment</span>
              <span className="text-red-400 font-medium">
                {borrowAmount
                  ? `$${((parseFloat(borrowAmount) * 0.085) / 12).toFixed(2)}`
                  : "$0.00"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Collateral Required</span>
              <span className="text-emerald-400 font-medium">None</span>
            </div>
          </div>

          <button
            onClick={handleBorrow}
            disabled={!borrowAmount || isPending}
            className="btn-primary w-full group-hover:shadow-cyan-lg"
          >
            {isPending ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-dark-900/20 border-t-dark-900 rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              "Borrow USDC"
            )}
          </button>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
            <p className="text-blue-400 text-xs text-center">
              💡 Borrowing requires trust network vouching
            </p>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          isVisible={notification.isVisible}
          onClose={hideNotification}
        />
      )}
    </div>
  );
}
