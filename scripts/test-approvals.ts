import { ethers } from "hardhat";

async function main() {
    console.log("🔍 Testing and fixing approval issues...");

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
        // Check current allowances
        console.log("\n💰 Checking current allowances...");
        const balance = await mockUSDC.balanceOf(deployer.address);
        console.log("USDC Balance:", ethers.formatUnits(balance, 6), "USDC");

        const allowanceLP = await mockUSDC.allowance(deployer.address, contracts.LiquidityPool);
        console.log("USDC Allowance for LiquidityPool:", ethers.formatUnits(allowanceLP, 6), "USDC");

        const allowanceTB = await mockUSDC.allowance(deployer.address, contracts.TrustBankCore);
        console.log("USDC Allowance for TrustBankCore:", ethers.formatUnits(allowanceTB, 6), "USDC");

        // Fix approvals
        const approveAmount = ethers.parseUnits("1000", 6); // 1000 USDC

        console.log("\n🔧 Setting proper approvals...");

        if (allowanceLP < approveAmount) {
            console.log("Approving LiquidityPool...");
            const tx1 = await mockUSDC.approve(contracts.LiquidityPool, approveAmount);
            await tx1.wait();
            console.log("✅ LiquidityPool approved");
        }

        if (allowanceTB < approveAmount) {
            console.log("Approving TrustBankCore...");
            const tx2 = await mockUSDC.approve(contracts.TrustBankCore, approveAmount);
            await tx2.wait();
            console.log("✅ TrustBankCore approved");
        }

        // Test addLiquidity
        console.log("\n🧪 Testing addLiquidity with proper approval...");
        const depositAmount = ethers.parseUnits("50", 6);

        try {
            const gasEstimate = await liquidityPool.addLiquidity.estimateGas(depositAmount);
            console.log("Gas estimate for addLiquidity:", gasEstimate.toString());

            if (gasEstimate < 1000000n) {
                console.log("✅ addLiquidity gas estimate looks good!");

                // Actually execute it
                console.log("Executing addLiquidity...");
                const tx = await liquidityPool.addLiquidity(depositAmount);
                await tx.wait();
                console.log("✅ addLiquidity succeeded!");
            }
        } catch (error: any) {
            console.error("❌ addLiquidity still failed:", error.message);
        }

        // Test sendPayment  
        console.log("\n📤 Testing sendPayment with proper approval...");
        const paymentAmount = ethers.parseUnits("10", 6);
        const recipient = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

        try {
            const gasEstimate = await trustBankCore.sendPayment.estimateGas(
                recipient,
                paymentAmount,
                "Test payment with approval"
            );
            console.log("Gas estimate for sendPayment:", gasEstimate.toString());

            if (gasEstimate < 1000000n) {
                console.log("✅ sendPayment gas estimate looks good!");

                // Actually execute it
                console.log("Executing sendPayment...");
                const tx = await trustBankCore.sendPayment(recipient, paymentAmount, "Test payment");
                await tx.wait();
                console.log("✅ sendPayment succeeded!");
            }
        } catch (error: any) {
            console.error("❌ sendPayment still failed:", error.message);
        }

    } catch (error: any) {
        console.error("❌ Test failed:", error);
    }

    console.log("\n✅ Approval testing completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 