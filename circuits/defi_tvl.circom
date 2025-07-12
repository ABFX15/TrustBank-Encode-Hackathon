pragma circom 2.0.0;

/**
 * TrustBank DeFi TVL Verification Circuit
 * 
 * Proves that a user has at least `threshold` amount of TVL across DeFi protocols
 * without revealing the exact TVL amounts or which protocols they use.
 * 
 * This circuit ensures privacy while enabling reputation-based lending in TrustBank.
 * Integrates with TrustBankZKCredit contract for trust score enhancement.
 */

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/gates.circom";

template TrustBankDeFiTVLVerification(maxProtocols) {
    // Private inputs - user's actual data
    signal private input protocolBalances[maxProtocols]; // Balances across different protocols
    signal private input protocolMask[maxProtocols];     // 1 if protocol is used, 0 otherwise
    
    // Public inputs - what we're proving
    signal input threshold;      // Minimum TVL threshold to prove
    signal input timestamp;      // Proof timestamp for freshness
    
    // Output - proof result
    signal output valid;         // 1 if TVL >= threshold, 0 otherwise
    
    // Internal signals
    signal totalTVL;
    
    // Calculate total TVL across all protocols
    component sumTVL = Sum(maxProtocols);
    for (var i = 0; i < maxProtocols; i++) {
        sumTVL.inputs[i] <== protocolBalances[i] * protocolMask[i];
    }
    totalTVL <== sumTVL.out;
    
    // Check if total TVL meets threshold
    component gte = GreaterEqualThan(64); // 64-bit comparison
    gte.in[0] <== totalTVL;
    gte.in[1] <== threshold;
    
    valid <== gte.out;
    
    // Constraint: All protocol balances must be non-negative
    component nonNegative[maxProtocols];
    for (var i = 0; i < maxProtocols; i++) {
        nonNegative[i] = GreaterEqualThan(64);
        nonNegative[i].in[0] <== protocolBalances[i];
        nonNegative[i].in[1] <== 0;
        nonNegative[i].out === 1;
    }
    
    // Constraint: Protocol mask must be binary
    component binaryMask[maxProtocols];
    for (var i = 0; i < maxProtocols; i++) {
        binaryMask[i] = IsEqual();
        binaryMask[i].in[0] <== protocolMask[i] * (protocolMask[i] - 1);
        binaryMask[i].in[1] <== 0;
        binaryMask[i].out === 1;
    }
}

template Sum(n) {
    signal input inputs[n];
    signal output out;
    
    if (n == 1) {
        out <== inputs[0];
    } else {
        component sum1 = Sum(n-1);
        for (var i = 0; i < n-1; i++) {
            sum1.inputs[i] <== inputs[i];
        }
        out <== sum1.out + inputs[n-1];
    }
}

// Main component with support for up to 10 protocols (configurable for TrustBank)
component main = TrustBankDeFiTVLVerification(10);
