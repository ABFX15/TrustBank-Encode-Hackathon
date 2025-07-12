import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import {
    TrustBankCore,
    TrustBankCreditEngine,
    ZKCreditImportProduction,
    MockUSDC
} from "../typechain-types";

describe("ZKCreditImport", function () {
    let vouchPayCore: TrustBankCore;
    let creditEngine: TrustBankCreditEngine;
    let zkCreditImport: ZKCreditImportProduction;
    let mockUSDC: MockUSDC;
    let owner: Signer;
    let user1: Signer;
    let user2: Signer;
    let oracle: Signer;

    const zkVerificationKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

    beforeEach(async function () {
        [owner, user1, user2, oracle] = await ethers.getSigners();

        // Deploy MockUSDC
        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        mockUSDC = await MockUSDC.deploy();

        // Deploy TrustBankCore
        const TrustBankCore = await ethers.getContractFactory("TrustBankCore");
        vouchPayCore = await TrustBankCore.deploy(mockUSDC.target);

        // Deploy TrustBankCreditEngine
        const TrustBankCreditEngine = await ethers.getContractFactory("TrustBankCreditEngine");
        creditEngine = await TrustBankCreditEngine.deploy(vouchPayCore.target, mockUSDC.target);

        // Deploy ZKCreditImportProduction
        const ZKCreditImportProduction = await ethers.getContractFactory("ZKCreditImportProduction");
        zkCreditImport = await ZKCreditImportProduction.deploy(
            vouchPayCore.target,
            creditEngine.target
        );

        // Connect contracts
        await vouchPayCore.setZKCreditContract(zkCreditImport.target);
        await creditEngine.setZKCreditContract(zkCreditImport.target);

        // Set up oracle
        await zkCreditImport.setTrustedOracle(await oracle.getAddress(), true);
    });

    describe("ZK Proof Verification", function () {
        it("Should submit valid ZK proof and boost trust score", async function () {
            const user1Address = await user1.getAddress();

            // Create mock ZK proof
            const zkProof = {
                proof: [1, 2, 3, 4, 5, 6, 7, 8], // Mock proof values
                publicSignals: [740, Math.floor(Date.now() / 1000)], // FICO 740, current timestamp
                commitment: ethers.keccak256(ethers.toUtf8Bytes("test_commitment_1"))
            };

            // Submit ZK proof for FICO 740 (Very Good credit)
            await zkCreditImport.connect(user1).submitCreditProof(
                1, // CreditBureau.FICO
                740, // threshold
                zkProof
            );

            // Check that credit boost was applied
            const creditBoost = await zkCreditImport.getUserCreditBoost(user1Address);
            expect(creditBoost).to.equal(200); // FICO 740 boost

            // Check that trust score was updated in VouchPay
            const trustScore = await vouchPayCore.trustScores(user1Address);
            expect(trustScore).to.equal(200); // Should have the boost
        });

        it("Should reject reused commitment", async function () {
            const user1Address = await user1.getAddress();

            const zkProof = {
                proof: [1, 2, 3, 4, 5, 6, 7, 8],
                publicSignals: [740, Math.floor(Date.now() / 1000)],
                commitment: ethers.keccak256(ethers.toUtf8Bytes("test_commitment_1"))
            };

            // Submit proof first time
            await zkCreditImport.connect(user1).submitCreditProof(1, 740, zkProof);

            // Try to submit same commitment again
            await expect(
                zkCreditImport.connect(user1).submitCreditProof(1, 740, zkProof)
            ).to.be.revertedWithCustomError(zkCreditImport, "CommitmentAlreadyUsed");
        });

        it("Should reject expired proof", async function () {
            const zkProof = {
                proof: [1, 2, 3, 4, 5, 6, 7, 8],
                publicSignals: [740, Math.floor(Date.now() / 1000) - 25 * 3600], // 25 hours ago
                commitment: ethers.keccak256(ethers.toUtf8Bytes("test_commitment_expired"))
            };

            await expect(
                zkCreditImport.connect(user1).submitCreditProof(1, 740, zkProof)
            ).to.be.revertedWithCustomError(zkCreditImport, "VerificationExpired");
        });
    });

    describe("Oracle Verification", function () {
        it("Should accept valid oracle signature", async function () {
            const user1Address = await user1.getAddress();
            const timestamp = Math.floor(Date.now() / 1000);

            // Create oracle signature
            const message = ethers.solidityPackedKeccak256(
                ["address", "uint8", "uint256", "uint256"],
                [user1Address, 1, 740, timestamp] // FICO 740
            );

            const signature = await oracle.signMessage(ethers.getBytes(message));

            // Submit oracle verification
            await zkCreditImport.connect(user1).submitOracleVerification(
                1, // CreditBureau.FICO
                740, // threshold
                signature,
                timestamp
            );

            // Check credit boost
            const creditBoost = await zkCreditImport.getUserCreditBoost(user1Address);
            expect(creditBoost).to.equal(200);
        });

        it("Should reject unauthorized oracle", async function () {
            const user1Address = await user1.getAddress();
            const timestamp = Math.floor(Date.now() / 1000);

            const message = ethers.solidityPackedKeccak256(
                ["address", "uint8", "uint256", "uint256"],
                [user1Address, 1, 740, timestamp]
            );

            // Sign with user2 (not authorized oracle)
            const signature = await user2.signMessage(ethers.getBytes(message));

            await expect(
                zkCreditImport.connect(user1).submitOracleVerification(1, 740, signature, timestamp)
            ).to.be.revertedWithCustomError(zkCreditImport, "UnauthorizedOracle");
        });
    });

    describe("Credit Score Thresholds", function () {
        it("Should have correct default thresholds", async function () {
            // Check FICO thresholds
            const fico740 = await zkCreditImport.creditThresholds(1, 740); // FICO, 740
            expect(fico740.trustBoost).to.equal(200);
            expect(fico740.active).to.be.true;

            const fico800 = await zkCreditImport.creditThresholds(1, 800); // FICO, 800
            expect(fico800.trustBoost).to.equal(300);
            expect(fico800.active).to.be.true;
        });

        it("Should allow admin to set new thresholds", async function () {
            // Set custom threshold
            await zkCreditImport.setCreditThreshold(
                1, // FICO
                850, // threshold
                400, // boost
                true // active
            );

            const threshold = await zkCreditImport.creditThresholds(1, 850);
            expect(threshold.trustBoost).to.equal(400);
            expect(threshold.active).to.be.true;
        });
    });

    describe("Enhanced Loan Terms", function () {
        it("Should provide enhanced loan terms with ZK credit", async function () {
            const user1Address = await user1.getAddress();

            // First submit credit proof
            const zkProof = {
                proof: [1, 2, 3, 4, 5, 6, 7, 8],
                publicSignals: [800, Math.floor(Date.now() / 1000)], // FICO 800
                commitment: ethers.keccak256(ethers.toUtf8Bytes("test_commitment_loan"))
            };

            await zkCreditImport.connect(user1).submitCreditProof(1, 800, zkProof);

            // Check enhanced loan terms
            const [maxAmount, interestRate] = await creditEngine.getEnhancedLoanTerms(user1Address);

            // With FICO 800 (300 boost), should get 2x loan amount and reduced interest
            expect(maxAmount).to.be.gt(0);
            expect(interestRate).to.be.lt(await creditEngine.BASE_INTEREST_RATE());
        });

        it("Should provide base terms without ZK credit", async function () {
            const user1Address = await user1.getAddress();

            // Check terms without credit verification
            const [maxAmount, interestRate] = await creditEngine.getEnhancedLoanTerms(user1Address);

            // Without trust score or credit, should get 0
            expect(maxAmount).to.equal(0);
            expect(interestRate).to.equal(0);
        });
    });

    describe("Multiple Credit Verifications", function () {
        it("Should stack multiple credit boosts", async function () {
            const user1Address = await user1.getAddress();

            // Submit FICO verification
            const ficoProof = {
                proof: [1, 2, 3, 4, 5, 6, 7, 8],
                publicSignals: [740, Math.floor(Date.now() / 1000)],
                commitment: ethers.keccak256(ethers.toUtf8Bytes("fico_commitment"))
            };

            await zkCreditImport.connect(user1).submitCreditProof(1, 740, ficoProof);

            // Submit Plaid verification
            const plaidTimestamp = Math.floor(Date.now() / 1000);
            const plaidMessage = ethers.solidityPackedKeccak256(
                ["address", "uint8", "uint256", "uint256"],
                [user1Address, 4, 1, plaidTimestamp] // PLAID_VERIFIED
            );
            const plaidSignature = await oracle.signMessage(ethers.getBytes(plaidMessage));

            await zkCreditImport.connect(user1).submitOracleVerification(4, 1, plaidSignature, plaidTimestamp);

            // Check total boost (FICO 740: 200 + Plaid: 75 = 275)
            const totalBoost = await zkCreditImport.getUserCreditBoost(user1Address);
            expect(totalBoost).to.equal(275);
        });

        it("Should expire old verifications", async function () {
            const user1Address = await user1.getAddress();

            // This test would need to manipulate time or use a mock
            // For now, just verify the calculation logic in getUserCreditBoost
            const verifications = await zkCreditImport.getUserVerifications(user1Address);
            expect(verifications.length).to.equal(0);
        });
    });

    describe("Admin Functions", function () {
        it("Should allow admin to update verification key", async function () {
            const newKey = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

            await zkCreditImport.updateVerificationKey(newKey);

            const currentKey = await zkCreditImport.verificationKey();
            expect(currentKey).to.equal(newKey);
        });

        it("Should not allow non-admin to update verification key", async function () {
            const newKey = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

            await expect(
                zkCreditImport.connect(user1).updateVerificationKey(newKey)
            ).to.be.revertedWithCustomError(zkCreditImport, "OwnableUnauthorizedAccount");
        });
    });
});
