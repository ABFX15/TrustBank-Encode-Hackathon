// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./TrustBankCCIPCrossChain.sol";

/**
 * @title YieldStrategy
 * @dev Manages stablecoin deposits in DeFi protocols for yield generation
 */
contract YieldStrategy is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Custom errors
    error YieldStrategy__AddressZeroStablecoin();
    error YieldStrategy__AddressZeroProtocol();
    error YieldStrategy__InvalidAllocation();
    error YieldStrategy__InsufficientBalance();
    error YieldStrategy__InsufficientAmount();
    error YieldStrategy__StrategyNotActive();
    error YieldStrategy__AllocationExceedsLimit();
    error YieldStrategy__NoStrategiesAvailable();
    error YieldStrategy__WithdrawFailed();
    error YieldStrategy__AddressZeroTreasury();
    error YieldStrategy__FeeTooHigh();

    // Strategy structures
    struct Strategy {
        string name;
        address protocol;
        uint256 allocation; // Percentage in basis points
        uint256 currentDeposit;
        uint256 lastHarvest;
        bool active;
    }

    // State variables
    IERC20 public immutable stablecoin;
    mapping(uint256 => Strategy) public strategies;
    mapping(address => uint256) public userDeposits;
    mapping(address => uint256) public userLastUpdate;
    uint256 public totalDeposits;
    uint256 public totalYieldEarned;
    uint256 public nextStrategyId;
    uint256 public totalAllocation; // Total allocation across all strategies

    // Protocol fee variables
    address public protocolTreasury;
    uint256 public yieldFeeBps; // Fee on yield (basis points)
    uint256 public withdrawFeeBps; // Fee on withdrawals (basis points)
    uint256 public constant MAX_FEE_BPS = 1000; // 10% max

    // Cross-chain state variables
    TrustBankCCIPCrossChain public crossChainInfra;
    bool public crossChainEnabled;

    // Constants
    uint256 public constant BASIS_POINTS_DIVISOR = 10000;
    uint256 public constant MAX_ALLOCATION = 10000; // 100% in basis points
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant DEFAULT_APY = 5e16; // 5% annual yield
    uint256 public constant WEI_PRECISION = 1e18;

    // Events
    event StrategyAdded(
        uint256 indexed strategyId,
        string name,
        address protocol,
        uint256 allocation
    );
    event StrategyUpdated(
        uint256 indexed strategyId,
        uint256 newAllocation,
        bool active
    );
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event YieldHarvested(uint256 totalYield);
    event Rebalanced(uint256 timestamp);
    event EmergencyWithdrawal(uint256 amount);

    constructor(
        address _stablecoin,
        address _protocolTreasury,
        uint256 _yieldFeeBps,
        uint256 _withdrawFeeBps
    ) Ownable(msg.sender) {
        if (_stablecoin == address(0)) {
            revert YieldStrategy__AddressZeroStablecoin();
        }
        if (_protocolTreasury == address(0)) {
            revert YieldStrategy__AddressZeroTreasury();
        }
        if (_yieldFeeBps > MAX_FEE_BPS || _withdrawFeeBps > MAX_FEE_BPS) {
            revert YieldStrategy__FeeTooHigh();
        }
        stablecoin = IERC20(_stablecoin);
        protocolTreasury = _protocolTreasury;
        yieldFeeBps = _yieldFeeBps;
        withdrawFeeBps = _withdrawFeeBps;
    }

    /**
     * @dev Set protocol fee parameters (owner only)
     */
    function setProtocolFees(
        address _treasury,
        uint256 _yieldFeeBps,
        uint256 _withdrawFeeBps
    ) external onlyOwner {
        if (_treasury == address(0))
            revert YieldStrategy__AddressZeroTreasury();
        if (_yieldFeeBps > MAX_FEE_BPS || _withdrawFeeBps > MAX_FEE_BPS)
            revert YieldStrategy__FeeTooHigh();
        protocolTreasury = _treasury;
        yieldFeeBps = _yieldFeeBps;
        withdrawFeeBps = _withdrawFeeBps;
    }

    /**
     * @dev Add a new yield strategy
     * @param name Strategy name
     * @param protocol Protocol address (Aave, Compound, etc.)
     * @param allocation Percentage allocation in basis points
     */
    function addStrategy(
        string memory name,
        address protocol,
        uint256 allocation
    ) external onlyOwner {
        if (protocol == address(0)) {
            revert YieldStrategy__AddressZeroProtocol();
        }
        if (allocation == 0 || allocation > MAX_ALLOCATION) {
            revert YieldStrategy__InvalidAllocation();
        }
        if (totalAllocation + allocation > MAX_ALLOCATION) {
            revert YieldStrategy__AllocationExceedsLimit();
        }

        uint256 strategyId = nextStrategyId++;
        totalAllocation += allocation;

        strategies[strategyId] = Strategy({
            name: name,
            protocol: protocol,
            allocation: allocation,
            currentDeposit: 0,
            lastHarvest: block.timestamp,
            active: true
        });

        emit StrategyAdded(strategyId, name, protocol, allocation);
    }

    /**
     * @dev Deposit stablecoin for yield farming
     * @param amount Amount to deposit
     */
    function deposit(uint256 amount) external nonReentrant {
        if (amount == 0) {
            revert YieldStrategy__InsufficientAmount();
        }
        if (totalAllocation == 0) {
            revert YieldStrategy__NoStrategiesAvailable();
        }

        uint256 currentBalance = _getUserBalanceWithYield(msg.sender);

        userDeposits[msg.sender] = currentBalance + amount;
        userLastUpdate[msg.sender] = block.timestamp;
        totalDeposits += amount;

        // Transfer tokens from user
        stablecoin.safeTransferFrom(msg.sender, address(this), amount);

        _allocateToStrategies(amount);

        emit Deposited(msg.sender, amount);
    }

    /**
     * @dev Deposit stablecoin that has already been transferred to this contract
     * @param amount Amount to deposit
     * @dev Only for use by integrated contracts like LiquidityPool
     */
    function depositPreTransferred(uint256 amount) external nonReentrant {
        if (amount == 0) {
            revert YieldStrategy__InsufficientAmount();
        }
        if (totalAllocation == 0) {
            revert YieldStrategy__NoStrategiesAvailable();
        }

        uint256 currentBalance = _getUserBalanceWithYield(msg.sender);

        userDeposits[msg.sender] = currentBalance + amount;
        userLastUpdate[msg.sender] = block.timestamp;
        totalDeposits += amount;

        // Tokens should already be transferred by caller
        _allocateToStrategies(amount);

        emit Deposited(msg.sender, amount);
    }

    /**
     * @dev Withdraw stablecoin with earned yield
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) {
            revert YieldStrategy__InsufficientAmount();
        }

        uint256 currentBalance = _getUserBalanceWithYield(msg.sender);
        if (currentBalance < amount) {
            revert YieldStrategy__InsufficientBalance();
        }

        // Calculate withdrawal fee
        uint256 fee = (amount * withdrawFeeBps) / BASIS_POINTS_DIVISOR;
        uint256 netAmount = amount - fee;

        userDeposits[msg.sender] = currentBalance - amount;
        userLastUpdate[msg.sender] = block.timestamp;
        totalDeposits -= amount;

        _withdrawFromStrategies(amount);
        if (fee > 0) {
            stablecoin.safeTransfer(protocolTreasury, fee);
        }
        stablecoin.safeTransfer(msg.sender, netAmount);

        emit Withdrawn(msg.sender, netAmount);
    }

    /**
     * @dev Harvest yield from all strategies
     */
    function harvestYield() external {
        uint256 totalHarvested = 0;
        uint256 protocolFee = 0;

        for (uint256 i = 0; i < nextStrategyId; i++) {
            Strategy storage strategy = strategies[i];
            if (strategy.active && strategy.currentDeposit > 0) {
                // Calculate yield based on time elapsed and default APY
                uint256 timeElapsed = block.timestamp - strategy.lastHarvest;
                uint256 yieldEarned = (strategy.currentDeposit *
                    DEFAULT_APY *
                    timeElapsed) / (WEI_PRECISION * SECONDS_PER_YEAR);

                totalYieldEarned += totalHarvested;
                // Calculate protocol fee on yield
                uint256 fee = (yieldEarned * yieldFeeBps) /
                    BASIS_POINTS_DIVISOR;
                if (fee > 0) {
                    protocolFee += fee;
                    yieldEarned -= fee;
                }

                strategy.lastHarvest = block.timestamp;
                totalHarvested += yieldEarned;
            }
        }

        // Transfer protocol fee to treasury if any
        if (protocolFee > 0) {
            stablecoin.safeTransfer(protocolTreasury, protocolFee);
        }

        emit YieldHarvested(totalHarvested);
    }

    /**
     * @dev Rebalance allocations across strategies
     */
    function rebalance() external nonReentrant onlyOwner {
        _internalHarvestYield();

        // aderyn-ignore-next-line(reentrancy-state-change)
        uint256 contractBalance = stablecoin.balanceOf(address(this));

        for (uint256 i = 0; i < nextStrategyId; i++) {
            Strategy storage strategy = strategies[i];
            if (strategy.active) {
                uint256 targetDeposit = (contractBalance *
                    strategy.allocation) / BASIS_POINTS_DIVISOR;
                strategy.currentDeposit = targetDeposit;
            }
        }

        emit Rebalanced(block.timestamp);
    }

    /**
     * @dev Get current APY across all strategies
     * @return Weighted average APY
     */
    function getCurrentAPY() external view returns (uint256) {
        if (totalAllocation == 0) {
            return 0;
        }

        uint256 weightedAPY = 0;

        for (uint256 i = 0; i < nextStrategyId; i++) {
            Strategy memory strategy = strategies[i];
            if (strategy.active) {
                // For simplicity, use default APY for all strategies
                // In production, each strategy would have its own APY calculation
                weightedAPY +=
                    (DEFAULT_APY * strategy.allocation) /
                    BASIS_POINTS_DIVISOR;
            }
        }

        return weightedAPY;
    }

    /**
     * @dev Get user's balance including earned yield
     * @param user User address
     * @return Total balance including yield
     */
    function getUserBalance(address user) external view returns (uint256) {
        return _getUserBalanceWithYield(user);
    }

    /**
     * @dev Emergency withdraw all funds from strategies
     */
    function emergencyWithdraw() external nonReentrant onlyOwner {
        totalDeposits = 0;

        for (uint256 i = 0; i < nextStrategyId; i++) {
            strategies[i].currentDeposit = 0;
        }
        uint256 totalBalance = stablecoin.balanceOf(address(this));

        if (totalBalance > 0) {
            stablecoin.safeTransfer(owner(), totalBalance);
        }

        emit EmergencyWithdrawal(totalBalance);
    }

    /**
     * @dev Enable cross-chain functionality
     * @param _crossChainInfra Address of simplified cross-chain infrastructure
     */
    function enableCrossChain(address _crossChainInfra) external onlyOwner {
        crossChainInfra = TrustBankCCIPCrossChain(_crossChainInfra);
        crossChainEnabled = _crossChainInfra != address(0);
    }

    /**
     * @dev Deploy funds to yield opportunities on other chains
     * @param destChainSelector Chainlink CCIP destination chain selector
     * @param receiver Receiver address on destination chain
     * @param amount Amount to deploy
     * @param data Arbitrary payload (e.g. yield strategy info)
     * @param feeToken Fee token address (0 for native)
     */
    function deployCrossChain(
        uint64 destChainSelector,
        address receiver,
        uint256 amount,
        bytes calldata data,
        address feeToken
    ) external payable onlyOwner nonReentrant {
        if (!crossChainEnabled) {
            revert YieldStrategy__StrategyNotActive();
        }
        if (amount > stablecoin.balanceOf(address(this))) {
            revert YieldStrategy__InsufficientBalance();
        }
        stablecoin.approve(address(crossChainInfra), amount);
        crossChainInfra.sendCCIPMessage{value: msg.value}(
            destChainSelector,
            abi.encode(receiver),
            amount,
            data,
            feeToken
        );
    }

    /**
     * @dev Get cross-chain deployments (simplified)
     */
    // function getTotalCrossChainDeployments() external view returns (uint256) {
    //     // Not implemented in CCIP version
    //     return 0;
    // }

    /**
     * @dev Internal function to calculate user balance with accrued yield
     * @param user User address
     * @return Total balance including yield
     */
    function _getUserBalanceWithYield(
        address user
    ) internal view returns (uint256) {
        uint256 baseBalance = userDeposits[user];
        if (baseBalance == 0) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - userLastUpdate[user];
        if (timeElapsed == 0) {
            return baseBalance;
        }

        uint256 currentAPY = this.getCurrentAPY();
        uint256 yieldEarned = (baseBalance * currentAPY * timeElapsed) /
            (WEI_PRECISION * SECONDS_PER_YEAR);

        return baseBalance + yieldEarned;
    }

    /**
     * @dev Internal function to harvest yield (no external calls)
     */
    function _internalHarvestYield() internal {
        uint256 totalHarvested = 0;

        for (uint256 i = 0; i < nextStrategyId; i++) {
            Strategy storage strategy = strategies[i];
            if (strategy.active && strategy.currentDeposit > 0) {
                uint256 timeElapsed = block.timestamp - strategy.lastHarvest;
                uint256 yieldEarned = (strategy.currentDeposit *
                    DEFAULT_APY *
                    timeElapsed) / (WEI_PRECISION * SECONDS_PER_YEAR);

                strategy.lastHarvest = block.timestamp;
                totalHarvested += yieldEarned;
            }
        }

        totalYieldEarned += totalHarvested;
    }

    /**
     * @dev Internal function to allocate deposits to strategies
     * @param amount Amount to allocate
     */
    function _allocateToStrategies(uint256 amount) internal {
        // For each active strategy, allocate based on allocation percentage
        for (uint256 i = 0; i < nextStrategyId; i++) {
            Strategy storage strategy = strategies[i];
            if (strategy.active) {
                uint256 strategyAmount = (amount * strategy.allocation) /
                    BASIS_POINTS_DIVISOR;
                strategy.currentDeposit += strategyAmount;
            }
        }
    }

    /**
     * @dev Internal function to withdraw from strategies
     * @param amount Amount to withdraw
     */
    function _withdrawFromStrategies(uint256 amount) internal {
        uint256 remainingAmount = amount;

        // Withdraw proportionally from each strategy
        for (uint256 i = 0; i < nextStrategyId && remainingAmount > 0; i++) {
            Strategy storage strategy = strategies[i];
            if (strategy.active && strategy.currentDeposit > 0) {
                uint256 strategyWithdraw = (amount * strategy.allocation) /
                    BASIS_POINTS_DIVISOR;

                if (strategyWithdraw > strategy.currentDeposit) {
                    strategyWithdraw = strategy.currentDeposit;
                }

                if (strategyWithdraw > remainingAmount) {
                    strategyWithdraw = remainingAmount;
                }

                strategy.currentDeposit -= strategyWithdraw;
                remainingAmount -= strategyWithdraw;
            }
        }
    }

    /**
     * @dev Update strategy allocation
     * @param strategyId Strategy ID
     * @param newAllocation New allocation in basis points
     * @param active Whether strategy is active
     */
    function updateStrategy(
        uint256 strategyId,
        uint256 newAllocation,
        bool active
    ) external onlyOwner {
        if (strategyId >= nextStrategyId) {
            revert YieldStrategy__StrategyNotActive();
        }

        Strategy storage strategy = strategies[strategyId];

        totalAllocation = totalAllocation - strategy.allocation + newAllocation;

        if (totalAllocation > MAX_ALLOCATION) {
            revert YieldStrategy__AllocationExceedsLimit();
        }

        strategy.allocation = newAllocation;
        strategy.active = active;

        emit StrategyUpdated(strategyId, newAllocation, active);
    }

    /**
     * @dev Get strategy details
     * @param strategyId Strategy ID
     * @return Strategy details
     */
    function getStrategy(
        uint256 strategyId
    ) external view returns (Strategy memory) {
        if (strategyId >= nextStrategyId) {
            revert YieldStrategy__StrategyNotActive();
        }
        return strategies[strategyId];
    }

    /**
     * @dev Get total number of strategies
     * @return Number of strategies
     */
    function getStrategyCount() external view returns (uint256) {
        return nextStrategyId;
    }

    function withdrawEth() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance <= 0) revert YieldStrategy__InsufficientBalance();
        (bool success, ) = owner().call{value: balance}("");
        if (!success) {
            revert YieldStrategy__WithdrawFailed();
        }
        emit EmergencyWithdrawal(balance);
    }
}
