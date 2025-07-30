import { ethers } from "hardhat";

async function main() {
    console.log("🔍 Testing actual function calls that cause high gas fees...");

    const [deployer] = await ethers.getSigners();
    console.log("Testing with account:", deployer.address);

    // Contract addresses
    const contracts = {
        MockUSDC: "0x8beC0937A6668FAA3a844047F1A9BaE0dCe0c759",
        TrustBankCore: "0xEDD7B8c0084B9196F5a30ff89bB40e95638c2894",
        LiquidityPool: "0x1d40b9B4B2801aa00C252e10cE8073103498b773",
    };

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = MockUSDC.attach(contracts.MockUSDC);

    const TrustBankCore = await ethers.getContractFactory("TrustBankCore");
    const trustBankCore = TrustBankCore.attach(contracts.TrustBankCore);

    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    const liquidityPool = LiquidityPool.attach(contracts.LiquidityPool);

    try {
        // Test 1: Check current USDC balance and allowance
        console.log("\n💰 Checking USDC status...");
        const balance = await mockUSDC.balanceOf(deployer.address);
        console.log("USDC Balance:", ethers.formatUnits(balance, 6), "USDC");

        const allowance = await mockUSDC.allowance(deployer.address, contracts.LiquidityPool);
        console.log("USDC Allowance for LiquidityPool:", ethers.formatUnits(allowance, 6), "USDC");

        // Test 2: Try addLiquidity with small amount (simulate what frontend does)
        const depositAmount = ethers.parseUnits("50", 6); // 50 USDC
        console.log("\n🧪 Testing addLiquidity simulation...");
        console.log("Deposit amount:", ethers.formatUnits(depositAmount, 6), "USDC");

        try {
            // First approve if needed
            if (allowance < depositAmount) {
                console.log("⚠️ Need approval first...");
                const approveTx = await mockUSDC.approve(contracts.LiquidityPool, depositAmount);
                await approveTx.wait();
                console.log("✅ Approval completed");
            }

            // Now try addLiquidity
            console.log("Attempting addLiquidity...");
            const gasEstimate = await liquidityPool.addLiquidity.estimateGas(depositAmount);
            console.log("Gas estimate for addLiquidity:", gasEstimate.toString());

            // If gas estimate is reasonable, try the actual call
            if (gasEstimate < 1000000n) { // Less than 1M gas is reasonable
                console.log("Gas estimate looks good, executing transaction...");
                const tx = await liquidityPool.addLiquidity(depositAmount);
                await tx.wait();
                console.log("✅ addLiquidity succeeded!");
            } else {
                console.log("❌ Gas estimate too high, something will revert");
            }

        } catch (error: any) {
            console.error("❌ addLiquidity failed:", error.message);

            // Try to get more specific error
            try {
                await liquidityPool.addLiquidity.staticCall(depositAmount);
            } catch (staticError: any) {
                console.error("Static call error:", staticError.message);
            }
        }

        // Test 3: Try sendPayment
        console.log("\n📤 Testing sendPayment...");
        const paymentAmount = ethers.parseUnits("10", 6); // 10 USDC
        const recipient = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Random address

        try {
            const gasEstimate = await trustBankCore.sendPayment.estimateGas(
                recipient,
                paymentAmount,
                "Test payment"
            );
            console.log("Gas estimate for sendPayment:", gasEstimate.toString());

            if (gasEstimate < 1000000n) {
                console.log("Gas estimate looks good for sendPayment");
            } else {
                console.log("❌ Gas estimate too high for sendPayment");
            }

        } catch (error: any) {
            console.error("❌ sendPayment gas estimation failed:", error.message);

            try {
                await trustBankCore.sendPayment.staticCall(recipient, paymentAmount, "Test payment");
            } catch (staticError: any) {
                console.error("sendPayment static call error:", staticError.message);
            }
        }

    } catch (error: any) {
        console.error("❌ Test failed:", error);
    }

    console.log("\n✅ Function call testing completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 