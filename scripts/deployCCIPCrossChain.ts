import { ethers } from "hardhat";
import { isAddress } from "ethers";

async function main() {
    // Replace with actual router and stablecoin addresses for your network
    const CCIP_ROUTER = process.env.CCIP_ROUTER || "0x0000000000000000000000000000000000000000";
    const STABLECOIN = process.env.STABLECOIN || "0x0000000000000000000000000000000000000000";

    if (!isAddress(CCIP_ROUTER) || !isAddress(STABLECOIN)) {
        throw new Error("Please set valid CCIP_ROUTER and STABLECOIN addresses in env");
    }

    const TrustBankCCIPCrossChain = await ethers.getContractFactory("TrustBankCCIPCrossChain");
    const ccip = await TrustBankCCIPCrossChain.deploy(CCIP_ROUTER, STABLECOIN);
    // The deploy() promise resolves when the contract is mined on Etherlink
    console.log("TrustBankCCIPCrossChain deployed to:", ccip.target);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
