import { ethers } from "hardhat";

async function main() {
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    // The deploy() promise resolves when the contract is mined on Etherlink
    console.log("MockUSDC deployed to:", usdc.target);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
