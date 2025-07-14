import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TrustBankModule = buildModule("TrustBank", (m) => {
    // Deploy Mock USDC first (for testnet)
    const mockUSDC = m.contract("MockUSDC");

    // Deploy TrustBankCore with USDC address
    const trustBankCore = m.contract("TrustBankCore", [mockUSDC]);

    // Deploy YieldStrategy
    const yieldStrategy = m.contract("YieldStrategy", [mockUSDC]);

    // Deploy LiquidityPool with dependencies
    const liquidityPool = m.contract("LiquidityPool", [
        mockUSDC,
        trustBankCore,
        yieldStrategy,
    ]);

    // Deploy TrustBankCreditEngine
    const creditEngine = m.contract("TrustBankCreditEngine", [
        trustBankCore,
        mockUSDC,
        liquidityPool,
    ]);

    // Deploy ZK Credit contracts
    const zkCredit = m.contract("TrustBankZKCredit", [
        trustBankCore,
        creditEngine,
    ]);

      // Deploy PriceOracle
  const priceOracle = m.contract("TrustBankPriceOracle");

  // Deploy Mortgage contract
  const mortgage = m.contract("TrustBankMortgage", [
    mockUSDC,
    trustBankCore,
  ]);

  // Return all contract instances
  return {
    mockUSDC,
    trustBankCore,
    yieldStrategy,
    liquidityPool,
    creditEngine,
    zkCredit,
    priceOracle,
    mortgage,
  };
});

export default TrustBankModule;
