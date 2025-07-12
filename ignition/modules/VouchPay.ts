import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VouchPayModule = buildModule("VouchPayModule", (m) => {
    // Deploy with USDC address on Etherlink testnet
    const stablecoin = m.getParameter("stablecoin", "0x..."); // Add Etherlink USDC address

    // ZK verification key (for demo purposes)
    const zkVerificationKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

    // Deploy core contracts
    const vouchPayCore = m.contract("VouchPayCore", [stablecoin]);
    const yieldStrategy = m.contract("YieldStrategy", [stablecoin]);
    const creditEngine = m.contract("CreditEngine", [vouchPayCore, stablecoin]);
    const bankingBridge = m.contract("BankingBridge", [vouchPayCore, stablecoin]);

    // Deploy ZK credit import contract (crypto reputation)
    const zkCreditImport = m.contract("ZKCreditImport", [
        vouchPayCore,
        creditEngine,
        zkVerificationKey
    ]);

    // Deploy crypto mortgage contract
    const cryptoMortgage = m.contract("CryptoMortgage", [
        stablecoin,
        vouchPayCore,
        zkCreditImport
    ]);

    // Connect ZK credit contract to core contracts
    m.call(vouchPayCore, "setZKCreditContract", [zkCreditImport]);
    m.call(creditEngine, "setZKCreditContract", [zkCreditImport]);

    return {
        vouchPayCore,
        yieldStrategy,
        creditEngine,
        bankingBridge,
        zkCreditImport,
        cryptoMortgage,
    };
});

export default VouchPayModule;
