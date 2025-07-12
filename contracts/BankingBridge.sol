// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./TrustBankCore.sol";

/**
 * @title BankingBridge
 * @dev Enterprise interface for banks to integrate with VouchPay
 */
contract BankingBridge is Ownable {
    using SafeERC20 for IERC20;

    // Custom errors
    error BankingBridge__DepositLimitExceeded();
    error BankingBridge__BankNotActive();
    error BankingBridge__InsufficientBalance();
    error BankingBridge__InsufficientTrustScore();

    // Bank structures
    struct BankConfig {
        string name;
        address treasury;
        uint256 depositLimit;
        uint256 withdrawalLimit;
        bool active;
        uint256 feeRate; // Basis points
    }

    struct CustomerAccount {
        address bank;
        address customer;
        uint256 balance;
        uint256 yieldEarned;
        uint256 lastUpdate;
    }

    // State variables
    TrustBankCore public immutable trustBank;
    IERC20 public immutable stablecoin;
    mapping(address => BankConfig) public banks;
    mapping(address => mapping(address => CustomerAccount))
        public customerAccounts; // bank => customer => account
    mapping(address => bool) public authorizedBanks;

    // Yield tracking
    uint256 public totalDeposits;
    uint256 public currentAPY = 5e16; // 5% annual yield (modifiable)
    uint256 public loanCounter; // Counter for generating unique loan IDs

    // Constants
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant BASIS_POINTS_DIVISOR = 10000;
    uint256 public constant PERCENTAGE_DIVISOR = 100;
    uint256 public constant TRUST_SCORE_RATIO = 1000; // 1000:1 ratio for bank-backed loans
    uint256 public constant MONTHS_PER_YEAR = 12;
    uint256 public constant BANK_STATS_DIVISOR = 10; // For simplified bank stats calculation
    uint256 public constant WEI_PRECISION = 1e18;

    // Events
    event BankRegistered(address indexed bank, string name);
    event CustomerDeposit(
        address indexed bank,
        address indexed customer,
        uint256 amount
    );
    event CustomerWithdrawal(
        address indexed bank,
        address indexed customer,
        uint256 amount
    );
    event YieldDistributed(
        address indexed bank,
        address indexed customer,
        uint256 amount
    );
    event LoanCreated(
        address indexed bank,
        address indexed customer,
        uint256 indexed loanId,
        uint256 amount,
        uint256 trustScore
    );

    modifier isAuthorizedBank() {
        if (!banks[msg.sender].active) {
            revert BankingBridge__BankNotActive();
        }
        _;
    }

    constructor(
        address _trustBankCore,
        address _stablecoin
    ) Ownable(msg.sender) {
        trustBank = TrustBankCore(_trustBankCore);
        stablecoin = IERC20(_stablecoin);
    }

    /**
     * @dev Register a new bank partner
     * @param bank Bank's contract address
     * @param name Bank's name
     * @param treasury Bank's treasury address
     * @param depositLimit Maximum deposit per customer
     * @param feeRate Fee rate in basis points
     */
    function registerBank(
        address bank,
        string memory name,
        address treasury,
        uint256 depositLimit,
        uint256 feeRate
    ) external onlyOwner {
        banks[bank] = BankConfig({
            name: name,
            treasury: treasury,
            depositLimit: depositLimit,
            withdrawalLimit: 0, // Set to 0 initially, can be updated later
            active: true,
            feeRate: feeRate
        });
        emit BankRegistered(bank, name);
    }

    /**
     * @dev Bank deposits customer funds for DeFi yield
     * @param customer Customer's address
     * @param amount Amount to deposit
     */
    function bankDeposit(
        address customer,
        uint256 amount
    ) external isAuthorizedBank {
        CustomerAccount storage account = customerAccounts[msg.sender][
            customer
        ];
        if (account.balance + amount > banks[msg.sender].depositLimit) {
            revert BankingBridge__DepositLimitExceeded();
        }

        account.bank = msg.sender;
        account.customer = customer;
        account.balance += amount;
        account.lastUpdate = block.timestamp;
        totalDeposits += amount;

        stablecoin.safeTransferFrom(msg.sender, address(this), amount);

        emit CustomerDeposit(msg.sender, customer, amount);
    }

    /**
     * @dev Bank withdraws customer funds
     * @param customer Customer's address
     * @param amount Amount to withdraw
     */
    function bankWithdraw(
        address customer,
        uint256 amount
    ) external isAuthorizedBank {
        CustomerAccount storage account = customerAccounts[msg.sender][
            customer
        ];

        // Calculate current balance including yield
        uint256 currentBalance = _calculateBalanceWithYield(
            msg.sender,
            customer
        );

        if (currentBalance < amount) {
            revert BankingBridge__InsufficientBalance();
        }

        // Update account state (Effects)
        account.balance = currentBalance - amount;
        account.lastUpdate = block.timestamp;
        totalDeposits -= amount;

        // Transfer stablecoin to bank (Interactions)
        stablecoin.safeTransfer(msg.sender, amount);

        emit CustomerWithdrawal(msg.sender, customer, amount);
    }

    /**
     * @dev Bank requests instant loan for customer using trust score
     * @param customer Customer's address
     * @param amount Loan amount
     * @return loanId Created loan ID
     */

    function bankLoanRequest(
        address customer,
        uint256 amount
    ) external isAuthorizedBank returns (uint256) {
        // Generate unique loan ID first (Effects)
        loanCounter++;
        uint256 loanId = loanCounter;

        // Check customer's TrustBank trust score (Interactions)
        uint256 trustScore = trustBank.getUserTrustScore(customer);

        // Apply minimum trust score requirement (banks can accept lower scores)
        uint256 minTrustScore = amount / TRUST_SCORE_RATIO;
        if (trustScore < minTrustScore) {
            revert BankingBridge__InsufficientTrustScore();
        }

        emit LoanCreated(msg.sender, customer, loanId, amount, trustScore);

        return loanId;
    }

    /**
     * @dev Calculate customer's balance including yield
     * @param bank Bank's address
     * @param customer Customer's address
     * @return Current balance including accrued yield
     */
    function getCustomerBalance(
        address bank,
        address customer
    ) external view returns (uint256) {
        return _calculateBalanceWithYield(bank, customer);
    }

    /**
     * @dev Internal function to calculate balance with accrued yield
     * @param bank Bank's address
     * @param customer Customer's address
     * @return Balance including yield
     */
    function _calculateBalanceWithYield(
        address bank,
        address customer
    ) internal view returns (uint256) {
        CustomerAccount memory account = customerAccounts[bank][customer];

        if (account.balance == 0) {
            return 0;
        }

        // Calculate time elapsed since last update
        uint256 timeElapsed = block.timestamp - account.lastUpdate;

        // Calculate yield: balance * APY * timeElapsed / secondsPerYear
        uint256 yieldEarned = (account.balance * currentAPY * timeElapsed) /
            (WEI_PRECISION * SECONDS_PER_YEAR);

        return account.balance + yieldEarned;
    }

    /**
     * @dev Get bank's total deposits and yield earned
     * @param bank Bank's address
     * @return totalBankDeposits Total deposits from this bank
     * @return totalBankYield Total yield earned by this bank's customers
     */
    function getBankStats(
        address bank
    )
        external
        view
        returns (uint256 totalBankDeposits, uint256 totalBankYield)
    {
        // Note: This is a simplified implementation
        // In production, you'd track these values more efficiently

        totalBankDeposits = 0;
        totalBankYield = 0;

        // For demo purposes, we'll return simplified stats
        // In production, you'd maintain separate mappings for efficiency
        if (banks[bank].active) {
            // Simplified calculation - in production you'd track these separately
            totalBankDeposits = totalDeposits / BANK_STATS_DIVISOR;
            totalBankYield =
                (totalBankDeposits * currentAPY) /
                (WEI_PRECISION * MONTHS_PER_YEAR);
        }

        return (totalBankDeposits, totalBankYield);
    }

    /**
     * @dev Update yield rates (only owner)
     * @param newAPY New annual percentage yield
     */
    function updateYieldRate(uint256 newAPY) external onlyOwner {
        currentAPY = newAPY;
    }

    /**
     * @dev Distribute yield to all customer accounts
     */
    function distributeYield() external {
        // For demo purposes, this is a simplified implementation
        // In production, you'd batch process accounts more efficiently

        // This function could be called periodically to update all account balances
        // For now, we'll just emit an event as yield is calculated dynamically

        uint256 totalYieldDistributed = (totalDeposits * currentAPY) /
            (WEI_PRECISION * MONTHS_PER_YEAR); // Monthly estimate

        emit YieldDistributed(address(0), address(0), totalYieldDistributed);
    }
}
