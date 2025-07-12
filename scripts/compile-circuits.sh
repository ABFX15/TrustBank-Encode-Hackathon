#!/bin/bash

# TrustBank ZK Circuits Compilation Script
# Compiles all Circom circuits and generates Solidity verifiers

set -e

echo "🔧 TrustBank ZK Circuit Compilation"
echo "=================================="

# Check dependencies
if ! command -v circom &> /dev/null; then
    echo "❌ Circom not found. Install with: npm install -g circom"
    exit 1
fi

if ! command -v snarkjs &> /dev/null; then
    echo "❌ snarkjs not found. Install with: npm install -g snarkjs"
    exit 1
fi

# Create build directories
mkdir -p build/circuits
mkdir -p contracts/verifiers

echo "📁 Created build directories"

# Compile circuits
echo "🔄 Compiling circuits..."

circuits=("defi_tvl" "lending_history" "wallet_age")

for circuit in "${circuits[@]}"; do
    echo "   📋 Compiling $circuit.circom..."
    circom "circuits/$circuit.circom" --r1cs --wasm --sym -o build/circuits
done

echo "✅ All circuits compiled successfully"

# Generate trusted setup if not exists
if [ ! -f "build/circuits/pot14_final.ptau" ]; then
    echo "🔐 Generating trusted setup (Powers of Tau)..."
    snarkjs powersoftau new bn128 14 build/circuits/pot14_0000.ptau > /dev/null
    snarkjs powersoftau contribute build/circuits/pot14_0000.ptau build/circuits/pot14_0001.ptau --name="TrustBank" > /dev/null
    snarkjs powersoftau prepare phase2 build/circuits/pot14_0001.ptau build/circuits/pot14_final.ptau > /dev/null
    echo "✅ Trusted setup complete"
else
    echo "✅ Using existing trusted setup"
fi

# Generate circuit-specific keys and verifiers
for circuit in "${circuits[@]}"; do
    echo "🔑 Generating keys for $circuit..."
    
    # Setup
    snarkjs groth16 setup "build/circuits/$circuit.r1cs" build/circuits/pot14_final.ptau "build/circuits/${circuit}_0000.zkey" > /dev/null
    
    # Contribute to ceremony
    snarkjs zkey contribute "build/circuits/${circuit}_0000.zkey" "build/circuits/${circuit}_final.zkey" --name="$circuit" > /dev/null
    
    # Generate verification key
    snarkjs zkey export verificationkey "build/circuits/${circuit}_final.zkey" "build/circuits/${circuit}_verification_key.json" > /dev/null
    
    # Generate Solidity verifier
    verifier_name=$(echo "$circuit" | sed 's/_//g' | sed 's/\b\w/\U&/g')
    snarkjs zkey export solidityverifier "build/circuits/${circuit}_final.zkey" "contracts/verifiers/${verifier_name}Verifier.sol" > /dev/null
    
    echo "   ✅ Generated ${verifier_name}Verifier.sol"
done

echo ""
echo "🎉 ZK Circuit compilation complete!"
echo ""
echo "Generated files:"
echo "   📁 build/circuits/ - Compiled circuits and keys"
echo "   📁 contracts/verifiers/ - Solidity verifier contracts"
echo ""
echo "Next steps:"
echo "   1. Run 'node scripts/generate-proofs.js' to test proof generation"
echo "   2. Deploy verifier contracts with your TrustBank deployment"
echo "   3. Update ZKCreditImportProduction.sol with verifier addresses"
echo ""
