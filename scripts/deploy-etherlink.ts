import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
    console.log("🚀 Deploying TrustBank to Etherlink Testnet...");

    // Get network info
    const network = hre.network.name;
    const chainId = (await ethers.provider.getNetwork()).chainId;

    console.log(`📍 Network: ${network}`);
    console.log(`🔗 Chain ID: ${chainId}`);

    // Get deployer
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    const balance = await ethers.provider.getBalance(deployerAddress);

    console.log(`👤 Deployer: ${deployerAddress}`);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

    if (balance < ethers.parseEther("0.1")) {
        console.log("⚠️  Warning: Low ETH balance. You might need more ETH for deployment.");
    }

    console.log("\n📝 Deploying contracts...");

    // 1. Deploy MockUSDC
    console.log("1️⃣ Deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();
    const usdcAddress = await mockUSDC.getAddress();
    console.log(`✅ MockUSDC deployed to: ${usdcAddress}`);

    // 2. Deploy TrustBankCore
    console.log("2️⃣ Deploying TrustBankCore...");
    const TrustBankCore = await ethers.getContractFactory("TrustBankCore");
    const trustBankCore = await TrustBankCore.deploy(usdcAddress);
    await trustBankCore.waitForDeployment();
    const coreAddress = await trustBankCore.getAddress();
    console.log(`✅ TrustBankCore deployed to: ${coreAddress}`);

    // 3. Deploy YieldStrategy
    console.log("3️⃣ Deploying YieldStrategy...");
    const YieldStrategy = await ethers.getContractFactory("YieldStrategy");
    const yieldStrategy = await YieldStrategy.deploy(usdcAddress);
    await yieldStrategy.waitForDeployment();
    const yieldAddress = await yieldStrategy.getAddress();
    console.log(`✅ YieldStrategy deployed to: ${yieldAddress}`);

    // 4. Deploy LiquidityPool
    console.log("4️⃣ Deploying LiquidityPool...");
    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    const liquidityPool = await LiquidityPool.deploy(
        usdcAddress,
        coreAddress,
        yieldAddress
    );
    await liquidityPool.waitForDeployment();
    const poolAddress = await liquidityPool.getAddress();
    console.log(`✅ LiquidityPool deployed to: ${poolAddress}`);

    // 5. Deploy TrustBankCreditEngine
    console.log("5️⃣ Deploying TrustBankCreditEngine...");
    const TrustBankCreditEngine = await ethers.getContractFactory("TrustBankCreditEngine");
    const creditEngine = await TrustBankCreditEngine.deploy(
        coreAddress,
        usdcAddress,
        poolAddress
    );
    await creditEngine.waitForDeployment();
    const creditEngineAddress = await creditEngine.getAddress();
    console.log(`✅ TrustBankCreditEngine deployed to: ${creditEngineAddress}`);

    // 6. Deploy Cross-Chain Infrastructure (using deployer as mock router)
    console.log("6️⃣ Deploying TrustBankCrossChainInfrastructure_Simplified...");
    const CrossChainInfra = await ethers.getContractFactory("TrustBankCrossChainInfrastructure_Simplified");
    const crossChainInfra = await CrossChainInfra.deploy(
        deployerAddress, // Mock Chainlink router (for testnet)
        usdcAddress
    );
    await crossChainInfra.waitForDeployment();
    const infraAddress = await crossChainInfra.getAddress();
    console.log(`✅ CrossChainInfra deployed to: ${infraAddress}`);

    // 7. Deploy SimpleCrossChainYield
    console.log("7️⃣ Deploying SimpleCrossChainYield...");
    const SimpleCrossChainYield = await ethers.getContractFactory("SimpleCrossChainYield");
    const simpleCrossChainYield = await SimpleCrossChainYield.deploy(
        infraAddress,
        usdcAddress
    );
    await simpleCrossChainYield.waitForDeployment();
    const yieldFarmingAddress = await simpleCrossChainYield.getAddress();
    console.log(`✅ SimpleCrossChainYield deployed to: ${yieldFarmingAddress}`);

    // 8. Configure contracts
    console.log("\n⚙️ Configuring contracts...");

    // Set credit engine in liquidity pool
    console.log("Setting credit engine in LiquidityPool...");
    await liquidityPool.setCreditEngine(creditEngineAddress);

    // Enable cross-chain in YieldStrategy
    console.log("Enabling cross-chain in YieldStrategy...");
    await yieldStrategy.enableCrossChain(infraAddress);

    // Mint some test tokens to deployer
    console.log("Minting test USDC tokens...");
    const mintAmount = ethers.parseUnits("1000000", 6); // 1M USDC
    await mockUSDC.mint(deployerAddress, mintAmount);

    console.log("\n🎉 Deployment completed successfully!");
    console.log("\n📋 Contract Addresses:");
    console.log(`MockUSDC:                    ${usdcAddress}`);
    console.log(`TrustBankCore:               ${coreAddress}`);
    console.log(`TrustBankCreditEngine:       ${creditEngineAddress}`);
    console.log(`YieldStrategy:               ${yieldAddress}`);
    console.log(`LiquidityPool:               ${poolAddress}`);
    console.log(`CrossChainInfra:             ${infraAddress}`);
    console.log(`SimpleCrossChainYield:       ${yieldFarmingAddress}`);

    console.log("\n📚 Next steps:");
    console.log("1. Save these addresses for frontend integration");
    console.log("2. Fund contracts with ETH for gas if needed");
    console.log("3. Test cross-chain functionality");
    console.log("4. Configure real Chainlink CCIP router when available");

    // Save deployment info to file
    const deploymentInfo = {
        network: network,
        chainId: chainId.toString(),
        deployer: deployerAddress,
        timestamp: new Date().toISOString(),
        contracts: {
            MockUSDC: usdcAddress,
            TrustBankCore: coreAddress,
            TrustBankCreditEngine: creditEngineAddress,
            YieldStrategy: yieldAddress,
            LiquidityPool: poolAddress,
            CrossChainInfra: infraAddress,
            SimpleCrossChainYield: yieldFarmingAddress,
        }
    };

    const fs = require('fs');
    fs.writeFileSync(
        `deployment-${network}-${Date.now()}.json`,
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log(`\n💾 Deployment info saved to deployment-${network}-${Date.now()}.json`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
