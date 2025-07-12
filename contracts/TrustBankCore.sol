// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TrustBankCore
 * @dev Main banking contract for stablecoin transfers with trust-based vouching system
 *
 * This contract enables TrustBank's core banking functionality:
 * - Instant stablecoin payments with social features
 * - Trust-based lending through vouching mechanisms
 * - Reputation building for progressive credit limits
 */
contract TrustBankCore is Ownable {
    using SafeERC20 for IERC20;

    // Custom errors
    error UnauthorizedZKContract();
    error TrustBankCore__AddressZeroStablecoin();
    error TrustBankCore__InsufficientBalance();
    error TrustBankCore__InsufficientTrustScore();
    error TrustBankScore__AddressZeroZkCredit();

    // Core payment structures
    struct Payment {
        address from;
        address to;
        uint256 amount;
        string message;
        uint256 timestamp;
        bool completed;
    }

    struct Vouch {
        address voucher;
        address vouchee;
        uint256 amount;
        uint256 timestamp;
        bool active;
    }

    // State variables
    IERC20 public immutable stablecoin; // USDC/USDT
    mapping(uint256 => Payment) public payments;
    mapping(address => Vouch[]) public vouches;
    mapping(address => uint256) public trustScores;
    mapping(address => uint256) public paymentCount;
    uint256 public nextPaymentId;

    // ZK Credit Integration
    address public zkCreditContract;
    mapping(address => uint256) public creditBoosts;

    // Events
    event PaymentSent(
        uint256 indexed paymentId,
        address indexed from,
        address indexed to,
        uint256 amount
    );
    event VouchCreated(
        address indexed voucher,
        address indexed vouchee,
        uint256 amount
    );
    event TrustScoreUpdated(address indexed user, uint256 newScore);
    event ZKCreditContractUpdated(address indexed newContract);
    event CreditBoostApplied(address indexed user, uint256 boost);

    constructor(address _stablecoin) Ownable(msg.sender) {
        if (_stablecoin == address(0)) {
            revert TrustBankCore__AddressZeroStablecoin();
        }
        stablecoin = IERC20(_stablecoin);
    }

    /**
     * @dev Send stablecoin payment to another user
     * @param to Recipient address
     * @param amount Amount in stablecoin (6 decimals for USDC)
     * @param message Optional payment message
     */
    function sendPayment(
        address to,
        uint256 amount,
        string memory message
    ) external {
        uint256 balance = stablecoin.balanceOf(msg.sender);
        if (balance < amount) revert TrustBankCore__InsufficientBalance();

        nextPaymentId++;
        paymentCount[msg.sender]++; 

        payments[nextPaymentId] = Payment({
            from: msg.sender,
            to: to,
            amount: amount,
            message: message,
            timestamp: block.timestamp,
            completed: false
        });
        payments[nextPaymentId].completed = true;

        trustScores[msg.sender] = _calculateTrustScore(msg.sender);

        stablecoin.safeTransferFrom(msg.sender, to, amount);

        emit PaymentSent(nextPaymentId, msg.sender, to, amount);
    }

    /**
     * @dev Vouch for another user (stake reputation)
     * @param user Address to vouch for
     * @param amount Vouch amount (affects their credit limit)
     */
    function vouchForUser(address user, uint256 amount) external {
        uint256 voucherScore = getUserTrustScore(msg.sender);
        if (voucherScore < amount) {
            revert TrustBankCore__InsufficientTrustScore();
        }

        vouches[user].push(
            Vouch({
                voucher: msg.sender,
                vouchee: user,
                amount: amount,
                timestamp: block.timestamp,
                active: true
            })
        );

        trustScores[user] = _calculateTrustScore(user);

        emit VouchCreated(msg.sender, user, amount);
        emit TrustScoreUpdated(user, trustScores[user]);
    }

    /**
     * @dev Calculate user's trust score based on payment history and vouches
     * @param user Address to check
     * @return Current trust score
     */
    function _calculateTrustScore(
        address user
    ) internal view returns (uint256) {
        uint256 baseScore = 0;

        // 1. Payment history component (50% weight)
        uint256 paymentScore = paymentCount[user] * 10; // 10 points per successful payment

        // 2. Vouch component (40% weight)
        uint256 vouchScore = 0;
        Vouch[] memory userVouches = vouches[user];
        for (uint256 i = 0; i < userVouches.length; i++) {
            if (userVouches[i].active) {
                // Each vouch adds points based on amount and voucher's credibility
                uint256 voucherCredibility = trustScores[
                    userVouches[i].voucher
                ];
                if (voucherCredibility > 0) {
                    // Vouch value is proportional to voucher's credibility
                    vouchScore +=
                        (userVouches[i].amount * voucherCredibility) /
                        1000;
                }
            }
        }

        // 3. Time-based bonus (10% weight) - users get points for account age
        uint256 timeBonus = 0;
        if (paymentCount[user] > 0) {
            // Simple time bonus - could be enhanced with actual account creation time
            timeBonus = 50; // Base bonus for active accounts
        }

        // Combine all components
        baseScore = paymentScore + vouchScore + timeBonus;

        // Apply any existing credit boosts
        return baseScore + creditBoosts[user];
    }

    /**
     * @dev Get user's payment history
     * @param user Address to check
     * @return Array of payment IDs
     */
    function getUserPayments(
        address user
    ) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= nextPaymentId; i++) {
            if (payments[i].from == user || payments[i].to == user) {
                count++;
            }
        }

        uint256[] memory userPaymentIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= nextPaymentId; i++) {
            if (payments[i].from == user || payments[i].to == user) {
                userPaymentIds[index] = i;
                index++;
            }
        }

        return userPaymentIds;
    }

    function getUserTrustScore(address user) public view returns (uint256) {
        return trustScores[user];
    }

    /**
     * @dev Get vouches for a user
     * @param user Address to check
     * @return Array of vouches received
     */
    function getUserVouches(
        address user
    ) external view returns (Vouch[] memory) {
        return vouches[user];
    }

    /**
     * @dev Set ZK credit contract address (admin only)
     * @param _zkCredit Address of ZK credit contract
     */
    function setZKCreditContract(address _zkCredit) external onlyOwner {
        if (_zkCredit == address(0)) {
            revert TrustBankScore__AddressZeroZkCredit();
        }
        zkCreditContract = _zkCredit;
        emit ZKCreditContractUpdated(_zkCredit);
    }

    /**
     * @dev Apply credit boost to user's trust score (called by ZK contract)
     * @param user User to boost
     * @param boost Amount to boost
     */
    function applyCreditBoost(address user, uint256 boost) external {
        if (msg.sender != zkCreditContract) revert UnauthorizedZKContract();
        creditBoosts[user] += boost;
        trustScores[user] += boost;
        emit CreditBoostApplied(user, boost);
        emit TrustScoreUpdated(user, trustScores[user]);
    }

    /**
     * @dev Get user's total trust score including credit boosts
     * @param user Address to check
     * @return Total trust score
     */
    function getTotalTrustScore(address user) external view returns (uint256) {
        return trustScores[user]; // Already includes applied boosts
    }
}
