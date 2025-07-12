import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
    console.log("🔍 Testing Etherlink connection and deploying MockUSDC only...");

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

    // Get gas price
    const gasPrice = await ethers.provider.getFeeData();
    console.log(`⛽ Gas Price: ${gasPrice.gasPrice ? ethers.formatUnits(gasPrice.gasPrice, "gwei") : "unknown"} gwei`);

    if (balance < ethers.parseEther("0.001")) {
        console.log("❌ Insufficient balance for deployment. Need at least 0.001 ETH.");
        return;
    }

    console.log("\n📝 Deploying MockUSDC only...");

    try {
        // Deploy MockUSDC with explicit gas settings
        console.log("1️⃣ Deploying MockUSDC...");
        const MockUSDC = await ethers.getContractFactory("MockUSDC");

        // Estimate gas
        const deploymentData = MockUSDC.interface.encodeDeploy([]);
        const gasEstimate = await ethers.provider.estimateGas({
            data: deploymentData,
        });

        console.log(`📊 Estimated gas: ${gasEstimate.toString()}`);

        const mockUSDC = await MockUSDC.deploy({
            gasLimit: gasEstimate + BigInt(50000), // Add buffer
        });

        console.log("⏳ Waiting for deployment...");
        await mockUSDC.waitForDeployment();

        const usdcAddress = await mockUSDC.getAddress();
        console.log(`✅ MockUSDC deployed to: ${usdcAddress}`);

        // Test the contract
        const name = await mockUSDC.name();
        const symbol = await mockUSDC.symbol();
        console.log(`📝 Token name: ${name}`);
        console.log(`📝 Token symbol: ${symbol}`);

        console.log("\n🎉 Test deployment successful!");
        console.log("\n📋 Contract Addresses:");
        console.log(`MockUSDC: ${usdcAddress}`);

    } catch (error) {
        console.error("❌ Deployment failed:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
