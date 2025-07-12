#!/bin/bash

# TrustBank ZK Circuit Compilation Script
# Compiles Circom circuits and generates Solidity verifiers

echo "🔧 Compiling TrustBank ZK Circuits..."

# Create output directories
mkdir -p build/circuits
mkdir -p contracts/verifiers

# Compile circuits
echo "📦 Compiling DeFi TVL circuit..."
circom circuits/defi_tvl.circom --r1cs --wasm --sym -o build/circuits

echo "📦 Compiling Lending History circuit..."
circom circuits/lending_history.circom --r1cs --wasm --sym -o build/circuits

echo "📦 Compiling Wallet Age circuit..."
circom circuits/wallet_age.circom --r1cs --wasm --sym -o build/circuits

# Generate trusted setup (Powers of Tau ceremony)
echo "🔐 Setting up trusted ceremony..."
snarkjs powersoftau new bn128 14 build/circuits/pot14_0000.ptau -v
snarkjs powersoftau contribute build/circuits/pot14_0000.ptau build/circuits/pot14_0001.ptau --name="TrustBank Contribution" -v
snarkjs powersoftau prepare phase2 build/circuits/pot14_0001.ptau build/circuits/pot14_final.ptau -v

# Generate proving and verification keys for each circuit
echo "🔑 Generating proving keys..."

# DeFi TVL Circuit
snarkjs groth16 setup build/circuits/defi_tvl.r1cs build/circuits/pot14_final.ptau build/circuits/defi_tvl_0000.zkey
snarkjs zkey contribute build/circuits/defi_tvl_0000.zkey build/circuits/defi_tvl_final.zkey --name="DeFi TVL Final" -v
snarkjs zkey export verificationkey build/circuits/defi_tvl_final.zkey build/circuits/defi_tvl_verification_key.json
snarkjs zkey export solidityverifier build/circuits/defi_tvl_final.zkey contracts/verifiers/DeFiTVLVerifier.sol

# Lending History Circuit  
snarkjs groth16 setup build/circuits/lending_history.r1cs build/circuits/pot14_final.ptau build/circuits/lending_history_0000.zkey
snarkjs zkey contribute build/circuits/lending_history_0000.zkey build/circuits/lending_history_final.zkey --name="Lending History Final" -v
snarkjs zkey export verificationkey build/circuits/lending_history_final.zkey build/circuits/lending_history_verification_key.json
snarkjs zkey export solidityverifier build/circuits/lending_history_final.zkey contracts/verifiers/LendingHistoryVerifier.sol

# Wallet Age Circuit
snarkjs groth16 setup build/circuits/wallet_age.r1cs build/circuits/pot14_final.ptau build/circuits/wallet_age_0000.zkey
snarkjs zkey contribute build/circuits/wallet_age_0000.zkey build/circuits/wallet_age_final.zkey --name="Wallet Age Final" -v
snarkjs zkey export verificationkey build/circuits/wallet_age_final.zkey build/circuits/wallet_age_verification_key.json
snarkjs zkey export solidityverifier build/circuits/wallet_age_final.zkey contracts/verifiers/WalletAgeVerifier.sol

echo "✅ Circuit compilation complete!"
echo "📁 Generated files:"
echo "   - contracts/verifiers/DeFiTVLVerifier.sol"
echo "   - contracts/verifiers/LendingHistoryVerifier.sol" 
echo "   - contracts/verifiers/WalletAgeVerifier.sol"
echo ""
echo "🚀 Next steps:"
echo "   1. Uncomment verifier imports in ZKCreditImportProduction.sol"
echo "   2. Deploy verifier contracts"
echo "   3. Update ZKCreditImportProduction with verifier addresses"
echo "   4. Test ZK proof generation and verification"
