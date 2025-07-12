// TrustBank ZK Proof Generation Examples
// This file shows how to generate proofs for our Circom circuits

const snarkjs = require("snarkjs");
const fs = require("fs");

/**
 * Generate a DeFi TVL proof
 * Proves user has at least `threshold` TVL without revealing exact amounts
 */
async function generateDeFiTVLProof(userTVLData, threshold) {
    console.log("🔐 Generating DeFi TVL proof...");

    // Example: User has TVL across 3 protocols out of 10 possible
    const protocolBalances = new Array(10).fill(0);
    const protocolMask = new Array(10).fill(0);

    // User's actual TVL (private)
    protocolBalances[0] = userTVLData.aave || 0;        // $50,000 in Aave
    protocolBalances[1] = userTVLData.compound || 0;    // $30,000 in Compound  
    protocolBalances[2] = userTVLData.uniswap || 0;     // $20,000 in Uniswap

    // Mark which protocols are used
    protocolMask[0] = userTVLData.aave > 0 ? 1 : 0;
    protocolMask[1] = userTVLData.compound > 0 ? 1 : 0;
    protocolMask[2] = userTVLData.uniswap > 0 ? 1 : 0;

    const input = {
        protocolBalances: protocolBalances,
        protocolMask: protocolMask,
        threshold: threshold,  // e.g., $50,000 minimum
        timestamp: Math.floor(Date.now() / 1000)
    };

    // Generate proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        "build/circuits/defi_tvl.wasm",
        "build/circuits/defi_tvl_final.zkey"
    );

    return { proof, publicSignals };
}

/**
 * Generate a Lending History proof  
 * Proves user has completed at least `threshold` loans without revealing details
 */
async function generateLendingHistoryProof(userLoans, threshold) {
    console.log("📋 Generating Lending History proof...");

    const maxLoans = 50;
    const loanIds = new Array(maxLoans).fill(0);
    const repaymentProofs = new Array(maxLoans).fill(0);
    const loanMask = new Array(maxLoans).fill(0);

    // Fill in user's actual loan data (up to maxLoans)
    for (let i = 0; i < Math.min(userLoans.length, maxLoans); i++) {
        loanIds[i] = userLoans[i].id;
        repaymentProofs[i] = userLoans[i].repaid ? 1 : 0;
        loanMask[i] = userLoans[i].repaid ? 1 : 0; // Only count repaid loans
    }

    const input = {
        loanIds: loanIds,
        repaymentProofs: repaymentProofs,
        loanMask: loanMask,
        nullifierSecret: 12345, // User's secret for nullifier generation
        threshold: threshold,   // e.g., minimum 5 successful loans
        timestamp: Math.floor(Date.now() / 1000)
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        "build/circuits/lending_history.wasm",
        "build/circuits/lending_history_final.zkey"
    );

    return { proof, publicSignals };
}

/**
 * Generate a Wallet Age proof
 * Proves wallet is at least `minAgeDays` old without revealing exact age
 */
async function generateWalletAgeProof(firstTxTimestamp, minAgeDays, walletAddress) {
    console.log("📅 Generating Wallet Age proof...");

    const input = {
        firstTxTimestamp: firstTxTimestamp,
        walletSecret: 67890, // User's wallet secret
        currentTimestamp: Math.floor(Date.now() / 1000),
        minAgeDays: minAgeDays, // e.g., 365 days minimum
        walletAddress: walletAddress
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        "build/circuits/wallet_age.wasm",
        "build/circuits/wallet_age_final.zkey"
    );

    return { proof, publicSignals };
}

/**
 * Verify a proof on-chain format conversion
 */
function formatProofForSolidity(proof) {
    return {
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
        c: [proof.pi_c[0], proof.pi_c[1]],
        publicSignals: proof.publicSignals || []
    };
}

// Example usage
async function main() {
    try {
        // Example user data
        const userTVL = {
            aave: 50000,      // $50k in Aave
            compound: 30000,  // $30k in Compound  
            uniswap: 20000    // $20k in Uniswap
        };

        const userLoans = [
            { id: 1, repaid: true },
            { id: 2, repaid: true },
            { id: 3, repaid: true },
            { id: 4, repaid: false },
            { id: 5, repaid: true }
        ];

        const firstTx = 1609459200; // Jan 1, 2021
        const walletAddr = "0x742d35Cc6639C0532fEa6b1E523E44db7E8e2AC1";

        // Generate proofs
        console.log("🚀 Generating TrustBank ZK proofs...");

        const tvlProof = await generateDeFiTVLProof(userTVL, 50000);
        console.log("✅ DeFi TVL proof generated");

        const lendingProof = await generateLendingHistoryProof(userLoans, 3);
        console.log("✅ Lending History proof generated");

        const ageProof = await generateWalletAgeProof(firstTx, 365, walletAddr);
        console.log("✅ Wallet Age proof generated");

        // Format for Solidity
        const solidityTVLProof = formatProofForSolidity(tvlProof.proof);
        const solidityLendingProof = formatProofForSolidity(lendingProof.proof);
        const solidityAgeProof = formatProofForSolidity(ageProof.proof);

        console.log("📝 Proofs formatted for Solidity submission");
        console.log("🎯 Ready for TrustBankZKCredit.submitZKProof()");

    } catch (error) {
        console.error("❌ Proof generation failed:", error);
    }
}

module.exports = {
    generateDeFiTVLProof,
    generateLendingHistoryProof,
    generateWalletAgeProof,
    formatProofForSolidity
};

if (require.main === module) {
    main();
}
