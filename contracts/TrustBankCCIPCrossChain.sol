// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";

/**
 * @title TrustBankCCIPCrossChain
 * @dev Chainlink CCIP-based cross-chain infrastructure for TrustBank protocol
 *
 * Enables:
 * - Cross-chain asset transfers via Chainlink CCIP
 * - Trust score synchronization across chains
 * - Cross-chain liquidity aggregation
 * - Multi-chain yield farming
 */

contract TrustBankCCIPCrossChain is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Custom errors
    error CCIP__InsufficientFee();
    error CCIP__OnlyRouter();
    error CCIP__OnlyStablecoinSupported();
    error CCIP__NoMessageType();
    error CCIP__UnknownMessageType();

    // Chainlink CCIP router
    IRouterClient public immutable ccipRouter;
    IERC20 public immutable stablecoin;

    // Events
    event CCIPMessageSent(
        bytes32 indexed messageId,
        uint64 indexed destChain,
        address indexed receiver,
        uint256 amount,
        bytes data
    );
    event CCIPMessageReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChain,
        address indexed sender,
        uint256 amount,
        bytes data
    );

    constructor(address _ccipRouter, address _stablecoin) Ownable(msg.sender) {
        require(_ccipRouter != address(0), "Router required");
        require(_stablecoin != address(0), "Stablecoin required");
        ccipRouter = IRouterClient(_ccipRouter);
        stablecoin = IERC20(_stablecoin);
    }

    /**
     * @dev Send cross-chain message with optional token transfer
     * @param destChainSelector Chainlink chain selector for destination
     * @param receiver Receiver address on destination chain (as bytes)
     * @param amount Amount of stablecoin to send (0 for data-only)
     * @param data Arbitrary payload (e.g. trust score sync)
     * @param feeToken Fee token address (0 for native)
     */
    function sendCCIPMessage(
        uint64 destChainSelector,
        bytes calldata receiver,
        uint256 amount,
        bytes calldata data,
        address feeToken
    ) external payable nonReentrant returns (bytes32 messageId) {
        Client.EVMTokenAmount[] memory tokenAmounts;
        if (amount > 0) {
            tokenAmounts = new Client.EVMTokenAmount[](1);
            tokenAmounts[0] = Client.EVMTokenAmount(
                address(stablecoin),
                amount
            );
            stablecoin.safeTransferFrom(msg.sender, address(this), amount);
            stablecoin.approve(address(ccipRouter), amount);
        }
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: receiver,
            data: data,
            tokenAmounts: tokenAmounts,
            feeToken: feeToken,
            extraArgs: ""
        });
        uint256 fee = ccipRouter.getFee(destChainSelector, message);
        if (msg.value < fee) {
            revert CCIP__InsufficientFee();
        }
        messageId = ccipRouter.ccipSend{value: msg.value}(
            destChainSelector,
            message
        );
        emit CCIPMessageSent(
            messageId,
            destChainSelector,
            abi.decode(receiver, (address)),
            amount,
            data
        );
    }

    /**
     * @dev Handle incoming CCIP messages (called by router)
     * @param any2EvmMessage The full message from the router
     */
    function ccipReceive(
        Client.Any2EVMMessage calldata any2EvmMessage
    ) external nonReentrant {
        if (msg.sender != address(ccipRouter)) {
            revert CCIP__OnlyRouter();
        }

        // Parse message fields
        uint64 sourceChain = any2EvmMessage.sourceChainSelector;
        address sender = abi.decode(any2EvmMessage.sender, (address));
        bytes memory data = any2EvmMessage.data;
        uint256 amount = 0;
        if (any2EvmMessage.destTokenAmounts.length > 0) {
            if (any2EvmMessage.destTokenAmounts[0].token != address(stablecoin)) {
                revert CCIP__OnlyStablecoinSupported();
            }
            amount = any2EvmMessage.destTokenAmounts[0].amount;
        }

        // Business logic: decode data to determine message type
        // Example: first byte = type (0=asset,1=trust,2=liq,3=yield), rest = payload
        if (data.length == 0) {
            revert CCIP__NoMessageType();
        }
        uint8 msgType = uint8(data[0]);
        bytes memory payload;
        if (data.length > 1) {
            payload = new bytes(data.length - 1);
            for (uint256 i = 1; i < data.length; i++) {
                payload[i - 1] = data[i];
            }
        } else {
            payload = new bytes(0);
        }

        if (msgType == 0) {
            // Asset transfer: transfer stablecoin to recipient
            address recipient = abi.decode(payload, (address));
            stablecoin.safeTransfer(recipient, amount);
        } else if (msgType == 1) {
            // Trust score sync: (address, uint256)
            (, uint256 trustScore) = abi.decode(payload, (address, uint256));
            emit CCIPMessageReceived(
                any2EvmMessage.messageId,
                sourceChain,
                sender,
                trustScore,
                data
            );
            return;
        } else if (msgType == 2) {
            // Liquidity aggregation: (address, uint256)
            // Decoding but not using values to avoid unused variable warning
            abi.decode(payload, (address, uint256));
            // Implement liquidity logic as needed
        } else if (msgType == 3) {
            // Yield farming: (address user, uint256 yieldAmount)
            (address user, uint256 yieldAmount) = abi.decode(
                payload,
                (address, uint256)
            );
            stablecoin.safeTransfer(user, yieldAmount);
        } else {
            revert CCIP__UnknownMessageType();
        }

        emit CCIPMessageReceived(
            any2EvmMessage.messageId,
            sourceChain,
            sender,
            amount,
            data
        );
    }
}
