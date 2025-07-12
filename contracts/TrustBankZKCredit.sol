// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./TrustBankCore.sol";
import "./TrustBankCreditEngine.sol";

/**
 * @title TrustBank ZK Credit Import (ZKCryptoReputation)
 * @author ABFX15
 * @dev Enables privacy-preserving crypto reputation verification using ZK-proofs for TrustBank
 *
 * This contract allows TrustBank users to prove their on-chain DeFi activity and reputation
 * without revealing specific transaction details. Users build decentralized credit
 * scores through verified crypto activities across multiple protocols and chains.
 */
contract TrustBankZKCredit is Ownable {
    using ECDSA for bytes32;

    // Simplified crypto reputation metrics for hackathon demo
    enum ReputationMetric {
        DEFI_TVL, // Total Value Locked in DeFi protocols
        LENDING_HISTORY, // Successful loan repayments
        WALLET_AGE // Age of wallet with activity
    }

    struct ReputationThreshold {
        uint256 minValue;
        uint256 trustBoost;
        bool active;
    }

    struct ZKProof {
        uint256[8] proof; // Groth16 proof (simplified for demo)
        uint256[2] publicSignals; // [metric_value, timestamp]
        bytes32 commitment; // Commitment to the actual activity data
    }

    struct CryptoVerification {
        address user;
        ReputationMetric metric;
        uint256 threshold;
        uint256 trustBoost;
        uint256 verifiedAt;
        bool active;
        bytes32 commitment;
        string ipfsProof; // IPFS hash for additional proof data
    }

    // State variables
    TrustBankCore public immutable i_trustBank;
    TrustBankCreditEngine public immutable i_creditEngine;

    // Crypto reputation configurations
    mapping(ReputationMetric => mapping(uint256 => ReputationThreshold))
        public reputationThresholds;
    mapping(address => CryptoVerification[]) public userVerifications;
    mapping(bytes32 => bool) public usedCommitments; // Prevent double spending

    // ZK verification key (in production, this would be more complex)
    bytes32 public verificationKey;

    // Trusted data providers (Chainlink, The Graph, etc.)
    mapping(address => bool) public trustedDataProviders;

    // Protocol verification contracts (for cross-verification)
    mapping(string => address) public protocolVerifiers; // e.g., "aave", "compound", "uniswap"

    // Constants for time windows and verification validity
    uint256 public constant VERIFICATION_EXPIRY_TIME = 24 hours;
    uint256 public constant VERIFICATION_VALIDITY_PERIOD = 180 days;

    // DeFi TVL thresholds (in USDC/6 decimals)
    uint256 public constant TVL_TIER_1_THRESHOLD = 10_000e6; // $10k
    uint256 public constant TVL_TIER_2_THRESHOLD = 50_000e6; // $50k
    uint256 public constant TVL_TIER_3_THRESHOLD = 100_000e6; // $100k

    // DeFi TVL trust boosts
    uint256 public constant TVL_TIER_1_BOOST = 100;
    uint256 public constant TVL_TIER_2_BOOST = 200;
    uint256 public constant TVL_TIER_3_BOOST = 400;

    // Lending history thresholds (number of successful loans)
    uint256 public constant LENDING_TIER_1_THRESHOLD = 5;
    uint256 public constant LENDING_TIER_2_THRESHOLD = 20;
    uint256 public constant LENDING_TIER_3_THRESHOLD = 50;

    // Lending history trust boosts
    uint256 public constant LENDING_TIER_1_BOOST = 75;
    uint256 public constant LENDING_TIER_2_BOOST = 150;
    uint256 public constant LENDING_TIER_3_BOOST = 300;

    // Wallet age thresholds (in days)
    uint256 public constant WALLET_AGE_TIER_1_THRESHOLD = 365; // 1 year
    uint256 public constant WALLET_AGE_TIER_2_THRESHOLD = 730; // 2 years
    uint256 public constant WALLET_AGE_TIER_3_THRESHOLD = 1095; // 3 years

    // Wallet age trust boosts
    uint256 public constant WALLET_AGE_TIER_1_BOOST = 50;
    uint256 public constant WALLET_AGE_TIER_2_BOOST = 100;
    uint256 public constant WALLET_AGE_TIER_3_BOOST = 150;

    // Events
    event ReputationThresholdSet(
        ReputationMetric indexed metric,
        uint256 threshold,
        uint256 trustBoost
    );
    event CryptoReputationVerified(
        address indexed user,
        ReputationMetric indexed metric,
        uint256 threshold,
        uint256 trustBoost
    );
    event TrustBoostApplied(
        address indexed user,
        uint256 boost,
        uint256 newTrustScore
    );
    event ProtocolVerifierAdded(string indexed protocol, address verifier);

    event TrustedDataProvicerSet(address indexed dataProvider, bool trusted);

    // Errors
    error InvalidProof();
    error CommitmentAlreadyUsed();
    error ThresholdNotSupported();
    error VerificationExpired();
    error UnauthorizedOracle();

    constructor(
        address _trustBank,
        address _creditEngine,
        bytes32 _verificationKey
    ) Ownable(msg.sender) {
        i_trustBank = TrustBankCore(_trustBank);
        i_creditEngine = TrustBankCreditEngine(_creditEngine);
        verificationKey = _verificationKey;

        // Initialize default credit thresholds
        _initializeDefaultThresholds();
    }

    /**
     * @dev Submit ZK-proof to verify crypto reputation metric meets threshold
     * @param metric Type of crypto reputation metric
     * @param threshold Minimum value threshold to prove
     * @param zkProof ZK-SNARK proof data
     * @param ipfsProof IPFS hash for additional proof data (optional)
     */
    function submitReputationProof(
        ReputationMetric metric,
        uint256 threshold,
        ZKProof calldata zkProof,
        string calldata ipfsProof
    ) external {
        // Validate threshold is supported
        ReputationThreshold memory thresholdConfig = reputationThresholds[
            metric
        ][threshold];
        if (!thresholdConfig.active) revert ThresholdNotSupported();

        // Prevent commitment reuse
        if (usedCommitments[zkProof.commitment]) revert CommitmentAlreadyUsed();

        // Verify ZK proof
        if (!_verifyZKProof(zkProof, threshold)) revert InvalidProof();

        // Check proof timestamp (24 hour validity)
        if (
            block.timestamp - zkProof.publicSignals[1] >
            VERIFICATION_EXPIRY_TIME
        ) {
            revert VerificationExpired();
        }

        // Mark commitment as used
        usedCommitments[zkProof.commitment] = true;

        // Record verification
        userVerifications[msg.sender].push(
            CryptoVerification({
                user: msg.sender,
                metric: metric,
                threshold: threshold,
                trustBoost: thresholdConfig.trustBoost,
                verifiedAt: block.timestamp,
                active: true,
                commitment: zkProof.commitment,
                ipfsProof: ipfsProof
            })
        );

        // Apply trust boost
        _applyTrustBoost(msg.sender, thresholdConfig.trustBoost);

        emit CryptoReputationVerified(
            msg.sender,
            metric,
            threshold,
            thresholdConfig.trustBoost
        );
    }

    /**
     * @dev Submit data provider signed verification (alternative to ZK)
     * @param metric Reputation metric type
     * @param threshold Verified threshold
     * @param signature Data provider signature
     * @param timestamp Verification timestamp
     * @param ipfsProof IPFS hash for additional proof data
     */
    function submitDataProviderVerification(
        ReputationMetric metric,
        uint256 threshold,
        bytes calldata signature,
        uint256 timestamp,
        string calldata ipfsProof
    ) external {
        // Validate threshold
        ReputationThreshold memory thresholdConfig = reputationThresholds[
            metric
        ][threshold];
        if (!thresholdConfig.active) revert ThresholdNotSupported();

        // Verify data provider signature
        bytes32 message = keccak256(
            abi.encodePacked(msg.sender, metric, threshold, timestamp)
        );
        bytes32 ethSignedMessage = MessageHashUtils.toEthSignedMessageHash(
            message
        );
        address dataProvider = ECDSA.recover(ethSignedMessage, signature);

        if (!trustedDataProviders[dataProvider]) revert UnauthorizedOracle();

        // Check timestamp validity
        if (block.timestamp - timestamp > VERIFICATION_EXPIRY_TIME)
            revert VerificationExpired();

        // Record verification
        bytes32 commitment = keccak256(
            abi.encodePacked(msg.sender, threshold, timestamp)
        );
        if (usedCommitments[commitment]) revert CommitmentAlreadyUsed();
        usedCommitments[commitment] = true;

        userVerifications[msg.sender].push(
            CryptoVerification({
                user: msg.sender,
                metric: metric,
                threshold: threshold,
                trustBoost: thresholdConfig.trustBoost,
                verifiedAt: block.timestamp,
                active: true,
                commitment: commitment,
                ipfsProof: ipfsProof
            })
        );

        // Apply trust boost
        _applyTrustBoost(msg.sender, thresholdConfig.trustBoost);

        emit CryptoReputationVerified(
            msg.sender,
            metric,
            threshold,
            thresholdConfig.trustBoost
        );
    }

    /**
     * @dev Get total crypto reputation boost for a user
     * @param user Address to check
     * @return Total trust score boost from verified crypto activities
     */
    function getUserCryptoBoost(address user) external view returns (uint256) {
        uint256 totalBoost = 0;
        CryptoVerification[] memory verifications = userVerifications[user];

        for (uint256 i = 0; i < verifications.length; i++) {
            if (
                verifications[i].active &&
                block.timestamp - verifications[i].verifiedAt <
                VERIFICATION_VALIDITY_PERIOD
            ) {
                totalBoost += verifications[i].trustBoost;
            }
        }

        return totalBoost;
    }

    /**
     * @dev Get user's reputation score (alias for getUserCryptoBoost)
     * @param user Address to check
     * @return Total reputation score
     */
    function getReputationScore(address user) external view returns (uint256) {
        return this.getUserCryptoBoost(user);
    }

    /**
     * @dev Get user's crypto reputation verifications
     * @param user Address to check
     * @return Array of crypto verifications
     */
    function getUserVerifications(
        address user
    ) external view returns (CryptoVerification[] memory) {
        return userVerifications[user];
    }

    /**
     * @dev Set reputation threshold configuration (admin only)
     * @param metric Reputation metric
     * @param threshold Value threshold
     * @param trustBoost Trust boost amount
     * @param active Whether threshold is active
     */
    function setReputationThreshold(
        ReputationMetric metric,
        uint256 threshold,
        uint256 trustBoost,
        bool active
    ) external onlyOwner {
        reputationThresholds[metric][threshold] = ReputationThreshold({
            minValue: threshold,
            trustBoost: trustBoost,
            active: active
        });

        emit ReputationThresholdSet(metric, threshold, trustBoost);
    }

    /**
     * @dev Add/remove trusted data provider
     * @param dataProvider Data provider address (Chainlink, The Graph, etc.)
     * @param trusted Whether provider is trusted
     */
    function setTrustedDataProvider(
        address dataProvider,
        bool trusted
    ) external onlyOwner {
        trustedDataProviders[dataProvider] = trusted;

        emit TrustedDataProvicerSet(dataProvider, trusted);
    }

    /**
     * @dev Add protocol verifier contract
     * @param protocol Protocol name (e.g., "aave", "compound", "uniswap")
     * @param verifier Verifier contract address
     */
    function addProtocolVerifier(
        string calldata protocol,
        address verifier
    ) external onlyOwner {
        protocolVerifiers[protocol] = verifier;
        emit ProtocolVerifierAdded(protocol, verifier);
    }

    /**
     * @dev Update verification key for ZK proofs
     * @param newKey New verification key
     */
    function updateVerificationKey(bytes32 newKey) external onlyOwner {
        verificationKey = newKey;
    }

    /**
     * @dev Verify ZK proof (simplified for demo)
     * In production, this would use a proper ZK library like circomlib
     */
    function _verifyZKProof(
        ZKProof calldata zkProof,
        uint256 threshold
    ) internal view returns (bool) {
        // Simplified verification - in production use proper ZK verification
        // This would validate the Groth16 proof against the verification key

        // Check public signals match expected values
        if (zkProof.publicSignals[0] != threshold) return false;

        // Verify proof components are non-zero (basic sanity check)
        for (uint256 i = 0; i < 8; i++) {
            if (zkProof.proof[i] == 0) return false;
        }

        // In production: use proper pairing checks with verification key
        bytes32 proofHash = keccak256(abi.encodePacked(zkProof.proof));
        bytes32 expectedHash = keccak256(
            abi.encodePacked(verificationKey, threshold)
        );

        return proofHash != bytes32(0) && expectedHash != bytes32(0);
    }

    /**
     * @dev Apply trust boost to user's score
     */
    function _applyTrustBoost(address user, uint256 boost) internal {
        // Apply boost through TrustBank contract
        i_trustBank.applyCreditBoost(user, boost);

        // Get updated trust score for event
        uint256 newScore = i_trustBank.getTotalTrustScore(user);
        emit TrustBoostApplied(user, boost, newScore);
    }

    /**
     * @dev Initialize default crypto reputation thresholds (simplified for hackathon)
     */
    function _initializeDefaultThresholds() internal {
        // DeFi TVL thresholds - shows user has skin in the game
        reputationThresholds[ReputationMetric.DEFI_TVL][
            TVL_TIER_1_THRESHOLD
        ] = ReputationThreshold(
            TVL_TIER_1_THRESHOLD,
            TVL_TIER_1_BOOST,
            true // $10k TVL → 100 boost
        );
        reputationThresholds[ReputationMetric.DEFI_TVL][
            TVL_TIER_2_THRESHOLD
        ] = ReputationThreshold(
            TVL_TIER_2_THRESHOLD,
            TVL_TIER_2_BOOST,
            true // $50k TVL → 200 boost
        );
        reputationThresholds[ReputationMetric.DEFI_TVL][
            TVL_TIER_3_THRESHOLD
        ] = ReputationThreshold(
            TVL_TIER_3_THRESHOLD,
            TVL_TIER_3_BOOST,
            true // $100k TVL → 400 boost
        );

        // Lending history - successful loan repayments
        reputationThresholds[ReputationMetric.LENDING_HISTORY][
            LENDING_TIER_1_THRESHOLD
        ] = ReputationThreshold(
            LENDING_TIER_1_THRESHOLD,
            LENDING_TIER_1_BOOST,
            true // 5 successful loans → 75 boost
        );
        reputationThresholds[ReputationMetric.LENDING_HISTORY][
            LENDING_TIER_2_THRESHOLD
        ] = ReputationThreshold(
            LENDING_TIER_2_THRESHOLD,
            LENDING_TIER_2_BOOST,
            true // 20 successful loans → 150 boost
        );
        reputationThresholds[ReputationMetric.LENDING_HISTORY][
            LENDING_TIER_3_THRESHOLD
        ] = ReputationThreshold(
            LENDING_TIER_3_THRESHOLD,
            LENDING_TIER_3_BOOST,
            true // 50 successful loans → 300 boost
        );

        // Wallet age - days since first transaction
        reputationThresholds[ReputationMetric.WALLET_AGE][
            WALLET_AGE_TIER_1_THRESHOLD
        ] = ReputationThreshold(
            WALLET_AGE_TIER_1_THRESHOLD,
            WALLET_AGE_TIER_1_BOOST,
            true // 1 year old wallet → 50 boost
        );
        reputationThresholds[ReputationMetric.WALLET_AGE][
            WALLET_AGE_TIER_2_THRESHOLD
        ] = ReputationThreshold(
            WALLET_AGE_TIER_2_THRESHOLD,
            WALLET_AGE_TIER_2_BOOST,
            true // 2 years old wallet → 100 boost
        );
        reputationThresholds[ReputationMetric.WALLET_AGE][
            WALLET_AGE_TIER_3_THRESHOLD
        ] = ReputationThreshold(
            WALLET_AGE_TIER_3_THRESHOLD,
            WALLET_AGE_TIER_3_BOOST,
            true // 3+ year old wallet → 150 boost
        );
    }

    /**
     * SIMPLIFIED CRYPTO REPUTATION METRICS (TrustBank Demo):
     *
     * 1. DEFI_TVL: Total Value Locked across DeFi protocols
     *    - Proves user has significant skin in the game
     *    - Thresholds: TVL_TIER_1_THRESHOLD ($10k → TVL_TIER_1_BOOST),
     *                  TVL_TIER_2_THRESHOLD ($50k → TVL_TIER_2_BOOST),
     *                  TVL_TIER_3_THRESHOLD ($100k → TVL_TIER_3_BOOST)
     *    - Higher TVL = more crypto expertise and commitment
     *
     * 2. LENDING_HISTORY: Number of successful loan repayments
     *    - Shows reliable borrowing behavior in DeFi
     *    - Thresholds: LENDING_TIER_1_THRESHOLD (5 loans → LENDING_TIER_1_BOOST),
     *                  LENDING_TIER_2_THRESHOLD (20 loans → LENDING_TIER_2_BOOST),
     *                  LENDING_TIER_3_THRESHOLD (50 loans → LENDING_TIER_3_BOOST)
     *    - Proven track record of debt repayment
     *
     * 3. WALLET_AGE: Days since first on-chain transaction
     *    - Older wallets with consistent activity show stability
     *    - Thresholds: WALLET_AGE_TIER_1_THRESHOLD (1 year → WALLET_AGE_TIER_1_BOOST),
     *                  WALLET_AGE_TIER_2_THRESHOLD (2 years → WALLET_AGE_TIER_2_BOOST),
     *                  WALLET_AGE_TIER_3_THRESHOLD (3+ years → WALLET_AGE_TIER_3_BOOST)
     *    - Demonstrates long-term crypto participation
     *
     * Verification validity: VERIFICATION_VALIDITY_PERIOD (180 days)
     * Proof expiry: VERIFICATION_EXPIRY_TIME (24 hours)
     *
     * These three core metrics provide a solid foundation for crypto reputation scoring
     * while keeping TrustBank's system simple and hackathon-friendly.
     */
}
