// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./TrustBankCore.sol";

/**
 * @title TrustBankCrossChain
 * @dev Cross-chain infrastructure for TrustBank protocol
 *
 * Enables:
 * - Cross-chain asset transfers
 * - Trust score synchronization across chains
 * - Cross-chain liquidity aggregation
 * - Multi-chain yield farming
 */
contract TrustBankCrossChain is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // Custom errors
    error TrustBankCrossChain__InvalidChainId();
    error TrustBankCrossChain__InvalidRelayer();
    error TrustBankCrossChain__InvalidSignature();
    error TrustBankCrossChain__MessageAlreadyProcessed();
    error TrustBankCrossChain__InsufficientBalance();
    error TrustBankCrossChain__BridgeNotActive();
    error TrustBankCrossChain__InvalidAmount();
    error TrustBankCrossChain__ChainNotSupported();
    error TrustBankCrossChain__RelayerNotAuthorized();

    // Supported chains
    enum SupportedChain {
        ETHEREUM,
        ARBITRUM,
        OPTIMISM,
        POLYGON,
        AVALANCHE,
        BASE,
        BSC
    }

    // Cross-chain message types
    enum MessageType {
        ASSET_TRANSFER,
        TRUST_SCORE_SYNC,
        LIQUIDITY_BRIDGE,
        YIELD_CLAIM
    }

    // Cross-chain message structure
    struct CrossChainMessage {
        uint256 messageId;
        SupportedChain sourceChain;
        SupportedChain destinationChain;
        MessageType messageType;
        address sender;
        address receiver;
        uint256 amount;
        bytes data;
        uint256 timestamp;
        bool processed;
    }

    // Chain configuration
    struct ChainConfig {
        string name;
        uint256 chainId;
        address trustBankCore;
        address bridgeContract;
        bool active;
        uint256 minTransferAmount;
        uint256 maxTransferAmount;
        uint256 bridgeFee; // In basis points
    }

    // Relayer configuration
    struct RelayerConfig {
        address relayer;
        bool authorized;
        uint256 stake;
        uint256 reputationScore;
    }

    // State variables
    TrustBankCore public immutable trustBankCore;
    IERC20 public immutable stablecoin;

    mapping(SupportedChain => ChainConfig) public chainConfigs;
    mapping(address => RelayerConfig) public relayers;
    mapping(bytes32 => bool) public processedMessages;
    mapping(address => mapping(SupportedChain => uint256))
        public userBalancesByChain;
    mapping(address => uint256) public aggregatedTrustScores;

    uint256 public nextMessageId = 1;
    uint256 public totalBridgedAmount;
    uint256 public constant BASIS_POINTS_DIVISOR = 10000;
    uint256 public constant MIN_RELAYER_STAKE = 10000e6; // $10,000 USDC
    uint256 public constant MAX_BRIDGE_FEE = 100; // 1% max fee
    uint256 public constant MESSAGE_EXPIRY_TIME = 7 days;
    uint256 public constant MIN_CONFIRMATIONS = 2; // Minimum relayer confirmations

    // Events
    event CrossChainTransferInitiated(
        uint256 indexed messageId,
        SupportedChain indexed sourceChain,
        SupportedChain indexed destinationChain,
        address sender,
        address receiver,
        uint256 amount
    );
    event CrossChainTransferCompleted(
        uint256 indexed messageId,
        address indexed receiver,
        uint256 amount
    );
    event TrustScoreSynced(
        address indexed user,
        SupportedChain indexed fromChain,
        uint256 newTrustScore
    );
    event ChainConfigured(
        SupportedChain indexed chain,
        uint256 chainId,
        address trustBankCore,
        bool active
    );
    event RelayerAuthorized(
        address indexed relayer,
        uint256 stake,
        bool authorized
    );
    event LiquidityBridged(
        SupportedChain indexed fromChain,
        SupportedChain indexed toChain,
        uint256 amount
    );

    constructor(
        address _trustBankCore,
        address _stablecoin
    ) Ownable(msg.sender) {
        trustBankCore = TrustBankCore(_trustBankCore);
        stablecoin = IERC20(_stablecoin);

        // Initialize current chain
        _initializeChainConfigs();
    }

    /**
     * @dev Initiate cross-chain asset transfer
     * @param destinationChain Target chain for transfer
     * @param receiver Receiver address on destination chain
     * @param amount Amount to transfer
     */
    function initiateCrossChainTransfer(
        SupportedChain destinationChain,
        address receiver,
        uint256 amount
    ) external nonReentrant {
        ChainConfig memory destConfig = chainConfigs[destinationChain];
        if (!destConfig.active) {
            revert TrustBankCrossChain__ChainNotSupported();
        }
        if (
            amount < destConfig.minTransferAmount ||
            amount > destConfig.maxTransferAmount
        ) {
            revert TrustBankCrossChain__InvalidAmount();
        }

        // Calculate bridge fee
        uint256 bridgeFee = (amount * destConfig.bridgeFee) /
            BASIS_POINTS_DIVISOR;
        uint256 netAmount = amount - bridgeFee;

        // Transfer tokens to this contract
        stablecoin.safeTransferFrom(msg.sender, address(this), amount);

        // Create cross-chain message
        uint256 messageId = nextMessageId++;

        // Update user balance tracking
        userBalancesByChain[msg.sender][destinationChain] += netAmount;
        totalBridgedAmount += amount;

        emit CrossChainTransferInitiated(
            messageId,
            SupportedChain.ETHEREUM, // Current chain (configurable)
            destinationChain,
            msg.sender,
            receiver,
            netAmount
        );
    }

    /**
     * @dev Process incoming cross-chain message
     * @param message Cross-chain message to process
     * @param signatures Array of relayer signatures
     */
    function processCrossChainMessage(
        CrossChainMessage calldata message,
        bytes[] calldata signatures
    ) external nonReentrant {
        bytes32 messageHash = _hashMessage(message);

        if (processedMessages[messageHash]) {
            revert TrustBankCrossChain__MessageAlreadyProcessed();
        }

        if (block.timestamp > message.timestamp + MESSAGE_EXPIRY_TIME) {
            revert TrustBankCrossChain__MessageAlreadyProcessed();
        }

        // Verify relayer signatures
        _verifyRelayerSignatures(messageHash, signatures);

        // Mark message as processed
        processedMessages[messageHash] = true;

        // Process based on message type
        if (message.messageType == MessageType.ASSET_TRANSFER) {
            _processAssetTransfer(message);
        } else if (message.messageType == MessageType.TRUST_SCORE_SYNC) {
            _processTrustScoreSync(message);
        } else if (message.messageType == MessageType.LIQUIDITY_BRIDGE) {
            _processLiquidityBridge(message);
        } else if (message.messageType == MessageType.YIELD_CLAIM) {
            _processYieldClaim(message);
        }
    }

    /**
     * @dev Sync trust score from another chain
     * @param user User address
     * @param sourceChain Chain where trust score originated
     * @param trustScore Trust score to sync
     * @param timestamp Timestamp of the trust score update
     * @param signatures Relayer signatures
     */
    function syncTrustScore(
        address user,
        SupportedChain sourceChain,
        uint256 trustScore,
        uint256 timestamp,
        bytes[] calldata signatures
    ) external {
        // Create and verify trust score sync message
        // aderyn-ignore-next-line(weak-randomness)
        bytes32 messageHash = keccak256(
            abi.encode(
                user,
                sourceChain,
                SupportedChain.ETHEREUM, // Current chain
                trustScore,
                timestamp
            )
        );

        // Verify relayer signatures
        _verifyRelayerSignatures(messageHash, signatures);

        // Check timestamp is not too old (within 1 hour)
        if (block.timestamp > timestamp + 3600) {
            revert TrustBankCrossChain__MessageAlreadyProcessed();
        }

        // Update aggregated trust score
        uint256 currentScore = aggregatedTrustScores[user];
        if (trustScore > currentScore) {
            aggregatedTrustScores[user] = trustScore;
        }

        emit TrustScoreSynced(user, sourceChain, trustScore);
    }

    /**
     * @dev Get user's aggregated balance across all chains
     * @param user User address
     * @return Total balance across all supported chains
     */
    function getAggregatedBalance(
        address user
    ) external view returns (uint256) {
        uint256 totalBalance = 0;

        // Add local balance
        totalBalance += stablecoin.balanceOf(user);

        // Add balances from other chains
        for (uint256 i = 0; i < 7; i++) {
            // 7 supported chains
            SupportedChain chain = SupportedChain(i);
            totalBalance += userBalancesByChain[user][chain];
        }

        return totalBalance;
    }

    /**
     * @dev Get user's aggregated trust score across all chains
     * @param user User address
     * @return Aggregated trust score
     */
    function getAggregatedTrustScore(
        address user
    ) external view returns (uint256) {
        uint256 localScore = trustBankCore.getUserTrustScore(user);
        uint256 crossChainScore = aggregatedTrustScores[user];

        // Return maximum of local and cross-chain scores
        return localScore > crossChainScore ? localScore : crossChainScore;
    }

    /**
     * @dev Configure chain settings
     * @param chain Chain to configure
     * @param chainId Network chain ID
     * @param trustBankCoreAddr TrustBank core contract address on target chain
     * @param bridgeAddr Bridge contract address on target chain
     * @param active Whether chain is active
     * @param minAmount Minimum transfer amount
     * @param maxAmount Maximum transfer amount
     * @param bridgeFee Bridge fee in basis points
     */
    function configureChain(
        SupportedChain chain,
        uint256 chainId,
        address trustBankCoreAddr,
        address bridgeAddr,
        bool active,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 bridgeFee
    ) external onlyOwner {
        if (bridgeFee > MAX_BRIDGE_FEE) {
            revert TrustBankCrossChain__InvalidAmount();
        }

        chainConfigs[chain] = ChainConfig({
            name: _getChainName(chain),
            chainId: chainId,
            trustBankCore: trustBankCoreAddr,
            bridgeContract: bridgeAddr,
            active: active,
            minTransferAmount: minAmount,
            maxTransferAmount: maxAmount,
            bridgeFee: bridgeFee
        });

        emit ChainConfigured(chain, chainId, trustBankCoreAddr, active);
    }

    /**
     * @dev Authorize or deauthorize a relayer
     * @param relayer Relayer address
     * @param authorized Whether to authorize
     * @param stake Required stake amount
     */
    function authorizeRelayer(
        address relayer,
        bool authorized,
        uint256 stake
    ) external onlyOwner {
        if (authorized && stake < MIN_RELAYER_STAKE) {
            revert TrustBankCrossChain__InvalidAmount();
        }

        relayers[relayer] = RelayerConfig({
            relayer: relayer,
            authorized: authorized,
            stake: stake,
            reputationScore: authorized ? 100 : 0
        });

        emit RelayerAuthorized(relayer, stake, authorized);
    }

    /**
     * @dev Get chain configuration
     * @param chain Chain to query
     * @return Chain configuration
     */
    function getChainConfig(
        SupportedChain chain
    ) external view returns (ChainConfig memory) {
        return chainConfigs[chain];
    }

    /**
     * @dev Check if relayer is authorized
     * @param relayer Relayer address
     * @return Whether relayer is authorized
     */
    function isRelayerAuthorized(address relayer) external view returns (bool) {
        return relayers[relayer].authorized;
    }

    /**
     * @dev Internal function to initialize chain configurations
     */
    function _initializeChainConfigs() internal {
        // Ethereum mainnet
        chainConfigs[SupportedChain.ETHEREUM] = ChainConfig({
            name: "Ethereum",
            chainId: 1,
            trustBankCore: address(trustBankCore),
            bridgeContract: address(this),
            active: true,
            minTransferAmount: 10e6, // $10 USDC
            maxTransferAmount: 1000000e6, // $1M USDC
            bridgeFee: 25 // 0.25%
        });

        // Arbitrum
        chainConfigs[SupportedChain.ARBITRUM] = ChainConfig({
            name: "Arbitrum",
            chainId: 42161,
            trustBankCore: address(0), // To be configured
            bridgeContract: address(0),
            active: false,
            minTransferAmount: 10e6,
            maxTransferAmount: 1000000e6,
            bridgeFee: 15 // 0.15%
        });

        // Optimism
        chainConfigs[SupportedChain.OPTIMISM] = ChainConfig({
            name: "Optimism",
            chainId: 10,
            trustBankCore: address(0),
            bridgeContract: address(0),
            active: false,
            minTransferAmount: 10e6,
            maxTransferAmount: 1000000e6,
            bridgeFee: 15 // 0.15%
        });

        // Polygon
        chainConfigs[SupportedChain.POLYGON] = ChainConfig({
            name: "Polygon",
            chainId: 137,
            trustBankCore: address(0),
            bridgeContract: address(0),
            active: false,
            minTransferAmount: 10e6,
            maxTransferAmount: 1000000e6,
            bridgeFee: 20 // 0.20%
        });

        // Avalanche
        chainConfigs[SupportedChain.AVALANCHE] = ChainConfig({
            name: "Avalanche",
            chainId: 43114,
            trustBankCore: address(0),
            bridgeContract: address(0),
            active: false,
            minTransferAmount: 10e6,
            maxTransferAmount: 1000000e6,
            bridgeFee: 20 // 0.20%
        });

        // Base
        chainConfigs[SupportedChain.BASE] = ChainConfig({
            name: "Base",
            chainId: 8453,
            trustBankCore: address(0),
            bridgeContract: address(0),
            active: false,
            minTransferAmount: 10e6,
            maxTransferAmount: 1000000e6,
            bridgeFee: 15 // 0.15%
        });

        // BSC
        chainConfigs[SupportedChain.BSC] = ChainConfig({
            name: "BSC",
            chainId: 56,
            trustBankCore: address(0),
            bridgeContract: address(0),
            active: false,
            minTransferAmount: 10e6,
            maxTransferAmount: 1000000e6,
            bridgeFee: 25 // 0.25%
        });
    }

    /**
     * @dev Process asset transfer message
     */
    function _processAssetTransfer(CrossChainMessage memory message) internal {
        stablecoin.safeTransfer(message.receiver, message.amount);

        emit CrossChainTransferCompleted(
            message.messageId,
            message.receiver,
            message.amount
        );
    }

    /**
     * @dev Process trust score sync message
     */
    function _processTrustScoreSync(CrossChainMessage memory message) internal {
        // Update aggregated trust score
        uint256 currentScore = aggregatedTrustScores[message.receiver];
        if (message.amount > currentScore) {
            aggregatedTrustScores[message.receiver] = message.amount;
        }

        emit TrustScoreSynced(
            message.receiver,
            message.sourceChain,
            message.amount
        );
    }

    /**
     * @dev Process liquidity bridge message
     */
    function _processLiquidityBridge(
        CrossChainMessage memory message
    ) internal {
        // Handle liquidity bridging logic
        emit LiquidityBridged(
            message.sourceChain,
            message.destinationChain,
            message.amount
        );
    }

    /**
     * @dev Process yield claim message
     */
    function _processYieldClaim(CrossChainMessage memory message) internal {
        // Transfer claimed yield to user
        stablecoin.safeTransfer(message.receiver, message.amount);
    }

    /**
     * @dev Hash cross-chain message for signature verification
     */
    function _hashMessage(
        CrossChainMessage memory message
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    message.messageId,
                    message.sourceChain,
                    message.destinationChain,
                    message.messageType,
                    message.sender,
                    message.receiver,
                    message.amount,
                    message.data,
                    message.timestamp
                )
            );
    }

    /**
     * @dev Verify relayer signatures
     */
    function _verifyRelayerSignatures(
        bytes32 messageHash,
        bytes[] calldata signatures
    ) internal view {
        if (signatures.length < MIN_CONFIRMATIONS) {
            revert TrustBankCrossChain__InvalidSignature();
        }

        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
            messageHash
        );
        uint256 validSignatures = 0;
        address[] memory usedSigners = new address[](signatures.length);

        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = ECDSA.recover(ethSignedMessageHash, signatures[i]);

            // Check if signer is authorized
            if (relayers[signer].authorized) {
                // Check for duplicate signers
                bool alreadyUsed = false;
                for (uint256 j = 0; j < validSignatures; j++) {
                    if (usedSigners[j] == signer) {
                        alreadyUsed = true;
                        break;
                    }
                }

                if (!alreadyUsed) {
                    usedSigners[validSignatures] = signer;
                    validSignatures++;
                }
            }
        }

        if (validSignatures < MIN_CONFIRMATIONS) {
            revert TrustBankCrossChain__RelayerNotAuthorized();
        }
    }

    /**
     * @dev Get chain name from enum
     */
    function _getChainName(
        SupportedChain chain
    ) internal pure returns (string memory) {
        if (chain == SupportedChain.ETHEREUM) return "Ethereum";
        if (chain == SupportedChain.ARBITRUM) return "Arbitrum";
        if (chain == SupportedChain.OPTIMISM) return "Optimism";
        if (chain == SupportedChain.POLYGON) return "Polygon";
        if (chain == SupportedChain.AVALANCHE) return "Avalanche";
        if (chain == SupportedChain.BASE) return "Base";
        if (chain == SupportedChain.BSC) return "BSC";
        return "Unknown";
    }
}
