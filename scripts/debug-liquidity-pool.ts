import { ethers } from "hardhat";

async function main() {
    console.log("🔍 Debugging LiquidityPool addLiquidity issue...");

    const [deployer] = await ethers.getSigners();
    console.log("Testing with account:", deployer.address);

    // Contract addresses
    const contracts = {
        MockUSDC: "0x8beC0937A6668FAA3a844047F1A9BaE0dCe0c759",
        LiquidityPool: "0x1d40b9B4B2801aa00C252e10cE8073103498b773",
        YieldStrategy: "0xdd99dE366D7F3Bab80e8f5aD1fCdBF82621b0c10",
    };

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = MockUSDC.attach(contracts.MockUSDC);

    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    const liquidityPool = LiquidityPool.attach(contracts.LiquidityPool);

    const YieldStrategy = await ethers.getContractFactory("YieldStrategy");
    const yieldStrategy = YieldStrategy.attach(contracts.YieldStrategy);

    try {
        // Check current state
        console.log("\n📊 Checking current state...");
        const balance = await mockUSDC.balanceOf(deployer.address);
        console.log("USDC Balance:", ethers.formatUnits(balance, 6), "USDC");

        const allowance = await mockUSDC.allowance(deployer.address, contracts.LiquidityPool);
        console.log("USDC Allowance for LiquidityPool:", ethers.formatUnits(allowance, 6), "USDC");

        const minDeposit = await liquidityPool.MIN_DEPOSIT();
        console.log("MIN_DEPOSIT:", ethers.formatUnits(minDeposit, 6), "USDC");

        const totalSupply = await liquidityPool.totalSupply();
        console.log("LiquidityPool totalSupply:", totalSupply.toString());

        // Check YieldStrategy state
        console.log("\n🔧 Checking YieldStrategy state...");
        const yieldStablecoin = await yieldStrategy.stablecoin();
        console.log("YieldStrategy stablecoin:", yieldStablecoin);
        console.log("Expected stablecoin:", contracts.MockUSDC);

        const yieldBalance = await mockUSDC.balanceOf(contracts.YieldStrategy);
        console.log("YieldStrategy USDC balance:", ethers.formatUnits(yieldBalance, 6), "USDC");

        // Test with smallest possible amount first
        const smallAmount = ethers.parseUnits("10", 6); // Exactly MIN_DEPOSIT
        console.log("\n🧪 Testing with minimum amount:", ethers.formatUnits(smallAmount, 6), "USDC");

        try {
            // Try static call to get the exact error
            await liquidityPool.addLiquidity.staticCall(smallAmount);
            console.log("✅ Static call succeeded - should work");

            // Try gas estimation
            const gasEstimate = await liquidityPool.addLiquidity.estimateGas(smallAmount);
            console.log("Gas estimate:", gasEstimate.toString());

        } catch (error: any) {
            console.error("❌ Static call failed:", error.message);

            // Check if it's a specific error
            if (error.message.includes("MinimumDepositNotMet")) {
                console.log("💡 Issue: Amount is below minimum deposit");
            } else if (error.message.includes("insufficient allowance")) {
                console.log("💡 Issue: Insufficient USDC allowance");
            } else if (error.message.includes("transfer amount exceeds balance")) {
                console.log("💡 Issue: Insufficient USDC balance");
            } else {
                console.log("💡 Issue: Unknown error in contract execution");

                // Let's try to isolate the issue by testing YieldStrategy directly
                console.log("\n🔧 Testing YieldStrategy directly...");
                try {
                    await yieldStrategy.depositPreTransferred.staticCall(smallAmount);
                    console.log("✅ YieldStrategy.depositPreTransferred static call succeeded");
                } catch (yieldError: any) {
                    console.error("❌ YieldStrategy issue:", yieldError.message);
                }
            }
        }

        // Let's also check the LiquidityPool configuration
        console.log("\n🔧 Checking LiquidityPool configuration...");
        const lpStablecoin = await liquidityPool.stablecoin();
        const lpTrustBank = await liquidityPool.trustBank();
        const lpYieldStrategy = await liquidityPool.yieldStrategy();

        console.log("LiquidityPool.stablecoin():", lpStablecoin);
        console.log("LiquidityPool.trustBank():", lpTrustBank);
        console.log("LiquidityPool.yieldStrategy():", lpYieldStrategy);
        console.log("Expected YieldStrategy:", contracts.YieldStrategy);

    } catch (error: any) {
        console.error("❌ Debug failed:", error);
    }

    console.log("\n✅ LiquidityPool debugging completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 