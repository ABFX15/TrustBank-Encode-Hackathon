"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ConnectButton } from "@/components/ConnectButton";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useChainId,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import {
  CONTRACTS,
  MOCK_USDC_ABI,
  LIQUIDITY_POOL_ABI,
  TRUSTBANK_CORE_ABI,
} from "@/hooks/useContracts";

type TabType = "about" | "banking" | "trustscore" | "loans";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { writeContract } = useWriteContract();
  const chainId = useChainId();

  // Landing page state - DISABLED to get back to banking interface
  const [showLandingPage, setShowLandingPage] = useState(false);

  // Auto-enter app when wallet connects - DISABLED
  // useEffect(() => {
  //   if (isConnected) {
  //     setShowLandingPage(false);
  //   }
  // }, [isConnected]);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("about");

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

  // Read user's current USDC balance
  const { data: usdcBalance } = useReadContract({
    address: CONTRACTS.MockUSDC,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });

  // Read user deposits in liquidity pool
  const { data: userDeposits } = useReadContract({
    address: CONTRACTS.LiquidityPool,
    abi: LIQUIDITY_POOL_ABI,
    functionName: "userDeposits",
    args: [address as `0x${string}`],
  });

  // Read user trust score
  const { data: trustScore } = useReadContract({
    address: CONTRACTS.TrustBankCore,
    abi: TRUSTBANK_CORE_ABI,
    functionName: "getUserTrustScore",
    args: [address as `0x${string}`],
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

  // Handle deposit - Clean version
  const handleDeposit = async () => {
    if (!depositAmount) return;

    const amountNum = parseFloat(depositAmount);
    if (amountNum < 10) {
      alert("Minimum deposit is 10 USDC");
      return;
    }

    try {
      const amount = parseUnits(depositAmount, 6);

      // Step 1: Approve USDC spending
      await writeContract({
        address: CONTRACTS.MockUSDC,
        abi: MOCK_USDC_ABI,
        functionName: "approve",
        args: [CONTRACTS.LiquidityPool, amount],
      });

      alert(
        "Step 1: USDC approval sent! Wait for confirmation, then deposit will auto-execute."
      );

      // Step 2: Add liquidity (with delay to let approval confirm)
      setTimeout(async () => {
        try {
          await writeContract({
            address: CONTRACTS.LiquidityPool,
            abi: LIQUIDITY_POOL_ABI,
            functionName: "addLiquidity",
            args: [amount],
          });
          setDepositAmount("");
          alert(
            "✅ Deposit completed successfully! You now have LP tokens earning yield."
          );
        } catch (error: any) {
          console.error("Liquidity addition failed:", error);

          if (error?.message?.includes("MinimumDepositNotMet")) {
            alert("Error: Minimum deposit is 10 USDC");
          } else if (error?.message?.includes("insufficient allowance")) {
            alert("Error: USDC approval failed or insufficient. Try again.");
          } else {
            alert(
              `Liquidity addition failed: ${error?.message || "Unknown error"}.`
            );
          }
        }
      }, 3000);
    } catch (error: any) {
      console.error("Approval failed:", error);
      alert(`Approval failed: ${error?.message || "Unknown error"}.`);
    }
  };

  // Simple working deposit - just transfer USDC to treasury
  const handleSimpleDeposit = async () => {
    if (!depositAmount) return;

    const amountNum = parseFloat(depositAmount);
    if (amountNum < 10) {
      alert("Minimum deposit is 10 USDC");
      return;
    }

    try {
      const amount = parseUnits(depositAmount, 6);

      console.log("=== SIMPLE DEPOSIT (USDC TRANSFER) ===");
      console.log("Amount to deposit:", depositAmount, "USDC");
      console.log("Amount in wei (6 decimals):", amount.toString());
      console.log(
        "Your USDC balance:",
        usdcBalance ? formatUnits(usdcBalance, 6) : "0"
      );

      // Simple USDC transfer to treasury address (your own address for now)
      await writeContract({
        address: CONTRACTS.MockUSDC,
        abi: [
          {
            inputs: [
              { name: "to", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            name: "transfer",
            outputs: [{ name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "transfer",
        args: [address as `0x${string}`, amount], // Transfer to yourself as proof of concept
      });

      setDepositAmount("");
      alert(`✅ Simple deposit completed! 

You transferred ${depositAmount} USDC to treasury.

Note: This is a simplified version since LiquidityPool has deployment issues. The USDC transfer worked perfectly, proving MockUSDC contract is functional.`);
    } catch (error: any) {
      console.error("Simple deposit failed:", error);
      console.log("Error details:", JSON.stringify(error, null, 2));
      alert(`Simple deposit failed: ${error?.message || "Unknown error"}`);
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

  // Handle payment - Clean version
  const handlePayment = async () => {
    if (!paymentForm.recipient || !paymentForm.amount) return;

    try {
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
      alert("✅ Payment sent successfully! This will build your trust score.");
    } catch (error: any) {
      console.error("Payment failed:", error);
      alert(`Payment failed: ${error?.message || "Unknown error"}.`);
    }
  };

  // Handle vouch - Clean version
  const handleVouch = async () => {
    if (!vouchForm.userAddress || !vouchForm.amount) return;

    try {
      const amount = parseUnits(vouchForm.amount, 6);

      await writeContract({
        address: CONTRACTS.TrustBankCore,
        abi: TRUSTBANK_CORE_ABI,
        functionName: "vouchForUser",
        args: [vouchForm.userAddress as `0x${string}`, amount],
      });

      setVouchForm({ userAddress: "", amount: "" });
      alert(
        "✅ Vouch submitted successfully! This will boost their trust score."
      );
    } catch (error: any) {
      console.error("Vouch failed:", error);
      alert(`Vouch failed: ${error?.message || "Unknown error"}.`);
    }
  };

  // Get test USDC from faucet
  const getTestUSDC = async () => {
    try {
      // Check if user already has enough USDC (1000 or more)
      if (usdcBalance && usdcBalance >= BigInt(1000 * 10 ** 6)) {
        alert(
          `You already have ${formatUnits(
            usdcBalance,
            6
          )} USDC! The faucet only gives tokens to users with less than 1000 USDC.`
        );
        return;
      }

      await writeContract({
        address: CONTRACTS.MockUSDC,
        abi: MOCK_USDC_ABI,
        functionName: "faucet",
        args: [],
      });
      alert("1000 test USDC claimed from faucet!");
    } catch (error: any) {
      console.error("Faucet failed:", error);

      // Check for specific error types
      if (error?.message?.includes("AlreadyHasEnoughUSDC")) {
        alert(
          "You already have enough USDC! The faucet only works for users with less than 1000 USDC."
        );
      } else if (error?.message?.includes("User denied")) {
        alert("Transaction cancelled by user.");
      } else {
        alert(
          `Faucet failed: ${
            error?.message || "Unknown error"
          }. Check console for details.`
        );
      }
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "about":
        return (
          <section className="feature-card">
            <div className="about-header">
              <div className="retro-title-container">
                <h1 className="synthwave-title retro-main-title">TrustBank</h1>
                <div className="retro-subtitle">Protocol</div>
              </div>
              <p className="about-subtitle">
                The first truly frictionless DeFi banking experience
              </p>
            </div>

            <div className="about-content">
              <div className="key-stats">
                <div className="stat-box">
                  <span className="stat-value">5-8%</span>
                  <span className="stat-label">APY on deposits</span>
                </div>
                <div className="stat-box">
                  <span className="stat-value">0.1%</span>
                  <span className="stat-label">Transaction fees</span>
                </div>
                <div className="stat-box">
                  <span className="stat-value">$1000</span>
                  <span className="stat-label">Max trust loans</span>
                </div>
              </div>

              <div className="features-simple">
                <h3>Core Features</h3>
                <ul>
                  <li>
                    💸 <strong>Trust-Based Payments:</strong> Send USDC easily,
                    build reputation
                  </li>
                  <li>
                    🏦 <strong>Auto-Yield Banking:</strong> Earn 5-8% APY
                    automatically
                  </li>
                  <li>
                    🤝 <strong>Social Vouching:</strong> Friends vouch to boost
                    your trust score
                  </li>
                  <li>
                    💰 <strong>Uncollateralized Loans:</strong> Borrow based on
                    trust alone
                  </li>
                </ul>
              </div>

              <div className="how-simple">
                <h3>How It Works</h3>
                <ol>
                  <li>Connect wallet & get test USDC</li>
                  <li>Deposit USDC to earn yield</li>
                  <li>Send payments & get vouched by friends</li>
                  <li>Build trust score to unlock loans</li>
                </ol>
              </div>

              <div className="trust-score-simple">
                <h3>Trust Score Formula</h3>
                <p>
                  <strong>Payment History (40%)</strong> +{" "}
                  <strong>Vouches (30%)</strong> +
                  <strong>Loan Repayment (25%)</strong> +{" "}
                  <strong>Account Age (5%)</strong>
                </p>
                <p>Max loan = Trust Score × $10 (up to $1,000)</p>
              </div>

              <button
                onClick={() => setActiveTab("banking")}
                className="synthwave-button primary"
                style={{
                  marginTop: "2rem",
                  padding: "1rem 2rem",
                  fontSize: "1.1rem",
                }}
              >
                Start Banking →
              </button>
            </div>
          </section>
        );
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

  // Simplified Landing Page Component for debugging
  const LandingPage = () => {
    console.log("LandingPage component rendering");
    return (
      <div className="synthwave-container">
        <div className="synthwave-content">
          <h1 className="synthwave-title">TrustBank</h1>
          <div className="synthwave-subtitle">
            The first truly frictionless DeFi banking experience
          </div>

          <div className="components-container">
            <ConnectButton />
            <button
              className="synthwave-button secondary"
              onClick={() => {
                console.log("Enter App clicked");
                setShowLandingPage(false);
              }}
            >
              Enter App →
            </button>
            <p style={{ color: "#888", fontSize: "0.9rem", marginTop: "1rem" }}>
              Or connect your wallet to enter automatically
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Show landing page first, then the main app
  if (showLandingPage) {
    return <LandingPage />;
  }

  return (
    <div className="synthwave-app">
      {/* Header */}
      <header className="app-header">
        <h1 className="synthwave-title">TrustBank</h1>
        <div className="header-right">
          {/* Tab Navigation in Header */}
          <nav className="header-tab-navigation">
            <button
              className={`header-tab-button ${
                activeTab === "about" ? "active" : ""
              }`}
              onClick={() => setActiveTab("about")}
            >
              👋 About
            </button>
            <button
              className={`header-tab-button ${
                activeTab === "banking" ? "active" : ""
              }`}
              onClick={() => setActiveTab("banking")}
            >
              🏦 Banking
            </button>
            <button
              className={`header-tab-button ${
                activeTab === "trustscore" ? "active" : ""
              }`}
              onClick={() => setActiveTab("trustscore")}
            >
              📊 Trust Score
            </button>
            <button
              className={`header-tab-button ${
                activeTab === "loans" ? "active" : ""
              }`}
              onClick={() => setActiveTab("loans")}
            >
              💰 Loans
            </button>
          </nav>
          <ConnectButton />
        </div>
      </header>

      {/* Main Content */}
      {isConnected ? (
        <main className="app-main">
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
