import { ethers } from "hardhat";
import {
    VouchPayCore,
    CreditEngine,
    ZKCreditImport,
    MockUSDC
} from "../typechain-types";

/**
 * VouchPay Crypto Mortgage Demo Script
 * 
 * This script demonstrates how users can buy houses using their crypto reputation:
 * 1. Deploy all contracts
 * 2. Set up users with different crypto reputations
 * 3. Show mortgage qualification process
 * 4. Demonstrate actual mortgage application
 * 5. Compare rates based on crypto reputation
 * 
 * Constants used match those defined in ZKCreditImport contract
 */

// Constants from ZKCreditImport contract
const TVL_TIER_3_THRESHOLD = ethers.parseUnits("100000", 6); // $100k
const TVL_TIER_2_THRESHOLD = ethers.parseUnits("50000", 6);  // $50k
const LENDING_TIER_3_THRESHOLD = 50; // 50 successful loans
const TVL_TIER_3_BOOST = 400;
const TVL_TIER_2_BOOST = 200;
const LENDING_TIER_3_BOOST = 300;

async function main() {
    console.log("🏠 Starting VouchPay Crypto Mortgage Demo...\n");

    // Get signers
    const [deployer, alice, bob, carol, realEstateLender] = await ethers.getSigners();
    console.log("👥 Accounts:");
    console.log(`   Deployer: ${deployer.address}`);
    console.log(`   Alice (DeFi Expert): ${alice.address}`);
    console.log(`   Bob (Moderate User): ${bob.address}`);
    console.log(`   Carol (New User): ${carol.address}`);
    console.log(`   Real Estate Lender: ${realEstateLender.address}\n`);

    // 1. Deploy contracts
    console.log("📋 Deploying contracts...");

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();

    const VouchPayCore = await ethers.getContractFactory("VouchPayCore");
    const vouchPayCore = await VouchPayCore.deploy(mockUSDC.target);

    const CreditEngine = await ethers.getContractFactory("CreditEngine");
    const creditEngine = await CreditEngine.deploy(vouchPayCore.target, mockUSDC.target);

    const zkVerificationKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const ZKCreditImport = await ethers.getContractFactory("ZKCreditImport");
    const zkCreditImport = await ZKCreditImport.deploy(
        vouchPayCore.target,
        creditEngine.target,
        zkVerificationKey
    );

    console.log(`   All contracts deployed successfully!\n`);

    // 2. Setup integration
    console.log("🔗 Setting up integration...");
    await vouchPayCore.setZKCreditContract(zkCreditImport.target);
    await creditEngine.setZKCreditContract(zkCreditImport.target);
    await vouchPayCore.addRealEstateLender(realEstateLender.address);
    console.log("   Integration complete!\n");

    // 3. Build different crypto reputations
    console.log("🏗️ Building Crypto Reputations...");

    // Alice: DeFi Expert with exceptional reputation
    console.log("   Setting up Alice as DeFi Expert...");

    // Alice has high DeFi TVL
    const aliceTVLProof = {
        proof: [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n] as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
        publicSignals: [BigInt(100000e6), BigInt(Math.floor(Date.now() / 1000))] as [bigint, bigint],
        commitment: ethers.keccak256(ethers.toUtf8Bytes(`alice_tvl_100k_${Date.now()}`))
    };

    await zkCreditImport.connect(alice).submitReputationProof(
        0, // DEFI_TVL
        100000e6, // $100k
        aliceTVLProof,
        "QmAliceTVLProof"
    );

    // Alice has extensive lending history
    const aliceLendingProof = {
        proof: [9n, 10n, 11n, 12n, 13n, 14n, 15n, 16n] as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
        publicSignals: [BigInt(50), BigInt(Math.floor(Date.now() / 1000))] as [bigint, bigint],
        commitment: ethers.keccak256(ethers.toUtf8Bytes(`alice_lending_50_${Date.now()}`))
    };

    await zkCreditImport.connect(alice).submitReputationProof(
        1, // LENDING_HISTORY
        50, // 50 successful loans
        aliceLendingProof,
        "QmAliceLendingProof"
    );

    // Alice has stable income history (24 months)
    const aliceIncomeProof = {
        proof: [17n, 18n, 19n, 20n, 21n, 22n, 23n, 24n] as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
        publicSignals: [BigInt(24), BigInt(Math.floor(Date.now() / 1000))] as [bigint, bigint],
        commitment: ethers.keccak256(ethers.toUtf8Bytes(`alice_income_24m_${Date.now()}`))
    };

    await zkCreditImport.connect(alice).submitReputationProof(
        10, // STABLE_INCOME_HISTORY
        24, // 24 months
        aliceIncomeProof,
        "QmAliceIncomeProof"
    );

    const aliceCryptoBoost = await zkCreditImport.getUserCryptoBoost(alice.address);
    console.log(`   ✅ Alice's crypto reputation boost: ${aliceCryptoBoost} (TVL: 400 + Lending: 300 + Income: 300)`);

    // Bob: Moderate DeFi user
    console.log("   Setting up Bob as moderate DeFi user...");

    const bobTVLProof = {
        proof: [25n, 26n, 27n, 28n, 29n, 30n, 31n, 32n] as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
        publicSignals: [BigInt(50000e6), BigInt(Math.floor(Date.now() / 1000))] as [bigint, bigint],
        commitment: ethers.keccak256(ethers.toUtf8Bytes(`bob_tvl_50k_${Date.now()}`))
    };

    await zkCreditImport.connect(bob).submitReputationProof(
        0, // DEFI_TVL
        50000e6, // $50k
        bobTVLProof,
        "QmBobTVLProof"
    );

    const bobCryptoBoost = await zkCreditImport.getUserCryptoBoost(bob.address);
    console.log(`   ✅ Bob's crypto reputation boost: ${bobCryptoBoost} (TVL: 200)`);

    // Carol: New user with minimal reputation
    const carolCryptoBoost = await zkCreditImport.getUserCryptoBoost(carol.address);
    console.log(`   ✅ Carol's crypto reputation boost: ${carolCryptoBoost} (new user)\n`);

    // 4. Demonstrate mortgage qualification
    console.log("🏡 Mortgage Qualification Analysis...");

    const propertyValue = ethers.parseUnits("500000", 6); // $500k house
    const downPayment = ethers.parseUnits("100000", 6);  // $100k down (20%)
    const monthlyIncome = ethers.parseUnits("10000", 6);  // $10k/month income

    // Check Alice's qualification
    const [aliceQualified, aliceMaxLoan, aliceRate] = await vouchPayCore.getMortgageQualification(
        alice.address,
        propertyValue,
        downPayment,
        monthlyIncome
    );

    console.log(`   Alice (DeFi Expert):`);
    console.log(`     ✅ Qualified: ${aliceQualified}`);
    console.log(`     ✅ Max Loan: $${ethers.formatUnits(aliceMaxLoan, 6)}`);
    console.log(`     ✅ Interest Rate: ${Number(aliceRate) / 100}%`);

    // Check Bob's qualification
    const [bobQualified, bobMaxLoan, bobRate] = await vouchPayCore.getMortgageQualification(
        bob.address,
        propertyValue,
        downPayment,
        monthlyIncome
    );

    console.log(`   Bob (Moderate User):`);
    console.log(`     ✅ Qualified: ${bobQualified}`);
    console.log(`     ✅ Max Loan: $${ethers.formatUnits(bobMaxLoan, 6)}`);
    console.log(`     ✅ Interest Rate: ${Number(bobRate) / 100}%`);

    // Check Carol's qualification
    const [carolQualified, carolMaxLoan, carolRate] = await vouchPayCore.getMortgageQualification(
        carol.address,
        propertyValue,
        downPayment,
        monthlyIncome
    );

    console.log(`   Carol (New User):`);
    console.log(`     ❌ Qualified: ${carolQualified}`);
    console.log(`     ❌ Max Loan: $${ethers.formatUnits(carolMaxLoan, 6)}`);
    console.log(`     ❌ Interest Rate: ${Number(carolRate) / 100}%\n`);

    // 5. Submit actual mortgage applications
    console.log("📝 Submitting Mortgage Applications...");

    // Alice applies for mortgage
    console.log("   Alice applying for $500k house...");
    const aliceApproved = await vouchPayCore.connect(alice).applyForCryptoMortgage(
        propertyValue,
        downPayment,
        monthlyIncome,
        "123 DeFi Street, Crypto Valley, CV 12345"
    );

    // Check if auto-approved
    const aliceApplications = await vouchPayCore.getUserRealEstateApplications(alice.address);
    const latestAliceApp = aliceApplications[aliceApplications.length - 1];

    console.log(`     ✅ Application submitted: ${latestAliceApp.loanAmount} USDC loan`);
    console.log(`     ✅ Auto-approved: ${latestAliceApp.approved}`);
    console.log(`     ✅ Interest rate: ${Number(latestAliceApp.interestRate) / 100}%`);
    console.log(`     ✅ Property: ${latestAliceApp.propertyAddress}`);

    // Bob applies for mortgage
    console.log("   Bob applying for $500k house...");
    await vouchPayCore.connect(bob).applyForCryptoMortgage(
        propertyValue,
        downPayment,
        monthlyIncome,
        "456 Blockchain Blvd, Web3 City, WC 67890"
    );

    const bobApplications = await vouchPayCore.getUserRealEstateApplications(bob.address);
    const latestBobApp = bobApplications[bobApplications.length - 1];

    console.log(`     ✅ Application submitted: ${latestBobApp.loanAmount} USDC loan`);
    console.log(`     🔍 Auto-approved: ${latestBobApp.approved} (requires manual review)`);
    console.log(`     ✅ Interest rate: ${Number(latestBobApp.interestRate) / 100}%`);

    console.log("\n🎉 VouchPay Crypto Mortgage Demo Complete!");
    console.log("\n📋 Summary:");
    console.log("✅ Users can buy houses using their crypto reputation as credit score");
    console.log("✅ Interest rates based on DeFi track record (3-8% range)");
    console.log("✅ Auto-approval for exceptional DeFi users");
    console.log("✅ No traditional credit checks required");
    console.log("✅ Fully on-chain mortgage qualification");
    console.log("✅ Real estate specific reputation metrics");

    console.log("\n🏆 Revolutionary Benefits:");
    console.log("🏠 First crypto-native mortgage system");
    console.log("⚡ Instant qualification based on on-chain reputation");
    console.log("🔐 Privacy-preserving income and asset verification");
    console.log("🌍 Global access - no geographic restrictions");
    console.log("💰 Lower rates for proven DeFi expertise");
    console.log("📊 Transparent, algorithmic underwriting");

    console.log("\n💡 Real Estate Innovation:");
    console.log("🏘️ Enables crypto-native home buying");
    console.log("🚀 Bridges DeFi expertise to real world assets");
    console.log("⏰ Reduces mortgage approval time from weeks to minutes");
    console.log("🔄 Creates positive feedback loop: DeFi skills → better rates");
    console.log("🌐 Opens global real estate markets to crypto users");

    return {
        contracts: {
            vouchPayCore: vouchPayCore.target,
            zkCreditImport: zkCreditImport.target,
        },
        results: {
            alice: {
                cryptoBoost: aliceCryptoBoost.toString(),
                qualified: aliceQualified,
                interestRate: `${Number(aliceRate) / 100}%`,
                autoApproved: latestAliceApp.approved,
            },
            bob: {
                cryptoBoost: bobCryptoBoost.toString(),
                qualified: bobQualified,
                interestRate: `${Number(bobRate) / 100}%`,
                autoApproved: latestBobApp.approved,
            },
            carol: {
                cryptoBoost: carolCryptoBoost.toString(),
                qualified: carolQualified,
            },
        },
    };
}

// Run the demo
if (require.main === module) {
    main()
        .then((result) => {
            console.log("\n📊 Demo Results:", JSON.stringify(result.results, null, 2));
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ Demo failed:", error);
            process.exit(1);
        });
}

export default main;
