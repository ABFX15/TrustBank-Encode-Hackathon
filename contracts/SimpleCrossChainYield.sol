// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./TrustBankCrossChainInfrastructure_Simplified.sol";

/**
 * @title SimpleCrossChainYield
 * @dev Simplified cross-chain yield farming using CCIP infrastructure
 *
 * Core features:
 * - Deposit to optimal yield chain
 * - Withdraw from any chain
 * - Basic yield tracking
 * - CCIP-powered cross-chain operations
 */
contract SimpleCrossChainYield is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Core state
    TrustBankCrossChainInfrastructure_Simplified
        public immutable crossChainInfra;
    IERC20 public immutable stablecoin;

    // User positions
    struct UserPosition {
        uint256 totalDeposited;
        uint256 totalYieldClaimed;
        uint256 lastUpdateTime;
    }

    mapping(address => UserPosition) public userPositions;

    // Chain yield data (simplified)
    mapping(uint256 => uint256) public chainAPYs; // chainId => APY in basis points
    mapping(uint256 => bool) public supportedChains;

    uint256 public totalValueLocked;

    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant DEFAULT_APY = 400; // 4%

    // Events
    event CrossChainDeposit(
        address indexed user,
        uint256 indexed targetChainId,
        uint256 amount,
        uint256 expectedAPY
    );

    event CrossChainWithdraw(
        address indexed user,
        uint256 indexed fromChainId,
        uint256 amount,
        uint256 yieldClaimed
    );

    event ChainAPYUpdated(uint256 indexed chainId, uint256 newAPY);

    // Custom errors
    error InvalidAmount();
    error ChainNotSupported();
    error InsufficientBalance();

    constructor(
        address payable _crossChainInfra,
        address _stablecoin
    ) Ownable(msg.sender) {
        crossChainInfra = TrustBankCrossChainInfrastructure_Simplified(
            _crossChainInfra
        );
        stablecoin = IERC20(_stablecoin);

        // Initialize supported chains with default APYs
        _initializeSupportedChains();
    }

    /**
     * @dev Deposit funds for cross-chain yield farming
     * @param amount Amount to deposit
     * @param preferredChainId Preferred chain (0 = auto-select best)
     */
    function deposit(
        uint256 amount,
        uint256 preferredChainId
    ) external payable nonReentrant {
        if (amount == 0) revert InvalidAmount();

        // Transfer tokens from user
        stablecoin.safeTransferFrom(msg.sender, address(this), amount);

        // Find optimal chain
        uint256 targetChainId = preferredChainId == 0
            ? _findBestYieldChain()
            : preferredChainId;

        if (!supportedChains[targetChainId]) revert ChainNotSupported();

        // Update user position
        UserPosition storage position = userPositions[msg.sender];
        position.totalDeposited += amount;
        position.lastUpdateTime = block.timestamp;

        totalValueLocked += amount;

        // Execute cross-chain transfer if needed
        if (targetChainId != block.chainid) {
            _executeCrossChainDeposit(targetChainId, amount);
        }

        emit CrossChainDeposit(
            msg.sender,
            targetChainId,
            amount,
            chainAPYs[targetChainId]
        );
    }

    /**
     * @dev Withdraw funds from yield farming
     * @param amount Amount to withdraw
     * @param fromChainId Chain to withdraw from (0 = current chain)
     */
    function withdraw(
        uint256 amount,
        uint256 fromChainId
    ) external payable nonReentrant {
        if (amount == 0) revert InvalidAmount();

        UserPosition storage position = userPositions[msg.sender];
        if (position.totalDeposited < amount) revert InsufficientBalance();

        // Calculate pending yield
        uint256 pendingYield = _calculatePendingYield(msg.sender);

        // Update position
        position.totalDeposited -= amount;
        position.totalYieldClaimed += pendingYield;
        position.lastUpdateTime = block.timestamp;

        totalValueLocked -= amount;

        uint256 totalWithdraw = amount + pendingYield;

        // Execute withdrawal
        if (fromChainId == 0 || fromChainId == block.chainid) {
            // Withdraw locally
            stablecoin.safeTransfer(msg.sender, totalWithdraw);
        } else {
            // Cross-chain withdrawal
            _executeCrossChainWithdraw(fromChainId, totalWithdraw);
        }

        emit CrossChainWithdraw(msg.sender, fromChainId, amount, pendingYield);
    }

    /**
     * @dev Get user's current position including pending yield
     */
    function getUserPosition(
        address user
    )
        external
        view
        returns (
            uint256 deposited,
            uint256 yieldClaimed,
            uint256 pendingYield,
            uint256 totalValue
        )
    {
        UserPosition storage position = userPositions[user];
        deposited = position.totalDeposited;
        yieldClaimed = position.totalYieldClaimed;
        pendingYield = _calculatePendingYield(user);
        totalValue = deposited + yieldClaimed + pendingYield;
    }

    /**
     * @dev Get best yield opportunities across all chains
     */
    function getBestYieldChains()
        external
        view
        returns (uint256[] memory chainIds, uint256[] memory apys)
    {
        // Get supported chain IDs from infrastructure
        uint256[] memory supportedChainIds = crossChainInfra
            .getSupportedChains();

        chainIds = new uint256[](supportedChainIds.length);
        apys = new uint256[](supportedChainIds.length);

        for (uint256 i = 0; i < supportedChainIds.length; i++) {
            chainIds[i] = supportedChainIds[i];
            apys[i] = chainAPYs[supportedChainIds[i]];
        }
    }

    // Admin functions
    function updateChainAPY(
        uint256 chainId,
        uint256 newAPY
    ) external onlyOwner {
        if (!supportedChains[chainId]) revert ChainNotSupported();
        chainAPYs[chainId] = newAPY;
        emit ChainAPYUpdated(chainId, newAPY);
    }

    function addSupportedChain(
        uint256 chainId,
        uint256 apy
    ) external onlyOwner {
        supportedChains[chainId] = true;
        chainAPYs[chainId] = apy;
    }

    function removeSupportedChain(uint256 chainId) external onlyOwner {
        supportedChains[chainId] = false;
        chainAPYs[chainId] = 0;
    }

    // Internal functions
    function _executeCrossChainDeposit(
        uint256 targetChainId,
        uint256 amount
    ) internal {
        stablecoin.approve(address(crossChainInfra), amount);

        crossChainInfra.sendCrossChain{value: msg.value}(
            targetChainId,
            address(this),
            amount,
            abi.encode("YIELD_DEPOSIT", msg.sender)
        );
    }

    function _executeCrossChainWithdraw(
        uint256 fromChainId,
        uint256 amount
    ) internal {
        // In a full implementation, this would send a cross-chain message
        // to trigger withdrawal on the target chain
        // For now, just emit the event
        emit CrossChainWithdraw(msg.sender, fromChainId, amount, 0);
    }

    function _findBestYieldChain() internal view returns (uint256) {
        uint256[] memory supportedChainIds = crossChainInfra
            .getSupportedChains();
        uint256 bestChainId = block.chainid;
        uint256 bestAPY = chainAPYs[block.chainid];

        for (uint256 i = 0; i < supportedChainIds.length; i++) {
            uint256 chainId = supportedChainIds[i];
            if (supportedChains[chainId] && chainAPYs[chainId] > bestAPY) {
                bestChainId = chainId;
                bestAPY = chainAPYs[chainId];
            }
        }

        return bestChainId;
    }

    function _calculatePendingYield(
        address user
    ) internal view returns (uint256) {
        UserPosition storage position = userPositions[user];
        if (position.totalDeposited == 0) return 0;

        uint256 timeElapsed = block.timestamp - position.lastUpdateTime;
        uint256 currentAPY = chainAPYs[block.chainid];

        if (currentAPY == 0) currentAPY = DEFAULT_APY;

        return
            (position.totalDeposited * currentAPY * timeElapsed) /
            (BASIS_POINTS * 365 days);
    }

    function _initializeSupportedChains() internal {
        // Ethereum
        supportedChains[1] = true;
        chainAPYs[1] = 450; // 4.5%

        // Arbitrum
        supportedChains[42161] = true;
        chainAPYs[42161] = 520; // 5.2%

        // Polygon
        supportedChains[137] = true;
        chainAPYs[137] = 380; // 3.8%

        // Optimism
        supportedChains[10] = true;
        chainAPYs[10] = 480; // 4.8%

        // Base
        supportedChains[8453] = true;
        chainAPYs[8453] = 420; // 4.2%
    }

    // Emergency functions
    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    receive() external payable {}
}
