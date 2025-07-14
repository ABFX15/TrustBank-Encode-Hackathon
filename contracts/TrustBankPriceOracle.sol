// SPDX-License-Identifier: MIT

pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TrustBankPriceOracle
 * @dev RedStone integration for decentralized asset pricing and yield optimization
 *
 * This contract provides real-time pricing data for TrustBank's yield strategies
 * and helps optimize capital allocation across DeFi protocols
 */
contract TrustBankPriceOracle is Ownable {
    // Custom errors
    error PriceOracle__InvalidAsset();
    error PriceOracle__PriceStale();
    error PriceOracle__InsufficientData();

    // Price feed structure
    struct PriceFeed {
        uint256 price;
        uint256 lastUpdated;
        bool active;
        uint8 decimals;
    }

    // Yield strategy structure
    struct YieldStrategy {
        string name;
        string protocol;
        uint256 currentAPY;
        uint256 lastUpdated;
        bool active;
        uint256 minDeposit;
        uint256 maxAllocation; // Percentage in basis points
    }

    // State variables
    mapping(string => PriceFeed) public priceFeeds;
    mapping(string => YieldStrategy) public yieldStrategies;
    mapping(address => bool) public authorizedUpdaters;

    string[] public supportedAssets;
    string[] public activeStrategies;

    uint256 public constant PRICE_STALENESS_THRESHOLD = 1 hours;
    uint256 public constant BASIS_POINTS = 10000;

    // Events
    event PriceUpdated(string indexed asset, uint256 price, uint256 timestamp);
    event YieldStrategyUpdated(
        string indexed strategy,
        uint256 apy,
        uint256 timestamp
    );
    event AuthorizedUpdaterSet(address indexed updater, bool authorized);

    constructor() Ownable(msg.sender) {
        // Initialize supported assets
        supportedAssets = ["USDC", "USDT", "ETH", "BTC"];

        // Initialize default price feeds (these would be updated by RedStone)
        priceFeeds["USDC"] = PriceFeed({
            price: 1e8, // $1.00 with 8 decimals
            lastUpdated: block.timestamp,
            active: true,
            decimals: 8
        });

        priceFeeds["USDT"] = PriceFeed({
            price: 1e8, // $1.00 with 8 decimals
            lastUpdated: block.timestamp,
            active: true,
            decimals: 8
        });

        // Initialize yield strategies
        _initializeYieldStrategies();
    }

    /**
     * @dev Initialize default yield strategies
     */
    function _initializeYieldStrategies() internal {
        // Aave USDC Strategy
        yieldStrategies["AAVE_USDC"] = YieldStrategy({
            name: "Aave USDC Lending",
            protocol: "aave",
            currentAPY: 520, // 5.2% in basis points
            lastUpdated: block.timestamp,
            active: true,
            minDeposit: 1e6, // $1 USDC
            maxAllocation: 4000 // 40% max allocation
        });

        // Compound USDC Strategy
        yieldStrategies["COMPOUND_USDC"] = YieldStrategy({
            name: "Compound USDC Lending",
            protocol: "compound",
            currentAPY: 480, // 4.8% in basis points
            lastUpdated: block.timestamp,
            active: true,
            minDeposit: 1e6, // $1 USDC
            maxAllocation: 4000 // 40% max allocation
        });

        // Uniswap V3 USDC/USDT Strategy
        yieldStrategies["UNISWAP_USDC_USDT"] = YieldStrategy({
            name: "Uniswap V3 USDC/USDT Pool",
            protocol: "uniswap",
            currentAPY: 680, // 6.8% in basis points (higher due to fees + rewards)
            lastUpdated: block.timestamp,
            active: true,
            minDeposit: 10e6, // $10 minimum for LP
            maxAllocation: 2000 // 20% max allocation (higher risk)
        });

        activeStrategies = ["AAVE_USDC", "COMPOUND_USDC", "UNISWAP_USDC_USDT"];
    }

    /**
     * @dev Get current price for an asset
     * @param asset Asset symbol (e.g., "USDC", "ETH")
     * @return price Asset price with decimals
     */
    function getAssetPrice(
        string memory asset
    ) external view returns (uint256 price) {
        PriceFeed memory feed = priceFeeds[asset];

        if (!feed.active) {
            revert PriceOracle__InvalidAsset();
        }

        if (block.timestamp - feed.lastUpdated > PRICE_STALENESS_THRESHOLD) {
            revert PriceOracle__PriceStale();
        }

        return feed.price;
    }

    /**
     * @dev Get current APY for a yield strategy
     * @param strategy Strategy identifier (e.g., "AAVE_USDC")
     * @return apy Current APY in basis points
     */
    function getYieldAPY(
        string memory strategy
    ) external view returns (uint256 apy) {
        YieldStrategy memory strat = yieldStrategies[strategy];

        if (!strat.active) {
            revert PriceOracle__InvalidAsset();
        }

        return strat.currentAPY;
    }

    /**
     * @dev Get USD value of token amount
     * @param token Token contract address
     * @param amount Token amount
     * @param assetSymbol Asset symbol for price lookup
     * @return usdValue USD value with 8 decimals
     */
    function getCollateralValue(
        address token,
        uint256 amount,
        string memory assetSymbol
    ) external view returns (uint256 usdValue) {
        uint256 price = this.getAssetPrice(assetSymbol);

        // Get token decimals (assume 18 for most ERC20, 6 for USDC/USDT)
        uint8 tokenDecimals = _getTokenDecimals(token, assetSymbol);

        // Calculate USD value: (amount * price) / (10^tokenDecimals)
        usdValue = (amount * price) / (10 ** tokenDecimals);

        return usdValue;
    }

    /**
     * @dev Find optimal yield strategy based on current APYs
     * @param minAPY Minimum acceptable APY in basis points
     * @param maxRisk Maximum risk level (0-100)
     * @return bestStrategy Strategy identifier with highest yield
     * @return expectedAPY Expected APY in basis points
     */
    function getOptimalYieldStrategy(
        uint256 minAPY,
        uint256 maxRisk
    ) external view returns (string memory bestStrategy, uint256 expectedAPY) {
        uint256 bestAPY = 0;
        string memory bestStrategyName = "";

        for (uint256 i = 0; i < activeStrategies.length; i++) {
            string memory strategyName = activeStrategies[i];
            YieldStrategy memory strategy = yieldStrategies[strategyName];

            if (strategy.active && strategy.currentAPY >= minAPY) {
                // Simple risk calculation based on protocol type
                uint256 riskLevel = _calculateRiskLevel(strategy.protocol);

                if (riskLevel <= maxRisk && strategy.currentAPY > bestAPY) {
                    bestAPY = strategy.currentAPY;
                    bestStrategyName = strategyName;
                }
            }
        }

        if (bestAPY == 0) {
            revert PriceOracle__InsufficientData();
        }

        return (bestStrategyName, bestAPY);
    }

    /**
     * @dev Calculate diversified allocation across strategies
     * @param totalAmount Total amount to allocate
     * @return strategies Array of strategy names
     * @return allocations Array of allocation amounts corresponding to strategies
     */
    function getOptimalAllocation(
        uint256 totalAmount
    )
        external
        view
        returns (string[] memory strategies, uint256[] memory allocations)
    {
        strategies = new string[](activeStrategies.length);
        allocations = new uint256[](activeStrategies.length);

        uint256 remainingAmount = totalAmount;
        uint256 strategyCount = 0;

        // Sort strategies by APY (simplified - in production use more sophisticated algorithm)
        for (uint256 i = 0; i < activeStrategies.length; i++) {
            string memory strategyName = activeStrategies[i];
            YieldStrategy memory strategy = yieldStrategies[strategyName];

            if (strategy.active && remainingAmount >= strategy.minDeposit) {
                uint256 maxAllocation = (totalAmount * strategy.maxAllocation) /
                    BASIS_POINTS;
                uint256 allocation = remainingAmount > maxAllocation
                    ? maxAllocation
                    : remainingAmount;

                strategies[strategyCount] = strategyName;
                allocations[strategyCount] = allocation;
                remainingAmount -= allocation;
                strategyCount++;

                if (remainingAmount == 0) break;
            }
        }

        // Resize arrays to actual strategy count
        assembly {
            mstore(strategies, strategyCount)
            mstore(allocations, strategyCount)
        }

        return (strategies, allocations);
    }

    /**
     * @dev Update asset price (called by RedStone oracle or authorized updater)
     * @param asset Asset symbol
     * @param price New price with 8 decimals
     */
    function updateAssetPrice(string memory asset, uint256 price) external {
        require(
            authorizedUpdaters[msg.sender] || msg.sender == owner(),
            "Unauthorized"
        );

        priceFeeds[asset].price = price;
        priceFeeds[asset].lastUpdated = block.timestamp;

        emit PriceUpdated(asset, price, block.timestamp);
    }

    /**
     * @dev Update yield strategy APY
     * @param strategy Strategy identifier
     * @param newAPY New APY in basis points
     */
    function updateYieldAPY(string memory strategy, uint256 newAPY) external {
        require(
            authorizedUpdaters[msg.sender] || msg.sender == owner(),
            "Unauthorized"
        );

        yieldStrategies[strategy].currentAPY = newAPY;
        yieldStrategies[strategy].lastUpdated = block.timestamp;

        emit YieldStrategyUpdated(strategy, newAPY, block.timestamp);
    }

    /**
     * @dev Set authorized price updater
     * @param updater Address to authorize/deauthorize
     * @param authorized Whether the address is authorized
     */
    function setAuthorizedUpdater(
        address updater,
        bool authorized
    ) external onlyOwner {
        authorizedUpdaters[updater] = authorized;
        emit AuthorizedUpdaterSet(updater, authorized);
    }

    /**
     * @dev Get all active yield strategies with their APYs
     * @return strategies Array of strategy names
     * @return apys Array of corresponding APYs
     */
    function getAllYieldStrategies()
        external
        view
        returns (string[] memory strategies, uint256[] memory apys)
    {
        strategies = new string[](activeStrategies.length);
        apys = new uint256[](activeStrategies.length);

        for (uint256 i = 0; i < activeStrategies.length; i++) {
            strategies[i] = activeStrategies[i];
            apys[i] = yieldStrategies[activeStrategies[i]].currentAPY;
        }

        return (strategies, apys);
    }

    /**
     * @dev Calculate risk level for a protocol (simplified)
     * @param protocol Protocol name
     * @return riskLevel Risk level 0-100 (0 = lowest risk)
     */
    function _calculateRiskLevel(
        string memory protocol
    ) internal pure returns (uint256 riskLevel) {
        bytes32 protocolHash = keccak256(abi.encodePacked(protocol));

        if (protocolHash == keccak256(abi.encodePacked("aave"))) {
            return 10; // Very low risk
        } else if (protocolHash == keccak256(abi.encodePacked("compound"))) {
            return 15; // Low risk
        } else if (protocolHash == keccak256(abi.encodePacked("uniswap"))) {
            return 35; // Medium risk (impermanent loss)
        }

        return 50; // Default medium-high risk
    }

    /**
     * @dev Get token decimals (simplified)
     * @param token Token address
     * @param symbol Asset symbol
     * @return decimals Number of decimals
     */
    function _getTokenDecimals(
        address token,
        string memory symbol
    ) internal pure returns (uint8 decimals) {
        bytes32 symbolHash = keccak256(abi.encodePacked(symbol));

        if (
            symbolHash == keccak256(abi.encodePacked("USDC")) ||
            symbolHash == keccak256(abi.encodePacked("USDT"))
        ) {
            return 6;
        }

        return 18; // Default for most ERC20 tokens
    }
}
