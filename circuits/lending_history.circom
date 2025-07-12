pragma circom 2.0.0;

/**
 * Lending History Verification Circuit
 * 
 * Proves that a user has successfully completed at least `threshold` number of loans
 * without revealing specific loan details or amounts.
 * 
 * Uses nullifiers to prevent double-counting of the same loan across proofs.
 */

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";

template LendingHistoryVerification(maxLoans) {
    // Private inputs
    signal private input loanIds[maxLoans];           // Unique loan identifiers
    signal private input repaymentProofs[maxLoans];   // Proofs of successful repayment
    signal private input loanMask[maxLoans];          // 1 if loan is counted, 0 otherwise
    signal private input nullifierSecret;            // Secret for nullifier generation
    
    // Public inputs
    signal input threshold;                          // Minimum number of loans to prove
    signal input timestamp;                          // Proof timestamp
    
    // Outputs
    signal output valid;                             // 1 if loan count >= threshold
    signal output nullifiers[maxLoans];              // Nullifiers to prevent double-spending
    
    // Calculate total number of successful loans
    component sumLoans = Sum(maxLoans);
    for (var i = 0; i < maxLoans; i++) {
        sumLoans.inputs[i] <== loanMask[i];
    }
    
    // Check if loan count meets threshold
    component gte = GreaterEqualThan(32);
    gte.in[0] <== sumLoans.out;
    gte.in[1] <== threshold;
    valid <== gte.out;
    
    // Generate nullifiers for each loan
    component nullifierHash[maxLoans];
    for (var i = 0; i < maxLoans; i++) {
        nullifierHash[i] = Poseidon(3);
        nullifierHash[i].inputs[0] <== loanIds[i];
        nullifierHash[i].inputs[1] <== nullifierSecret;
        nullifierHash[i].inputs[2] <== repaymentProofs[i];
        nullifiers[i] <== nullifierHash[i].out;
    }
    
    // Constraints: All inputs must be valid
    component validRepayment[maxLoans];
    for (var i = 0; i < maxLoans; i++) {
        // If loan is masked in, repayment proof must be non-zero
        validRepayment[i] = IsZero();
        validRepayment[i].in <== (1 - loanMask[i]) + repaymentProofs[i];
        validRepayment[i].out === 0;
    }
    
    // Constraint: Loan mask must be binary
    component binaryMask[maxLoans];
    for (var i = 0; i < maxLoans; i++) {
        binaryMask[i] = IsEqual();
        binaryMask[i].in[0] <== loanMask[i] * (loanMask[i] - 1);
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

// Main component with support for up to 50 loans
component main = LendingHistoryVerification(50);
