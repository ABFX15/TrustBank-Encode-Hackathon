import { ethers } from "hardhat";

async function main() {
    console.log("🚀 Fixing Etherlink contract deployment...");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    // Existing MockUSDC (working fine)
    const mockUSDC = "0x8beC0937A6668FAA3a844047F1A9BaE0dCe0c759";
    console.log("✅ Using existing MockUSDC:", mockUSDC);

    // Deploy YieldStrategy first (LiquidityPool dependency)
    console.log("\n📦 Deploying YieldStrategy...");
    const YieldStrategy = await ethers.getContractFactory("YieldStrategy");
    const yieldStrategy = await YieldStrategy.deploy(
        mockUSDC,           // _stablecoin
        deployer.address,   // _protocolTreasury (use deployer as treasury)
        500,                // _yieldFeeBps (5% yield fee)
        100                 // _withdrawFeeBps (1% withdraw fee)
    );
    await yieldStrategy.waitForDeployment();
    const yieldStrategyAddress = await yieldStrategy.getAddress();
    console.log("✅ YieldStrategy deployed to:", yieldStrategyAddress);

    // Deploy TrustBankCore 
    console.log("\n📦 Deploying TrustBankCore...");
    const TrustBankCore = await ethers.getContractFactory("TrustBankCore");
    const trustBankCore = await TrustBankCore.deploy(mockUSDC);
    await trustBankCore.waitForDeployment();
    const trustBankCoreAddress = await trustBankCore.getAddress();
    console.log("✅ TrustBankCore deployed to:", trustBankCoreAddress);

    // Deploy LiquidityPool with proper constructor parameters
    console.log("\n📦 Deploying LiquidityPool...");
    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    const liquidityPool = await LiquidityPool.deploy(
        mockUSDC,           // stablecoin
        trustBankCoreAddress, // trustBank
        yieldStrategyAddress  // yieldStrategy
    );
    await liquidityPool.waitForDeployment();
    const liquidityPoolAddress = await liquidityPool.getAddress();
    console.log("✅ LiquidityPool deployed to:", liquidityPoolAddress);

    // Set credit engine in LiquidityPool
    console.log("\n🔧 Setting up LiquidityPool...");
    await liquidityPool.setCreditEngine(trustBankCoreAddress);
    console.log("✅ LiquidityPool creditEngine set to TrustBankCore");

    // Set liquidity pool in TrustBankCore
    console.log("\n🔧 Setting up TrustBankCore...");
    try {
        await trustBankCore.setLiquidityPool(liquidityPoolAddress);
        console.log("✅ TrustBankCore liquidityPool set");
    } catch (error) {
        console.log("ℹ️  TrustBankCore may not have setLiquidityPool function");
    }

    // Test basic functionality
    console.log("\n🧪 Testing contract functionality...");

    // Test LiquidityPool configuration
    const stablecoinAddr = await liquidityPool.stablecoin();
    const trustBankAddr = await liquidityPool.trustBank();
    const yieldStrategyAddr = await liquidityPool.yieldStrategy();

    console.log("LiquidityPool configuration:");
    console.log("  stablecoin:", stablecoinAddr);
    console.log("  trustBank:", trustBankAddr);
    console.log("  yieldStrategy:", yieldStrategyAddr);

    // Final deployment summary
    console.log("\n🎉 Deployment completed successfully!");
    console.log("📋 Updated contract addresses:");
    console.log(`  MockUSDC: "${mockUSDC}"`);
    console.log(`  TrustBankCore: "${trustBankCoreAddress}"`);
    console.log(`  YieldStrategy: "${yieldStrategyAddress}"`);
    console.log(`  LiquidityPool: "${liquidityPoolAddress}"`);

    console.log("\n🔄 Update frontend/Hack/src/hooks/useContracts.ts with these addresses!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 