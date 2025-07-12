import { ethers } from "hardhat";

async function main() {
    // Replace with actual router and stablecoin addresses for your network
    const CCIP_ROUTER = process.env.CCIP_ROUTER || "0x0000000000000000000000000000000000000000";
    const STABLECOIN = process.env.STABLECOIN || "0x0000000000000000000000000000000000000000";

    if (!ethers.utils.isAddress(CCIP_ROUTER) || !ethers.utils.isAddress(STABLECOIN)) {
        throw new Error("Please set valid CCIP_ROUTER and STABLECOIN addresses in env");
    }

    const TrustBankCCIPCrossChain = await ethers.getContractFactory("TrustBankCCIPCrossChain");
    const ccip = await TrustBankCCIPCrossChain.deploy(CCIP_ROUTER, STABLECOIN);
    await ccip.deployed();
    console.log("TrustBankCCIPCrossChain deployed to:", ccip.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
