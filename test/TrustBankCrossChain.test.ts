import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
    TrustBankCrossChain,
    TrustBankCore,
    MockUSDC,
} from "../typechain-types";

describe("TrustBank Cross-Chain Core", function () {
    let trustBankCore: TrustBankCore;
    let crossChainBridge: TrustBankCrossChain;
    let usdc: MockUSDC;
    let owner: HardhatEthersSigner;
    let user1: HardhatEthersSigner;
    let user2: HardhatEthersSigner;
    let relayer1: HardhatEthersSigner;
    let relayer2: HardhatEthersSigner;

    const INITIAL_BALANCE = ethers.parseUnits("100000", 6); // 100k USDC
    const MIN_DEPOSIT = ethers.parseUnits("10", 6); // $10 USDC
    const RELAYER_STAKE = ethers.parseUnits("10000", 6); // $10k USDC

    beforeEach(async function () {
        [owner, user1, user2, relayer1, relayer2] = await ethers.getSigners();

        // Deploy MockUSDC
        const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
        usdc = await MockUSDCFactory.deploy();

        // Deploy TrustBankCore
        const TrustBankCoreFactory = await ethers.getContractFactory("TrustBankCore");
        trustBankCore = await TrustBankCoreFactory.deploy(await usdc.getAddress());

        // Deploy TrustBankCrossChain
        const CrossChainFactory = await ethers.getContractFactory("TrustBankCrossChain");
        crossChainBridge = await CrossChainFactory.deploy(
            await trustBankCore.getAddress(),
            await usdc.getAddress()
        );

        // Mint tokens to users and relayers
        await usdc.mint(user1.address, INITIAL_BALANCE);
        await usdc.mint(user2.address, INITIAL_BALANCE);
        await usdc.mint(relayer1.address, INITIAL_BALANCE);
        await usdc.mint(relayer2.address, INITIAL_BALANCE);

        // Setup relayers
        await crossChainBridge.authorizeRelayer(relayer1.address, true, RELAYER_STAKE);
        await crossChainBridge.authorizeRelayer(relayer2.address, true, RELAYER_STAKE);
    });

    describe("Cross-Chain Bridge Deployment", function () {
        it("Should deploy with correct initial configuration", async function () {
            expect(await crossChainBridge.trustBankCore()).to.equal(await trustBankCore.getAddress());
            expect(await crossChainBridge.stablecoin()).to.equal(await usdc.getAddress());
            expect(await crossChainBridge.nextMessageId()).to.equal(1);
        });

        it("Should initialize Ethereum chain configuration", async function () {
            const ethereumConfig = await crossChainBridge.getChainConfig(0); // ETHEREUM
            expect(ethereumConfig.active).to.be.true;
            expect(ethereumConfig.name).to.equal("Ethereum");
            expect(ethereumConfig.chainId).to.equal(1);
            expect(ethereumConfig.bridgeFee).to.equal(25); // 0.25%
        });

        it("Should have authorized relayers", async function () {
            expect(await crossChainBridge.isRelayerAuthorized(relayer1.address)).to.be.true;
            expect(await crossChainBridge.isRelayerAuthorized(relayer2.address)).to.be.true;
            expect(await crossChainBridge.isRelayerAuthorized(user1.address)).to.be.false;
        });
    });

    describe("Chain Configuration", function () {
        it("Should configure new chains correctly", async function () {
            await crossChainBridge.configureChain(
                1, // ARBITRUM
                42161,
                await trustBankCore.getAddress(),
                await crossChainBridge.getAddress(),
                true,
                MIN_DEPOSIT,
                ethers.parseUnits("1000000", 6),
                15 // 0.15% fee
            );

            const arbitrumConfig = await crossChainBridge.getChainConfig(1);
            expect(arbitrumConfig.active).to.be.true;
            expect(arbitrumConfig.name).to.equal("Arbitrum");
            expect(arbitrumConfig.chainId).to.equal(42161);
            expect(arbitrumConfig.bridgeFee).to.equal(15);
        });

        it("Should emit ChainConfigured event", async function () {
            await expect(
                crossChainBridge.configureChain(
                    2, // OPTIMISM
                    10,
                    await trustBankCore.getAddress(),
                    await crossChainBridge.getAddress(),
                    true,
                    MIN_DEPOSIT,
                    ethers.parseUnits("500000", 6),
                    20
                )
            ).to.emit(crossChainBridge, "ChainConfigured")
                .withArgs(2, 10, await trustBankCore.getAddress(), true);
        });

        it("Should reject bridge fee above maximum", async function () {
            await expect(
                crossChainBridge.configureChain(
                    3, // POLYGON
                    137,
                    await trustBankCore.getAddress(),
                    await crossChainBridge.getAddress(),
                    true,
                    MIN_DEPOSIT,
                    ethers.parseUnits("500000", 6),
                    150 // 1.5% - above 1% maximum
                )
            ).to.be.revertedWithCustomError(crossChainBridge, "TrustBankCrossChain__InvalidAmount");
        });
    });

    describe("Cross-Chain Transfers", function () {
        beforeEach(async function () {
            // Configure destination chain
            await crossChainBridge.configureChain(
                3, // POLYGON
                137,
                await trustBankCore.getAddress(),
                await crossChainBridge.getAddress(),
                true,
                MIN_DEPOSIT,
                ethers.parseUnits("1000000", 6),
                20 // 0.20% fee
            );
        });

        it("Should initiate cross-chain transfer successfully", async function () {
            const transferAmount = ethers.parseUnits("1000", 6); // $1000 USDC
            const expectedFee = (transferAmount * 20n) / 10000n; // 0.20% fee
            const expectedNetAmount = transferAmount - expectedFee;

            await usdc.connect(user1).approve(await crossChainBridge.getAddress(), transferAmount);

            await expect(
                crossChainBridge.connect(user1).initiateCrossChainTransfer(
                    3, // POLYGON
                    user2.address,
                    transferAmount
                )
            ).to.emit(crossChainBridge, "CrossChainTransferInitiated")
                .withArgs(1, 0, 3, user1.address, user2.address, expectedNetAmount);

            // Check user's balance on destination chain tracking
            const userBalance = await crossChainBridge.userBalancesByChain(user1.address, 3);
            expect(userBalance).to.equal(expectedNetAmount);

            // Check bridge has received the full amount
            const bridgeBalance = await usdc.balanceOf(await crossChainBridge.getAddress());
            expect(bridgeBalance).to.equal(transferAmount);
        });

        it("Should reject transfer below minimum amount", async function () {
            const smallAmount = ethers.parseUnits("5", 6); // $5 - below $10 minimum

            await usdc.connect(user1).approve(await crossChainBridge.getAddress(), smallAmount);

            await expect(
                crossChainBridge.connect(user1).initiateCrossChainTransfer(
                    3, // POLYGON
                    user2.address,
                    smallAmount
                )
            ).to.be.revertedWithCustomError(crossChainBridge, "TrustBankCrossChain__InvalidAmount");
        });

        it("Should reject transfer to inactive chain", async function () {
            const transferAmount = ethers.parseUnits("1000", 6);

            await usdc.connect(user1).approve(await crossChainBridge.getAddress(), transferAmount);

            await expect(
                crossChainBridge.connect(user1).initiateCrossChainTransfer(
                    1, // ARBITRUM - not configured yet
                    user2.address,
                    transferAmount
                )
            ).to.be.revertedWithCustomError(crossChainBridge, "TrustBankCrossChain__ChainNotSupported");
        });
    });

    describe("Trust Score Synchronization", function () {
        it("Should sync trust score from another chain", async function () {
            // Build some local trust score first
            await usdc.connect(user1).approve(await trustBankCore.getAddress(), ethers.parseUnits("1000", 6));
            await trustBankCore.connect(user1).sendPayment(user2.address, ethers.parseUnits("100", 6), "Test payment");

            const localTrustScore = await trustBankCore.getUserTrustScore(user1.address);
            expect(localTrustScore).to.be.gt(0);

            // Simulate higher trust score from another chain
            const crossChainScore = localTrustScore + 500n;
            const timestamp = Math.floor(Date.now() / 1000);

            // Create message hash for verification - must match contract's format exactly
            const messageHash = ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ["address", "uint8", "uint8", "uint256", "uint256"],
                    [user1.address, 3, 0, crossChainScore, timestamp]
                )
            );

            // Get signatures from multiple relayers
            const signature1 = await relayer1.signMessage(ethers.getBytes(messageHash));
            const signature2 = await relayer2.signMessage(ethers.getBytes(messageHash));

            await expect(
                crossChainBridge.syncTrustScore(
                    user1.address,
                    3, // POLYGON
                    crossChainScore,
                    timestamp,
                    [signature1, signature2]
                )
            ).to.emit(crossChainBridge, "TrustScoreSynced")
                .withArgs(user1.address, 3, crossChainScore);

            // Check aggregated trust score
            const aggregatedScore = await crossChainBridge.getAggregatedTrustScore(user1.address);
            expect(aggregatedScore).to.equal(crossChainScore);
        });

        it("Should return higher of local vs cross-chain trust score", async function () {
            // Set low cross-chain score
            const lowCrossChainScore = 50n; // Set lower score
            const timestamp = Math.floor(Date.now() / 1000);
            const messageHash = ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ["address", "uint8", "uint8", "uint256", "uint256"],
                    [user1.address, 1, 0, lowCrossChainScore, timestamp]
                )
            );

            const signature1 = await relayer1.signMessage(ethers.getBytes(messageHash));
            const signature2 = await relayer2.signMessage(ethers.getBytes(messageHash));

            await crossChainBridge.syncTrustScore(user1.address, 1, lowCrossChainScore, timestamp, [signature1, signature2]);

            // Build higher local trust score
            await usdc.connect(user1).approve(await trustBankCore.getAddress(), ethers.parseUnits("5000", 6));
            for (let i = 0; i < 5; i++) {
                await trustBankCore.connect(user1).sendPayment(user2.address, ethers.parseUnits("200", 6), `Payment ${i}`);
            }

            const localScore = await trustBankCore.getUserTrustScore(user1.address);
            const aggregatedScore = await crossChainBridge.getAggregatedTrustScore(user1.address);

            // Should return the higher local score
            expect(aggregatedScore).to.equal(localScore);
            expect(localScore).to.be.gt(lowCrossChainScore);
        });

        it("Should reject trust score sync with insufficient signatures", async function () {
            const trustScore = 500n;
            const timestamp = Math.floor(Date.now() / 1000);
            const messageHash = ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ["address", "uint8", "uint8", "uint256", "uint256"],
                    [user1.address, 2, 0, trustScore, timestamp]
                )
            );

            const signature1 = await relayer1.signMessage(ethers.getBytes(messageHash));

            // Only one signature when 2 are required
            await expect(
                crossChainBridge.syncTrustScore(user1.address, 2, trustScore, timestamp, [signature1])
            ).to.be.revertedWithCustomError(crossChainBridge, "TrustBankCrossChain__InvalidSignature");
        });
    });

    describe("Relayer Management", function () {
        it("Should authorize new relayers", async function () {
            const [, , , , , newRelayer] = await ethers.getSigners();

            await expect(
                crossChainBridge.authorizeRelayer(newRelayer.address, true, RELAYER_STAKE)
            ).to.emit(crossChainBridge, "RelayerAuthorized")
                .withArgs(newRelayer.address, RELAYER_STAKE, true);

            expect(await crossChainBridge.isRelayerAuthorized(newRelayer.address)).to.be.true;
        });

        it("Should deauthorize existing relayers", async function () {
            await crossChainBridge.authorizeRelayer(relayer1.address, false, 0);
            expect(await crossChainBridge.isRelayerAuthorized(relayer1.address)).to.be.false;
        });

        it("Should reject authorization with insufficient stake", async function () {
            const [, , , , , newRelayer] = await ethers.getSigners();
            const lowStake = ethers.parseUnits("5000", 6); // Below $10k requirement

            await expect(
                crossChainBridge.authorizeRelayer(newRelayer.address, true, lowStake)
            ).to.be.revertedWithCustomError(crossChainBridge, "TrustBankCrossChain__InvalidAmount");
        });
    });

    describe("Aggregated Balance Tracking", function () {
        beforeEach(async function () {
            // Configure multiple chains
            await crossChainBridge.configureChain(1, 42161, await trustBankCore.getAddress(), await crossChainBridge.getAddress(), true, MIN_DEPOSIT, ethers.parseUnits("1000000", 6), 15);
            await crossChainBridge.configureChain(3, 137, await trustBankCore.getAddress(), await crossChainBridge.getAddress(), true, MIN_DEPOSIT, ethers.parseUnits("1000000", 6), 20);
        });

        it("Should track user balances across multiple chains", async function () {
            const amount1 = ethers.parseUnits("1000", 6);
            const amount2 = ethers.parseUnits("2000", 6);

            // Transfer to Arbitrum
            await usdc.connect(user1).approve(await crossChainBridge.getAddress(), amount1);
            await crossChainBridge.connect(user1).initiateCrossChainTransfer(1, user1.address, amount1);

            // Transfer to Polygon  
            await usdc.connect(user1).approve(await crossChainBridge.getAddress(), amount2);
            await crossChainBridge.connect(user1).initiateCrossChainTransfer(3, user1.address, amount2);

            // Check individual chain balances (minus fees)
            const arbitrumBalance = await crossChainBridge.userBalancesByChain(user1.address, 1);
            const polygonBalance = await crossChainBridge.userBalancesByChain(user1.address, 3);

            const arbitrumFee = (amount1 * 15n) / 10000n;
            const polygonFee = (amount2 * 20n) / 10000n;

            expect(arbitrumBalance).to.equal(amount1 - arbitrumFee);
            expect(polygonBalance).to.equal(amount2 - polygonFee);

            // Check aggregated balance
            const localBalance = await usdc.balanceOf(user1.address);
            const totalAggregated = await crossChainBridge.getAggregatedBalance(user1.address);

            expect(totalAggregated).to.equal(localBalance + arbitrumBalance + polygonBalance);
        });
    });

    describe("Security Features", function () {
        it("Should only allow owner to configure chains", async function () {
            await expect(
                crossChainBridge.connect(user1).configureChain(
                    4, // AVALANCHE
                    43114,
                    await trustBankCore.getAddress(),
                    await crossChainBridge.getAddress(),
                    true,
                    MIN_DEPOSIT,
                    ethers.parseUnits("1000000", 6),
                    25
                )
            ).to.be.revertedWithCustomError(crossChainBridge, "OwnableUnauthorizedAccount");
        });

        it("Should only allow owner to authorize relayers", async function () {
            const [, , , , , newRelayer] = await ethers.getSigners();

            await expect(
                crossChainBridge.connect(user1).authorizeRelayer(newRelayer.address, true, RELAYER_STAKE)
            ).to.be.revertedWithCustomError(crossChainBridge, "OwnableUnauthorizedAccount");
        });

        it("Should validate relayer signatures properly", async function () {
            const invalidSigner = user1; // Not an authorized relayer
            const trustScore = 500n;

            const messageHash = ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ["address", "uint8", "uint8", "uint256", "uint256"],
                    [user2.address, 1, 0, trustScore, Math.floor(Date.now() / 1000)]
                )
            );

            const invalidSignature = await invalidSigner.signMessage(ethers.getBytes(messageHash));
            const validSignature = await relayer1.signMessage(ethers.getBytes(messageHash));

            // Should fail with invalid signature
            await expect(
                crossChainBridge.syncTrustScore(user2.address, 1, trustScore, Math.floor(Date.now() / 1000), [invalidSignature, validSignature])
            ).to.be.revertedWithCustomError(crossChainBridge, "TrustBankCrossChain__RelayerNotAuthorized");
        });
    });
});
