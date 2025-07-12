# TrustBank ZK Circuits

This directory contains Circom circuits for privacy-preserving crypto reputation verification for TrustBank's decentralized banking platform.

## Circuits Overview

### 1. DeFi TVL Verification (`defi_tvl.circom`)

Proves user has >= X amount of TVL across DeFi protocols without revealing exact amounts.

**Inputs:**

- `total_tvl` (private): User's actual TVL across all protocols
- `threshold` (public): Minimum TVL threshold to prove
- `protocols[]` (private): Array of protocol balances
- `merkle_proof[]` (private): Merkle proof of protocol data authenticity

**Outputs:**

- `valid`: 1 if total_tvl >= threshold, 0 otherwise

### 2. Lending History Verification (`lending_history.circom`)

Proves user has >= X successful loan repayments without revealing specific loans.

**Inputs:**

- `num_successful_loans` (private): Total number of successful repayments
- `threshold` (public): Minimum number of loans to prove
- `loan_hashes[]` (private): Array of loan transaction hashes
- `repayment_proofs[]` (private): Proofs of successful repayments

**Outputs:**

- `valid`: 1 if num_successful_loans >= threshold, 0 otherwise

### 3. Wallet Age Verification (`wallet_age.circom`)

Proves wallet age >= X days without revealing exact creation date.

**Inputs:**

- `first_tx_timestamp` (private): Timestamp of first transaction
- `current_timestamp` (public): Current timestamp
- `min_age_days` (public): Minimum age in days to prove

**Outputs:**

- `valid`: 1 if wallet age >= min_age_days, 0 otherwise

## Setup Instructions

1. Install Circom and snarkjs:

```bash
npm install -g circom_tester
npm install snarkjs
```

2. Compile circuits:

```bash
circom defi_tvl.circom --r1cs --wasm --sym -o build/
```

3. Generate trusted setup (for production):

```bash
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
```

4. Generate proving and verification keys:

```bash
snarkjs groth16 setup build/defi_tvl.r1cs pot12_final.ptau defi_tvl_0000.zkey
snarkjs zkey contribute defi_tvl_0000.zkey defi_tvl_final.zkey --name="1st Contributor Name" -v
```

5. Export verification key for Solidity:

```bash
snarkjs zkey export verificationkey defi_tvl_final.zkey verification_key.json
snarkjs zkey export solidityverifier defi_tvl_final.zkey DeFiTVLVerifier.sol
```

## Integration with TrustBank

The generated Solidity verifiers would replace the simplified `_verifyZKProof` function in `ZKCreditImport.sol`:

```solidity
import "./verifiers/DeFiTVLVerifier.sol";
import "./verifiers/LendingHistoryVerifier.sol";
import "./verifiers/WalletAgeVerifier.sol";

contract ZKCreditImport {
    DeFiTVLVerifier public immutable defiTVLVerifier;
    LendingHistoryVerifier public immutable lendingVerifier;
    WalletAgeVerifier public immutable walletAgeVerifier;

    function _verifyZKProof(ZKProof calldata zkProof, ReputationMetric metric, uint256 threshold)
        internal view returns (bool) {

        if (metric == ReputationMetric.DEFI_TVL) {
            return defiTVLVerifier.verifyProof(
                [zkProof.proof[0], zkProof.proof[1]], // a
                [[zkProof.proof[2], zkProof.proof[3]], [zkProof.proof[4], zkProof.proof[5]]], // b
                [zkProof.proof[6], zkProof.proof[7]], // c
                [threshold] // public inputs
            );
        }
        // ... handle other metrics
    }
}
```

## Security Considerations

1. **Trusted Setup**: For production, organize a multi-party ceremony
2. **Data Sources**: Integrate with Chainlink or The Graph for verified data
3. **Privacy**: Ensure circuits don't leak information through timing or constraints
4. **Nullifiers**: Use nullifiers to prevent double-spending of reputation proofs

## Development vs Production

**Current (Demo/Hackathon)**: Simplified verification in `ZKCreditImport.sol`
**Production**: Full Circom circuits with proper cryptographic proofs

The current implementation provides the contract structure and interface while allowing for seamless ZK upgrade later for TrustBank's production banking platform.
