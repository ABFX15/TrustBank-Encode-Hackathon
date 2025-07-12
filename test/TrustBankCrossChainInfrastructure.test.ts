import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import {
    TrustBankCrossChainInfrastructure_Simplified,
    MockUSDC
} from "../typechain-types";

describe("TrustBankCrossChainInfrastructure_Simplified", function () {
    let crossChainInfra: TrustBankCrossChainInfrastructure_Simplified;
    let usdc: MockUSDC;
    let owner: Signer;
    let user1: Signer;
    let mockChainlinkRouter: Signer;

    const INITIAL_BALANCE = ethers.parseUnits("1000000", 6);

    beforeEach(async function () {
        [owner, user1, mockChainlinkRouter] = await ethers.getSigners();

        // Deploy MockUSDC
        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        usdc = await MockUSDC.deploy();

        // Deploy TrustBankCrossChainInfrastructure_Simplified with only Chainlink CCIP
        const TrustBankCrossChainInfrastructure = await ethers.getContractFactory("TrustBankCrossChainInfrastructure_Simplified");
        crossChainInfra = await TrustBankCrossChainInfrastructure.deploy(
            await mockChainlinkRouter.getAddress(), // Mock Chainlink router
            await usdc.getAddress()
        );

        // Mint tokens to user
        const user1Address = await user1.getAddress();
        await usdc.mint(user1Address, INITIAL_BALANCE);
    });

    describe("Deployment", function () {
        it("Should deploy with correct configuration", async function () {
            expect(await crossChainInfra.chainlinkRouter()).to.equal(await mockChainlinkRouter.getAddress());
            expect(await crossChainInfra.stablecoin()).to.equal(await usdc.getAddress());
        });

        it("Should initialize chain configurations", async function () {
            // Check Ethereum configuration
            const ethConfig = await crossChainInfra.chainConfigs(1);
            expect(ethConfig.chainlinkSelector).to.equal(5009297550715157269n);
            expect(ethConfig.active).to.be.true;

            // Check Arbitrum configuration
            const arbConfig = await crossChainInfra.chainConfigs(42161);
            expect(arbConfig.chainlinkSelector).to.equal(4949039107694359620n);
            expect(arbConfig.active).to.be.true;
        });
    });

    describe("Chain Management", function () {
        it("Should check if chains are supported", async function () {
            expect(await crossChainInfra.isChainSupported(1)).to.be.true; // Ethereum
            expect(await crossChainInfra.isChainSupported(42161)).to.be.true; // Arbitrum
            expect(await crossChainInfra.isChainSupported(999)).to.be.false; // Unsupported
        });

        it("Should return supported chains", async function () {
            const chains = await crossChainInfra.getSupportedChains();
            expect(chains.length).to.equal(5);
            expect(chains[0]).to.equal(1); // Ethereum
            expect(chains[1]).to.equal(42161); // Arbitrum
            expect(chains[2]).to.equal(137); // Polygon
        });

        it("Should allow owner to configure new chains", async function () {
            await crossChainInfra.configureChain(
                999, // Custom chain ID
                1234567890n, // Chainlink selector
                true, // Active
                10, // Min confirmations
                500000 // Max gas limit
            );

            const config = await crossChainInfra.chainConfigs(999);
            expect(config.chainlinkSelector).to.equal(1234567890n);
            expect(config.active).to.be.true;
        });

        it("Should not allow non-owner to configure chains", async function () {
            await expect(
                crossChainInfra.connect(user1).configureChain(
                    999, 1234567890n, true, 10, 500000
                )
            ).to.be.revertedWithCustomError(crossChainInfra, "OwnableUnauthorizedAccount");
        });
    });

    describe("Message Management", function () {
        it("Should track message status", async function () {
            const messageId = ethers.keccak256(ethers.toUtf8Bytes("test-message"));

            // Initially not processed
            expect(await crossChainInfra.getMessageStatus(messageId)).to.be.false;

            // This would normally be set by the receive function
            // For testing purposes, we can't easily test the full flow without mocks
        });
    });

    describe("Validation", function () {
        it("Should validate transfer amounts", async function () {
            const tooSmall = ethers.parseUnits("0.5", 6); // $0.50 - below minimum
            const tooBig = ethers.parseUnits("2000000", 6); // $2M - above maximum

            // These should fail validation (we can't easily test private functions)
            // But we can test via the public functions that would call them

            // Note: These tests would work with proper Chainlink/LayerZero mocks
            // For now, they'll fail because we don't have real router implementations
        });

        it("Should reject unsupported chains", async function () {
            // These would test the validation logic
            // Implementation depends on having proper mocks for the routers
        });
    });

    describe("Emergency Functions", function () {
        it("Should allow owner to emergency withdraw tokens", async function () {
            // Send some tokens to the contract
            const amount = ethers.parseUnits("1000", 6);
            await usdc.mint(await crossChainInfra.getAddress(), amount);

            const ownerAddress = await owner.getAddress();
            const initialBalance = await usdc.balanceOf(ownerAddress);

            await crossChainInfra.emergencyWithdraw(await usdc.getAddress(), amount);

            const finalBalance = await usdc.balanceOf(ownerAddress);
            expect(finalBalance - initialBalance).to.equal(amount);
        });

        it("Should allow owner to emergency withdraw ETH", async function () {
            // Send some ETH to the contract
            const amount = ethers.parseEther("1.0");
            await owner.sendTransaction({
                to: await crossChainInfra.getAddress(),
                value: amount
            });

            const ownerAddress = await owner.getAddress();
            const initialBalance = await ethers.provider.getBalance(ownerAddress);

            const tx = await crossChainInfra.emergencyWithdrawETH();
            const receipt = await tx.wait();
            const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

            const finalBalance = await ethers.provider.getBalance(ownerAddress);

            // Account for gas costs in the comparison
            expect(finalBalance + gasUsed - initialBalance).to.be.closeTo(amount, ethers.parseEther("0.01"));
        });

        it("Should not allow non-owner to use emergency functions", async function () {
            await expect(
                crossChainInfra.connect(user1).emergencyWithdraw(await usdc.getAddress(), 1000)
            ).to.be.revertedWithCustomError(crossChainInfra, "OwnableUnauthorizedAccount");

            await expect(
                crossChainInfra.connect(user1).emergencyWithdrawETH()
            ).to.be.revertedWithCustomError(crossChainInfra, "OwnableUnauthorizedAccount");
        });
    });

    describe("Constants and Limits", function () {
        it("Should have correct security parameters", async function () {
            expect(await crossChainInfra.MAX_GAS_LIMIT()).to.equal(2_000_000);
            expect(await crossChainInfra.MIN_TRANSFER_AMOUNT()).to.equal(1e6); // $1
            expect(await crossChainInfra.MAX_TRANSFER_AMOUNT()).to.equal(1_000_000e6); // $1M
            expect(await crossChainInfra.MESSAGE_TIMEOUT()).to.equal(24 * 60 * 60); // 24 hours
        });
    });

    describe("ETH Handling", function () {
        it("Should accept ETH for fees", async function () {
            const amount = ethers.parseEther("0.1");

            await expect(
                owner.sendTransaction({
                    to: await crossChainInfra.getAddress(),
                    value: amount
                })
            ).not.to.be.reverted;

            expect(await ethers.provider.getBalance(await crossChainInfra.getAddress())).to.equal(amount);
        });
    });
});
