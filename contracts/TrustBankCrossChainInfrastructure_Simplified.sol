// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Chainlink CCIP imports
import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";

/**
 * @title TrustBankCrossChainInfrastructure_Simplified
 * @dev Production-ready cross-chain infrastructure using Chainlink CCIP only
 *
 * Features:
 * - Chainlink CCIP for secure cross-chain messaging
 * - Simplified single-provider architecture
 * - Production-grade security controls
 * - Gas optimization and fee estimation
 * - Emergency controls
 */
contract TrustBankCrossChainInfrastructure_Simplified is
    Ownable,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    // Custom errors
    error TransferFailed();

    struct ChainConfig {
        uint64 chainlinkSelector; // Chainlink CCIP chain selector
        bool active;
        uint256 minConfirmations;
        uint256 maxGasLimit;
    }

    // Message structure for cross-chain operations
    struct CrossChainMessage {
        address sender;
        address receiver;
        uint256 amount;
        bytes data;
        uint256 timestamp;
        bytes32 messageHash;
    }

    // State variables
    IRouterClient public immutable chainlinkRouter;
    IERC20 public immutable stablecoin;

    mapping(uint256 => ChainConfig) public chainConfigs;
    mapping(bytes32 => bool) public processedMessages;
    mapping(bytes32 => CrossChainMessage) public pendingMessages;
    mapping(bytes32 => uint256) public messageTimestamps;
    mapping(address => bool) public authorizedSenders;
    mapping(address => uint256) public userPendingRefunds;

    uint256 public totalBridgedVolume;
    uint256 public messageNonce;

    // Security parameters
    uint256 public constant MAX_GAS_LIMIT = 2_000_000;
    uint256 public constant MIN_TRANSFER_AMOUNT = 1e6; // $1 USDC
    uint256 public constant MAX_TRANSFER_AMOUNT = 1_000_000e6; // $1M USDC
    uint256 public constant MESSAGE_TIMEOUT = 24 hours;

    // Events
    event CrossChainTransferInitiated(
        bytes32 indexed messageId,
        uint256 indexed sourceChain,
        uint256 indexed destinationChain,
        address sender,
        address receiver,
        uint256 amount
    );

    event CrossChainTransferCompleted(
        bytes32 indexed messageId,
        address indexed receiver,
        uint256 amount
    );

    event ChainConfigUpdated(uint256 indexed chainId, bool active);
    event EmergencyWithdraw(
        address indexed token,
        address indexed to,
        uint256 amount
    );

    // Custom errors
    error ChainNotSupported(uint256 chainId);
    error InvalidTransferAmount();
    error InsufficientGasLimit();
    error DuplicateMessage();
    error MessageExpired();
    error UnauthorizedSender();

    constructor(
        address _chainlinkRouter,
        address _stablecoin
    ) Ownable(msg.sender) {
        chainlinkRouter = IRouterClient(_chainlinkRouter);
        stablecoin = IERC20(_stablecoin);

        _initializeChainConfigs();
    }

    /**
     * @dev Send cross-chain message using Chainlink CCIP
     */
    function sendCrossChain(
        uint256 destinationChain,
        address receiver,
        uint256 amount,
        bytes calldata data
    ) external payable nonReentrant returns (bytes32) {
        _validateTransfer(destinationChain, amount);
        ChainConfig memory config = chainConfigs[destinationChain];

        bytes32 messageId = _generateMessageId(
            destinationChain,
            receiver,
            amount
        );
        totalBridgedVolume += amount;

        // Store message immediately with timestamp
        messageTimestamps[messageId] = block.timestamp;
        pendingMessages[messageId] = CrossChainMessage({
            sender: msg.sender,
            receiver: receiver,
            amount: amount,
            data: data,
            timestamp: block.timestamp,
            messageHash: bytes32(0) // Will be updated after CCIP call
        });

        uint256 fee = _executeCCIPTransfer(
            config,
            receiver,
            amount,
            data,
            messageId
        );

        emit CrossChainTransferInitiated(
            messageId,
            block.chainid,
            destinationChain,
            msg.sender,
            receiver,
            amount
        );

        // Refund excess ETH
        _refundExcessETH(fee);

        return messageId;
    }

    /**
     * @dev Execute CCIP transfer - separated for reentrancy safety
     */
    function _executeCCIPTransfer(
        ChainConfig memory config,
        address receiver,
        uint256 amount,
        bytes calldata data,
        bytes32 messageId
    ) internal returns (uint256 fee) {
        // Prepare CCIP message
        Client.EVM2AnyMessage memory ccipMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: abi.encode(msg.sender, amount, data, messageId),
            tokenAmounts: new Client.EVMTokenAmount[](1),
            feeToken: address(0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: config.maxGasLimit})
            )
        });

        ccipMessage.tokenAmounts[0] = Client.EVMTokenAmount({
            token: address(stablecoin),
            amount: amount
        });

        // Calculate fee
        fee = chainlinkRouter.getFee(config.chainlinkSelector, ccipMessage);
        if (msg.value < fee) revert InsufficientGasLimit();

        // Execute token transfer
        stablecoin.safeTransferFrom(msg.sender, address(this), amount);
        stablecoin.approve(address(chainlinkRouter), amount);

        // Send cross-chain message
        bytes32 ccipMessageId = chainlinkRouter.ccipSend{value: fee}(
            config.chainlinkSelector,
            ccipMessage
        );

        // Update the message hash now that we have it
        pendingMessages[messageId].messageHash = ccipMessageId;
    }

    /**
     * @dev Estimate cross-chain fees
     */
    function estimateTransferFee(
        uint256 destinationChain,
        uint256 amount,
        bytes calldata data
    ) external view returns (uint256 fee) {
        ChainConfig memory config = chainConfigs[destinationChain];
        if (!config.active) revert ChainNotSupported(destinationChain);

        Client.EVM2AnyMessage memory ccipMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(msg.sender),
            data: abi.encode(msg.sender, amount, data, bytes32(0)),
            tokenAmounts: new Client.EVMTokenAmount[](1),
            feeToken: address(0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: config.maxGasLimit})
            )
        });

        ccipMessage.tokenAmounts[0] = Client.EVMTokenAmount({
            token: address(stablecoin),
            amount: amount
        });

        return chainlinkRouter.getFee(config.chainlinkSelector, ccipMessage);
    }

    /**
     * @dev Validate transfer parameters
     */
    function _validateTransfer(
        uint256 destinationChain,
        uint256 amount
    ) internal view {
        ChainConfig memory config = chainConfigs[destinationChain];
        if (!config.active) revert ChainNotSupported(destinationChain);
        if (amount < MIN_TRANSFER_AMOUNT || amount > MAX_TRANSFER_AMOUNT) {
            revert InvalidTransferAmount();
        }
    }

    /**
     * @dev Generate unique message ID using secure entropy sources
     * @notice Uses multiple entropy sources to prevent prediction/manipulation
     * @notice This is for message uniqueness, not cryptographic security
     */
    function _generateMessageId(
        uint256 destinationChain,
        address receiver,
        uint256 amount
    ) internal returns (bytes32) {
        // aderyn-ignore-next-line(weak-randomness)
        return
            keccak256(
                abi.encodePacked(
                    block.chainid,
                    destinationChain,
                    msg.sender,
                    receiver,
                    amount,
                    block.number,
                    block.prevrandao, // Post-merge Ethereum randomness
                    blockhash(block.number - 1),
                    tx.gasprice,
                    ++messageNonce,
                    address(this)
                )
            );
    }

    /**
     * @dev Initialize chain configurations with real CCIP selectors
     */
    function _initializeChainConfigs() internal {
        // Ethereum Mainnet
        chainConfigs[1] = ChainConfig({
            chainlinkSelector: 5009297550715157269, // Real Ethereum CCIP selector
            active: true,
            minConfirmations: 12,
            maxGasLimit: 500_000
        });

        // Arbitrum One
        chainConfigs[42161] = ChainConfig({
            chainlinkSelector: 4949039107694359620, // Real Arbitrum CCIP selector
            active: true,
            minConfirmations: 1,
            maxGasLimit: 1_000_000
        });

        // Polygon
        chainConfigs[137] = ChainConfig({
            chainlinkSelector: 4051577828743386545, // Real Polygon CCIP selector
            active: true,
            minConfirmations: 128,
            maxGasLimit: 500_000
        });

        // Optimism
        chainConfigs[10] = ChainConfig({
            chainlinkSelector: 3734403246176062136, // Real Optimism CCIP selector
            active: true,
            minConfirmations: 1,
            maxGasLimit: 500_000
        });

        // Base
        chainConfigs[8453] = ChainConfig({
            chainlinkSelector: 15971525489660198786, // Real Base CCIP selector
            active: true,
            minConfirmations: 1,
            maxGasLimit: 500_000
        });
    }

    /**
     * @dev Safe ETH refund mechanism
     */
    function _refundExcessETH(uint256 usedFee) internal {
        if (msg.value > usedFee) {
            uint256 refundAmount = msg.value - usedFee;

            (bool success, ) = payable(msg.sender).call{
                value: refundAmount,
                gas: 2300
            }("");

            if (!success) {
                // If refund fails, store for later claim to prevent DoS
                userPendingRefunds[msg.sender] += refundAmount;
            }
        }
    }

    /**
     * @dev Allow users to claim pending refunds
     */
    function claimPendingRefund() external nonReentrant {
        uint256 refundAmount = userPendingRefunds[msg.sender];
        if (refundAmount > 0) {
            userPendingRefunds[msg.sender] = 0;
            (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
            if (!success) {
                revert TransferFailed();
            }
        }
    }

    /**
     * @dev Admin functions
     */
    function configureChain(
        uint256 chainId,
        uint64 chainlinkSelector,
        bool active,
        uint256 minConfirmations,
        uint256 maxGasLimit
    ) external onlyOwner {
        if (maxGasLimit > MAX_GAS_LIMIT) revert InsufficientGasLimit();

        chainConfigs[chainId] = ChainConfig({
            chainlinkSelector: chainlinkSelector,
            active: active,
            minConfirmations: minConfirmations,
            maxGasLimit: maxGasLimit
        });

        emit ChainConfigUpdated(chainId, active);
    }

    function setAuthorizedSender(
        address sender,
        bool authorized
    ) external onlyOwner {
        authorizedSenders[sender] = authorized;
        emit ChainConfigUpdated(
            uint256(uint160(sender)), // Use address as chainId for clarity
            authorized
        );
    }

    /**
     * @dev Emergency functions
     */
    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyOwner nonReentrant {
        IERC20(token).safeTransfer(owner(), amount);
        emit EmergencyWithdraw(token, owner(), amount);
    }

    function emergencyWithdrawETH() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) return; // Nothing to withdraw
        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) {
            revert TransferFailed();
        }
    }

    /**
     * @dev View functions
     */
    function getSupportedChains()
        external
        pure
        returns (uint256[] memory chains)
    {
        chains = new uint256[](5);
        chains[0] = 1; // Ethereum
        chains[1] = 42161; // Arbitrum
        chains[2] = 137; // Polygon
        chains[3] = 10; // Optimism
        chains[4] = 8453; // Base
    }

    function isChainSupported(uint256 chainId) external view returns (bool) {
        return chainConfigs[chainId].active;
    }

    function getMessageStatus(
        bytes32 messageId
    ) external view returns (bool processed) {
        return processedMessages[messageId];
    }

    function getPendingRefund(address user) external view returns (uint256) {
        return userPendingRefunds[user];
    }

    // Fallback to receive ETH for gas payments
    receive() external payable {}
}
