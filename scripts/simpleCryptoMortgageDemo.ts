import { ethers } from "hardhat";
import { VouchPayCore, CryptoMortgage, ZKCreditImport, MockUSDC } from "../typechain-types";

// Constants matching ZKCreditImport contract
const TVL_TIER_3_THRESHOLD = ethers.parseUnits("100000", 6); // $100k
const LENDING_TIER_3_THRESHOLD = 50; // 50 successful loans
const TVL_TIER_3_BOOST = 400;
const LENDING_TIER_3_BOOST = 300;

async function main() {
    console.log("🏠 Simple VouchPay Crypto Mortgage Demo");
    console.log("======================================");

    // Get signers
    const [deployer, borrower, lender] = await ethers.getSigners();
    console.log("👤 Deployer:", deployer.address);
    console.log("👤 Borrower:", borrower.address);
    console.log("👤 Lender:", lender.address);

    // Deploy contracts for demo
    console.log("\n📦 Deploying contracts...");

    // Deploy MockUSDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDCFactory.deploy() as MockUSDC;
    await mockUSDC.waitForDeployment();
    console.log("💰 MockUSDC deployed to:", await mockUSDC.getAddress());

    // Deploy VouchPayCore
    const VouchPayCoreFactory = await ethers.getContractFactory("VouchPayCore");
    const vouchPayCore = await VouchPayCoreFactory.deploy(await mockUSDC.getAddress()) as VouchPayCore;
    await vouchPayCore.waitForDeployment();
    console.log("🔗 VouchPayCore deployed to:", await vouchPayCore.getAddress());

    // Deploy ZKCreditImport
    const ZKCreditImportFactory = await ethers.getContractFactory("ZKCreditImport");
    const zkVerificationKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const zkCreditImport = await ZKCreditImportFactory.deploy(
        await vouchPayCore.getAddress(),
        ethers.ZeroAddress, // creditEngine not needed for this demo
        zkVerificationKey
    ) as ZKCreditImport;
    await zkCreditImport.waitForDeployment();
    console.log("🔐 ZKCreditImport deployed to:", await zkCreditImport.getAddress());

    // Deploy CryptoMortgage
    const CryptoMortgageFactory = await ethers.getContractFactory("CryptoMortgage");
    const cryptoMortgage = await CryptoMortgageFactory.deploy(
        await mockUSDC.getAddress(),
        await vouchPayCore.getAddress(),
        await zkCreditImport.getAddress()
    ) as CryptoMortgage;
    await cryptoMortgage.waitForDeployment();
    console.log("🏠 CryptoMortgage deployed to:", await cryptoMortgage.getAddress());

    // Setup: Connect ZK contract to VouchPay
    await vouchPayCore.setZKCreditContract(await zkCreditImport.getAddress());
    console.log("✅ ZK contract connected to VouchPay");

    // Setup: Get USDC from faucet for borrower
    const borrowerUSDC = mockUSDC.connect(borrower);
    await borrowerUSDC.faucet();
    console.log("💰 Borrower got 1000 USDC from faucet");

    // Setup: Fund mortgage pool
    await cryptoMortgage.addApprovedLender(lender.address);
    await mockUSDC.transfer(lender.address, ethers.parseUnits("1000000", 6)); // $1M to lender

    const lenderUSDC = mockUSDC.connect(lender);
    await lenderUSDC.approve(await cryptoMortgage.getAddress(), ethers.parseUnits("1000000", 6));

    const lenderMortgage = cryptoMortgage.connect(lender);
    await lenderMortgage.addToMortgagePool(ethers.parseUnits("500000", 6)); // $500k pool
    console.log("🏦 Funded mortgage pool with $500k");

    console.log("\n🌟 Building Crypto Reputation...");

    // Build borrower's crypto reputation
    const borrowerZK = zkCreditImport.connect(borrower);

    // Submit some reputation proofs to build score
    await borrowerZK.submitReputationProof(
        0, // DEFI_TVL
        ethers.parseEther("50000"), // $50k TVL
        "ipfs://QmDeFiTVLProof123",
        ["0x1234", "0x5678"]
    );
    console.log("📊 Submitted DeFi TVL proof: $50k");

    await borrowerZK.submitReputationProof(
        1, // LENDING_HISTORY
        ethers.parseEther("25"), // 25 successful loans
        "ipfs://QmLendingHistoryProof456",
        ["0xabcd", "0xef01"]
    );
    console.log("💳 Submitted lending history proof: 25 loans");

    await borrowerZK.submitReputationProof(
        4, // WALLET_AGE
        365 * 2, // 2 years old
        "ipfs://QmWalletAgeProof789",
        ["0x2345", "0x6789"]
    );
    console.log("⏰ Submitted wallet age proof: 2 years");

    // Check qualification
    const loanAmount = ethers.parseUnits("250000", 6); // $250k loan
    const [qualified, interestRate] = await cryptoMortgage.checkQualification(borrower.address, loanAmount);
    console.log("\n🎯 Loan Qualification Check:");
    console.log("   Qualified:", qualified);
    console.log("   Interest Rate:", interestRate.toString(), "basis points");

    if (qualified) {
        console.log("\n📝 Applying for mortgage...");
        const borrowerMortgage = cryptoMortgage.connect(borrower);

        const tx = await borrowerMortgage.applyForMortgage(loanAmount);
        const receipt = await tx.wait();

        // Check if auto-approved
        const application = await cryptoMortgage.getUserApplication(borrower.address);
        console.log("✅ Application submitted!");
        console.log("   Loan Amount:", ethers.formatUnits(application.loanAmount, 6));
        console.log("   Interest Rate:", application.interestRate.toString(), "bps");
        console.log("   Auto-approved:", application.approved);

        if (application.approved) {
            console.log("\n💰 Funding mortgage...");
            await lenderMortgage.fundMortgage(borrower.address);

            const loanBalance = await cryptoMortgage.getUserLoanBalance(borrower.address);
            console.log("✅ Mortgage funded!");
            console.log("   Loan Balance:", ethers.formatUnits(loanBalance, 6));

            // Make a payment
            console.log("\n💸 Making first payment...");
            const paymentAmount = ethers.parseUnits("2000", 6); // $2k payment
            await borrowerUSDC.approve(await cryptoMortgage.getAddress(), paymentAmount);
            await borrowerMortgage.makePayment(paymentAmount);

            const newBalance = await cryptoMortgage.getUserLoanBalance(borrower.address);
            console.log("✅ Payment made!");
            console.log("   Payment Amount:", ethers.formatUnits(paymentAmount, 6));
            console.log("   Remaining Balance:", ethers.formatUnits(newBalance, 6));
        }
    }

    // Show final stats
    const totalPool = await cryptoMortgage.getTotalMortgagePool();
    const totalLoans = await cryptoMortgage.getTotalLoansIssued();

    console.log("\n📊 Final Statistics:");
    console.log("   Total Mortgage Pool:", ethers.formatUnits(totalPool, 6));
    console.log("   Total Loans Issued:", totalLoans.toString());

    console.log("\n✨ Simple Demo completed successfully!");
    console.log("💡 Key features demonstrated:");
    console.log("   - Simple crypto reputation-based lending");
    console.log("   - Auto-approval for high reputation users");
    console.log("   - Dynamic interest rates based on reputation");
    console.log("   - Modular, hackathon-ready architecture");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
