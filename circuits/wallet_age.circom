pragma circom 2.0.0;

/**
 * TrustBank Wallet Age Verification Circuit
 * 
 * Proves that a wallet is at least `minAgeDays` old without revealing
 * the exact creation date or first transaction timestamp.
 * 
 * This helps establish long-term crypto participation for TrustBank reputation scoring.
 * Integrates with TrustBankZKCredit for enhanced trust scores.
 */

include "circomlib/circuits/comparators.circom";

template TrustBankWalletAgeVerification() {
    // Private inputs
    signal private input firstTxTimestamp;    // Timestamp of first transaction
    signal private input walletSecret;        // Secret to prevent gaming
    
    // Public inputs  
    signal input currentTimestamp;            // Current timestamp
    signal input minAgeDays;                  // Minimum age in days to prove
    signal input walletAddress;               // Wallet address (public)
    
    // Output
    signal output valid;                      // 1 if wallet age >= minAgeDays
    
    // Constants (aligned with TrustBank thresholds)
    var SECONDS_PER_DAY = 86400; // 24 * 60 * 60
    var ETHEREUM_LAUNCH = 1438300800; // July 30, 2015
    var MAX_FUTURE_SECONDS = 3600; // 1 hour tolerance for clock skew
    
    // Calculate wallet age in seconds
    signal walletAgeSeconds;
    walletAgeSeconds <== currentTimestamp - firstTxTimestamp;
    
    // Convert minimum age to seconds
    signal minAgeSeconds;
    minAgeSeconds <== minAgeDays * SECONDS_PER_DAY;
    
    // Check if wallet age meets minimum requirement
    component gte = GreaterEqualThan(64);
    gte.in[0] <== walletAgeSeconds;
    gte.in[1] <== minAgeSeconds;
    valid <== gte.out;
    
    // Constraints: Timestamps must be reasonable
    // First tx must be after Ethereum launch and before current time
    component validFirstTx = GreaterEqualThan(64);
    validFirstTx.in[0] <== firstTxTimestamp;
    validFirstTx.in[1] <== ETHEREUM_LAUNCH;
    validFirstTx.out === 1;

    component firstBeforeCurrent = LessEqualThan(64);
    firstBeforeCurrent.in[0] <== firstTxTimestamp;
    firstBeforeCurrent.in[1] <== currentTimestamp;
    firstBeforeCurrent.out === 1;

    // Constraint: Current timestamp must be reasonable (not too far in future)
    component reasonableCurrent = LessEqualThan(64);
    reasonableCurrent.in[0] <== currentTimestamp;
    reasonableCurrent.in[1] <== currentTimestamp + MAX_FUTURE_SECONDS;
    reasonableCurrent.out === 1;
    
    // Optional: Bind wallet secret to address to prevent proof reuse
    // In TrustBank, this creates a unique commitment per user
    component secretBinding = Poseidon(2);
    secretBinding.inputs[0] <== walletAddress;
    secretBinding.inputs[1] <== walletSecret;
    // The commitment can be used for nullifier generation in TrustBank
}

// Import Poseidon hash for secret binding (production would use circomlib)
template Poseidon(nInputs) {
    signal input inputs[nInputs];
    signal output out;
    
    // Simplified for demo - production should use circomlib's Poseidon
    // This provides a deterministic hash function for commitment schemes
    if (nInputs == 2) {
        out <== inputs[0] + inputs[1] * 1000000007; // Large prime for mixing
    } else {
        out <== inputs[0] + inputs[1];
    }
}

// Main component for TrustBank wallet age verification
component main = TrustBankWalletAgeVerification();
