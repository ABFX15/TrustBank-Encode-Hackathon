import { ethers } from "hardhat";
import {
    VouchPayCore,
    CreditEngine,
    ZKCreditImport,
    MockUSDC
} from "../typechain-types";

/**
 * VouchPay Crypto Reputation Demo Script
 * 
 * This script demonstrates the decentralized crypto reputation system:
 * 1. Deploy all contracts
 * 2. Set up users and data providers
 * 3. Demonstrate ZK proof submission for DeFi activities
 * 4. Show enhanced loan terms based on crypto reputation
 * 5. Demonstrate multi-metric reputation building
 */

async function main() {
    console.log("🚀 Starting VouchPay Crypto Reputation Demo...\n");

    // Get signers
    const [deployer, alice, bob, dataProvider] = await ethers.getSigners();
    console.log("👥 Accounts:");
    console.log(`   Deployer: ${deployer.address}`);
    console.log(`   Alice: ${alice.address}`);
    console.log(`   Bob: ${bob.address}`);
    console.log(`   Data Provider: ${dataProvider.address}\n`);

    // 1. Deploy contracts
    console.log("📋 Deploying contracts...");

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    console.log(`   MockUSDC deployed at: ${mockUSDC.target}`);

    // Deploy VouchPayCore
    const VouchPayCore = await ethers.getContractFactory("VouchPayCore");
    const vouchPayCore = await VouchPayCore.deploy(mockUSDC.target);
    console.log(`   VouchPayCore deployed at: ${vouchPayCore.target}`);

    // Deploy CreditEngine
    const CreditEngine = await ethers.getContractFactory("CreditEngine");
    const creditEngine = await CreditEngine.deploy(vouchPayCore.target, mockUSDC.target);
    console.log(`   CreditEngine deployed at: ${creditEngine.target}`);

    // Deploy ZKCreditImport (now crypto reputation)
    const zkVerificationKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const ZKCreditImport = await ethers.getContractFactory("ZKCreditImport");
    const zkCreditImport = await ZKCreditImport.deploy(
        vouchPayCore.target,
        creditEngine.target,
        zkVerificationKey
    );
    console.log(`   ZKCryptoReputation deployed at: ${zkCreditImport.target}\n`);

    // 2. Setup integration
    console.log("🔗 Setting up contract integration...");
    await vouchPayCore.setZKCreditContract(zkCreditImport.target);
    await creditEngine.setZKCreditContract(zkCreditImport.target);
    await zkCreditImport.setTrustedDataProvider(dataProvider.address, true);
    console.log("   Integration complete!\n");

    // 3. Demo: Alice proves her DeFi TVL via ZK proof
    console.log("🔐 Demo: ZK Proof for DeFi TVL");
    console.log("   Alice will prove she has $50k+ locked in DeFi protocols...");

    // Check Alice's initial trust score
    let aliceTrustScore = await vouchPayCore.trustScores(alice.address);
    console.log(`   Alice's initial trust score: ${aliceTrustScore}`);

    // Create mock ZK proof for $50k DeFi TVL
    const tvlProof = {
        proof: [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n] as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
        publicSignals: [BigInt(50000e6), BigInt(Math.floor(Date.now() / 1000))] as [bigint, bigint],
        commitment: ethers.keccak256(ethers.toUtf8Bytes(`alice_tvl_50k_${Date.now()}`))
    };

    // Submit ZK proof for DeFi TVL
    const tx1 = await zkCreditImport.connect(alice).submitReputationProof(
        0, // ReputationMetric.DEFI_TVL
        50000e6, // $50k threshold
        tvlProof,
        "QmTVLProofData123" // IPFS hash for additional proof data
    );
    await tx1.wait();

    // Check updated trust score
    aliceTrustScore = await vouchPayCore.trustScores(alice.address);
    const aliceCryptoBoost = await zkCreditImport.getUserCryptoBoost(alice.address);
    console.log(`   ✅ Alice's new trust score: ${aliceTrustScore}`);
    console.log(`   ✅ Alice's crypto boost: ${aliceCryptoBoost} (from $50k TVL)`);

    // Check enhanced loan terms
    const [maxAmount, interestRate] = await creditEngine.getEnhancedLoanTerms(alice.address);
    const baseInterestRate = await creditEngine.BASE_INTEREST_RATE();
    console.log(`   ✅ Alice's max loan amount: $${ethers.formatUnits(maxAmount, 6)} USDC`);
    console.log(`   ✅ Alice's interest rate: ${ethers.formatUnits(interestRate, 16)}% (vs base ${ethers.formatUnits(baseInterestRate, 16)}%)\n`);

    // 4. Demo: Bob proves lending history via data provider
    console.log("🏦 Demo: Data Provider Verification");
    console.log("   Bob will get verified for his lending history by a trusted data provider...");

    // Check Bob's initial state
    let bobTrustScore = await vouchPayCore.trustScores(bob.address);
    console.log(`   Bob's initial trust score: ${bobTrustScore}`);

    // Create data provider signature for lending history
    const timestamp = Math.floor(Date.now() / 1000);
    const message = ethers.solidityPackedKeccak256(
        ["address", "uint8", "uint256", "uint256"],
        [bob.address, 1, 20, timestamp] // LENDING_HISTORY, 20 successful loans
    );

    const signature = await dataProvider.signMessage(ethers.getBytes(message));

    // Submit data provider verification
    const tx2 = await zkCreditImport.connect(bob).submitDataProviderVerification(
        1, // ReputationMetric.LENDING_HISTORY
        20, // 20 successful loans
        signature,
        timestamp,
        "QmLendingHistoryData456" // IPFS proof
    );
    await tx2.wait();

    // Check Bob's updated state
    bobTrustScore = await vouchPayCore.trustScores(bob.address);
    const bobCryptoBoost = await zkCreditImport.getUserCryptoBoost(bob.address);
    console.log(`   ✅ Bob's new trust score: ${bobTrustScore}`);
    console.log(`   ✅ Bob's crypto boost: ${bobCryptoBoost} (from 20 loan repayments)\n`);

    // 5. Demo: Alice stacks multiple reputation metrics
    console.log("📊 Demo: Multi-Metric Reputation Building");
    console.log("   Alice will add more reputation metrics to maximize her crypto score...");

    // Alice proves never been liquidated (data provider verification)
    const liquidationFreeTimestamp = Math.floor(Date.now() / 1000);
    const liquidationFreeMessage = ethers.solidityPackedKeccak256(
        ["address", "uint8", "uint256", "uint256"],
        [alice.address, 6, 1, liquidationFreeTimestamp] // LIQUIDATION_FREE, value = 1 (true)
    );
    const liquidationFreeSignature = await dataProvider.signMessage(ethers.getBytes(liquidationFreeMessage));

    await zkCreditImport.connect(alice).submitDataProviderVerification(
        6, // ReputationMetric.LIQUIDATION_FREE
        1, // Never liquidated
        liquidationFreeSignature,
        liquidationFreeTimestamp,
        "QmLiquidationFreeProof789"
    );

    // Alice proves cross-chain activity (ZK proof)
    const crossChainProof = {
        proof: [9n, 10n, 11n, 12n, 13n, 14n, 15n, 16n] as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
        publicSignals: [BigInt(7), BigInt(Math.floor(Date.now() / 1000))] as [bigint, bigint],
        commitment: ethers.keccak256(ethers.toUtf8Bytes(`alice_crosschain_7_${Date.now()}`))
    };

    await zkCreditImport.connect(alice).submitReputationProof(
        7, // ReputationMetric.CROSS_CHAIN_ACTIVITY
        7, // 7+ chains
        crossChainProof,
        "QmCrossChainActivityProof"
    );

    // Check Alice's final reputation
    const aliceTotalBoost = await zkCreditImport.getUserCryptoBoost(alice.address);
    const aliceFinalTrustScore = await vouchPayCore.trustScores(alice.address);
    const [aliceMaxAmount, aliceInterestRate] = await creditEngine.getEnhancedLoanTerms(alice.address);

    console.log(`   ✅ Alice's total crypto boost: ${aliceTotalBoost} ($50k TVL: 200 + Never liquidated: 150 + 7+ chains: 250)`);
    console.log(`   ✅ Alice's final trust score: ${aliceFinalTrustScore}`);
    console.log(`   ✅ Alice's enhanced max loan: $${ethers.formatUnits(aliceMaxAmount, 6)} USDC`);
    console.log(`   ✅ Alice's enhanced interest rate: ${ethers.formatUnits(aliceInterestRate, 16)}%\n`);

    // 6. Demo: Reputation verification history
    console.log("📜 Demo: Crypto Reputation History");

    const aliceVerifications = await zkCreditImport.getUserVerifications(alice.address);
    const bobVerifications = await zkCreditImport.getUserVerifications(bob.address);

    console.log(`   Alice's verifications (${aliceVerifications.length}):`);
    const metricNames = [
        "DEFI_TVL", "LENDING_HISTORY", "TRADING_VOLUME", "STAKING_DURATION",
        "WALLET_AGE", "GOVERNANCE_PARTICIPATION", "LIQUIDATION_FREE", "CROSS_CHAIN_ACTIVITY"
    ];
    for (let i = 0; i < aliceVerifications.length; i++) {
        const verification = aliceVerifications[i];
        console.log(`     ${i + 1}. ${metricNames[Number(verification.metric)]} - Threshold: ${verification.threshold} - Boost: ${verification.trustBoost} - IPFS: ${verification.ipfsProof}`);
    }

    console.log(`   Bob's verifications (${bobVerifications.length}):`);
    for (let i = 0; i < bobVerifications.length; i++) {
        const verification = bobVerifications[i];
        console.log(`     ${i + 1}. ${metricNames[Number(verification.metric)]} - Threshold: ${verification.threshold} - Boost: ${verification.trustBoost} - IPFS: ${verification.ipfsProof}`);
    }

    console.log("\n🎉 VouchPay Crypto Reputation Demo Complete!");
    console.log("\n📋 Summary:");
    console.log("✅ Users build decentralized crypto reputation through verified DeFi activities");
    console.log("✅ ZK-proofs preserve privacy while proving on-chain achievements");
    console.log("✅ Data providers offer alternative verification paths");
    console.log("✅ Multiple reputation metrics can be stacked for maximum benefit");
    console.log("✅ Enhanced loan terms based on proven crypto expertise");
    console.log("✅ Full audit trail with IPFS integration for proof storage");

    console.log("\n🏆 Key Innovation Points:");
    console.log("🔐 Privacy-preserving verification of on-chain DeFi activities");
    console.log("🏗️ Fully decentralized reputation system (no traditional credit agencies)");
    console.log("⚡ Real-time trust score updates based on crypto expertise");
    console.log("🌐 Multi-chain reputation aggregation");
    console.log("🛡️ Anti-fraud protection with commitment tracking");
    console.log("📊 Comprehensive DeFi activity metrics");

    return {
        contracts: {
            mockUSDC: mockUSDC.target,
            vouchPayCore: vouchPayCore.target,
            creditEngine: creditEngine.target,
            zkCreditImport: zkCreditImport.target,
        },
        demoResults: {
            alice: {
                trustScore: aliceFinalTrustScore.toString(),
                cryptoBoost: aliceTotalBoost.toString(),
                maxLoan: ethers.formatUnits(aliceMaxAmount, 6),
                interestRate: ethers.formatUnits(aliceInterestRate, 16),
                verifications: aliceVerifications.length,
            },
            bob: {
                trustScore: bobTrustScore.toString(),
                cryptoBoost: bobCryptoBoost.toString(),
                verifications: bobVerifications.length,
            },
        },
    };
}

// Run the demo
if (require.main === module) {
    main()
        .then((result) => {
            console.log("\n📊 Demo Results:", JSON.stringify(result.demoResults, null, 2));
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ Demo failed:", error);
            process.exit(1);
        });
}

export default main;
