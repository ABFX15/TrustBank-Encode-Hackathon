#!/usr/bin/env node

/**
 * TrustBank ZK Proof Generation Examples
 * 
 * This script demonstrates how to generate ZK proofs for all TrustBank circuits:
 * - DeFi TVL verification
 * - Lending history verification  
 * - Wallet age verification
 * 
 * Usage: node scripts/generate-proofs.js
 */

const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

// Helper to format proof for Solidity
function formatProofForSolidity(proof) {
    return {
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
        c: [proof.pi_c[0], proof.pi_c[1]]
    };
}

// Helper to save proof data
function saveProofData(circuitName, input, proof, publicSignals) {
    const outputDir = `build/proofs/${circuitName}`;
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
        path.join(outputDir, "input.json"),
        JSON.stringify(input, null, 2)
    );

    fs.writeFileSync(
        path.join(outputDir, "proof.json"),
        JSON.stringify(proof, null, 2)
    );

    fs.writeFileSync(
        path.join(outputDir, "public_signals.json"),
        JSON.stringify(publicSignals, null, 2)
    );

    fs.writeFileSync(
        path.join(outputDir, "solidity_proof.json"),
        JSON.stringify(formatProofForSolidity(proof), null, 2)
    );
}

async function generateDeFiTVLProof() {
    console.log("🏦 Generating DeFi TVL proof...");

    // Example: User has $150k TVL across 3 protocols, wants to prove ≥$50k
    const input = {
        protocolBalances: [75000, 50000, 25000, 0, 0, 0, 0, 0, 0, 0], // $150k total
        protocolMask: [1, 1, 1, 0, 0, 0, 0, 0, 0, 0], // 3 protocols used
        threshold: 50000, // Prove ≥ $50k TVL
        timestamp: Math.floor(Date.now() / 1000)
    };

    try {
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            "build/circuits/defi_tvl.wasm",
            "build/circuits/defi_tvl_final.zkey"
        );

        saveProofData("defi_tvl", input, proof, publicSignals);

        console.log("   ✅ Proof generated successfully");
        console.log(`   📊 Threshold: $${input.threshold.toLocaleString()}`);
        console.log(`   🏦 Protocols used: ${input.protocolMask.reduce((a, b) => a + b, 0)}`);

        return { proof: formatProofForSolidity(proof), publicSignals };
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return null;
    }
}

async function generateLendingHistoryProof() {
    console.log("📋 Generating Lending History proof...");

    // Example: User has 5 successful loans, wants to prove ≥3 loans
    const numLoans = 5;
    const loanIds = new Array(50).fill(0);
    const repaymentProofs = new Array(50).fill(0);
    const loanMask = new Array(50).fill(0);

    // Set up 5 successful loans
    for (let i = 0; i < numLoans; i++) {
        loanIds[i] = 1000 + i; // Loan IDs
        repaymentProofs[i] = 1; // Successfully repaid
        loanMask[i] = 1; // Include in count
    }

    const input = {
        loanIds,
        repaymentProofs,
        loanMask,
        nullifierSecret: 12345, // User's secret for nullifier generation
        threshold: 3, // Prove ≥3 successful loans
        timestamp: Math.floor(Date.now() / 1000)
    };

    try {
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            "build/circuits/lending_history.wasm",
            "build/circuits/lending_history_final.zkey"
        );

        saveProofData("lending_history", input, proof, publicSignals);

        console.log("   ✅ Proof generated successfully");
        console.log(`   💳 Loans proven: ${numLoans}`);
        console.log(`   🎯 Threshold: ${input.threshold}`);

        return { proof: formatProofForSolidity(proof), publicSignals };
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return null;
    }
}

async function generateWalletAgeProof() {
    console.log("📅 Generating Wallet Age proof...");

    // Example: Wallet created 180 days ago, prove ≥90 days
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const daysAgo = 180;
    const firstTxTimestamp = currentTimestamp - (daysAgo * 24 * 60 * 60);

    const input = {
        firstTxTimestamp,
        walletSecret: 98765, // User's wallet secret
        currentTimestamp,
        minAgeDays: 90, // Prove ≥90 days old
        walletAddress: "0x742d35Cc6634C0532925a3b8D8C0F4F23d5e7aF8" // Example address
    };

    try {
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            "build/circuits/wallet_age.wasm",
            "build/circuits/wallet_age_final.zkey"
        );

        saveProofData("wallet_age", input, proof, publicSignals);

        console.log("   ✅ Proof generated successfully");
        console.log(`   📅 Wallet age: ${daysAgo} days`);
        console.log(`   🎯 Minimum required: ${input.minAgeDays} days`);

        return { proof: formatProofForSolidity(proof), publicSignals };
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return null;
    }
}

async function main() {
    console.log("🔒 TrustBank ZK Proof Generation");
    console.log("================================");
    console.log("");

    // Check if circuits are compiled
    const requiredFiles = [
        "build/circuits/defi_tvl.wasm",
        "build/circuits/defi_tvl_final.zkey",
        "build/circuits/lending_history.wasm",
        "build/circuits/lending_history_final.zkey",
        "build/circuits/wallet_age.wasm",
        "build/circuits/wallet_age_final.zkey"
    ];

    for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
            console.log(`❌ Missing ${file}`);
            console.log("📋 Run './scripts/compile-circuits.sh' first to compile circuits");
            process.exit(1);
        }
    }

    console.log("✅ All circuit files found");
    console.log("");

    // Generate all proofs
    const results = {
        defiTVL: await generateDeFiTVLProof(),
        lendingHistory: await generateLendingHistoryProof(),
        walletAge: await generateWalletAgeProof()
    };

    console.log("");
    console.log("🎉 Proof generation complete!");
    console.log("");
    console.log("Generated files:");
    console.log("   📁 build/proofs/ - All proof data and examples");
    console.log("");
    console.log("Integration examples:");
    console.log("   📋 See solidity_proof.json files for contract integration format");
    console.log("   🔗 Use with ZKCreditImportProduction.sol submitZKProof() function");
    console.log("");

    // Summary
    const successful = Object.values(results).filter(Boolean).length;
    console.log(`📊 Summary: ${successful}/3 proofs generated successfully`);

    if (successful === 3) {
        console.log("🚀 Ready for ZK integration with TrustBank!");
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    generateDeFiTVLProof,
    generateLendingHistoryProof,
    generateWalletAgeProof,
    formatProofForSolidity
};
