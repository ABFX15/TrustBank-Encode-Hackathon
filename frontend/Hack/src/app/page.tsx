"use client";

import { useState } from "react";
import Image from "next/image";
import { ConnectButton } from "@/components/ConnectButton";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import {
  CONTRACTS,
  MOCK_USDC_ABI,
  LIQUIDITY_POOL_ABI,
  TRUSTBANK_CORE_ABI,
} from "@/hooks/useContracts";

type TabType = "banking" | "trustscore" | "loans";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { writeContract } = useWriteContract();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("banking");

  // Form states
  const [paymentForm, setPaymentForm] = useState({
    recipient: "",
    amount: "",
    message: "",
  });

  const [vouchForm, setVouchForm] = useState({
    userAddress: "",
    amount: "",
  });

  const [depositAmount, setDepositAmount] = useState("");
  const [loanAmount, setLoanAmount] = useState("");

  // Read user's USDC balance
  const { data: usdcBalance } = useReadContract({
    address: CONTRACTS.MockUSDC,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    query: { enabled: !!address },
  });

  // Read user's trust score
  const { data: trustScore } = useReadContract({
    address: CONTRACTS.TrustBankCore,
    abi: TRUSTBANK_CORE_ABI,
    functionName: "getUserTrustScore",
    args: [address as `0x${string}`],
    query: { enabled: !!address },
  });

  // Read user deposits in liquidity pool
  const { data: userDeposits } = useReadContract({
    address: CONTRACTS.LiquidityPool,
    abi: LIQUIDITY_POOL_ABI,
    functionName: "userDeposits",
    args: [address as `0x${string}`],
    query: { enabled: !!address },
  });

  // Read claimable yield
  const { data: claimableYield } = useReadContract({
    address: CONTRACTS.LiquidityPool,
    abi: LIQUIDITY_POOL_ABI,
    functionName: "getClaimableYield",
    args: [address as `0x${string}`],
    query: { enabled: !!address },
  });

  // Calculate max loan based on trust score (simple formula)
  const maxLoanAmount = trustScore ? Number(trustScore) * 10 : 0;

  // Handle deposit
  const handleDeposit = async () => {
    if (!depositAmount) return;

    const amountNum = parseFloat(depositAmount);
    if (amountNum < 10) {
      alert("Minimum deposit is 10 USDC");
      return;
    }

    try {
      // Use 6 decimals for USDC instead of 18
      const amount = parseUnits(depositAmount, 6);

      // First approve USDC
      await writeContract({
        address: CONTRACTS.MockUSDC,
        abi: MOCK_USDC_ABI,
        functionName: "approve",
        args: [CONTRACTS.LiquidityPool, amount],
      });

      alert(
        "Step 1: USDC approval sent! Wait for confirmation, then deposit will auto-execute."
      );

      // Then add liquidity after a short delay
      setTimeout(async () => {
        try {
          await writeContract({
            address: CONTRACTS.LiquidityPool,
            abi: LIQUIDITY_POOL_ABI,
            functionName: "addLiquidity",
            args: [amount],
          });
          setDepositAmount("");
          alert("Deposit completed!");
        } catch (error) {
          console.error("Liquidity addition failed:", error);
          alert("Liquidity addition failed. Check console.");
        }
      }, 3000);
    } catch (error) {
      console.error("Approval failed:", error);
      alert("Approval failed. Check console for details.");
    }
  };

  // Handle claim yield
  const handleClaimYield = async () => {
    try {
      await writeContract({
        address: CONTRACTS.LiquidityPool,
        abi: LIQUIDITY_POOL_ABI,
        functionName: "claimYield",
        args: [],
      });
      alert("Yield claim submitted!");
    } catch (error) {
      console.error("Yield claim failed:", error);
      alert("Yield claim failed. Check console for details.");
    }
  };

  // Handle loan request (simplified - using liquidity pool for now)
  const handleLoanRequest = async () => {
    if (!loanAmount) return;

    const amountNum = parseFloat(loanAmount);
    if (amountNum > maxLoanAmount) {
      alert(
        `Maximum loan amount is ${maxLoanAmount} USDC based on your trust score`
      );
      return;
    }

    if (amountNum < 10) {
      alert("Minimum loan amount is 10 USDC");
      return;
    }

    try {
      // For now, we'll simulate a loan by withdrawing from liquidity pool
      // In production, this would use a proper credit engine
      const amount = parseUnits(loanAmount, 6);

      await writeContract({
        address: CONTRACTS.LiquidityPool,
        abi: LIQUIDITY_POOL_ABI,
        functionName: "removeLiquidity",
        args: [amount],
      });

      setLoanAmount("");
      alert("Loan request submitted! (Simulated via liquidity withdrawal)");
    } catch (error) {
      console.error("Loan request failed:", error);
      alert(
        "Loan request failed. You may need to deposit first or check your trust score."
      );
    }
  };

  // Handle payment
  const handlePayment = async () => {
    if (!paymentForm.recipient || !paymentForm.amount) return;

    try {
      // Use 6 decimals for USDC
      const amount = parseUnits(paymentForm.amount, 6);

      await writeContract({
        address: CONTRACTS.TrustBankCore,
        abi: TRUSTBANK_CORE_ABI,
        functionName: "sendPayment",
        args: [
          paymentForm.recipient as `0x${string}`,
          amount,
          paymentForm.message,
        ],
      });

      setPaymentForm({ recipient: "", amount: "", message: "" });
      alert("Payment sent!");
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed. Check console for details.");
    }
  };

  // Handle vouch
  const handleVouch = async () => {
    if (!vouchForm.userAddress || !vouchForm.amount) return;

    try {
      // Use 6 decimals for USDC
      const amount = parseUnits(vouchForm.amount, 6);

      await writeContract({
        address: CONTRACTS.TrustBankCore,
        abi: TRUSTBANK_CORE_ABI,
        functionName: "vouchForUser",
        args: [vouchForm.userAddress as `0x${string}`, amount],
      });

      setVouchForm({ userAddress: "", amount: "" });
      alert("Vouch submitted!");
    } catch (error) {
      console.error("Vouch failed:", error);
      alert("Vouch failed. Check console for details.");
    }
  };

  // Get test USDC from faucet
  const getTestUSDC = async () => {
    try {
      await writeContract({
        address: CONTRACTS.MockUSDC,
        abi: MOCK_USDC_ABI,
        functionName: "faucet",
        args: [],
      });
      alert("1000 test USDC claimed from faucet!");
    } catch (error) {
      console.error("Faucet failed:", error);
      alert("Faucet failed. You might already have enough USDC (1000+ USDC).");
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "banking":
        return (
          <>
            {/* Test USDC Faucet Button */}
            <section className="feature-card">
              <h2 className="card-title">🧪 Test Setup</h2>
              <div className="balance-info">
                USDC Balance: {usdcBalance ? formatUnits(usdcBalance, 6) : "0"}{" "}
                USDC
              </div>
              <button
                onClick={getTestUSDC}
                className="synthwave-button secondary"
              >
                Get 1000 Test USDC (Faucet)
              </button>
            </section>

            {/* Deposit & Yield Section */}
            <section className="feature-card">
              <h2 className="card-title">💰 Deposit & Earn Yield</h2>
              <div className="input-group">
                <input
                  type="number"
                  placeholder="Amount to deposit (min 10 USDC)"
                  className="synthwave-input"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="10"
                />
                <button
                  onClick={handleDeposit}
                  className="synthwave-button primary"
                >
                  Deposit USDC
                </button>
                <div className="balance-info">
                  Your Deposits:{" "}
                  {userDeposits ? formatUnits(userDeposits, 6) : "0"} USDC
                </div>
                <div className="balance-info">
                  Claimable Yield:{" "}
                  {claimableYield ? formatUnits(claimableYield, 6) : "0"} USDC
                </div>
                {claimableYield &&
                  Number(formatUnits(claimableYield, 6)) > 0 && (
                    <button
                      onClick={handleClaimYield}
                      className="synthwave-button secondary"
                    >
                      Claim Yield
                    </button>
                  )}
              </div>
            </section>

            {/* Send Payment Section */}
            <section className="feature-card">
              <h2 className="card-title">💸 Send Payment</h2>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Recipient address"
                  className="synthwave-input"
                  value={paymentForm.recipient}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      recipient: e.target.value,
                    })
                  }
                />
                <input
                  type="number"
                  placeholder="Amount (USDC)"
                  className="synthwave-input"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, amount: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Message (optional)"
                  className="synthwave-input"
                  value={paymentForm.message}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, message: e.target.value })
                  }
                />
                <button
                  onClick={handlePayment}
                  className="synthwave-button primary"
                >
                  Send Payment
                </button>
              </div>
            </section>

            {/* Vouch Section */}
            <section className="feature-card">
              <h2 className="card-title">🤝 Vouch for Someone</h2>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="User address to vouch for"
                  className="synthwave-input"
                  value={vouchForm.userAddress}
                  onChange={(e) =>
                    setVouchForm({ ...vouchForm, userAddress: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Vouch amount (USDC)"
                  className="synthwave-input"
                  value={vouchForm.amount}
                  onChange={(e) =>
                    setVouchForm({ ...vouchForm, amount: e.target.value })
                  }
                />
                <button
                  onClick={handleVouch}
                  className="synthwave-button secondary"
                >
                  Submit Vouch
                </button>
              </div>
            </section>
          </>
        );

      case "trustscore":
        return (
          <section className="feature-card dashboard">
            <h2 className="card-title">📊 Your Trust Score Details</h2>
            <div className="score-display">
              <div className="score-number">
                {trustScore ? trustScore.toString() : "0"}
              </div>
              <div className="score-label">Trust Score</div>
            </div>

            <div className="trust-breakdown">
              <h3 className="breakdown-title">How Your Score is Calculated:</h3>
              <div className="breakdown-item">
                <span className="breakdown-label">Payment History (40%)</span>
                <span className="breakdown-value">Building...</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Vouches Received (30%)</span>
                <span className="breakdown-value">Building...</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Loan Repayment (25%)</span>
                <span className="breakdown-value">No loans yet</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Account Age (5%)</span>
                <span className="breakdown-value">New account</span>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">
                  {userDeposits ? formatUnits(userDeposits, 6) : "0"}
                </span>
                <span className="stat-label">Deposited USDC</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {claimableYield ? formatUnits(claimableYield, 6) : "0"}
                </span>
                <span className="stat-label">Earned Yield</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">${maxLoanAmount}</span>
                <span className="stat-label">Max Loan Amount</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">5.2%</span>
                <span className="stat-label">Current APY</span>
              </div>
            </div>

            <div className="trust-tips">
              <h3 className="tips-title">💡 How to Improve Your Score:</h3>
              <ul className="tips-list">
                <li>Make more payments to build transaction history</li>
                <li>Ask friends to vouch for you</li>
                <li>Repay loans on time (when available)</li>
                <li>Maintain account activity over time</li>
              </ul>
            </div>
          </section>
        );

      case "loans":
        return (
          <>
            <section className="feature-card">
              <h2 className="card-title">🏦 Request a Loan</h2>
              <div className="loan-info">
                <div className="loan-stats">
                  <div className="loan-stat">
                    <span className="stat-label">Your Trust Score:</span>
                    <span className="stat-value">
                      {trustScore ? trustScore.toString() : "0"}
                    </span>
                  </div>
                  <div className="loan-stat">
                    <span className="stat-label">Max Loan Amount:</span>
                    <span className="stat-value">${maxLoanAmount} USDC</span>
                  </div>
                  <div className="loan-stat">
                    <span className="stat-label">Interest Rate:</span>
                    <span className="stat-value">5% APR</span>
                  </div>
                  <div className="loan-stat">
                    <span className="stat-label">Loan Term:</span>
                    <span className="stat-value">30 days</span>
                  </div>
                </div>
              </div>

              {maxLoanAmount > 0 ? (
                <div className="input-group">
                  <input
                    type="number"
                    placeholder={`Amount to borrow (max $${maxLoanAmount} USDC)`}
                    className="synthwave-input"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    max={maxLoanAmount}
                    min="10"
                  />
                  <button
                    onClick={handleLoanRequest}
                    className="synthwave-button primary"
                  >
                    Request Loan
                  </button>
                  <div className="loan-terms">
                    <small>
                      By requesting a loan, you agree to repay within 30 days at
                      5% interest. Failure to repay will impact your trust
                      score.
                    </small>
                  </div>
                </div>
              ) : (
                <div className="no-loans">
                  <h3>🚫 No Loans Available</h3>
                  <p>Your trust score is too low to qualify for loans.</p>
                  <p>Build your trust score by:</p>
                  <ul>
                    <li>Making payments to other users</li>
                    <li>Getting vouched by friends</li>
                    <li>Depositing funds to earn yield</li>
                  </ul>
                  <button
                    onClick={() => setActiveTab("trustscore")}
                    className="synthwave-button secondary"
                  >
                    View Trust Score Details
                  </button>
                </div>
              )}
            </section>

            <section className="feature-card">
              <h2 className="card-title">📋 Your Loan History</h2>
              <div className="loan-history">
                <p className="no-history">
                  No loans yet. Request your first loan above!
                </p>
              </div>
            </section>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="synthwave-app">
      {/* Header */}
      <header className="app-header">
        <h1 className="synthwave-title">TrustBank</h1>
        {!isConnected ? (
          <ConnectButton />
        ) : (
          <div className="wallet-info">
            <span className="wallet-address">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <appkit-button />
          </div>
        )}
      </header>

      {/* Main Content */}
      {isConnected ? (
        <main className="app-main">
          {/* Tab Navigation */}
          <nav className="tab-navigation">
            <button
              className={`tab-button ${
                activeTab === "banking" ? "active" : ""
              }`}
              onClick={() => setActiveTab("banking")}
            >
              🏦 Banking
            </button>
            <button
              className={`tab-button ${
                activeTab === "trustscore" ? "active" : ""
              }`}
              onClick={() => setActiveTab("trustscore")}
            >
              📊 Trust Score
            </button>
            <button
              className={`tab-button ${activeTab === "loans" ? "active" : ""}`}
              onClick={() => setActiveTab("loans")}
            >
              💰 Loans
            </button>
          </nav>

          {/* Tab Content */}
          {renderTabContent()}
        </main>
      ) : (
        <main className="connect-prompt">
          <div className="connect-message">
            <h2>Connect Your Wallet to Access TrustBank</h2>
            <p>
              Connect your wallet to start sending payments, vouching for
              friends, and building your trust score.
            </p>
          </div>
        </main>
      )}
    </div>
  );
}
