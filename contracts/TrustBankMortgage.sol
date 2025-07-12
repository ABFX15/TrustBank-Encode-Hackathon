// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./TrustBankCore.sol";

/**
 * @title TrustBankMortgage
 * @dev Mortgage lending based on crypto reputation for TrustBank - Simplified for hackathon
 *
 * Enables users to get mortgages based on their decentralized credit scores:
 * - Trust-based lending through crypto reputation
 * - Progressive interest rates based on DeFi activity
 * - Auto-approval for high-reputation users
 * - Integration with TrustBank's core banking system
 */
contract TrustBankMortgage is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct MortgageApplication {
        address applicant;
        uint256 loanAmount;
        uint256 interestRate; // Basis points
        bool isApproved;
        bool isFunded;
        uint256 timestamp;
    }

    // State variables
    IERC20 public immutable stablecoin;
    TrustBankCore public immutable trustBank;
    address public zkCreditContract;

    mapping(address => MortgageApplication) public userApplication;
    mapping(address => uint256) public loanBalance;
    mapping(address => bool) public approvedLenders;

    uint256 public totalMortgagePool;
    uint256 public totalLoansIssued;

    // Simple parameters
    uint256 public constant MIN_CRYPTO_SCORE = 500;
    uint256 public constant MAX_LOAN_AMOUNT = 500000e6; // $500k max
    uint256 public constant BASE_INTEREST_RATE = 600; // 6% in basis points

    // Auto-approval and interest rate thresholds
    uint256 public constant AUTO_APPROVAL_THRESHOLD = 800;
    uint256 public constant EXCELLENT_SCORE_THRESHOLD = 1200;
    uint256 public constant VERY_GOOD_SCORE_THRESHOLD = 1000;
    uint256 public constant GOOD_SCORE_THRESHOLD = 800;
    uint256 public constant FAIR_SCORE_THRESHOLD = 600;

    // Interest rate adjustments (in basis points)
    uint256 public constant EXCELLENT_DISCOUNT = 150; // 1.5% discount
    uint256 public constant VERY_GOOD_DISCOUNT = 100; // 1% discount
    uint256 public constant GOOD_DISCOUNT = 50; // 0.5% discount
    uint256 public constant FAIR_PENALTY = 100; // 1% penalty

    // Events
    event MortgageApplicationSubmitted(
        address indexed applicant,
        uint256 loanAmount,
        uint256 interestRate
    );
    event MortgageApproved(address indexed applicant, uint256 loanAmount);
    event MortgageFunded(address indexed borrower, uint256 amount);
    event MortgagePaymentMade(
        address indexed borrower,
        uint256 amount,
        uint256 remainingBalance
    );
    event LenderApproved(address indexed lender);

    // Custom Errors
    error CryptoMortgage__InvalidAddress();
    error InsufficientCryptoReputation();
    error LoanAmountTooHigh();
    error ApplicationNotFound();
    error ApplicationNotApproved();
    error ApplicationAlreadyExists();
    error ApplicationAlreadyFunded();
    error InsufficientMortgagePool();
    error UnauthorizedLender();
    error InvalidAmount();
    error NoActiveLoan();

    constructor(
        address _stablecoin,
        address _trustBank,
        address _zkCredit
    ) Ownable(msg.sender) {
        if (_stablecoin == address(0) || _trustBank == address(0)) {
            revert CryptoMortgage__InvalidAddress();
        }
        stablecoin = IERC20(_stablecoin);
        trustBank = TrustBankCore(_trustBank);
        zkCreditContract = _zkCredit; // Allow zero address for optional ZK contract
    }

    /**
     * @dev Apply for simple crypto mortgage
     * @param loanAmount Requested loan amount
     */
    function applyForMortgage(
        uint256 loanAmount
    ) external nonReentrant returns (bool approved) {
        if (userApplication[msg.sender].applicant != address(0))
            revert ApplicationAlreadyExists();
        if (loanAmount == 0 || loanAmount > MAX_LOAN_AMOUNT)
            revert LoanAmountTooHigh();

        // Get user's crypto reputation score
        uint256 totalTrustScore = _getUserTotalCryptoScore(msg.sender);

        // Calculate interest rate based on reputation
        uint256 interestRate = _calculateInterestRate(totalTrustScore);

        // Auto-approve if criteria met
        bool autoApproved = totalTrustScore >= AUTO_APPROVAL_THRESHOLD;

        // Create application
        userApplication[msg.sender] = MortgageApplication({
            applicant: msg.sender,
            loanAmount: loanAmount,
            interestRate: interestRate,
            isApproved: autoApproved,
            isFunded: false,
            timestamp: block.timestamp
        });

        emit MortgageApplicationSubmitted(msg.sender, loanAmount, interestRate);

        if (autoApproved) {
            emit MortgageApproved(msg.sender, loanAmount);
        }

        return autoApproved;
    }

    /**
     * @dev Fund an approved mortgage
     * @param borrower Address of the borrower
     */
    function fundMortgage(address borrower) external nonReentrant {
        if (!approvedLenders[msg.sender]) revert UnauthorizedLender();

        MortgageApplication storage app = userApplication[borrower];
        if (app.applicant == address(0)) revert ApplicationNotFound();
        if (!app.isApproved) revert ApplicationNotApproved();
        if (app.isFunded) revert ApplicationAlreadyFunded();
        if (totalMortgagePool < app.loanAmount)
            revert InsufficientMortgagePool();

        app.isFunded = true;
        loanBalance[borrower] = app.loanAmount;
        totalMortgagePool -= app.loanAmount;
        totalLoansIssued++;

        stablecoin.safeTransfer(borrower, app.loanAmount);

        emit MortgageFunded(borrower, app.loanAmount);
    }

    /**
     * @dev Make mortgage payment
     * @param paymentAmount Amount to pay
     */
    function makePayment(uint256 paymentAmount) external nonReentrant {
        if (loanBalance[msg.sender] == 0) revert NoActiveLoan();
        if (paymentAmount == 0) revert InvalidAmount();

        totalMortgagePool += paymentAmount;

        if (paymentAmount >= loanBalance[msg.sender]) {
            loanBalance[msg.sender] = 0;
        } else {
            loanBalance[msg.sender] -= paymentAmount;
        }

        stablecoin.safeTransferFrom(msg.sender, address(this), paymentAmount);

        emit MortgagePaymentMade(
            msg.sender,
            paymentAmount,
            loanBalance[msg.sender]
        );
    }

    /**
     * @dev Get user's total crypto reputation score
     */
    function _getUserTotalCryptoScore(
        address user
    ) internal view returns (uint256 totalTrustScore) {
        totalTrustScore = trustBank.getTotalTrustScore(user);

        if (zkCreditContract != address(0)) {
            (bool success, bytes memory data) = zkCreditContract.staticcall(
                abi.encodeWithSignature("getUserCryptoBoost(address)", user)
            );
            if (success && data.length > 0) {
                uint256 cryptoBoost = abi.decode(data, (uint256));
                totalTrustScore += cryptoBoost;
            }
        }

        if (totalTrustScore < MIN_CRYPTO_SCORE) {
            revert InsufficientCryptoReputation();
        }
    }

    /**
     * @dev Calculate interest rate based on crypto reputation
     */
    function _calculateInterestRate(
        uint256 cryptoScore
    ) internal pure returns (uint256) {
        if (cryptoScore >= EXCELLENT_SCORE_THRESHOLD)
            return BASE_INTEREST_RATE - EXCELLENT_DISCOUNT; // 4.5%
        if (cryptoScore >= VERY_GOOD_SCORE_THRESHOLD)
            return BASE_INTEREST_RATE - VERY_GOOD_DISCOUNT; // 5%
        if (cryptoScore >= GOOD_SCORE_THRESHOLD)
            return BASE_INTEREST_RATE - GOOD_DISCOUNT; // 5.5%
        if (cryptoScore >= FAIR_SCORE_THRESHOLD) return BASE_INTEREST_RATE; // 6%
        return BASE_INTEREST_RATE + FAIR_PENALTY; // 7%
    }

    // View functions
    function getUserApplication(
        address user
    ) external view returns (MortgageApplication memory) {
        return userApplication[user];
    }

    function getUserLoanBalance(address user) external view returns (uint256) {
        return loanBalance[user];
    }

    function getTotalMortgagePool() external view returns (uint256) {
        return totalMortgagePool;
    }

    function getTotalLoansIssued() external view returns (uint256) {
        return totalLoansIssued;
    }

    function checkQualification(
        address user,
        uint256 loanAmount
    ) external view returns (bool qualified, uint256 interestRate) {
        if (loanAmount > MAX_LOAN_AMOUNT) return (false, 0);

        uint256 totalTrustScore = trustBank.getTotalTrustScore(user);

        interestRate = qualified ? _calculateInterestRate(totalTrustScore) : 0;
        qualified = totalTrustScore >= MIN_CRYPTO_SCORE;

        if (zkCreditContract != address(0)) {
            (bool success, bytes memory data) = zkCreditContract.staticcall(
                abi.encodeWithSignature("getUserCryptoBoost(address)", user)
            );
            if (success && data.length > 0) {
                uint256 cryptoBoost = abi.decode(data, (uint256));
                totalTrustScore += cryptoBoost;
            }
        }
    }

    // Admin functions
    function addApprovedLender(address lender) external onlyOwner {
        approvedLenders[lender] = true;
        emit LenderApproved(lender);
    }

    function addToMortgagePool(uint256 amount) external {
        if (!approvedLenders[msg.sender]) revert UnauthorizedLender();
        totalMortgagePool += amount;
        stablecoin.safeTransferFrom(msg.sender, address(this), amount);
    }

    function updateZKCreditContract(address _zkCredit) external onlyOwner {
        // Allow zero address to disable ZK credit functionality
        zkCreditContract = _zkCredit;
    }
}
