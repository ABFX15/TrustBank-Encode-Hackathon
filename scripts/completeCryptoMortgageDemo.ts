import { ethers } from "hardhat";

/**
 * Complete VouchPay Crypto Mortgage Demo
 * 
 * This demonstrates the revolutionary crypto mortgage system:
 * 1. Deploy modular contracts (VouchPay, ZKCredit, CryptoMortgage)
 * 2. Build crypto reputation through DeFi activities
 * 3. Apply for mortgages using decentralized credit scores
 * 4. Compare rates and terms based on crypto expertise
 * 5. Fund and manage crypto mortgages
 */

// Constants matching ZKCreditImport contract thresholds
const TVL_TIER_3_THRESHOLD = ethers.parseUnits("100000", 6); // $100k
const TVL_TIER_2_THRESHOLD = ethers.parseUnits("50000", 6);  // $50k
const LENDING_TIER_3_THRESHOLD = 50; // 50 successful loans
const LENDING_TIER_2_THRESHOLD = 20; // 20 successful loans
const WALLET_AGE_TIER_2_THRESHOLD = 730; // 2 years

// Demo constants
const MORTGAGE_POOL_AMOUNT = ethers.parseUnits("2000000", 6); // $2M pool
const ALICE_HOUSE_VALUE = ethers.parseUnits("800000", 6); // $800k house
const BOB_HOUSE_VALUE = ethers.parseUnits("400000", 6); // $400k house

async function main() {
    console.log("🏠 Starting Complete VouchPay Crypto Mortgage Demo...\n");

    // Get signers
    const [deployer, alice, bob, mortgageLender, dataProvider] = await ethers.getSigners();
    console.log("👥 Demo Participants:");
    console.log(`   Deployer: ${deployer.address}`);
    console.log(`   Alice (DeFi Whale): ${alice.address}`);
    console.log(`   Bob (DeFi User): ${bob.address}`);
    console.log(`   Mortgage Lender: ${mortgageLender.address}`);
    console.log(`   Data Provider: ${dataProvider.address}\n`);

    // 1. Deploy all contracts
    console.log("📋 Deploying VouchPay Ecosystem...");

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    console.log(`   MockUSDC: ${mockUSDC.target}`);

    const VouchPayCore = await ethers.getContractFactory("VouchPayCore");
    const vouchPayCore = await VouchPayCore.deploy(mockUSDC.target);
    console.log(`   VouchPayCore: ${vouchPayCore.target}`);

    const CreditEngine = await ethers.getContractFactory("CreditEngine");
    const creditEngine = await CreditEngine.deploy(vouchPayCore.target, mockUSDC.target);
    console.log(`   CreditEngine: ${creditEngine.target}`);

    const zkVerificationKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const ZKCreditImport = await ethers.getContractFactory("ZKCreditImport");
    const zkCreditImport = await ZKCreditImport.deploy(
        vouchPayCore.target,
        creditEngine.target,
        zkVerificationKey
    );
    console.log(`   ZKCreditImport: ${zkCreditImport.target}`);

    const CryptoMortgage = await ethers.getContractFactory("CryptoMortgage");
    const cryptoMortgage = await CryptoMortgage.deploy(
        mockUSDC.target,
        vouchPayCore.target,
        zkCreditImport.target
    );
    console.log(`   CryptoMortgage: ${cryptoMortgage.target}\n`);

    // 2. Setup ecosystem
    console.log("🔗 Setting up ecosystem integration...");
    await vouchPayCore.setZKCreditContract(zkCreditImport.target);
    await creditEngine.setZKCreditContract(zkCreditImport.target);
    await zkCreditImport.setTrustedDataProvider(dataProvider.address, true);
    await cryptoMortgage.addApprovedLender(mortgageLender.address);

    // Fund mortgage pool
    await mockUSDC.mint(mortgageLender.address, 10000000e6); // $10M
    await mockUSDC.connect(mortgageLender).approve(cryptoMortgage.target, 10000000e6);
    await cryptoMortgage.connect(mortgageLender).addToMortgagePool(5000000e6); // $5M
    console.log("   ✅ Mortgage pool funded with $5M\n");

    // 3. Build Alice's exceptional crypto reputation
    console.log("🔐 Building Alice's Elite Crypto Reputation...");

    // Alice has $100k DeFi TVL
    const aliceTVLProof = {
        proof: [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n] as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
        publicSignals: [BigInt(100000e6), BigInt(Math.floor(Date.now() / 1000))] as [bigint, bigint],
        commitment: ethers.keccak256(ethers.toUtf8Bytes(`alice_tvl_100k_${Date.now()}`))
    };

    await zkCreditImport.connect(alice).submitReputationProof(
        0, // DEFI_TVL
        100000e6,
        aliceTVLProof,
        "QmAliceTVL100k"
    );

    // Alice has 50 successful loans
    const aliceLendingTs = Math.floor(Date.now() / 1000);
    const aliceLendingMsg = ethers.solidityPackedKeccak256(
        ["address", "uint8", "uint256", "uint256"],
        [alice.address, 1, 50, aliceLendingTs]
    );
    const aliceLendingSig = await dataProvider.signMessage(ethers.getBytes(aliceLendingMsg));
    await zkCreditImport.connect(alice).submitDataProviderVerification(
        1, // LENDING_HISTORY
        50,
        aliceLendingSig,
        aliceLendingTs,
        "QmAliceLending50"
    );

    // Alice never liquidated
    const aliceNoLiqTs = Math.floor(Date.now() / 1000);
    const aliceNoLiqMsg = ethers.solidityPackedKeccak256(
        ["address", "uint8", "uint256", "uint256"],
        [alice.address, 6, 1, aliceNoLiqTs]
    );
    const aliceNoLiqSig = await dataProvider.signMessage(ethers.getBytes(aliceNoLiqMsg));
    await zkCreditImport.connect(alice).submitDataProviderVerification(
        6, // LIQUIDATION_FREE
        1,
        aliceNoLiqSig,
        aliceNoLiqTs,
        "QmAliceNoLiq"
    );

    const aliceCryptoScore = await zkCreditImport.getUserCryptoBoost(alice.address);
    console.log(`   ✅ Alice's crypto reputation: ${aliceCryptoScore} points`);
    console.log(`      • $100k DeFi TVL: 400 pts`);
    console.log(`      • 50 successful loans: 300 pts`);
    console.log(`      • Never liquidated: 150 pts\n`);

    // 4. Build Bob's moderate reputation
    console.log("💼 Building Bob's Solid Crypto Reputation...");

    // Bob has $10k DeFi TVL
    const bobTVLProof = {
        proof: [9n, 10n, 11n, 12n, 13n, 14n, 15n, 16n] as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
        publicSignals: [BigInt(10000e6), BigInt(Math.floor(Date.now() / 1000))] as [bigint, bigint],
        commitment: ethers.keccak256(ethers.toUtf8Bytes(`bob_tvl_10k_${Date.now()}`))
    };

    await zkCreditImport.connect(bob).submitReputationProof(
        0, // DEFI_TVL
        10000e6,
        bobTVLProof,
        "QmBobTVL10k"
    );

    // Bob has 5 successful loans
    const bobLendingTs = Math.floor(Date.now() / 1000);
    const bobLendingMsg = ethers.solidityPackedKeccak256(
        ["address", "uint8", "uint256", "uint256"],
        [bob.address, 1, 5, bobLendingTs]
    );
    const bobLendingSig = await dataProvider.signMessage(ethers.getBytes(bobLendingMsg));
    await zkCreditImport.connect(bob).submitDataProviderVerification(
        1, // LENDING_HISTORY
        5,
        bobLendingSig,
        bobLendingTs,
        "QmBobLending5"
    );

    const bobCryptoScore = await zkCreditImport.getUserCryptoBoost(bob.address);
    console.log(`   ✅ Bob's crypto reputation: ${bobCryptoScore} points`);
    console.log(`      • $10k DeFi TVL: 100 pts`);
    console.log(`      • 5 successful loans: 75 pts\n`);

    // 5. Alice applies for luxury home
    console.log("🏡 Alice applies for luxury property ($800k)...");
    const aliceProperty = 800000e6; // $800k
    const aliceDown = 200000e6; // $200k down (25%)
    const aliceIncome = 15000e6; // $15k/month

    const [aliceQual, aliceMaxLoan, aliceRate, alicePayment] = await cryptoMortgage.getMortgageQualification(
        alice.address,
        aliceProperty,
        aliceDown,
        aliceIncome,
        360
    );

    console.log(`   Property: $${ethers.formatUnits(aliceProperty, 6)}`);
    console.log(`   Down Payment: $${ethers.formatUnits(aliceDown, 6)} (25%)`);
    console.log(`   Loan: $${ethers.formatUnits(aliceProperty - aliceDown, 6)}`);
    console.log(`   Monthly Income: $${ethers.formatUnits(aliceIncome, 6)}`);
    console.log(`   ✅ Qualified: ${aliceQual}`);
    console.log(`   ✅ Rate: ${Number(aliceRate) / 100}% (crypto discount applied)`);
    console.log(`   ✅ Monthly Payment: $${ethers.formatUnits(alicePayment, 6)}\n`);

    // Submit Alice's application
    const aliceApproved = await cryptoMortgage.connect(alice).applyForMortgage(
        aliceProperty,
        aliceDown,
        aliceIncome,
        "123 Crypto Mansion Dr, DeFi Hills, CA 90210",
        "QmAlicePropertyDocs",
        360
    );

    console.log(`   🎉 Auto-approved: ${aliceApproved}\n`);

    // 6. Bob applies for starter home
    console.log("🏠 Bob applies for starter home ($250k)...");
    const bobProperty = 250000e6; // $250k
    const bobDown = 50000e6; // $50k down (20%)
    const bobIncome = 6000e6; // $6k/month

    const [bobQual, bobMaxLoan, bobRate, bobPayment] = await cryptoMortgage.getMortgageQualification(
        bob.address,
        bobProperty,
        bobDown,
        bobIncome,
        360
    );

    console.log(`   Property: $${ethers.formatUnits(bobProperty, 6)}`);
    console.log(`   Down Payment: $${ethers.formatUnits(bobDown, 6)} (20%)`);
    console.log(`   Loan: $${ethers.formatUnits(bobProperty - bobDown, 6)}`);
    console.log(`   Monthly Income: $${ethers.formatUnits(bobIncome, 6)}`);
    console.log(`   ✅ Qualified: ${bobQual}`);
    console.log(`   ✅ Rate: ${Number(bobRate) / 100}% (moderate discount)`);
    console.log(`   ✅ Monthly Payment: $${ethers.formatUnits(bobPayment, 6)}\n`);

    const bobApproved = await cryptoMortgage.connect(bob).applyForMortgage(
        bobProperty,
        bobDown,
        bobIncome,
        "456 Starter St, Crypto Town, TX 75001",
        "QmBobPropertyDocs",
        360
    );

    console.log(`   📋 Application: ${bobApproved ? "Auto-approved" : "Pending review"}\n`);

    // 7. Fund Alice's mortgage
    console.log("💰 Funding approved mortgages...");
    const aliceApps = await cryptoMortgage.getUserMortgageApplications(alice.address);
    if (aliceApps.length > 0 && aliceApps[0].approved) {
        await cryptoMortgage.connect(mortgageLender).fundMortgage(alice.address, 0);
        console.log(`   ✅ Alice's mortgage funded: $${ethers.formatUnits(aliceApps[0].loanAmount, 6)}`);
    }

    // 8. Show mortgage stats
    console.log("\n📊 Mortgage Pool Statistics:");
    const stats = await cryptoMortgage.getMortgageStats();
    const poolRemaining = await cryptoMortgage.totalMortgagePool();

    console.log(`   Total Applications: ${stats.totalApplications}`);
    console.log(`   Approved: ${stats.approvedApplications}`);
    console.log(`   Funded: ${stats.fundedMortgages}`);
    console.log(`   Total Funded: $${ethers.formatUnits(stats.totalFundedAmount, 6)}`);
    console.log(`   Pool Remaining: $${ethers.formatUnits(poolRemaining, 6)}`);

    console.log("\n🎉 VouchPay Crypto Mortgage Demo Complete!");
    console.log("\n🏆 Revolutionary Features:");
    console.log("✅ Modular contract architecture");
    console.log("✅ Custom errors (no require statements)");
    console.log("✅ Decentralized reputation-based lending");
    console.log("✅ Competitive crypto-native mortgage rates");
    console.log("✅ Auto-approval for elite DeFi users");
    console.log("✅ Privacy-preserving credit verification");

    console.log("\n🏠 Impact for Crypto Home Buyers:");
    console.log("🔐 Build credit through DeFi, not credit cards");
    console.log("⚡ Get mortgage approval in minutes");
    console.log("💰 Lower rates for crypto expertise");
    console.log("🌍 Buy real estate with crypto wealth");
    console.log("🏦 No traditional bank needed");

    return {
        contracts: {
            cryptoMortgage: cryptoMortgage.target,
            zkCreditImport: zkCreditImport.target,
            vouchPayCore: vouchPayCore.target,
        },
        results: {
            alice: {
                cryptoScore: aliceCryptoScore.toString(),
                qualified: aliceQual,
                approved: aliceApproved,
                rate: `${Number(aliceRate) / 100}%`,
                monthlyPayment: ethers.formatUnits(alicePayment, 6),
            },
            bob: {
                cryptoScore: bobCryptoScore.toString(),
                qualified: bobQual,
                approved: bobApproved,
                rate: `${Number(bobRate) / 100}%`,
                monthlyPayment: ethers.formatUnits(bobPayment, 6),
            },
        },
    };
}

// Run demo
if (require.main === module) {
    main()
        .then((result) => {
            console.log("\n📊 Final Results:", JSON.stringify(result.results, null, 2));
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ Demo failed:", error);
            process.exit(1);
        });
}

export default main;
