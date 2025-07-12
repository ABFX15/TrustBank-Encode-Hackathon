// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./TrustBankCore.sol";

/**
 * @title TrustBankCreditEngine
 * @dev Handles uncollateralized loans based on trust scores and vouching for TrustBank
 */
contract TrustBankCreditEngine is Ownable {
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
    TrustBankCore public trustBank;
    IERC20 public stablecoin;
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

    constructor(address _trustBank, address _stablecoin) Ownable(msg.sender) {
        trustBank = TrustBankCore(_trustBank);
        stablecoin = IERC20(_stablecoin);
    }

    /**
     * @dev Request an uncollateralized loan
     * @param amount Loan amount in stablecoin
     * @return loanId The ID of the created loan
     */
    function requestLoan(uint256 amount) external returns (uint256) {
        // TODO: Implement loan request logic
        // - Check trust score
        // - Verify credit limit
        // - Get required vouchers
        // - Calculate interest rate
        // - Create loan
        // - Transfer funds
    }

    /**
     * @dev Repay a loan
     * @param loanId The loan to repay
     */
    function repayLoan(uint256 loanId) external {
        // TODO: Implement loan repayment
        // - Check loan exists and is active
        // - Calculate total amount (principal + interest)
        // - Transfer stablecoin
        // - Update trust scores (borrower and vouchers)
        // - Mark loan as repaid
    }

    /**
     * @dev Calculate maximum loan amount for a user
     * @param user Address to check
     * @return Maximum loan amount
     */
    function getMaxLoanAmount(address user) external view returns (uint256) {
        // TODO: Calculate based on:
        // - Trust score
        // - Payment history
        // - Current outstanding loans
        // - Vouch amounts
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
        // TODO: Dynamic interest rate based on:
        // - Trust score
        // - Loan amount
        // - Risk factors
        // - Market conditions
    }

    /**
     * @dev Check if a loan is overdue and mark as default
     * @param loanId The loan to check
     */
    function checkDefault(uint256 loanId) external {
        // TODO: Implement default logic
        // - Check if loan is overdue
        // - Mark as defaulted
        // - Slash trust scores
        // - Penalize vouchers
    }

    /**
     * @dev Get user's loan history
     * @param user Address to check
     * @return Array of loan IDs
     */
    function getUserLoans(
        address user
    ) external view returns (uint256[] memory) {
        // TODO: Return user's loan history
    }

    /**
     * @dev Get loan details
     * @param loanId Loan ID to check
     * @return Loan struct
     */
    function getLoanDetails(
        uint256 loanId
    ) external view returns (Loan memory) {
        // TODO: Return loan details
    }

    /**
     * @dev Set ZK credit contract for enhanced loan calculations
     * @param _zkCredit Address of ZK credit contract
     */
    function setZKCreditContract(address _zkCredit) external onlyOwner {
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
}
