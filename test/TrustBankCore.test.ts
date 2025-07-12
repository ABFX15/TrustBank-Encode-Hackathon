import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { TrustBankCore, MockUSDC } from "../typechain-types";

describe("TrustBankCore", function () {
    // Fixture to deploy contracts
    async function deployTrustBankCoreFixture() {
        const [owner, alice, bob, charlie] = await ethers.getSigners();

        // Deploy Mock USDC
        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        const mockUSDC = await MockUSDC.deploy();

        // Deploy TrustBankCore
        const TrustBankCore = await ethers.getContractFactory("TrustBankCore");
        const trustBankCore = await TrustBankCore.deploy(await mockUSDC.getAddress());

        // Mint some USDC to test users
        const mintAmount = ethers.parseUnits("1000", 6); // 1000 USDC (6 decimals)
        await mockUSDC.mint(alice.address, mintAmount);
        await mockUSDC.mint(bob.address, mintAmount);
        await mockUSDC.mint(charlie.address, mintAmount);

        return { trustBankCore, mockUSDC, owner, alice, bob, charlie };
    }

    describe("Deployment", function () {
        it("Should deploy with correct stablecoin address", async function () {
            const { trustBankCore, mockUSDC } = await loadFixture(deployTrustBankCoreFixture);

            expect(await trustBankCore.stablecoin()).to.equal(await mockUSDC.getAddress());
        });

        it("Should revert with zero address stablecoin", async function () {
            const TrustBankCore = await ethers.getContractFactory("TrustBankCore");

            await expect(TrustBankCore.deploy(ethers.ZeroAddress))
                .to.be.revertedWithCustomError(TrustBankCore, "TrustBankCore__AddressZeroStablecoin");
        });
    });

    describe("Payment Functionality", function () {
        it("Should send payment successfully", async function () {
            const { trustBankCore, mockUSDC, alice, bob } = await loadFixture(deployTrustBankCoreFixture);

            const paymentAmount = ethers.parseUnits("50", 6); // 50 USDC
            const message = "Payment for coffee";

            // Alice approves TrustBankCore to spend USDC
            await mockUSDC.connect(alice).approve(await trustBankCore.getAddress(), paymentAmount);

            // Send payment
            await expect(trustBankCore.connect(alice).sendPayment(bob.address, paymentAmount, message))
                .to.emit(trustBankCore, "PaymentSent")
                .withArgs(1, alice.address, bob.address, paymentAmount);

            // Check payment was recorded
            const payment = await trustBankCore.payments(1);
            expect(payment.from).to.equal(alice.address);
            expect(payment.to).to.equal(bob.address);
            expect(payment.amount).to.equal(paymentAmount);
            expect(payment.message).to.equal(message);
            expect(payment.completed).to.be.true;

            // Check balances
            expect(await mockUSDC.balanceOf(alice.address)).to.equal(ethers.parseUnits("950", 6));
            expect(await mockUSDC.balanceOf(bob.address)).to.equal(ethers.parseUnits("1050", 6));

            // Check payment count increased
            expect(await trustBankCore.paymentCount(alice.address)).to.equal(1);
        });

        it("Should revert payment with insufficient balance", async function () {
            const { trustBankCore, mockUSDC, alice, bob } = await loadFixture(deployTrustBankCoreFixture);

            const paymentAmount = ethers.parseUnits("2000", 6); // More than alice has

            await mockUSDC.connect(alice).approve(await trustBankCore.getAddress(), paymentAmount);

            await expect(trustBankCore.connect(alice).sendPayment(bob.address, paymentAmount, "Too much"))
                .to.be.revertedWithCustomError(trustBankCore, "TrustBankCore__InsufficientBalance");
        });

        it("Should update trust score after payment", async function () {
            const { trustBankCore, mockUSDC, alice, bob } = await loadFixture(deployTrustBankCoreFixture);

            const paymentAmount = ethers.parseUnits("50", 6);

            // Initial trust score should be 0
            expect(await trustBankCore.getUserTrustScore(alice.address)).to.equal(0);

            await mockUSDC.connect(alice).approve(await trustBankCore.getAddress(), paymentAmount);
            await trustBankCore.connect(alice).sendPayment(bob.address, paymentAmount, "Test");

            // Trust score should increase after payment (10 points per payment + time bonus)
            const trustScore = await trustBankCore.getUserTrustScore(alice.address);
            expect(trustScore).to.be.greaterThan(0);
            expect(trustScore).to.equal(60); // 10 (payment) + 50 (time bonus)
        });
    });

    describe("Vouching System", function () {
        it("Should allow vouching for another user", async function () {
            const { trustBankCore, mockUSDC, alice, bob } = await loadFixture(deployTrustBankCoreFixture);

            // Alice makes a payment first to build trust score
            const paymentAmount = ethers.parseUnits("50", 6);
            await mockUSDC.connect(alice).approve(await trustBankCore.getAddress(), paymentAmount);
            await trustBankCore.connect(alice).sendPayment(bob.address, paymentAmount, "Build trust");

            const vouchAmount = 30;

            await expect(trustBankCore.connect(alice).vouchForUser(bob.address, vouchAmount))
                .to.emit(trustBankCore, "VouchCreated")
                .withArgs(alice.address, bob.address, vouchAmount);

            // Check vouch was recorded
            const vouches = await trustBankCore.getUserVouches(bob.address);
            expect(vouches.length).to.equal(1);
            expect(vouches[0].voucher).to.equal(alice.address);
            expect(vouches[0].vouchee).to.equal(bob.address);
            expect(vouches[0].amount).to.equal(vouchAmount);
            expect(vouches[0].active).to.be.true;
        });

        it("Should revert vouching with insufficient trust score", async function () {
            const { trustBankCore, alice, bob } = await loadFixture(deployTrustBankCoreFixture);

            const vouchAmount = 100; // More than alice's trust score (0)

            await expect(trustBankCore.connect(alice).vouchForUser(bob.address, vouchAmount))
                .to.be.revertedWithCustomError(trustBankCore, "TrustBankCore__InsufficientTrustScore");
        });

        it("Should update vouchee's trust score", async function () {
            const { trustBankCore, mockUSDC, alice, bob } = await loadFixture(deployTrustBankCoreFixture);

            // Build Alice's trust score first
            const paymentAmount = ethers.parseUnits("50", 6);
            await mockUSDC.connect(alice).approve(await trustBankCore.getAddress(), paymentAmount);
            await trustBankCore.connect(alice).sendPayment(bob.address, paymentAmount, "Build trust");

            const initialBobScore = await trustBankCore.getUserTrustScore(bob.address);

            const vouchAmount = 30;
            await trustBankCore.connect(alice).vouchForUser(bob.address, vouchAmount);

            const finalBobScore = await trustBankCore.getUserTrustScore(bob.address);
            expect(finalBobScore).to.be.greaterThan(initialBobScore);
        });
    });

    describe("Trust Score Calculation", function () {
        it("Should calculate trust score correctly", async function () {
            const { trustBankCore, mockUSDC, alice, bob } = await loadFixture(deployTrustBankCoreFixture);

            // Make multiple payments to increase payment score
            const paymentAmount = ethers.parseUnits("25", 6);
            await mockUSDC.connect(alice).approve(await trustBankCore.getAddress(), paymentAmount * BigInt(3));

            await trustBankCore.connect(alice).sendPayment(bob.address, paymentAmount, "Payment 1");
            await trustBankCore.connect(alice).sendPayment(bob.address, paymentAmount, "Payment 2");
            await trustBankCore.connect(alice).sendPayment(bob.address, paymentAmount, "Payment 3");

            const trustScore = await trustBankCore.getUserTrustScore(alice.address);

            // Should be: (3 payments × 10 points) + 50 time bonus = 80
            expect(trustScore).to.equal(80);
        });

        it("Should include vouch component in trust score", async function () {
            const { trustBankCore, mockUSDC, alice, bob, charlie } = await loadFixture(deployTrustBankCoreFixture);

            // Alice builds trust score
            const paymentAmount = ethers.parseUnits("50", 6);
            await mockUSDC.connect(alice).approve(await trustBankCore.getAddress(), paymentAmount);
            await trustBankCore.connect(alice).sendPayment(bob.address, paymentAmount, "Build trust");

            // Bob builds trust score  
            await mockUSDC.connect(bob).approve(await trustBankCore.getAddress(), paymentAmount);
            await trustBankCore.connect(bob).sendPayment(charlie.address, paymentAmount, "Build trust");

            const initialCharlieScore = await trustBankCore.getUserTrustScore(charlie.address);

            // Alice and Bob both vouch for Charlie
            await trustBankCore.connect(alice).vouchForUser(charlie.address, 20);
            await trustBankCore.connect(bob).vouchForUser(charlie.address, 15);

            const finalCharlieScore = await trustBankCore.getUserTrustScore(charlie.address);
            expect(finalCharlieScore).to.be.greaterThan(initialCharlieScore);
        });
    });

    describe("View Functions", function () {
        it("Should return user payments correctly", async function () {
            const { trustBankCore, mockUSDC, alice, bob, charlie } = await loadFixture(deployTrustBankCoreFixture);

            const paymentAmount = ethers.parseUnits("25", 6);
            await mockUSDC.connect(alice).approve(await trustBankCore.getAddress(), paymentAmount * BigInt(2));

            // Alice sends payments
            await trustBankCore.connect(alice).sendPayment(bob.address, paymentAmount, "Payment 1");
            await trustBankCore.connect(alice).sendPayment(charlie.address, paymentAmount, "Payment 2");

            const alicePayments = await trustBankCore.getUserPayments(alice.address);
            expect(alicePayments.length).to.equal(2);
            expect(alicePayments[0]).to.equal(1);
            expect(alicePayments[1]).to.equal(2);

            // Bob receives payment  
            const bobPayments = await trustBankCore.getUserPayments(bob.address);
            expect(bobPayments.length).to.equal(1);
            expect(bobPayments[0]).to.equal(1);
        });

        it("Should return user vouches correctly", async function () {
            const { trustBankCore, mockUSDC, alice, bob } = await loadFixture(deployTrustBankCoreFixture);

            // Build trust score first
            const paymentAmount = ethers.parseUnits("50", 6);
            await mockUSDC.connect(alice).approve(await trustBankCore.getAddress(), paymentAmount);
            await trustBankCore.connect(alice).sendPayment(bob.address, paymentAmount, "Build trust");

            await trustBankCore.connect(alice).vouchForUser(bob.address, 30);

            const bobVouches = await trustBankCore.getUserVouches(bob.address);
            expect(bobVouches.length).to.equal(1);
            expect(bobVouches[0].voucher).to.equal(alice.address);
            expect(bobVouches[0].amount).to.equal(30);
        });
    });

    describe("Edge Cases", function () {
        it("Should handle zero amount payments", async function () {
            const { trustBankCore, alice, bob } = await loadFixture(deployTrustBankCoreFixture);

            // Zero amount should work (though practically unusual)
            await expect(trustBankCore.connect(alice).sendPayment(bob.address, 0, "Zero payment"))
                .to.not.be.reverted;
        });

        it("Should handle payments to self", async function () {
            const { trustBankCore, mockUSDC, alice } = await loadFixture(deployTrustBankCoreFixture);

            const paymentAmount = ethers.parseUnits("10", 6);
            await mockUSDC.connect(alice).approve(await trustBankCore.getAddress(), paymentAmount);

            // Payment to self should work
            await expect(trustBankCore.connect(alice).sendPayment(alice.address, paymentAmount, "Self payment"))
                .to.not.be.reverted;
        });

        it("Should handle empty payment message", async function () {
            const { trustBankCore, mockUSDC, alice, bob } = await loadFixture(deployTrustBankCoreFixture);

            const paymentAmount = ethers.parseUnits("10", 6);
            await mockUSDC.connect(alice).approve(await trustBankCore.getAddress(), paymentAmount);

            await expect(trustBankCore.connect(alice).sendPayment(bob.address, paymentAmount, ""))
                .to.not.be.reverted;
        });
    });
});
