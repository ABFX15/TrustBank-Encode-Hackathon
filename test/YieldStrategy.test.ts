import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { YieldStrategy, MockUSDC } from "../typechain-types";

describe("YieldStrategy", function () {
    // Fixture to deploy contracts
    async function deployYieldStrategyFixture() {
        const [owner, alice, bob, strategy1, strategy2] = await ethers.getSigners();

        // Deploy Mock USDC
        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        const mockUSDC = await MockUSDC.deploy();

        // Deploy YieldStrategy
        const YieldStrategy = await ethers.getContractFactory("YieldStrategy");
        const yieldStrategy = await YieldStrategy.deploy(await mockUSDC.getAddress());

        // Mint USDC to test users
        const mintAmount = ethers.parseUnits("10000", 6); // 10,000 USDC
        await mockUSDC.mint(alice.address, mintAmount);
        await mockUSDC.mint(bob.address, mintAmount);

        return { yieldStrategy, mockUSDC, owner, alice, bob, strategy1, strategy2 };
    }

    describe("Deployment", function () {
        it("Should deploy with correct stablecoin address", async function () {
            const { yieldStrategy, mockUSDC } = await loadFixture(deployYieldStrategyFixture);

            expect(await yieldStrategy.stablecoin()).to.equal(await mockUSDC.getAddress());
        });

        it("Should revert with zero address stablecoin", async function () {
            const YieldStrategy = await ethers.getContractFactory("YieldStrategy");

            await expect(YieldStrategy.deploy(ethers.ZeroAddress))
                .to.be.revertedWithCustomError(YieldStrategy, "YieldStrategy__AddressZeroStablecoin");
        });

        it("Should initialize with correct default values", async function () {
            const { yieldStrategy } = await loadFixture(deployYieldStrategyFixture);

            expect(await yieldStrategy.totalDeposits()).to.equal(0);
            expect(await yieldStrategy.totalYieldEarned()).to.equal(0);
            expect(await yieldStrategy.nextStrategyId()).to.equal(0);
            expect(await yieldStrategy.totalAllocation()).to.equal(0);
        });
    });

    describe("Strategy Management", function () {
        it("Should add strategy successfully", async function () {
            const { yieldStrategy, strategy1 } = await loadFixture(deployYieldStrategyFixture);

            const strategyName = "Aave USDC";
            const allocation = 5000; // 50% in basis points

            await expect(yieldStrategy.addStrategy(strategyName, strategy1.address, allocation))
                .to.emit(yieldStrategy, "StrategyAdded")
                .withArgs(0, strategyName, strategy1.address, allocation);

            // Check strategy was added
            const strategy = await yieldStrategy.getStrategy(0);
            expect(strategy.name).to.equal(strategyName);
            expect(strategy.protocol).to.equal(strategy1.address);
            expect(strategy.allocation).to.equal(allocation);
            expect(strategy.active).to.be.true;
            expect(strategy.currentDeposit).to.equal(0);

            // Check total allocation updated
            expect(await yieldStrategy.totalAllocation()).to.equal(allocation);
            expect(await yieldStrategy.getStrategyCount()).to.equal(1);
        });

        it("Should revert adding strategy with zero address", async function () {
            const { yieldStrategy } = await loadFixture(deployYieldStrategyFixture);

            await expect(yieldStrategy.addStrategy("Test", ethers.ZeroAddress, 5000))
                .to.be.revertedWithCustomError(yieldStrategy, "YieldStrategy__AddressZeroProtocol");
        });

        it("Should revert adding strategy with invalid allocation", async function () {
            const { yieldStrategy, strategy1 } = await loadFixture(deployYieldStrategyFixture);

            // Zero allocation
            await expect(yieldStrategy.addStrategy("Test", strategy1.address, 0))
                .to.be.revertedWithCustomError(yieldStrategy, "YieldStrategy__InvalidAllocation");

            // Too high allocation
            await expect(yieldStrategy.addStrategy("Test", strategy1.address, 10001))
                .to.be.revertedWithCustomError(yieldStrategy, "YieldStrategy__InvalidAllocation");
        });

        it("Should revert when total allocation exceeds 100%", async function () {
            const { yieldStrategy, strategy1, strategy2 } = await loadFixture(deployYieldStrategyFixture);

            // Add first strategy with 80%
            await yieldStrategy.addStrategy("Strategy 1", strategy1.address, 8000);

            // Try to add second strategy with 30% (would exceed 100%)
            await expect(yieldStrategy.addStrategy("Strategy 2", strategy2.address, 3000))
                .to.be.revertedWithCustomError(yieldStrategy, "YieldStrategy__AllocationExceedsLimit");
        });

        it("Should update strategy successfully", async function () {
            const { yieldStrategy, strategy1 } = await loadFixture(deployYieldStrategyFixture);

            // Add strategy first
            await yieldStrategy.addStrategy("Test Strategy", strategy1.address, 5000);

            // Update strategy
            const newAllocation = 3000;
            await expect(yieldStrategy.updateStrategy(0, newAllocation, false))
                .to.emit(yieldStrategy, "StrategyUpdated")
                .withArgs(0, newAllocation, false);

            const updatedStrategy = await yieldStrategy.getStrategy(0);
            expect(updatedStrategy.allocation).to.equal(newAllocation);
            expect(updatedStrategy.active).to.be.false;
            expect(await yieldStrategy.totalAllocation()).to.equal(newAllocation);
        });
    });

    describe("Deposit Functionality", function () {
        it("Should deposit successfully", async function () {
            const { yieldStrategy, mockUSDC, alice, strategy1 } = await loadFixture(deployYieldStrategyFixture);

            // Add a strategy first
            await yieldStrategy.addStrategy("Aave", strategy1.address, 10000); // 100%

            const depositAmount = ethers.parseUnits("100", 6); // 100 USDC

            // Alice approves and deposits
            await mockUSDC.connect(alice).approve(await yieldStrategy.getAddress(), depositAmount);

            await expect(yieldStrategy.connect(alice).deposit(depositAmount))
                .to.emit(yieldStrategy, "Deposited")
                .withArgs(alice.address, depositAmount);

            // Check deposit was recorded
            expect(await yieldStrategy.getUserBalance(alice.address)).to.equal(depositAmount);
            expect(await yieldStrategy.totalDeposits()).to.equal(depositAmount);

            // Check strategy allocation
            const strategy = await yieldStrategy.getStrategy(0);
            expect(strategy.currentDeposit).to.equal(depositAmount);
        });

        it("Should revert deposit with zero amount", async function () {
            const { yieldStrategy, alice, strategy1 } = await loadFixture(deployYieldStrategyFixture);

            await yieldStrategy.addStrategy("Test", strategy1.address, 10000);

            await expect(yieldStrategy.connect(alice).deposit(0))
                .to.be.revertedWithCustomError(yieldStrategy, "YieldStrategy__InsufficientAmount");
        });

        it("Should revert deposit with no strategies", async function () {
            const { yieldStrategy, alice } = await loadFixture(deployYieldStrategyFixture);

            const depositAmount = ethers.parseUnits("100", 6);

            await expect(yieldStrategy.connect(alice).deposit(depositAmount))
                .to.be.revertedWithCustomError(yieldStrategy, "YieldStrategy__NoStrategiesAvailable");
        });

        it("Should handle multiple deposits correctly", async function () {
            const { yieldStrategy, mockUSDC, alice, strategy1 } = await loadFixture(deployYieldStrategyFixture);

            await yieldStrategy.addStrategy("Aave", strategy1.address, 10000);

            const firstDeposit = ethers.parseUnits("100", 6);
            const secondDeposit = ethers.parseUnits("50", 6);

            // First deposit
            await mockUSDC.connect(alice).approve(await yieldStrategy.getAddress(), firstDeposit);
            await yieldStrategy.connect(alice).deposit(firstDeposit);

            // Second deposit
            await mockUSDC.connect(alice).approve(await yieldStrategy.getAddress(), secondDeposit);
            await yieldStrategy.connect(alice).deposit(secondDeposit);

            expect(await yieldStrategy.getUserBalance(alice.address)).to.equal(firstDeposit + secondDeposit);
        });
    });

    describe("Withdrawal Functionality", function () {
        it("Should withdraw successfully", async function () {
            const { yieldStrategy, mockUSDC, alice, strategy1 } = await loadFixture(deployYieldStrategyFixture);

            // Setup: Add strategy and deposit
            await yieldStrategy.addStrategy("Aave", strategy1.address, 10000);
            const depositAmount = ethers.parseUnits("100", 6);
            await mockUSDC.connect(alice).approve(await yieldStrategy.getAddress(), depositAmount);
            await yieldStrategy.connect(alice).deposit(depositAmount);

            // Withdraw half
            const withdrawAmount = ethers.parseUnits("50", 6);

            await expect(yieldStrategy.connect(alice).withdraw(withdrawAmount))
                .to.emit(yieldStrategy, "Withdrawn")
                .withArgs(alice.address, withdrawAmount);

            expect(await yieldStrategy.getUserBalance(alice.address)).to.equal(depositAmount - withdrawAmount);
        });

        it("Should revert withdraw with insufficient balance", async function () {
            const { yieldStrategy, mockUSDC, alice, strategy1 } = await loadFixture(deployYieldStrategyFixture);

            await yieldStrategy.addStrategy("Aave", strategy1.address, 10000);
            const depositAmount = ethers.parseUnits("100", 6);
            await mockUSDC.connect(alice).approve(await yieldStrategy.getAddress(), depositAmount);
            await yieldStrategy.connect(alice).deposit(depositAmount);

            // Try to withdraw more than deposited
            const withdrawAmount = ethers.parseUnits("150", 6);

            await expect(yieldStrategy.connect(alice).withdraw(withdrawAmount))
                .to.be.revertedWithCustomError(yieldStrategy, "YieldStrategy__InsufficientBalance");
        });

        it("Should revert withdraw with zero amount", async function () {
            const { yieldStrategy, alice } = await loadFixture(deployYieldStrategyFixture);

            await expect(yieldStrategy.connect(alice).withdraw(0))
                .to.be.revertedWithCustomError(yieldStrategy, "YieldStrategy__InsufficientAmount");
        });
    });

    describe("Yield Calculation", function () {
        it("Should calculate APY correctly", async function () {
            const { yieldStrategy, strategy1, strategy2 } = await loadFixture(deployYieldStrategyFixture);

            // Add two strategies with different allocations
            await yieldStrategy.addStrategy("Strategy 1", strategy1.address, 6000); // 60%
            await yieldStrategy.addStrategy("Strategy 2", strategy2.address, 4000); // 40%

            const apy = await yieldStrategy.getCurrentAPY();

            // Should be weighted average of DEFAULT_APY (5e16)
            // 60% * 5e16 + 40% * 5e16 = 100% * 5e16 = 5e16
            expect(apy).to.equal(ethers.parseUnits("0.05", 18)); // 5%
        });

        it("Should return zero APY with no strategies", async function () {
            const { yieldStrategy } = await loadFixture(deployYieldStrategyFixture);

            expect(await yieldStrategy.getCurrentAPY()).to.equal(0);
        });

        it("Should harvest yield correctly", async function () {
            const { yieldStrategy, mockUSDC, alice, strategy1 } = await loadFixture(deployYieldStrategyFixture);

            // Setup deposit
            await yieldStrategy.addStrategy("Aave", strategy1.address, 10000);
            const depositAmount = ethers.parseUnits("1000", 6);
            await mockUSDC.connect(alice).approve(await yieldStrategy.getAddress(), depositAmount);
            await yieldStrategy.connect(alice).deposit(depositAmount);

            // Fast forward time to accrue yield
            await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]); // 1 year
            await ethers.provider.send("evm_mine", []);

            const initialYield = await yieldStrategy.totalYieldEarned();

            await expect(yieldStrategy.harvestYield())
                .to.emit(yieldStrategy, "YieldHarvested");

            const finalYield = await yieldStrategy.totalYieldEarned();
            expect(finalYield).to.be.greaterThan(initialYield);
        });
    });

    describe("Administrative Functions", function () {
        it("Should allow owner to rebalance", async function () {
            const { yieldStrategy, mockUSDC, alice, strategy1 } = await loadFixture(deployYieldStrategyFixture);

            // Setup
            await yieldStrategy.addStrategy("Aave", strategy1.address, 10000);
            const depositAmount = ethers.parseUnits("100", 6);
            await mockUSDC.connect(alice).approve(await yieldStrategy.getAddress(), depositAmount);
            await yieldStrategy.connect(alice).deposit(depositAmount);

            await expect(yieldStrategy.rebalance())
                .to.emit(yieldStrategy, "Rebalanced");
        });

        it("Should allow emergency withdraw by owner", async function () {
            const { yieldStrategy, mockUSDC, alice, owner, strategy1 } = await loadFixture(deployYieldStrategyFixture);

            // Setup
            await yieldStrategy.addStrategy("Aave", strategy1.address, 10000);
            const depositAmount = ethers.parseUnits("100", 6);
            await mockUSDC.connect(alice).approve(await yieldStrategy.getAddress(), depositAmount);
            await yieldStrategy.connect(alice).deposit(depositAmount);

            const initialOwnerBalance = await mockUSDC.balanceOf(owner.address);

            await expect(yieldStrategy.emergencyWithdraw())
                .to.emit(yieldStrategy, "EmergencyWithdrawal");

            // Owner should receive the funds
            const finalOwnerBalance = await mockUSDC.balanceOf(owner.address);
            expect(finalOwnerBalance).to.be.greaterThan(initialOwnerBalance);

            // Pool should be reset
            expect(await yieldStrategy.totalDeposits()).to.equal(0);
        });

        it("Should prevent non-owner from administrative functions", async function () {
            const { yieldStrategy, alice, strategy1 } = await loadFixture(deployYieldStrategyFixture);

            await expect(yieldStrategy.connect(alice).addStrategy("Test", strategy1.address, 5000))
                .to.be.revertedWithCustomError(yieldStrategy, "OwnableUnauthorizedAccount");

            await expect(yieldStrategy.connect(alice).rebalance())
                .to.be.revertedWithCustomError(yieldStrategy, "OwnableUnauthorizedAccount");

            await expect(yieldStrategy.connect(alice).emergencyWithdraw())
                .to.be.revertedWithCustomError(yieldStrategy, "OwnableUnauthorizedAccount");
        });
    });

    describe("View Functions", function () {
        it("Should return correct strategy count", async function () {
            const { yieldStrategy, strategy1, strategy2 } = await loadFixture(deployYieldStrategyFixture);

            expect(await yieldStrategy.getStrategyCount()).to.equal(0);

            await yieldStrategy.addStrategy("Strategy 1", strategy1.address, 5000);
            expect(await yieldStrategy.getStrategyCount()).to.equal(1);

            await yieldStrategy.addStrategy("Strategy 2", strategy2.address, 5000);
            expect(await yieldStrategy.getStrategyCount()).to.equal(2);
        });

        it("Should get strategy details correctly", async function () {
            const { yieldStrategy, strategy1 } = await loadFixture(deployYieldStrategyFixture);

            const strategyName = "Compound USDC";
            const allocation = 7500;

            await yieldStrategy.addStrategy(strategyName, strategy1.address, allocation);

            const strategy = await yieldStrategy.getStrategy(0);
            expect(strategy.name).to.equal(strategyName);
            expect(strategy.protocol).to.equal(strategy1.address);
            expect(strategy.allocation).to.equal(allocation);
            expect(strategy.active).to.be.true;
        });

        it("Should revert getting invalid strategy", async function () {
            const { yieldStrategy } = await loadFixture(deployYieldStrategyFixture);

            await expect(yieldStrategy.getStrategy(0))
                .to.be.revertedWithCustomError(yieldStrategy, "YieldStrategy__StrategyNotActive");
        });
    });
});
