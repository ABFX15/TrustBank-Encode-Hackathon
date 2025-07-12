// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./TrustBankCore.sol";
import "./YieldStrategy.sol";

/**
 * @title LiquidityPool
 * @dev LP contract that provides capital for loans and earns yield
 */
contract LiquidityPool is ERC20, Ownable {
    using SafeERC20 for IERC20;

    // Custom errors
    error LiquidityPool__AddressZero();
    error LiquidityPool__MinimumDepositNotMet();
    error LiquidityPool__WrongAmountOfLiquidity();
    error LiquidityPool__NotAuthorized();

    // Pool structures
    struct PoolStats {
        uint256 totalDeposits;
        uint256 totalLoans;
        uint256 availableLiquidity;
        uint256 yieldEarned;
        uint256 defaultsLost;
    }

    // State variables
    IERC20 public immutable stablecoin;
    TrustBankCore public immutable trustBank;
    YieldStrategy public immutable yieldStrategy;
    address public creditEngine; // Address of the credit engine contract

    PoolStats public stats;
    mapping(address => uint256) public userDeposits; // Track individual user deposits
    mapping(address => uint256) public lastDepositTime;
    mapping(address => uint256) public userYieldClaimed;

    // Pool parameters
    uint256 public constant LOAN_TO_DEPOSIT_RATIO = 80; // 80% max loans to deposits
    uint256 public constant YIELD_SPLIT_LP = 60; // 60% to LP holders
    uint256 public constant YIELD_SPLIT_INSURANCE = 40; // 40% to insurance pool
    uint256 public constant MIN_DEPOSIT = 10e6; // $10 USDC minimum
    uint256 public constant PERCENTAGE_DIVISOR = 100; // For percentage calculations
    uint256 public constant BASIS_POINTS_DIVISOR = 10000; // For basis points calculations (10000 = 100%)
    uint256 public constant YIELD_DISTRIBUTION_RATE = 10; // 10% of yield distributed per harvest

    // Events
    event LiquidityAdded(
        address indexed provider,
        uint256 amount,
        uint256 shares
    );
    event LiquidityRemoved(
        address indexed provider,
        uint256 amount,
        uint256 shares
    );
    event LoanFunded(address indexed borrower, uint256 amount);
    event LoanRepaid(
        address indexed borrower,
        uint256 amount,
        uint256 interest
    );
    event DefaultProcessed(address indexed borrower, uint256 lossAmount);
    event YieldDistributed(
        uint256 totalYield,
        uint256 lpShare,
        uint256 insuranceShare
    );
    event YieldClaimed(address indexed user, uint256 amount);

    modifier isAuthorized() {
        if (msg.sender != address(trustBank) && msg.sender != creditEngine) {
            revert LiquidityPool__NotAuthorized();
        }
        _;
    }

    constructor(
        address _stablecoin,
        address _trustBank,
        address _yieldStrategy
    ) ERC20("TrustBank LP Token", "tLP") Ownable(msg.sender) {
        if (
            _stablecoin == address(0) ||
            _trustBank == address(0) ||
            _yieldStrategy == address(0)
        ) {
            revert LiquidityPool__AddressZero();
        }
        stablecoin = IERC20(_stablecoin);
        trustBank = TrustBankCore(_trustBank);
        yieldStrategy = YieldStrategy(_yieldStrategy);
    }

    /**
     * @dev Set credit engine address (owner only)
     * @param _creditEngine Address of the credit engine contract
     */
    function setCreditEngine(address _creditEngine) external onlyOwner {
        require(
            _creditEngine != address(0),
            "Credit engine cannot be zero address"
        );
        creditEngine = _creditEngine;
    }

    /**
     * @dev Add liquidity to the pool, get LP tokens
     * @param amount Amount of stablecoin to deposit
     */
    function addLiquidity(uint256 amount) external {
        // Check minimum deposit
        if (amount < MIN_DEPOSIT) {
            revert LiquidityPool__MinimumDepositNotMet();
        }

        // Calculate shares BEFORE updating state
        uint256 shares;
        if (totalSupply() == 0) {
            // First deposit, 1:1 ratio
            shares = amount;
        } else {
            // shares = amount * totalSupply / current pool value (before this deposit)
            shares = (amount * totalSupply()) / stats.totalDeposits;
        }

        stats.totalDeposits += amount;
        stats.availableLiquidity += amount;

        userDeposits[msg.sender] += amount;
        lastDepositTime[msg.sender] = block.timestamp;

        stablecoin.safeTransferFrom(msg.sender, address(this), amount);

        _mint(msg.sender, shares);

        if (address(yieldStrategy) != address(0)) {
            stablecoin.safeTransfer(address(yieldStrategy), amount);
            yieldStrategy.depositPreTransferred(amount);
        }

        emit LiquidityAdded(msg.sender, amount, shares);
    }

    /**
     * @dev Remove liquidity from pool, burn LP tokens
     * @param lpTokenAmount Amount of LP tokens to burn
     */
    function removeLiquidity(uint256 lpTokenAmount) external {
        if (balanceOf(msg.sender) < lpTokenAmount) {
            revert LiquidityPool__WrongAmountOfLiquidity();
        }

        uint256 stablecoinAmount = (lpTokenAmount * stats.totalDeposits) /
            totalSupply();

        stats.totalDeposits -= stablecoinAmount;
        stats.availableLiquidity -= stablecoinAmount;

        userDeposits[msg.sender] = userDeposits[msg.sender] >= stablecoinAmount
            ? userDeposits[msg.sender] - stablecoinAmount
            : 0;

        _burn(msg.sender, lpTokenAmount);

        if (address(yieldStrategy) != address(0)) {
            yieldStrategy.withdraw(stablecoinAmount);
        }

        stablecoin.safeTransfer(msg.sender, stablecoinAmount);

        emit LiquidityRemoved(msg.sender, stablecoinAmount, lpTokenAmount);
    }

    /**
     * @dev Fund a loan (called by CreditEngine)
     * @param borrower Address of borrower
     * @param amount Loan amount
     * @return success Whether loan was funded
     */
    function fundLoan(
        address borrower,
        uint256 amount
    ) external isAuthorized returns (bool) {
        if (stats.availableLiquidity < amount) {
            return false;
        }

        uint256 maxLoan = (stats.totalDeposits * LOAN_TO_DEPOSIT_RATIO) /
            PERCENTAGE_DIVISOR;
        if (stats.totalLoans + amount > maxLoan) {
            return false;
        }

        stats.totalLoans += amount;
        stats.availableLiquidity -= amount;

        stablecoin.safeTransfer(borrower, amount);

        emit LoanFunded(borrower, amount);
        return true;
    }

    /**
     * @dev Process loan repayment (called by CreditEngine)
     * @param borrower Address of borrower
     * @param principal Principal amount
     * @param interest Interest amount
     */
    function processRepayment(
        address borrower,
        uint256 principal,
        uint256 interest
    ) external isAuthorized {
        stats.totalLoans -= principal;
        stats.availableLiquidity += principal;
        stats.yieldEarned += interest;

        stablecoin.safeTransferFrom(
            borrower,
            address(this),
            principal + interest
        );

        if (address(yieldStrategy) != address(0) && interest > 0) {
            stablecoin.safeTransfer(address(yieldStrategy), interest);
            yieldStrategy.depositPreTransferred(interest);
        }

        emit LoanRepaid(borrower, principal, interest);
    }

    /**
     * @dev Process loan default (called by CreditEngine)
     * @param borrower Address of defaulting borrower
     * @param lossAmount Amount lost to default
     */
    function processDefault(
        address borrower,
        uint256 lossAmount
    ) external isAuthorized {
        stats.defaultsLost += lossAmount;
        stats.availableLiquidity -= lossAmount;
        emit DefaultProcessed(borrower, lossAmount);
    }

    /**
     * @dev Harvest yield from strategies and distribute
     */
    function harvestAndDistribute() external {
        uint256 totalYield = stats.yieldEarned / YIELD_DISTRIBUTION_RATE; // Simple 10% distribution

        if (totalYield == 0) {
            return;
        }

        uint256 lpShare = (totalYield * YIELD_SPLIT_LP) / PERCENTAGE_DIVISOR;
        uint256 insuranceShare = (totalYield * YIELD_SPLIT_INSURANCE) /
            PERCENTAGE_DIVISOR;

        stats.availableLiquidity += insuranceShare;

        stablecoin.safeTransfer(msg.sender, lpShare);

        emit YieldDistributed(totalYield, lpShare, insuranceShare);
    }

    /**
     * @dev Get available liquidity for new loans
     * @return Available amount for lending
     */
    function getAvailableLiquidity() external view returns (uint256) {
        // Calculate max lendable amount based on loan-to-deposit ratio
        uint256 maxLendable = (stats.totalDeposits * LOAN_TO_DEPOSIT_RATIO) /
            PERCENTAGE_DIVISOR;

        // Available liquidity is the minimum of:
        // 1. Current available liquidity in pool
        // 2. Remaining capacity under loan-to-deposit ratio
        uint256 remainingCapacity = maxLendable > stats.totalLoans
            ? maxLendable - stats.totalLoans
            : 0;

        return
            stats.availableLiquidity < remainingCapacity
                ? stats.availableLiquidity
                : remainingCapacity;
    }

    /**
     * @dev Calculate user's share of pool rewards
     * @param user Address to check
     * @return Claimable yield amount
     */
    function getClaimableYield(address user) external view returns (uint256) {
        uint256 lpTokenBalance = balanceOf(user);

        if (lpTokenBalance == 0 || totalSupply() == 0) {
            return 0; // No yield if no LP tokens
        }

        // Calculate user's proportional share of total yield earned
        uint256 userShareOfYield = (stats.yieldEarned * lpTokenBalance) /
            totalSupply();

        // Subtract what they've already claimed
        uint256 alreadyClaimed = userYieldClaimed[user];

        return
            userShareOfYield > alreadyClaimed
                ? userShareOfYield - alreadyClaimed
                : 0;
    }

    /**
     * @dev Claim accumulated yield rewards
     */
    function claimYield() external {
        uint256 lpTokenBalance = balanceOf(msg.sender);

        if (lpTokenBalance == 0 || totalSupply() == 0) {
            return; // Nothing to claim
        }

        // Calculate claimable amount
        uint256 userShareOfYield = (stats.yieldEarned * lpTokenBalance) /
            totalSupply();
        uint256 alreadyClaimed = userYieldClaimed[msg.sender];
        uint256 claimableAmount = userShareOfYield > alreadyClaimed
            ? userShareOfYield - alreadyClaimed
            : 0;

        if (claimableAmount == 0) {
            return; // Nothing to claim
        }

        // Update claimed tracking first (Effects)
        userYieldClaimed[msg.sender] += claimableAmount;

        // Transfer stablecoin to user (Interactions)
        stablecoin.safeTransfer(msg.sender, claimableAmount);

        // Emit event
        emit YieldClaimed(msg.sender, claimableAmount);
    }

    /**
     * @dev Get current pool utilization ratio
     * @return Utilization percentage (basis points)
     */
    function getUtilizationRatio() external view returns (uint256) {
        if (stats.totalDeposits == 0) {
            return 0; // No utilization if no deposits
        }

        // Return utilization as basis points (10000 = 100%)
        return (stats.totalLoans * BASIS_POINTS_DIVISOR) / stats.totalDeposits;
    }

    /**
     * @dev Emergency pause (only owner)
     */
    function pause() external onlyOwner {
        // For now, just emit an event
        // In production, this would integrate with OpenZeppelin's Pausable
        // and halt all major functions like addLiquidity, removeLiquidity, etc.

        // Could add a paused state variable and check it in major functions
        // paused = true;

        // For demo purposes, just log the pause action
        emit LiquidityRemoved(msg.sender, 0, 0); // Reusing event for demo
    }
}
