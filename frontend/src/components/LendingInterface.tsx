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
      <div className="lg:col-span-2 card-miami-premium">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-400 to-pink-400 flex items-center justify-center">
            <span className="text-xl">💡</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-neon-cyan">
              How TrustBank Works
            </h3>
            <p className="text-gray-300 text-sm">
              Your trust score determines your borrowing power
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-pink-400 flex items-center justify-center">
              <span className="text-cyan-400 text-xs font-bold">1</span>
            </div>
            <span className="text-gray-300">Deposit USDC to earn yield</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-400 to-orange-400 flex items-center justify-center">
              <span className="text-pink-400 text-xs font-bold">2</span>
            </div>
            <span className="text-gray-300">
              Build trust score through vouching
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-400 to-cyan-400 flex items-center justify-center">
              <span className="text-orange-400 text-xs font-bold">3</span>
            </div>
            <span className="text-gray-300">
              Borrow up to $50k without collateral
            </span>
          </div>
        </div>
      </div>

      {/* Deposit Section */}
      <div className="card-miami group">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-pink-400 flex items-center justify-center">
            <span className="text-2xl">💎</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Deposit USDC</h2>
            <p className="text-gray-400 text-sm">Earn yield on your deposits</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-3">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="input-miami text-2xl font-mono pr-20"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <span className="text-neon-cyan font-bold">USDC</span>
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
                  className="text-neon-pink hover:text-pink-300"
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
                  className="text-neon-cyan hover:text-cyan-300"
                >
                  MAX
                </button>
              </div>
            </div>
          </div>

          <div className="card-miami p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Current APY</span>
              <span className="text-neon-cyan font-bold">12.5%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Est. Monthly Earnings</span>
              <span className="text-neon-pink font-bold">
                {amount
                  ? `$${((parseFloat(amount) * 0.125) / 12).toFixed(2)}`
                  : "$0.00"}
              </span>
            </div>
          </div>

          <button
            onClick={handleDeposit}
            disabled={!amount || isPending || depositStep !== "idle"}
            className="btn-miami-primary w-full group-hover:shadow-cyan-400/50"
          >
            {isPending || depositStep !== "idle" ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="loading-miami"></div>
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
      <div className="card-miami group">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-pink-400 to-orange-400 flex items-center justify-center">
            <span className="text-2xl">🏦</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Borrow USDC</h2>
            <p className="text-gray-400 text-sm">Undercollateralized loans</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-3">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                placeholder="0.00"
                className="input-miami text-2xl font-mono pr-20"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <span className="text-neon-pink font-bold">USDC</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>Max Loan: $50,000</span>
              <button
                onClick={() => setBorrowAmount("50")}
                className="text-neon-pink hover:text-pink-300"
              >
                MAX
              </button>
            </div>
          </div>

          <div className="card-miami p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Interest Rate</span>
              <span className="text-neon-cyan font-bold">5.0%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Loan Term</span>
              <span className="text-neon-pink font-bold">30 days</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Trust Score Required</span>
              <span className="text-miami-gradient font-bold">100+</span>
            </div>
          </div>

          <button
            onClick={handleBorrow}
            disabled={!borrowAmount || isPending}
            className="btn-miami-secondary w-full group-hover:shadow-pink-400/50"
          >
            {isPending ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="loading-miami"></div>
                <span>Processing...</span>
              </div>
            ) : (
              "Borrow USDC"
            )}
          </button>
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
