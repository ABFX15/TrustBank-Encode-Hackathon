// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @dev Mock USDC contract for testing (6 decimals like real USDC)
 */
contract MockUSDC is ERC20, Ownable {
    // Custom errors
    error AlreadyHasEnoughUSDC();

    constructor() ERC20("Mock USD Coin", "USDC") Ownable(msg.sender) {
        // Mint 1M USDC for testing
        _mint(msg.sender, 1_000_000 * 10 ** 6);
    }

    function decimals() public pure override returns (uint8) {
        return 6; // USDC has 6 decimals
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    // Faucet function for testing - anyone can get 1000 USDC
    function faucet() external {
        if (balanceOf(msg.sender) >= 1000 * 10 ** 6) {
            revert AlreadyHasEnoughUSDC();
        }
        _mint(msg.sender, 1000 * 10 ** 6);
    }
}
