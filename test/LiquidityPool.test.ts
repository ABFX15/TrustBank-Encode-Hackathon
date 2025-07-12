import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { LiquidityPool, TrustBankCore, YieldStrategy, MockUSDC } from "../typechain-types";

describe("LiquidityPool", function () {
    // Fixture to deploy all contracts
    async function deployLiquidityPoolFixture() {
        const [owner, alice, bob, charlie, strategy1] = await ethers.getSigners();

        // Deploy Mock USDC
        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        const mockUSDC = await MockUSDC.deploy();

        // Deploy TrustBankCore
        const TrustBankCore = await ethers.getContractFactory("TrustBankCore");
        const trustBankCore = await TrustBankCore.deploy(await mockUSDC.getAddress());

        // Deploy YieldStrategy
        const YieldStrategy = await ethers.getContractFactory("YieldStrategy");
        const yieldStrategy = await YieldStrategy.deploy(await mockUSDC.getAddress());

        // Add a strategy to YieldStrategy
        await yieldStrategy.addStrategy("Aave USDC", strategy1.address, 10000); // 100%

        // Deploy LiquidityPool
        const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
        const liquidityPool = await LiquidityPool.deploy(
            await mockUSDC.getAddress(),
            await trustBankCore.getAddress(),
            await yieldStrategy.getAddress()
        );

        // Mint USDC to test users
        const mintAmount = ethers.parseUnits("100000", 6); // 100,000 USDC
        await mockUSDC.mint(alice.address, mintAmount);
        await mockUSDC.mint(bob.address, mintAmount);
        await mockUSDC.mint(charlie.address, mintAmount);
        await mockUSDC.mint(await liquidityPool.getAddress(), mintAmount); // For pool operations

        return {
            liquidityPool,
            trustBankCore,
            yieldStrategy,
            mockUSDC,
            owner,
            alice,
            bob,
            charlie,
            strategy1
        };
    }

    describe("Deployment", function () {
        it("Should deploy with correct addresses", async function () {
            const { liquidityPool, trustBankCore, yieldStrategy, mockUSDC } = await loadFixture(deployLiquidityPoolFixture);

            expect(await liquidityPool.stablecoin()).to.equal(await mockUSDC.getAddress());
            expect(await liquidityPool.trustBank()).to.equal(await trustBankCore.getAddress());
            expect(await liquidityPool.yieldStrategy()).to.equal(await yieldStrategy.getAddress());
        });

        it("Should revert with zero addresses", async function () {
            const { trustBankCore, yieldStrategy, mockUSDC } = await loadFixture(deployLiquidityPoolFixture);
            const LiquidityPool = await ethers.getContractFactory("LiquidityPool");

            // Zero stablecoin address
            await expect(LiquidityPool.deploy(
                ethers.ZeroAddress,
                await trustBankCore.getAddress(),
                await yieldStrategy.getAddress()
            )).to.be.revertedWithCustomError(LiquidityPool, "LiquidityPool__AddressZero");

            // Zero trustBank address
            await expect(LiquidityPool.deploy(
                await mockUSDC.getAddress(),
                ethers.ZeroAddress,
                await yieldStrategy.getAddress()
            )).to.be.revertedWithCustomError(LiquidityPool, "LiquidityPool__AddressZero");

            // Zero yieldStrategy address
            await expect(LiquidityPool.deploy(
                await mockUSDC.getAddress(),
                await trustBankCore.getAddress(),
                ethers.ZeroAddress
            )).to.be.revertedWithCustomError(LiquidityPool, "LiquidityPool__AddressZero");
        });

        it("Should initialize with correct LP token details", async function () {
            const { liquidityPool } = await loadFixture(deployLiquidityPoolFixture);

            expect(await liquidityPool.name()).to.equal("TrustBank LP Token");
            expect(await liquidityPool.symbol()).to.equal("tLP");
            expect(await liquidityPool.totalSupply()).to.equal(0);
        });

        it("Should initialize with zero pool stats", async function () {
            const { liquidityPool } = await loadFixture(deployLiquidityPoolFixture);

            const stats = await liquidityPool.stats();
            expect(stats.totalDeposits).to.equal(0);
            expect(stats.totalLoans).to.equal(0);
            expect(stats.availableLiquidity).to.equal(0);
            expect(stats.yieldEarned).to.equal(0);
            expect(stats.defaultsLost).to.equal(0);
        });
    });

    describe("Liquidity Addition", function () {
        it("Should add liquidity successfully", async function () {
            const { liquidityPool, mockUSDC, alice } = await loadFixture(deployLiquidityPoolFixture);

            const depositAmount = ethers.parseUnits("1000", 6); // 1000 USDC

            // Alice approves and adds liquidity
            await mockUSDC.connect(alice).approve(await liquidityPool.getAddress(), depositAmount);

            await expect(liquidityPool.connect(alice).addLiquidity(depositAmount))
                .to.emit(liquidityPool, "LiquidityAdded")
                .withArgs(alice.address, depositAmount, depositAmount); // 1:1 ratio for first deposit

            // Check LP tokens minted
            expect(await liquidityPool.balanceOf(alice.address)).to.equal(depositAmount);
            expect(await liquidityPool.totalSupply()).to.equal(depositAmount);

            // Check pool stats updated
            const stats = await liquidityPool.stats();
            expect(stats.totalDeposits).to.equal(depositAmount);
            expect(stats.availableLiquidity).to.equal(depositAmount);

            // Check user deposit tracking
            expect(await liquidityPool.userDeposits(alice.address)).to.equal(depositAmount);
        });

        it("Should revert with deposit below minimum", async function () {
            const { liquidityPool, mockUSDC, alice } = await loadFixture(deployLiquidityPoolFixture);

            const smallAmount = ethers.parseUnits("5", 6); // 5 USDC (below $10 minimum)

            await mockUSDC.connect(alice).approve(await liquidityPool.getAddress(), smallAmount);

            await expect(liquidityPool.connect(alice).addLiquidity(smallAmount))
                .to.be.revertedWithCustomError(liquidityPool, "LiquidityPool__MinimumDepositNotMet");
        });

        it("Should handle second deposit with correct share calculation", async function () {
            const { liquidityPool, mockUSDC, alice, bob } = await loadFixture(deployLiquidityPoolFixture);

            const firstDeposit = ethers.parseUnits("1000", 6);
            const secondDeposit = ethers.parseUnits("500", 6);

            // Alice deposits first
            await mockUSDC.connect(alice).approve(await liquidityPool.getAddress(), firstDeposit);
            await liquidityPool.connect(alice).addLiquidity(firstDeposit);

            // Bob deposits second
            await mockUSDC.connect(bob).approve(await liquidityPool.getAddress(), secondDeposit);
            await liquidityPool.connect(bob).addLiquidity(secondDeposit);

            // Check LP token distribution
            // Bob should get (500 * 1000) / 1000 = 500 LP tokens
            expect(await liquidityPool.balanceOf(alice.address)).to.equal(firstDeposit);
            expect(await liquidityPool.balanceOf(bob.address)).to.equal(secondDeposit);
            expect(await liquidityPool.totalSupply()).to.equal(firstDeposit + secondDeposit);
        });
    });

    describe("Liquidity Removal", function () {
        it("Should remove liquidity successfully", async function () {
            const { liquidityPool, mockUSDC, alice } = await loadFixture(deployLiquidityPoolFixture);

            const depositAmount = ethers.parseUnits("1000", 6);
            const withdrawTokens = ethers.parseUnits("500", 6); // Half of LP tokens

            // Setup: Add liquidity first
            await mockUSDC.connect(alice).approve(await liquidityPool.getAddress(), depositAmount);
            await liquidityPool.connect(alice).addLiquidity(depositAmount);

            const initialBalance = await mockUSDC.balanceOf(alice.address);

            // Remove half the liquidity
            await expect(liquidityPool.connect(alice).removeLiquidity(withdrawTokens))
                .to.emit(liquidityPool, "LiquidityRemoved")
                .withArgs(alice.address, ethers.parseUnits("500", 6), withdrawTokens);

            // Check LP tokens burned
            expect(await liquidityPool.balanceOf(alice.address)).to.equal(withdrawTokens);

            // Check USDC returned
            const finalBalance = await mockUSDC.balanceOf(alice.address);
            expect(finalBalance).to.equal(initialBalance + ethers.parseUnits("500", 6));

            // Check pool stats
            const stats = await liquidityPool.stats();
            expect(stats.totalDeposits).to.equal(ethers.parseUnits("500", 6));
            expect(stats.availableLiquidity).to.equal(ethers.parseUnits("500", 6));
        });

        it("Should revert when trying to remove more LP tokens than owned", async function () {
            const { liquidityPool, mockUSDC, alice } = await loadFixture(deployLiquidityPoolFixture);

            const depositAmount = ethers.parseUnits("1000", 6);
            const excessiveWithdraw = ethers.parseUnits("1500", 6);

            // Setup
            await mockUSDC.connect(alice).approve(await liquidityPool.getAddress(), depositAmount);
            await liquidityPool.connect(alice).addLiquidity(depositAmount);

            await expect(liquidityPool.connect(alice).removeLiquidity(excessiveWithdraw))
                .to.be.revertedWithCustomError(liquidityPool, "LiquidityPool__WrongAmountOfLiquidity");
        });
    });

    describe("Loan Funding", function () {
        it("Should fund loan successfully when authorized", async function () {
            const { liquidityPool, trustBankCore, mockUSDC, alice, bob } = await loadFixture(deployLiquidityPoolFixture);

            // Setup: Add liquidity
            const depositAmount = ethers.parseUnits("10000", 6); // 10,000 USDC
            await mockUSDC.connect(alice).approve(await liquidityPool.getAddress(), depositAmount);
            await liquidityPool.connect(alice).addLiquidity(depositAmount);

            const loanAmount = ethers.parseUnits("1000", 6); // 1,000 USDC loan
            const initialBobBalance = await mockUSDC.balanceOf(bob.address);

            // TrustBankCore calls fundLoan (simulated by calling from trustBank address)
            // Note: This requires impersonating the trustBank contract
            await ethers.provider.send("hardhat_impersonateAccount", [await trustBankCore.getAddress()]);
            const trustBankSigner = await ethers.getSigner(await trustBankCore.getAddress());

            // Fund the impersonated account with ETH directly
            await ethers.provider.send("hardhat_setBalance", [
                await trustBankCore.getAddress(),
                "0x1000000000000000000" // 1 ETH in hex
            ]);

            await expect(liquidityPool.connect(trustBankSigner).fundLoan(bob.address, loanAmount))
                .to.emit(liquidityPool, "LoanFunded")
                .withArgs(bob.address, loanAmount);

            // Check loan was funded
            const finalBobBalance = await mockUSDC.balanceOf(bob.address);
            expect(finalBobBalance).to.equal(initialBobBalance + loanAmount);

            // Check pool stats updated
            const stats = await liquidityPool.stats();
            expect(stats.totalLoans).to.equal(loanAmount);
            expect(stats.availableLiquidity).to.equal(depositAmount - loanAmount);

            await ethers.provider.send("hardhat_stopImpersonatingAccount", [await trustBankCore.getAddress()]);
        });

        it("Should reject loan when insufficient liquidity", async function () {
            const { liquidityPool, trustBankCore, mockUSDC, alice, bob } = await loadFixture(deployLiquidityPoolFixture);

            // Setup: Add small amount of liquidity
            const depositAmount = ethers.parseUnits("100", 6);
            await mockUSDC.connect(alice).approve(await liquidityPool.getAddress(), depositAmount);
            await liquidityPool.connect(alice).addLiquidity(depositAmount);

            const largeLoanAmount = ethers.parseUnits("1000", 6); // More than available

            // Impersonate trustBank
            await ethers.provider.send("hardhat_impersonateAccount", [await trustBankCore.getAddress()]);
            const trustBankSigner = await ethers.getSigner(await trustBankCore.getAddress());
            await ethers.provider.send("hardhat_setBalance", [
                await trustBankCore.getAddress(),
                "0x1000000000000000000" // 1 ETH in hex
            ]);

            // Should return false for insufficient liquidity
            const result = await liquidityPool.connect(trustBankSigner).fundLoan.staticCall(bob.address, largeLoanAmount);
            expect(result).to.be.false;

            await ethers.provider.send("hardhat_stopImpersonatingAccount", [await trustBankCore.getAddress()]);
        });

        it("Should reject loan when exceeding loan-to-deposit ratio", async function () {
            const { liquidityPool, trustBankCore, mockUSDC, alice, bob } = await loadFixture(deployLiquidityPoolFixture);

            const depositAmount = ethers.parseUnits("1000", 6);
            await mockUSDC.connect(alice).approve(await liquidityPool.getAddress(), depositAmount);
            await liquidityPool.connect(alice).addLiquidity(depositAmount);

            // Try to loan 90% (max is 80%)
            const excessiveLoanAmount = ethers.parseUnits("900", 6);

            await ethers.provider.send("hardhat_impersonateAccount", [await trustBankCore.getAddress()]);
            const trustBankSigner = await ethers.getSigner(await trustBankCore.getAddress());
            await ethers.provider.send("hardhat_setBalance", [
                await trustBankCore.getAddress(),
                "0x1000000000000000000" // 1 ETH in hex
            ]);

            const result = await liquidityPool.connect(trustBankSigner).fundLoan.staticCall(bob.address, excessiveLoanAmount);
            expect(result).to.be.false;

            await ethers.provider.send("hardhat_stopImpersonatingAccount", [await trustBankCore.getAddress()]);
        });

        it("Should revert when called by unauthorized address", async function () {
            const { liquidityPool, alice, bob } = await loadFixture(deployLiquidityPoolFixture);

            const loanAmount = ethers.parseUnits("100", 6);

            await expect(liquidityPool.connect(alice).fundLoan(bob.address, loanAmount))
                .to.be.revertedWithCustomError(liquidityPool, "LiquidityPool__NotAuthorized");
        });
    });

    describe("Loan Repayment", function () {
        it("Should process repayment successfully", async function () {
            const { liquidityPool, trustBankCore, mockUSDC, alice, bob } = await loadFixture(deployLiquidityPoolFixture);

            // Setup: Add liquidity and fund loan
            const depositAmount = ethers.parseUnits("10000", 6);
            const loanAmount = ethers.parseUnits("1000", 6);
            const interestAmount = ethers.parseUnits("50", 6);

            await mockUSDC.connect(alice).approve(await liquidityPool.getAddress(), depositAmount);
            await liquidityPool.connect(alice).addLiquidity(depositAmount);

            // Fund loan
            await ethers.provider.send("hardhat_impersonateAccount", [await trustBankCore.getAddress()]);
            const trustBankSigner = await ethers.getSigner(await trustBankCore.getAddress());
            await ethers.provider.send("hardhat_setBalance", [
                await trustBankCore.getAddress(),
                "0x1000000000000000000" // 1 ETH in hex
            ]);

            await liquidityPool.connect(trustBankSigner).fundLoan(bob.address, loanAmount);

            // Bob approves repayment
            await mockUSDC.connect(bob).approve(await liquidityPool.getAddress(), loanAmount + interestAmount);

            // Process repayment
            await expect(liquidityPool.connect(trustBankSigner).processRepayment(bob.address, loanAmount, interestAmount))
                .to.emit(liquidityPool, "LoanRepaid")
                .withArgs(bob.address, loanAmount, interestAmount);

            // Check pool stats updated
            const stats = await liquidityPool.stats();
            expect(stats.totalLoans).to.equal(0); // Loan paid off
            expect(stats.availableLiquidity).to.equal(depositAmount); // Principal returned
            expect(stats.yieldEarned).to.equal(interestAmount); // Interest earned

            await ethers.provider.send("hardhat_stopImpersonatingAccount", [await trustBankCore.getAddress()]);
        });
    });

    describe("Yield Management", function () {
        it("Should calculate claimable yield correctly", async function () {
            const { liquidityPool, mockUSDC, trustBankCore, alice, bob } = await loadFixture(deployLiquidityPoolFixture);

            // Alice adds 1000 USDC, Bob adds 500 USDC
            const aliceDeposit = ethers.parseUnits("1000", 6);
            const bobDeposit = ethers.parseUnits("500", 6);

            await mockUSDC.connect(alice).approve(await liquidityPool.getAddress(), aliceDeposit);
            await liquidityPool.connect(alice).addLiquidity(aliceDeposit);

            await mockUSDC.connect(bob).approve(await liquidityPool.getAddress(), bobDeposit);
            await liquidityPool.connect(bob).addLiquidity(bobDeposit);

            // Manually set yield earned for testing
            // In real scenario, this would come from loan interest
            // We'll simulate by calling processRepayment with interest
            await ethers.provider.send("hardhat_impersonateAccount", [await trustBankCore.getAddress()]);
            const trustBankSigner = await ethers.getSigner(await trustBankCore.getAddress());
            await ethers.provider.send("hardhat_setBalance", [
                await trustBankCore.getAddress(),
                "0x1000000000000000000" // 1 ETH in hex
            ]);

            // Simulate loan and repayment to generate yield
            const loanAmount = ethers.parseUnits("100", 6);
            const interestAmount = ethers.parseUnits("150", 6); // 150 USDC interest

            await liquidityPool.connect(trustBankSigner).fundLoan(alice.address, loanAmount);
            await mockUSDC.connect(alice).approve(await liquidityPool.getAddress(), loanAmount + interestAmount);
            await liquidityPool.connect(trustBankSigner).processRepayment(alice.address, loanAmount, interestAmount);

            // Check claimable yield
            // Alice has 1000/1500 = 2/3 of LP tokens, Bob has 500/1500 = 1/3
            const aliceClaimable = await liquidityPool.getClaimableYield(alice.address);
            const bobClaimable = await liquidityPool.getClaimableYield(bob.address);

            expect(aliceClaimable).to.equal(ethers.parseUnits("100", 6)); // 2/3 * 150
            expect(bobClaimable).to.equal(ethers.parseUnits("50", 6));   // 1/3 * 150

            await ethers.provider.send("hardhat_stopImpersonatingAccount", [await trustBankCore.getAddress()]);
        });

        it("Should allow claiming yield", async function () {
            const { liquidityPool, trustBankCore, mockUSDC, alice } = await loadFixture(deployLiquidityPoolFixture);

            // Setup with yield
            const depositAmount = ethers.parseUnits("1000", 6);
            await mockUSDC.connect(alice).approve(await liquidityPool.getAddress(), depositAmount);
            await liquidityPool.connect(alice).addLiquidity(depositAmount);

            // Generate yield through loan repayment
            await ethers.provider.send("hardhat_impersonateAccount", [await trustBankCore.getAddress()]);
            const trustBankSigner = await ethers.getSigner(await trustBankCore.getAddress());
            await ethers.provider.send("hardhat_setBalance", [
                await trustBankCore.getAddress(),
                "0x1000000000000000000" // 1 ETH in hex
            ]);

            const loanAmount = ethers.parseUnits("100", 6);
            const interestAmount = ethers.parseUnits("100", 6);

            await liquidityPool.connect(trustBankSigner).fundLoan(alice.address, loanAmount);
            await mockUSDC.connect(alice).approve(await liquidityPool.getAddress(), loanAmount + interestAmount);
            await liquidityPool.connect(trustBankSigner).processRepayment(alice.address, loanAmount, interestAmount);

            const initialBalance = await mockUSDC.balanceOf(alice.address);
            const claimableAmount = await liquidityPool.getClaimableYield(alice.address);

            await expect(liquidityPool.connect(alice).claimYield())
                .to.emit(liquidityPool, "YieldClaimed")
                .withArgs(alice.address, claimableAmount);

            // Check balance increased
            const finalBalance = await mockUSDC.balanceOf(alice.address);
            expect(finalBalance).to.equal(initialBalance + claimableAmount);

            // Check claimed amount tracked
            expect(await liquidityPool.userYieldClaimed(alice.address)).to.equal(claimableAmount);

            await ethers.provider.send("hardhat_stopImpersonatingAccount", [await trustBankCore.getAddress()]);
        });

        it("Should return zero yield for users with no LP tokens", async function () {
            const { liquidityPool, alice } = await loadFixture(deployLiquidityPoolFixture);

            expect(await liquidityPool.getClaimableYield(alice.address)).to.equal(0);
        });
    });

    describe("Pool Statistics", function () {
        it("Should calculate utilization ratio correctly", async function () {
            const { liquidityPool, trustBankCore, mockUSDC, alice, bob } = await loadFixture(deployLiquidityPoolFixture);

            const depositAmount = ethers.parseUnits("1000", 6);
            const loanAmount = ethers.parseUnits("200", 6); // 20% utilization

            // Add liquidity
            await mockUSDC.connect(alice).approve(await liquidityPool.getAddress(), depositAmount);
            await liquidityPool.connect(alice).addLiquidity(depositAmount);

            // Initially 0% utilization
            expect(await liquidityPool.getUtilizationRatio()).to.equal(0);

            // Fund loan
            await ethers.provider.send("hardhat_impersonateAccount", [await trustBankCore.getAddress()]);
            const trustBankSigner = await ethers.getSigner(await trustBankCore.getAddress());
            await ethers.provider.send("hardhat_setBalance", [
                await trustBankCore.getAddress(),
                "0x1000000000000000000" // 1 ETH in hex
            ]);

            await liquidityPool.connect(trustBankSigner).fundLoan(bob.address, loanAmount);

            // Should be 20% = 2000 basis points
            expect(await liquidityPool.getUtilizationRatio()).to.equal(2000);

            await ethers.provider.send("hardhat_stopImpersonatingAccount", [await trustBankCore.getAddress()]);
        });

        it("Should return correct available liquidity", async function () {
            const { liquidityPool, trustBankCore, mockUSDC, alice, bob } = await loadFixture(deployLiquidityPoolFixture);

            const depositAmount = ethers.parseUnits("1000", 6);

            // Add liquidity
            await mockUSDC.connect(alice).approve(await liquidityPool.getAddress(), depositAmount);
            await liquidityPool.connect(alice).addLiquidity(depositAmount);

            // Available should be min of actual liquidity and loan capacity (80% of deposits)
            const expectedAvailable = ethers.parseUnits("800", 6); // 80% of 1000
            expect(await liquidityPool.getAvailableLiquidity()).to.equal(expectedAvailable);

            // Fund a loan
            await ethers.provider.send("hardhat_impersonateAccount", [await trustBankCore.getAddress()]);
            const trustBankSigner = await ethers.getSigner(await trustBankCore.getAddress());
            await ethers.provider.send("hardhat_setBalance", [
                await trustBankCore.getAddress(),
                "0x1000000000000000000" // 1 ETH in hex
            ]);

            const loanAmount = ethers.parseUnits("300", 6);
            await liquidityPool.connect(trustBankSigner).fundLoan(bob.address, loanAmount);

            // Available should now be 800 - 300 = 500
            expect(await liquidityPool.getAvailableLiquidity()).to.equal(ethers.parseUnits("500", 6));

            await ethers.provider.send("hardhat_stopImpersonatingAccount", [await trustBankCore.getAddress()]);
        });
    });

    describe("Edge Cases", function () {
        it("Should handle zero liquidity scenarios", async function () {
            const { liquidityPool } = await loadFixture(deployLiquidityPoolFixture);

            expect(await liquidityPool.getUtilizationRatio()).to.equal(0);
            expect(await liquidityPool.getAvailableLiquidity()).to.equal(0);
        });

        it("Should handle claiming yield with no yield available", async function () {
            const { liquidityPool, mockUSDC, alice } = await loadFixture(deployLiquidityPoolFixture);

            // Add liquidity but no yield generated
            const depositAmount = ethers.parseUnits("1000", 6);
            await mockUSDC.connect(alice).approve(await liquidityPool.getAddress(), depositAmount);
            await liquidityPool.connect(alice).addLiquidity(depositAmount);

            // Should not revert, just do nothing
            await expect(liquidityPool.connect(alice).claimYield()).to.not.be.reverted;

            expect(await liquidityPool.userYieldClaimed(alice.address)).to.equal(0);
        });

        it("Should handle multiple users claiming yield", async function () {
            const { liquidityPool, trustBankCore, mockUSDC, alice, bob, charlie } = await loadFixture(deployLiquidityPoolFixture);

            // Multiple users add liquidity
            const depositAmount = ethers.parseUnits("1000", 6);

            await mockUSDC.connect(alice).approve(await liquidityPool.getAddress(), depositAmount);
            await liquidityPool.connect(alice).addLiquidity(depositAmount);

            await mockUSDC.connect(bob).approve(await liquidityPool.getAddress(), depositAmount);
            await liquidityPool.connect(bob).addLiquidity(depositAmount);

            // Generate yield
            await ethers.provider.send("hardhat_impersonateAccount", [await trustBankCore.getAddress()]);
            const trustBankSigner = await ethers.getSigner(await trustBankCore.getAddress());
            await ethers.provider.send("hardhat_setBalance", [
                await trustBankCore.getAddress(),
                "0x1000000000000000000" // 1 ETH in hex
            ]);

            const loanAmount = ethers.parseUnits("100", 6);
            const interestAmount = ethers.parseUnits("200", 6);

            await liquidityPool.connect(trustBankSigner).fundLoan(charlie.address, loanAmount);
            await mockUSDC.connect(charlie).approve(await liquidityPool.getAddress(), loanAmount + interestAmount);
            await liquidityPool.connect(trustBankSigner).processRepayment(charlie.address, loanAmount, interestAmount);

            // Both users should be able to claim their share
            await expect(liquidityPool.connect(alice).claimYield()).to.not.be.reverted;
            await expect(liquidityPool.connect(bob).claimYield()).to.not.be.reverted;

            // Each should have claimed 100 USDC (50% share each)
            expect(await liquidityPool.userYieldClaimed(alice.address)).to.equal(ethers.parseUnits("100", 6));
            expect(await liquidityPool.userYieldClaimed(bob.address)).to.equal(ethers.parseUnits("100", 6));

            await ethers.provider.send("hardhat_stopImpersonatingAccount", [await trustBankCore.getAddress()]);
        });
    });

    describe("Administrative Functions", function () {
        it("Should allow owner to pause", async function () {
            const { liquidityPool, owner } = await loadFixture(deployLiquidityPoolFixture);

            // For now, pause just emits an event (as noted in contract)
            await expect(liquidityPool.connect(owner).pause())
                .to.emit(liquidityPool, "LiquidityRemoved")
                .withArgs(owner.address, 0, 0);
        });

        it("Should prevent non-owner from pausing", async function () {
            const { liquidityPool, alice } = await loadFixture(deployLiquidityPoolFixture);

            await expect(liquidityPool.connect(alice).pause())
                .to.be.revertedWithCustomError(liquidityPool, "OwnableUnauthorizedAccount");
        });
    });
});
