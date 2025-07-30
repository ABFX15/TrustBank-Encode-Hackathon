import { ethers } from "hardhat";

async function main() {
    console.log("🔍 Verifying deployed contracts...");

    const [deployer] = await ethers.getSigners();
    console.log("Testing with account:", deployer.address);

    // Contract addresses
    const contracts = {
        MockUSDC: "0x8beC0937A6668FAA3a844047F1A9BaE0dCe0c759",
        TrustBankCore: "0xEDD7B8c0084B9196F5a30ff89bB40e95638c2894",
        LiquidityPool: "0x1d40b9B4B2801aa00C252e10cE8073103498b773",
    };

    try {
        // Test TrustBankCore
        console.log("\n📋 Testing TrustBankCore...");
        const TrustBankCore = await ethers.getContractFactory("TrustBankCore");
        const trustBankCore = TrustBankCore.attach(contracts.TrustBankCore);

        // Test getUserTrustScore function
        const trustScore = await trustBankCore.getUserTrustScore(deployer.address);
        console.log("✅ getUserTrustScore works, result:", trustScore.toString());

        // Test stablecoin address
        const stablecoinAddr = await trustBankCore.stablecoin();
        console.log("✅ TrustBankCore.stablecoin():", stablecoinAddr);

    } catch (error) {
        console.error("❌ TrustBankCore test failed:", error);
    }

    try {
        // Test LiquidityPool
        console.log("\n📋 Testing LiquidityPool...");
        const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
        const liquidityPool = LiquidityPool.attach(contracts.LiquidityPool);

        // Test userDeposits function
        const userDeposits = await liquidityPool.userDeposits(deployer.address);
        console.log("✅ userDeposits works, result:", userDeposits.toString());

        // Test configuration
        const stablecoin = await liquidityPool.stablecoin();
        const trustBank = await liquidityPool.trustBank();
        console.log("✅ LiquidityPool.stablecoin():", stablecoin);
        console.log("✅ LiquidityPool.trustBank():", trustBank);

        // Test MIN_DEPOSIT constant
        const minDeposit = await liquidityPool.MIN_DEPOSIT();
        console.log("✅ MIN_DEPOSIT:", ethers.formatUnits(minDeposit, 6), "USDC");

    } catch (error) {
        console.error("❌ LiquidityPool test failed:", error);
    }

    try {
        // Test MockUSDC (should work)
        console.log("\n📋 Testing MockUSDC...");
        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        const mockUSDC = MockUSDC.attach(contracts.MockUSDC);

        const balance = await mockUSDC.balanceOf(deployer.address);
        const symbol = await mockUSDC.symbol();
        const decimals = await mockUSDC.decimals();

        console.log("✅ MockUSDC.balanceOf():", ethers.formatUnits(balance, 6), "USDC");
        console.log("✅ MockUSDC.symbol():", symbol);
        console.log("✅ MockUSDC.decimals():", decimals);

    } catch (error) {
        console.error("❌ MockUSDC test failed:", error);
    }

    console.log("\n✅ Contract verification completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 