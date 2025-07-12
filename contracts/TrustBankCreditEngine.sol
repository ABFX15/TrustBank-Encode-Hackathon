// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./TrustBankCore.sol";
import "./LiquidityPool.sol";

/**
 * @title TrustBankCreditEngine
 * @dev Handles uncollateralized loans based on trust scores and vouching for TrustBank
 */
contract TrustBankCreditEngine is Ownable {
    using SafeERC20 for IERC20;

    // Custom errors
    error TrustBankCreditEngine__AddressZero();
    error TrustBankCreditEngine__InvalidAmount();
    error TrustBankCreditEngine__InsufficientTrustScore();
    error TrustBankCreditEngine__ExceedsCreditLimit();
    error TrustBankCreditEngine__OutstandingLoansExist();
    error TrustBankCreditEngine__LoanFundingFailed();
    error TrustBankCreditEngine__NotYourLoan();
    error TrustBankCreditEngine__LoanAlreadyRepaid();
    error TrustBankCreditEngine__LoanDefaulted();
    error TrustBankCreditEngine__InsufficientBalance();
    error TrustBankCreditEngine__LoanDoesNotExist();
    error TrustBankCreditEngine__LoanAlreadyDefaulted();
    error TrustBankCreditEngine__LoanNotOverdue();

    // Loan structures
    struct Loan {
        uint256 id;
        address borrower;
        uint256 amount;
        uint256 interestRate;
        uint256 dueDate;
        bool repaid;
        bool defaulted;
        address[] vouchers; // People who vouched for this loan
    }

    // State variables
    TrustBankCore public immutable trustBank;
    LiquidityPool public liquidityPool;
    IERC20 public immutable stablecoin;
    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public userLoans;
    mapping(address => uint256) public totalBorrowed;
    mapping(address => uint256) public totalRepaid;
    uint256 public nextLoanId;

    // Risk parameters
    uint256 public constant MIN_TRUST_SCORE = 100;
    uint256 public constant MAX_LOAN_AMOUNT = 1000e6; // $1000 USDC
    uint256 public constant BASE_INTEREST_RATE = 5e16; // 5% annual
    uint256 public constant LOAN_DURATION = 30 days;

    // ZK Credit Integration
    address public zkCreditContract;

    // Events
    event LoanRequested(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount
    );
    event LoanRepaid(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount
    );
    event LoanDefaulted(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount
    );
    event ZKCreditContractSet(address indexed zkCredit);

    constructor(
        address _trustBank,
        address _stablecoin,
        address _liquidityPool
    ) Ownable(msg.sender) {
        trustBank = TrustBankCore(_trustBank);
        stablecoin = IERC20(_stablecoin);
        if (_liquidityPool == address(0)) {
            revert TrustBankCreditEngine__AddressZero();
        }
        liquidityPool = LiquidityPool(_liquidityPool);
    }

    /**
     * @dev Request an uncollateralized loan
     * @param amount Loan amount in stablecoin
     * @return loanId The ID of the created loan
     */
    function requestLoan(uint256 amount) external returns (uint256) {
        if (amount == 0) {
            revert TrustBankCreditEngine__InvalidAmount();
        }

        // aderyn-fp-next-line(reentrancy-state-change) Safe: Only reading user's trust score
        // Check trust score meets minimum requirement
        uint256 trustScore = trustBank.getTotalTrustScore(msg.sender);
        if (trustScore < MIN_TRUST_SCORE) {
            revert TrustBankCreditEngine__InsufficientTrustScore();
        }

        // Calculate maximum loan amount for user
        uint256 maxAmount = _calculateMaxLoanAmount(msg.sender);
        if (amount > maxAmount) {
            revert TrustBankCreditEngine__ExceedsCreditLimit();
        }

        // Check if user has any outstanding loans
        if (_getOutstandingLoanCount(msg.sender) != 0) {
            revert TrustBankCreditEngine__OutstandingLoansExist();
        }

        // Calculate interest rate based on trust score
        uint256 interestRate = _calculateInterestRate(msg.sender, amount);

        // Create loan (state changes before external calls)
        nextLoanId++;
        uint256 loanId = nextLoanId;

        loans[loanId] = Loan({
            id: loanId,
            borrower: msg.sender,
            amount: amount,
            interestRate: interestRate,
            dueDate: block.timestamp + LOAN_DURATION,
            repaid: false,
            defaulted: false,
            vouchers: new address[](0) // Will be populated by vouchers later
        });

        userLoans[msg.sender].push(loanId);
        totalBorrowed[msg.sender] += amount;

        // Fund loan through liquidity pool (external call after state changes)
        bool funded = liquidityPool.fundLoan(msg.sender, amount);
        if (!funded) {
            revert TrustBankCreditEngine__LoanFundingFailed();
        }

        emit LoanRequested(loanId, msg.sender, amount);
        return loanId;
    }

    /**
     * @dev Repay a loan
     * @param loanId The loan to repay
     */
    function repayLoan(uint256 loanId) external {
        Loan storage loan = loans[loanId];
        if (loan.borrower != msg.sender) {
            revert TrustBankCreditEngine__NotYourLoan();
        }
        if (loan.repaid) {
            revert TrustBankCreditEngine__LoanAlreadyRepaid();
        }
        if (loan.defaulted) {
            revert TrustBankCreditEngine__LoanDefaulted();
        }

        // Calculate total amount (principal + interest)
        uint256 totalAmount = _calculateTotalRepayment(loanId);

        loan.repaid = true;
        totalRepaid[msg.sender] += totalAmount;

   
        if (stablecoin.balanceOf(msg.sender) < totalAmount) {
            revert TrustBankCreditEngine__InsufficientBalance();
        }

        stablecoin.safeTransferFrom(
            msg.sender,
            address(liquidityPool),
            totalAmount
        );

        // Process repayment in liquidity pool
        liquidityPool.processRepayment(
            msg.sender,
            loan.amount,
            totalAmount - loan.amount
        );

        // Update trust score (successful repayment increases trust)
        trustBank.applyCreditBoost(msg.sender, 25); // 25 point bonus for repayment

        emit LoanRepaid(loanId, msg.sender, totalAmount);
    }

    /**
     * @dev Calculate maximum loan amount for a user
     * @param user Address to check
     * @return Maximum loan amount
     */
    function getMaxLoanAmount(address user) external view returns (uint256) {
        return _calculateMaxLoanAmount(user);
    }

    /**
     * @dev Calculate interest rate for a user
     * @param user Address to check
     * @param amount Loan amount
     * @return Interest rate (basis points)
     */
    function calculateInterestRate(
        address user,
        uint256 amount
    ) external view returns (uint256) {
        return _calculateInterestRate(user, amount);
    }

    /**
     * @dev Check if a loan is overdue and mark as default
     * @param loanId The loan to check
     */
    function checkDefault(uint256 loanId) external {
        Loan storage loan = loans[loanId];
        if (loan.borrower == address(0)) {
            revert TrustBankCreditEngine__LoanDoesNotExist();
        }
        if (loan.repaid) {
            revert TrustBankCreditEngine__LoanAlreadyRepaid();
        }
        if (loan.defaulted) {
            revert TrustBankCreditEngine__LoanAlreadyDefaulted();
        }
        if (block.timestamp <= loan.dueDate) {
            revert TrustBankCreditEngine__LoanNotOverdue();
        }

        // Mark as defaulted
        loan.defaulted = true;

        emit LoanDefaulted(loanId, loan.borrower, loan.amount);
    }

    /**
     * @dev Get user's loan history
     * @param user Address to check
     * @return Array of loan IDs
     */
    function getUserLoans(
        address user
    ) external view returns (uint256[] memory) {
        return userLoans[user];
    }

    /**
     * @dev Get loan details
     * @param loanId Loan ID to check
     * @return Loan struct
     */
    function getLoanDetails(
        uint256 loanId
    ) external view returns (Loan memory) {
        return loans[loanId];
    }

    /**
     * @dev Set ZK credit contract for enhanced loan calculations
     * @param _zkCredit Address of ZK credit contract
     */
    function setZKCreditContract(address _zkCredit) external onlyOwner {
        if (_zkCredit == address(0)) {
            revert TrustBankCreditEngine__AddressZero();
        }
        zkCreditContract = _zkCredit;
        emit ZKCreditContractSet(_zkCredit);
    }

    /**
     * @dev Calculate enhanced loan terms based on ZK credit verification
     * @param user Borrower address
     * @return maxAmount Enhanced maximum loan amount
     * @return interestRate Reduced interest rate based on credit
     */
    function getEnhancedLoanTerms(
        address user
    ) external view returns (uint256 maxAmount, uint256 interestRate) {
        uint256 baseTrustScore = trustBank.getTotalTrustScore(user);
        uint256 creditBoost = 0;

        // Get ZK crypto reputation boost if contract is set
        if (zkCreditContract != address(0)) {
            (bool success, bytes memory data) = zkCreditContract.staticcall(
                abi.encodeWithSignature("getUserCryptoBoost(address)", user)
            );
            if (success && data.length > 0) {
                creditBoost = abi.decode(data, (uint256));
            }
        }

        uint256 totalTrustScore = baseTrustScore + creditBoost;

        // Enhanced loan calculation with ZK credit boost
        if (totalTrustScore < MIN_TRUST_SCORE) {
            return (0, 0);
        }

        // Base calculation
        uint256 baseAmount = (totalTrustScore * MAX_LOAN_AMOUNT) / 1000;

        // ZK credit enhancement - up to 2x multiplier for high credit scores
        uint256 enhancementMultiplier = 100; // 1x base
        if (creditBoost >= 300) {
            enhancementMultiplier = 200; // 2x for exceptional credit
        } else if (creditBoost >= 200) {
            enhancementMultiplier = 175; // 1.75x for very good credit
        } else if (creditBoost >= 100) {
            enhancementMultiplier = 150; // 1.5x for good credit
        } else if (creditBoost >= 50) {
            enhancementMultiplier = 125; // 1.25x for fair credit
        }

        maxAmount = (baseAmount * enhancementMultiplier) / 100;
        if (maxAmount > MAX_LOAN_AMOUNT * 2) {
            maxAmount = MAX_LOAN_AMOUNT * 2; // Cap at 2x base max
        }

        // Calculate reduced interest rate based on credit boost
        interestRate = BASE_INTEREST_RATE;
        if (creditBoost >= 300) {
            interestRate = (BASE_INTEREST_RATE * 70) / 100; // 30% reduction
        } else if (creditBoost >= 200) {
            interestRate = (BASE_INTEREST_RATE * 80) / 100; // 20% reduction
        } else if (creditBoost >= 100) {
            interestRate = (BASE_INTEREST_RATE * 90) / 100; // 10% reduction
        } else if (creditBoost >= 50) {
            interestRate = (BASE_INTEREST_RATE * 95) / 100; // 5% reduction
        }

        return (maxAmount, interestRate);
    }

    // ============ HELPER FUNCTIONS ============

    /**
     * @dev Calculate maximum loan amount based on trust score
     * @param user Address to check
     * @return Maximum loan amount
     */
    function _calculateMaxLoanAmount(
        address user
    ) internal view returns (uint256) {
        uint256 trustScore = trustBank.getTotalTrustScore(user);

        if (trustScore < MIN_TRUST_SCORE) {
            return 0;
        }

        // Base calculation: $10 per trust score point, capped at MAX_LOAN_AMOUNT
        uint256 baseAmount = (trustScore * 10e6) / 100; // 10 USDC per 100 trust points

        if (baseAmount > MAX_LOAN_AMOUNT) {
            baseAmount = MAX_LOAN_AMOUNT;
        }

        return baseAmount;
    }

    /**
     * @dev Calculate interest rate based on trust score
     * @param user Address to check
     * @return Interest rate per year (basis points)
     */
    function _calculateInterestRate(
        address user,
        uint256 /* amount */
    ) internal view returns (uint256) {
        uint256 trustScore = trustBank.getTotalTrustScore(user);

        // Base rate starts at 5% and decreases with higher trust scores
        uint256 rate = BASE_INTEREST_RATE;

        if (trustScore >= 500) {
            rate = (BASE_INTEREST_RATE * 80) / 100; // 4% for high trust
        } else if (trustScore >= 300) {
            rate = (BASE_INTEREST_RATE * 90) / 100; // 4.5% for medium trust
        }

        return rate;
    }

    /**
     * @dev Get count of outstanding (unpaid, non-defaulted) loans for a user
     * @param user Address to check
     * @return Number of outstanding loans
     */
    function _getOutstandingLoanCount(
        address user
    ) internal view returns (uint256) {
        uint256 count = 0;
        uint256[] memory userLoanIds = userLoans[user];

        for (uint256 i = 0; i < userLoanIds.length; i++) {
            Loan memory loan = loans[userLoanIds[i]];
            if (!loan.repaid && !loan.defaulted) {
                count++;
            }
        }

        return count;
    }

    /**
     * @dev Calculate total repayment amount (principal + interest)
     * @param loanId Loan ID
     * @return Total amount to repay
     */
    function _calculateTotalRepayment(
        uint256 loanId
    ) internal view returns (uint256) {
        Loan memory loan = loans[loanId];

        // Simple interest calculation for the loan duration
        uint256 interest = (loan.amount * loan.interestRate * LOAN_DURATION) /
            (365 days * 1e18);

        return loan.amount + interest;
    }
}
