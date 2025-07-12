# TrustBank ZK Circuits

This directory contains the zero-knowledge circuits for TrustBank's privacy-preserving reputation verification system.

## Overview

TrustBank uses ZK-SNARKs to allow users to prove their DeFi reputation and creditworthiness without revealing sensitive financial information. The system supports three main reputation metrics:

1. **DeFi TVL** - Proves minimum Total Value Locked across DeFi protocols
2. **Lending History** - Proves successful completion of loan repayments
3. **Wallet Age** - Proves wallet has been active for a minimum time period

## Circuits

### 🏦 DeFi TVL Verification (`defi_tvl.circom`)

Proves that a user has at least a threshold amount of TVL across multiple DeFi protocols without revealing:

- Exact TVL amounts
- Which specific protocols are used
- Distribution of funds across protocols

### 📋 Lending History Verification (`lending_history.circom`)

Proves that a user has successfully completed at least a threshold number of loans without revealing:

- Specific loan amounts
- Loan terms or interest rates
- Exact repayment dates

**Features:**

- Nullifier system prevents double-counting loans
- Supports up to 50 historical loans
- Only counts successfully repaid loans

**Inputs:**

- Private: `loanIds[50]`, `repaymentProofs[50]`, `loanMask[50]`, `nullifierSecret`
- Public: `threshold`, `timestamp`
- Output: `valid`, `nullifiers[50]`

### 📅 Wallet Age Verification (`wallet_age.circom`)

Proves that a wallet has been active for at least a minimum number of days without revealing:

- Exact wallet creation date
- First transaction timestamp
- Specific transaction history

**Inputs:**

- Private: `firstTxTimestamp`, `walletSecret`
- Public: `currentTimestamp`, `minAgeDays`, `walletAddress`
- Output: `valid` (1 if age ≥ minAgeDays)

## Setup and Compilation

### Prerequisites

```bash
# Install Circom and snarkjs
npm install -g circom snarkjs

# Install dependencies
npm install
```

### Compile Circuits

Run the automated compilation script:

```bash
./scripts/compile-circuits.sh
```

This will:

1. Compile all Circom circuits to R1CS and WASM
2. Generate trusted setup parameters (Powers of Tau)
3. Create proving and verification keys
4. Generate Solidity verifier contracts

### Manual Compilation

```bash
# Compile individual circuits
circom circuits/defi_tvl.circom --r1cs --wasm --sym -o build/circuits
circom circuits/lending_history.circom --r1cs --wasm --sym -o build/circuits
circom circuits/wallet_age.circom --r1cs --wasm --sym -o build/circuits

# Generate trusted setup
snarkjs powersoftau new bn128 14 build/circuits/pot14_0000.ptau
snarkjs powersoftau contribute build/circuits/pot14_0000.ptau build/circuits/pot14_0001.ptau --name="TrustBank"
snarkjs powersoftau prepare phase2 build/circuits/pot14_0001.ptau build/circuits/pot14_final.ptau

# Generate circuit-specific keys
snarkjs groth16 setup build/circuits/defi_tvl.r1cs build/circuits/pot14_final.ptau build/circuits/defi_tvl_0000.zkey
snarkjs zkey contribute build/circuits/defi_tvl_0000.zkey build/circuits/defi_tvl_final.zkey --name="DeFi TVL"
snarkjs zkey export solidityverifier build/circuits/defi_tvl_final.zkey contracts/verifiers/DeFiTVLVerifier.sol
```

## Proof Generation

### JavaScript Example

```javascript
const snarkjs = require("snarkjs");

// Generate DeFi TVL proof
const input = {
  protocolBalances: [50000, 30000, 20000, 0, 0, 0, 0, 0, 0, 0], // $100k total
  protocolMask: [1, 1, 1, 0, 0, 0, 0, 0, 0, 0], // 3 protocols used
  threshold: 50000, // Prove ≥ $50k
  timestamp: Math.floor(Date.now() / 1000),
};

const { proof, publicSignals } = await snarkjs.groth16.fullProve(
  input,
  "build/circuits/defi_tvl.wasm",
  "build/circuits/defi_tvl_final.zkey"
);
```

### Solidity Integration

```solidity
// Submit proof to TrustBankZKCredit contract
contract.submitZKProof(
    ReputationMetric.DEFI_TVL,
    50000, // threshold
    CircomProof({
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
        c: [proof.pi_c[0], proof.pi_c[1]],
        publicSignals: publicSignals
    }),
    "ipfs://proof-metadata-hash"
);
```

## Security Considerations

### Trusted Setup

- Powers of Tau ceremony must be performed with multiple independent contributors
- Circuit-specific setup phase requires contribution from TrustBank team
- Verification keys are public and deterministic
- Proving keys must be kept secure but can be regenerated

### Privacy Guarantees

- Zero-knowledge: Proofs reveal nothing beyond the threshold being met
- Soundness: Impossible to generate valid proof for false statement
- Completeness: Honest provers can always generate valid proofs

### Nullifiers

- Lending history circuit uses nullifiers to prevent double-spending proofs
- Each loan can only be counted once across all proof submissions
- Nullifier secret should be unique per user and kept private

## Integration with TrustBank

### Contract Integration

1. Deploy generated verifier contracts
2. Update `ZKCreditImportProduction.sol` with verifier addresses
3. Uncomment verifier imports
4. Set reputation thresholds in TrustBankZKCredit

### Trust Score Boosts

- DeFi TVL: +25-100 trust score based on threshold
- Lending History: +50-150 trust score based on loan count
- Wallet Age: +50-150 trust score based on age tiers

### Workflow

1. User generates proof off-chain using their private data
2. User submits proof to TrustBankZKCredit contract
3. Contract verifies proof using Groth16 verifier
4. If valid, trust score boost is applied to user's TrustBank profile
5. Enhanced trust score enables better loan terms and higher limits

## Testing

```bash
# Run circuit tests
npm test

# Generate sample proofs
node scripts/generate-proofs.js

# Verify proofs
snarkjs groth16 verify build/circuits/defi_tvl_verification_key.json publicSignals.json proof.json
```

## Production Considerations

### Performance

- Proof generation: ~1-5 seconds per circuit
- Proof verification: ~5-10ms on-chain
- Circuit constraints: <100k for reasonable proving time

### Scalability

- Consider batch verification for multiple proofs
- Use recursive SNARKs for complex multi-circuit proofs
- Implement proof caching for repeated verifications

### Upgrades

- Circuits are immutable once deployed
- New reputation metrics require new circuits
- Version control circuit deployments carefully

## Resources

- [Circom Documentation](https://docs.circom.io/)
- [snarkjs Guide](https://github.com/iden3/snarkjs)
- [ZK-SNARKs Explained](https://ethereum.org/en/zero-knowledge-proofs/)
- [TrustBank Protocol Documentation](../README.md)

**Current (Demo/Hackathon)**: Simplified verification in `ZKCreditImport.sol`
**Production**: Full Circom circuits with proper cryptographic proofs

The current implementation provides the contract structure and interface while allowing for seamless ZK upgrade later for TrustBank's production banking platform.
