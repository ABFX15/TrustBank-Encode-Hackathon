import { ethers } from "hardhat";

async function main() {
    console.log("🔧 Setting up YieldStrategy with dummy strategies...");

    const [deployer] = await ethers.getSigners();
    console.log("Setting up with account:", deployer.address);

    // Contract addresses
    const contracts = {
        YieldStrategy: "0xdd99dE366D7F3Bab80e8f5aD1fCdBF82621b0c10",
    };

    const YieldStrategy = await ethers.getContractFactory("YieldStrategy");
    const yieldStrategy = YieldStrategy.attach(contracts.YieldStrategy);

    try {
        // Check current state
        console.log("\n📊 Checking current YieldStrategy state...");
        const totalAllocation = await yieldStrategy.totalAllocation();
        console.log("Current totalAllocation:", totalAllocation.toString());

        const maxAllocation = await yieldStrategy.MAX_ALLOCATION();
        console.log("MAX_ALLOCATION:", maxAllocation.toString());

        if (totalAllocation === 0n) {
            console.log("\n🔧 Adding dummy yield strategies...");

            // Add a simple "mock" strategy - just using the YieldStrategy contract itself as a dummy protocol
            // In a real deployment, these would be actual DeFi protocols like Aave, Compound, etc.

            // Strategy 1: "Mock Aave" - 60% allocation
            console.log("Adding Strategy 1: Mock Aave (60%)...");
            const tx1 = await yieldStrategy.addStrategy(
                "Mock Aave USDC",
                deployer.address, // Using deployer as dummy protocol address
                6000 // 60% allocation (out of 10000 = 100%)
            );
            await tx1.wait();
            console.log("✅ Strategy 1 added");

            // Strategy 2: "Mock Compound" - 40% allocation  
            console.log("Adding Strategy 2: Mock Compound (40%)...");
            const tx2 = await yieldStrategy.addStrategy(
                "Mock Compound USDC",
                contracts.YieldStrategy, // Using YieldStrategy itself as dummy
                4000 // 40% allocation
            );
            await tx2.wait();
            console.log("✅ Strategy 2 added");

            // Check final state
            const finalAllocation = await yieldStrategy.totalAllocation();
            console.log("\n📊 Final totalAllocation:", finalAllocation.toString());
            console.log("✅ YieldStrategy is now configured with strategies!");

        } else {
            console.log("✅ YieldStrategy already has strategies configured");
        }

        // Test that depositPreTransferred now works
        console.log("\n🧪 Testing depositPreTransferred after setup...");
        const testAmount = ethers.parseUnits("10", 6);

        try {
            await yieldStrategy.depositPreTransferred.staticCall(testAmount);
            console.log("✅ depositPreTransferred static call now succeeds!");
        } catch (error: any) {
            console.error("❌ depositPreTransferred still fails:", error.message);
        }

    } catch (error: any) {
        console.error("❌ Setup failed:", error);
    }

    console.log("\n✅ YieldStrategy setup completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 