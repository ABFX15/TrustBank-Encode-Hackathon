import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TrustBankModule = buildModule("TrustBankModule", (m) => {
    // Deploy MockUSDC first (since Etherlink testnet might not have USDC)
    const mockUSDC = m.contract("MockUSDC", []);

    // For Etherlink, we'll use a mock Chainlink router since CCIP might not be available
    // In production, you'd use the real Chainlink router address
    const mockChainlinkRouter = m.getParameter(
        "chainlinkRouter",
        "0x0000000000000000000000000000000000000001" // Placeholder
    );

    // Deploy TrustBankCore
    const trustBankCore = m.contract("TrustBankCore", [mockUSDC]);

    // Deploy YieldStrategy
    const yieldStrategy = m.contract("YieldStrategy", [mockUSDC]);

    // Deploy LiquidityPool
    const liquidityPool = m.contract("LiquidityPool", [
        mockUSDC,
        trustBankCore,
        yieldStrategy
    ]);

    // Deploy simplified cross-chain infrastructure
    const crossChainInfra = m.contract("TrustBankCrossChainInfrastructure_Simplified", [
        mockChainlinkRouter,
        mockUSDC
    ]);

    // Deploy SimpleCrossChainYield
    const simpleCrossChainYield = m.contract("SimpleCrossChainYield", [
        crossChainInfra,
        mockUSDC
    ]);

    // Enable cross-chain functionality in YieldStrategy
    m.call(yieldStrategy, "enableCrossChain", [crossChainInfra]);

    return {
        mockUSDC,
        trustBankCore,
        yieldStrategy,
        liquidityPool,
        crossChainInfra,
        simpleCrossChainYield,
    };
});

export default TrustBankModule;
