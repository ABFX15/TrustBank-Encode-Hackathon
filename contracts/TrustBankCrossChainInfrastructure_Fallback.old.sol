// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TrustBankCrossChainInfrastructure_Fallback
 * @dev Fallback cross-chain infrastructure for testnets without CCIP
 * @notice This is a testnet-compatible version that simulates CCIP functionality
 */
contract TrustBankCrossChainInfrastructure_Fallback is
    Ownable,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    // Custom errors
    error CrossChain__UnsupportedChain();
    error CrossChain__InsufficientAmount();
    error CrossChain__AddressZero();
    error CrossChain__NotEnoughBalance();

    // Message types for cross-chain operations
    enum MessageType {
        SIMPLE_TRANSFER,
        YIELD_DEPOSIT,
        TRUST_SCORE_SYNC,
        LIQUIDITY_BRIDGE
    }

    // Cross-chain message structure
    struct TrustBankMessage {
        MessageType messageType;
        address sender;
        address recipient;
        uint256 amount;
        bytes extraData;
        uint256 timestamp;
        bool processed;
    }

    // Chain configuration
    struct ChainConfig {
        uint64 chainSelector;
        address trustBankContract;
        bool enabled;
        uint256 gasLimit;
    }

    // State variables
    IERC20 public immutable stablecoin;
    address public immutable mockRouter;
    address public immutable mockLinkToken;

    mapping(uint64 => ChainConfig) public supportedChains;
    mapping(bytes32 => TrustBankMessage) public messages;

    // Statistics
    uint256 public totalBridgedVolume;
    uint256 public totalMessagesSent;
    uint256 public totalMessagesReceived;
    uint256 public nextMessageId;

    // Events
    event CrossChainMessageSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address indexed recipient,
        uint256 amount,
        uint256 fees
    );

    event CrossChainMessageReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address indexed sender,
        uint256 amount
    );

    event ChainConfigured(
        uint64 indexed chainSelector,
        address trustBankContract,
        bool enabled
    );

    constructor(
        address _mockRouter,
        address _mockLinkToken,
        address _stablecoin
    ) Ownable(msg.sender) {
        if (_mockRouter == address(0) || _stablecoin == address(0)) {
            revert CrossChain__AddressZero();
        }

        mockRouter = _mockRouter;
        mockLinkToken = _mockLinkToken;
        stablecoin = IERC20(_stablecoin);

        // Configure default test chains
        _configureDefaultChains();
    }

    /**
     * @dev Send cross-chain message (simulated for testnet)
     */
    function sendCrossChain(
        uint64 destinationChainSelector,
        address recipient,
        uint256 amount,
        MessageType messageType,
        bytes calldata extraData
    ) external nonReentrant returns (bytes32 messageId) {
        ChainConfig memory destChain = supportedChains[
            destinationChainSelector
        ];

        if (!destChain.enabled) {
            revert CrossChain__UnsupportedChain();
        }
        if (amount == 0) {
            revert CrossChain__InsufficientAmount();
        }
        if (recipient == address(0)) {
            revert CrossChain__AddressZero();
        }

        // Transfer tokens from sender
        stablecoin.safeTransferFrom(msg.sender, address(this), amount);

        // Generate message ID
        messageId = keccak256(
            abi.encodePacked(
                block.chainid,
                destinationChainSelector,
                msg.sender,
                recipient,
                amount,
                nextMessageId++
            )
        );

        // Store message
        messages[messageId] = TrustBankMessage({
            messageType: messageType,
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            extraData: extraData,
            timestamp: block.timestamp,
            processed: false
        });

        // Update statistics
        totalBridgedVolume += amount;
        totalMessagesSent++;

        emit CrossChainMessageSent(
            messageId,
            destinationChainSelector,
            recipient,
            amount,
            0 // No fees for testnet
        );

        return messageId;
    }

    /**
     * @dev Simulate receiving a cross-chain message
     */
    function simulateReceive(
        bytes32 messageId,
        uint64 sourceChainSelector,
        address sender,
        address recipient,
        uint256 amount,
        MessageType messageType
    ) external onlyOwner {
        if (recipient == address(0)) {
            revert CrossChain__AddressZero();
        }

        // Transfer tokens to recipient
        if (amount > 0 && stablecoin.balanceOf(address(this)) >= amount) {
            stablecoin.safeTransfer(recipient, amount);
        }

        totalMessagesReceived++;

        emit CrossChainMessageReceived(
            messageId,
            sourceChainSelector,
            sender,
            amount
        );
    }

    /**
     * @dev Configure a destination chain
     */
    function configureChain(
        uint64 chainSelector,
        address trustBankContract,
        bool enabled,
        uint256 gasLimit
    ) external onlyOwner {
        supportedChains[chainSelector] = ChainConfig({
            chainSelector: chainSelector,
            trustBankContract: trustBankContract,
            enabled: enabled,
            gasLimit: gasLimit
        });

        emit ChainConfigured(chainSelector, trustBankContract, enabled);
    }

    /**
     * @dev Get fee estimate (always 0 for testnet)
     */
    function getFeeEstimate(
        uint64 destinationChainSelector,
        address recipient,
        uint256 amount,
        MessageType messageType,
        bytes calldata extraData
    ) external pure returns (uint256 fees) {
        // No fees for testnet simulation
        return 0;
    }

    /**
     * @dev Get contract statistics
     */
    function getStats()
        external
        view
        returns (
            uint256 totalVolume,
            uint256 totalSent,
            uint256 totalReceived,
            uint256 contractBalance,
            uint256 linkBalance
        )
    {
        return (
            totalBridgedVolume,
            totalMessagesSent,
            totalMessagesReceived,
            stablecoin.balanceOf(address(this)),
            0 // No LINK balance in testnet
        );
    }

    /**
     * @dev Withdraw tokens
     */
    function withdrawToken(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        if (to == address(0)) revert CrossChain__AddressZero();

        if (token == address(0)) {
            payable(to).transfer(amount);
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    /**
     * @dev Configure default test chains
     */
    function _configureDefaultChains() internal {
        // Ethereum Sepolia simulation
        supportedChains[16015286601757825753] = ChainConfig({
            chainSelector: 16015286601757825753,
            trustBankContract: address(0),
            enabled: true,
            gasLimit: 200000
        });

        // Arbitrum Sepolia simulation
        supportedChains[3478487238524512106] = ChainConfig({
            chainSelector: 3478487238524512106,
            trustBankContract: address(0),
            enabled: true,
            gasLimit: 200000
        });
    }

    receive() external payable {}
}
