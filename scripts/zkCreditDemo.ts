import { ethers } from "hardhat";
import {
    VouchPayCore,
    CreditEngine,
    ZKCreditImport,
    MockUSDC
} from "../typechain-types";

/**
 * VouchPay ZK Credit Demo Script
 * 
 * This script demonstrates the complete ZK credit import feature:
 * 1. Deploy all contracts
 * 2. Set up users and oracle
 * 3. Demonstrate ZK proof submission
 * 4. Show enhanced loan terms
 * 5. Demonstrate oracle-based verification
 */

async function main() {
    console.log("🚀 Starting VouchPay ZK Credit Demo...\n");

    // Get signers
    const [deployer, alice, bob, oracle] = await ethers.getSigners();
    console.log("👥 Accounts:");
    console.log(`   Deployer: ${deployer.address}`);
    console.log(`   Alice: ${alice.address}`);
    console.log(`   Bob: ${bob.address}`);
    console.log(`   Oracle: ${oracle.address}\n`);

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

    // Deploy ZKCreditImport
    const zkVerificationKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const ZKCreditImport = await ethers.getContractFactory("ZKCreditImport");
    const zkCreditImport = await ZKCreditImport.deploy(
        vouchPayCore.target,
        creditEngine.target,
        zkVerificationKey
    );
    console.log(`   ZKCreditImport deployed at: ${zkCreditImport.target}\n`);

    // 2. Setup integration
    console.log("🔗 Setting up contract integration...");
    await vouchPayCore.setZKCreditContract(zkCreditImport.target);
    await creditEngine.setZKCreditContract(zkCreditImport.target);
    await zkCreditImport.setTrustedOracle(oracle.address, true);
    console.log("   Integration complete!\n");

    // 3. Demo ZK Proof Submission
    console.log("🔐 Demo: ZK Credit Proof Submission");
    console.log("   Alice will submit a ZK proof for FICO 740 credit score...");

    // Check Alice's initial trust score
    let aliceTrustScore = await vouchPayCore.trustScores(alice.address);
    console.log(`   Alice's initial trust score: ${aliceTrustScore}`);

    // Create mock ZK proof for FICO 740
    const zkProof = {
        proof: [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n] as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
        publicSignals: [BigInt(740), BigInt(Math.floor(Date.now() / 1000))] as [bigint, bigint],
        commitment: ethers.keccak256(ethers.toUtf8Bytes(`alice_fico_740_${Date.now()}`))
    };

    // Submit ZK proof
    const tx1 = await zkCreditImport.connect(alice).submitCreditProof(
        1, // CreditBureau.FICO
        740, // threshold
        zkProof
    );
    await tx1.wait();

    // Check updated trust score
    aliceTrustScore = await vouchPayCore.trustScores(alice.address);
    const aliceCreditBoost = await zkCreditImport.getUserCreditBoost(alice.address);
    console.log(`   ✅ Alice's new trust score: ${aliceTrustScore}`);
    console.log(`   ✅ Alice's credit boost: ${aliceCreditBoost}`);

    // Check enhanced loan terms
    const [maxAmount, interestRate] = await creditEngine.getEnhancedLoanTerms(alice.address);
    const baseInterestRate = await creditEngine.BASE_INTEREST_RATE();
    console.log(`   ✅ Alice's max loan amount: $${ethers.formatUnits(maxAmount, 6)} USDC`);
    console.log(`   ✅ Alice's interest rate: ${ethers.formatUnits(interestRate, 16)}% (vs base ${ethers.formatUnits(baseInterestRate, 16)}%)\n`);

    // 4. Demo Oracle Verification
    console.log("🏦 Demo: Oracle-Based Credit Verification");
    console.log("   Bob will get verified through a trusted oracle (Plaid bank connection)...");

    // Check Bob's initial state
    let bobTrustScore = await vouchPayCore.trustScores(bob.address);
    console.log(`   Bob's initial trust score: ${bobTrustScore}`);

    // Create oracle signature for Plaid verification
    const timestamp = Math.floor(Date.now() / 1000);
    const message = ethers.solidityPackedKeccak256(
        ["address", "uint8", "uint256", "uint256"],
        [bob.address, 4, 1, timestamp] // PLAID_VERIFIED, threshold 1
    );

    const signature = await oracle.signMessage(ethers.getBytes(message));

    // Submit oracle verification
    const tx2 = await zkCreditImport.connect(bob).submitOracleVerification(
        4, // CreditBureau.PLAID_VERIFIED
        1, // threshold
        signature,
        timestamp
    );
    await tx2.wait();

    // Check Bob's updated state
    bobTrustScore = await vouchPayCore.trustScores(bob.address);
    const bobCreditBoost = await zkCreditImport.getUserCreditBoost(bob.address);
    console.log(`   ✅ Bob's new trust score: ${bobTrustScore}`);
    console.log(`   ✅ Bob's credit boost: ${bobCreditBoost}\n`);

    // 5. Demo Multiple Verifications
    console.log("📊 Demo: Multiple Credit Verifications");
    console.log("   Alice will add a Plaid verification to stack with her FICO score...");

    // Create oracle signature for Alice's Plaid verification
    const alicePlaidTimestamp = Math.floor(Date.now() / 1000);
    const alicePlaidMessage = ethers.solidityPackedKeccak256(
        ["address", "uint8", "uint256", "uint256"],
        [alice.address, 4, 1, alicePlaidTimestamp]
    );

    const alicePlaidSignature = await oracle.signMessage(ethers.getBytes(alicePlaidMessage));

    // Submit Alice's additional verification
    const tx3 = await zkCreditImport.connect(alice).submitOracleVerification(
        4, // CreditBureau.PLAID_VERIFIED
        1,
        alicePlaidSignature,
        alicePlaidTimestamp
    );
    await tx3.wait();

    // Check Alice's stacked benefits
    const aliceTotalBoost = await zkCreditImport.getUserCreditBoost(alice.address);
    const aliceFinalTrustScore = await vouchPayCore.trustScores(alice.address);
    const [aliceMaxAmount, aliceInterestRate] = await creditEngine.getEnhancedLoanTerms(alice.address);

    console.log(`   ✅ Alice's total credit boost: ${aliceTotalBoost} (FICO 740: 200 + Plaid: 75)`);
    console.log(`   ✅ Alice's final trust score: ${aliceFinalTrustScore}`);
    console.log(`   ✅ Alice's enhanced max loan: $${ethers.formatUnits(aliceMaxAmount, 6)} USDC`);
    console.log(`   ✅ Alice's enhanced interest rate: ${ethers.formatUnits(aliceInterestRate, 16)}%\n`);

    // 6. Demo Credit Verification History
    console.log("📜 Demo: Credit Verification History");

    const aliceVerifications = await zkCreditImport.getUserVerifications(alice.address);
    const bobVerifications = await zkCreditImport.getUserVerifications(bob.address);

    console.log(`   Alice's verifications (${aliceVerifications.length}):`);
    for (let i = 0; i < aliceVerifications.length; i++) {
        const verification = aliceVerifications[i];
        const bureauNames = ["FICO", "EXPERIAN", "EQUIFAX", "TRANSUNION", "PLAID_VERIFIED"];
        console.log(`     ${i + 1}. ${bureauNames[Number(verification.bureau)]} - Threshold: ${verification.threshold} - Boost: ${verification.trustBoost}`);
    }

    console.log(`   Bob's verifications (${bobVerifications.length}):`);
    for (let i = 0; i < bobVerifications.length; i++) {
        const verification = bobVerifications[i];
        const bureauNames = ["FICO", "EXPERIAN", "EQUIFAX", "TRANSUNION", "PLAID_VERIFIED"];
        console.log(`     ${i + 1}. ${bureauNames[Number(verification.bureau)]} - Threshold: ${verification.threshold} - Boost: ${verification.trustBoost}`);
    }

    console.log("\n🎉 VouchPay ZK Credit Demo Complete!");
    console.log("\n📋 Summary:");
    console.log("✅ Users can submit ZK proofs to verify credit scores privately");
    console.log("✅ Oracle-based verification provides alternative verification path");
    console.log("✅ Credit verification provides significant trust score boosts");
    console.log("✅ Enhanced loan terms available based on verified credit");
    console.log("✅ Multiple verifications can be stacked for maximum benefit");
    console.log("✅ Full audit trail of verifications maintained on-chain");

    console.log("\n🏆 Key Innovation Points:");
    console.log("🔐 Privacy-preserving credit verification via ZK-proofs");
    console.log("🏦 Integration with traditional credit systems");
    console.log("⚡ Real-time trust score updates and loan term adjustments");
    console.log("🔗 Seamless integration with existing DeFi protocols");
    console.log("🛡️ Anti-fraud protection with commitment tracking");

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
                creditBoost: aliceTotalBoost.toString(),
                maxLoan: ethers.formatUnits(aliceMaxAmount, 6),
                interestRate: ethers.formatUnits(aliceInterestRate, 16),
                verifications: aliceVerifications.length,
            },
            bob: {
                trustScore: bobTrustScore.toString(),
                creditBoost: bobCreditBoost.toString(),
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
