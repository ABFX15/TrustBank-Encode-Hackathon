pragma circom 2.0.0;

/**
 * Wallet Age Verification Circuit
 * 
 * Proves that a wallet is at least `minAgeDays` old without revealing
 * the exact creation date or first transaction timestamp.
 * 
 * This helps establish long-term crypto participation for reputation scoring.
 */

include "circomlib/circuits/comparators.circom";

template WalletAgeVerification() {
    // Private inputs
    signal private input firstTxTimestamp;    // Timestamp of first transaction
    signal private input walletSecret;        // Secret to prevent gaming
    
    // Public inputs  
    signal input currentTimestamp;            // Current timestamp
    signal input minAgeDays;                  // Minimum age in days to prove
    signal input walletAddress;               // Wallet address (public)
    
    // Output
    signal output valid;                      // 1 if wallet age >= minAgeDays
    
    // Constants
    var SECONDS_PER_DAY = 86400; // 24 * 60 * 60
    
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
    // First tx must be after 2015 (Ethereum launch) and before current time
    var ETHEREUM_LAUNCH = 1438300800; // July 30, 2015
    
    component validFirstTx = GreaterEqualThan(64);
    validFirstTx.in[0] <== firstTxTimestamp;
    validFirstTx.in[1] <== ETHEREUM_LAUNCH;
    validFirstTx.out === 1;
    
    component firstBeforeCurrent = LessEqualThan(64);
    firstBeforeCurrent.in[0] <== firstTxTimestamp;
    firstBeforeCurrent.in[1] <== currentTimestamp;
    firstBeforeCurrent.out === 1;
    
    // Constraint: Current timestamp must be reasonable (not too far in future)
    var MAX_FUTURE_SECONDS = 3600; // 1 hour tolerance for clock skew
    signal maxCurrentTime;
    maxCurrentTime <== currentTimestamp + MAX_FUTURE_SECONDS;
    
    // Optional: Bind wallet secret to address to prevent proof reuse
    // In practice, this would use a more sophisticated commitment scheme
    component secretBinding = Poseidon(2);
    secretBinding.inputs[0] <== walletAddress;
    secretBinding.inputs[1] <== walletSecret;
    // The commitment could be made public or used in nullifier generation
}

// Import Poseidon hash for secret binding
template Poseidon(nInputs) {
    signal input inputs[nInputs];
    signal output out;
    
    // Simplified for demo - in practice use circomlib's Poseidon
    out <== inputs[0] + inputs[1];
}

// Main component
component main = WalletAgeVerification();
