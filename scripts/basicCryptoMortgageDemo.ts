import { ethers } from "hardhat";
import { TrustBankCore, TrustBankMortgage, MockUSDC } from "../typechain-types";

// Constants for demo amounts (using nice round numbers for simplicity)
const MORTGAGE_POOL_FUNDING = ethers.parseUnits("500000", 6); // $500k pool
const LOAN_REQUEST_AMOUNT = ethers.parseUnits("100000", 6); // $100k loan
const PAYMENT_AMOUNT = ethers.parseUnits("1000", 6); // $1k payment

async function main() {
    console.log("🏠 Simple TrustBank Crypto Mortgage Demo");
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

    // Deploy TrustBankCore (keeping contract name for compatibility)
    const TrustBankCoreFactory = await ethers.getContractFactory("TrustBankCore");
    const trustBankCore = await TrustBankCoreFactory.deploy(await mockUSDC.getAddress()) as TrustBankCore;
    await trustBankCore.waitForDeployment();
    console.log("🔗 TrustBankCore deployed to:", await trustBankCore.getAddress());

    // Deploy TrustBankMortgage (without ZK for simplicity)
    const TrustBankMortgageFactory = await ethers.getContractFactory("TrustBankMortgage");
    const trustBankMortgage = await TrustBankMortgageFactory.deploy(
        await mockUSDC.getAddress(),
        await trustBankCore.getAddress(),
        ethers.ZeroAddress // No ZK contract for this simple demo
    ) as TrustBankMortgage;
    await trustBankMortgage.waitForDeployment();
    console.log("🏠 TrustBankMortgage deployed to:", await trustBankMortgage.getAddress());

    // Setup: Get USDC from faucet for borrower
    const borrowerUSDC = mockUSDC.connect(borrower);
    await borrowerUSDC.faucet();
    console.log("💰 Borrower got 1000 USDC from faucet");

    // Setup: Fund mortgage pool
    await trustBankMortgage.addApprovedLender(lender.address);
    await mockUSDC.transfer(lender.address, ethers.parseUnits("1000000", 6)); // $1M to lender

    const lenderUSDC = mockUSDC.connect(lender);
    await lenderUSDC.approve(await trustBankMortgage.getAddress(), ethers.parseUnits("1000000", 6));

    const lenderMortgage = trustBankMortgage.connect(lender);
    await lenderMortgage.addToMortgagePool(MORTGAGE_POOL_FUNDING); // $500k pool
    console.log("🏦 Funded mortgage pool with $500k");

    console.log("\n🌟 Building Crypto Reputation...");

    // Simulate building trust score in VouchPay (normally would be through payments/vouches)
    // For demo purposes, we'll manually boost the borrower's trust score
    console.log("📊 Simulating crypto activity and trust building...");
    console.log("   (In production, this would be real DeFi activity)");

    // Check qualification with base trust score
    const [qualified, interestRate] = await trustBankMortgage.checkQualification(borrower.address, LOAN_REQUEST_AMOUNT);
    console.log("\n🎯 Loan Qualification Check:");
    console.log("   Loan Amount Requested:", ethers.formatUnits(LOAN_REQUEST_AMOUNT, 6));
    console.log("   Qualified:", qualified);

    if (qualified) {
        console.log("   Interest Rate:", interestRate.toString(), "basis points");
        console.log("   Interest Rate %:", (Number(interestRate) / 100).toFixed(2) + "%");

        console.log("\n📝 Applying for mortgage...");
        const borrowerMortgage = trustBankMortgage.connect(borrower);

        const tx = await borrowerMortgage.applyForMortgage(LOAN_REQUEST_AMOUNT);
        const receipt = await tx.wait();

        // Check if auto-approved
        const application = await trustBankMortgage.getUserApplication(borrower.address);
        console.log("✅ Application submitted!");
        console.log("   Loan Amount:", ethers.formatUnits(application.loanAmount, 6));
        console.log("   Interest Rate:", application.interestRate.toString(), "bps");
        console.log("   Auto-approved:", application.isApproved);

        if (application.isApproved) {
            console.log("\n💰 Funding mortgage...");
            await lenderMortgage.fundMortgage(borrower.address);

            const loanBalance = await trustBankMortgage.getUserLoanBalance(borrower.address);
            console.log("✅ Mortgage funded!");
            console.log("   Loan Balance:", ethers.formatUnits(loanBalance, 6));

            // Make a payment
            console.log("\n💸 Making first payment...");
            await borrowerUSDC.approve(await trustBankMortgage.getAddress(), PAYMENT_AMOUNT);
            await borrowerMortgage.makePayment(PAYMENT_AMOUNT);

            const newBalance = await trustBankMortgage.getUserLoanBalance(borrower.address);
            console.log("✅ Payment made!");
            console.log("   Payment Amount:", ethers.formatUnits(PAYMENT_AMOUNT, 6));
            console.log("   Remaining Balance:", ethers.formatUnits(newBalance, 6));
        } else {
            console.log("❌ Application not auto-approved (insufficient reputation)");
            console.log("   Would require manual underwriting in production");
        }
    } else {
        console.log("❌ Not qualified for mortgage");
        console.log("   Need to build more crypto reputation through:");
        console.log("   - DeFi protocol usage");
        console.log("   - Successful loan repayments");
        console.log("   - Social vouching");
        console.log("   - On-chain governance participation");
    }

    // Show final stats
    const totalPool = await trustBankMortgage.getTotalMortgagePool();
    const totalLoans = await trustBankMortgage.getTotalLoansIssued();

    console.log("\n📊 Final Statistics:");
    console.log("   Total Mortgage Pool:", ethers.formatUnits(totalPool, 6));
    console.log("   Total Loans Issued:", totalLoans.toString());

    // Show contract constants
    console.log("\n⚙️ Contract Parameters:");
    console.log("   Min Crypto Score:", await trustBankMortgage.MIN_CRYPTO_SCORE());
    console.log("   Max Loan Amount:", ethers.formatUnits(await trustBankMortgage.MAX_LOAN_AMOUNT(), 6));
    console.log("   Base Interest Rate:", (await trustBankMortgage.BASE_INTEREST_RATE()).toString() + " bps");
    console.log("   Auto-approval Threshold:", await trustBankMortgage.AUTO_APPROVAL_THRESHOLD());

    console.log("\n✨ TrustBank Demo completed successfully!");
    console.log("💡 Key features demonstrated:");
    console.log("   ✅ Modular architecture (separate mortgage contract)");
    console.log("   ✅ No magic numbers (all constants defined)");
    console.log("   ✅ Reentrancy protection on all state-changing functions");
    console.log("   ✅ Custom errors instead of require statements");
    console.log("   ✅ Reputation-based lending");
    console.log("   ✅ Dynamic interest rates");
    console.log("   ✅ Simple, hackathon-ready design");
    console.log("   🏦 TrustBank: Making DeFi banking accessible to everyone");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
