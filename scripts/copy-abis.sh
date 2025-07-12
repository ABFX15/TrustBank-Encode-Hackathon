#!/bin/bash

# Script to copy compiled contract ABIs to the frontend

# Ensure we're in the right directory
cd "$(dirname "$0")/.."

echo "🔄 Copying contract ABIs to frontend..."

# Define source and destination paths
ARTIFACTS_DIR="./artifacts/contracts"
FRONTEND_CONTRACTS_DIR="./frontend/src/contracts"

# Create the destination directory if it doesn't exist
mkdir -p "$FRONTEND_CONTRACTS_DIR"

# Function to extract ABI from artifact JSON
extract_abi() {
    local contract_file="$1"
    local contract_name="$2"
    
    if [ -f "$contract_file" ]; then
        echo "Extracting ABI for $contract_name..."
        # Use jq to extract just the ABI array
        jq '.abi' "$contract_file" > "/tmp/${contract_name}_abi.json"
        return 0
    else
        echo "⚠️  Warning: $contract_file not found"
        return 1
    fi
}

# Contract mappings (artifact_path:contract_name)
contracts=(
    "TrustBankCore.sol/TrustBankCore.json:TrustBankCore"
    "LiquidityPool.sol/LiquidityPool.json:LiquidityPool"
    "TrustBankCreditEngine.sol/TrustBankCreditEngine.json:TrustBankCreditEngine"
    "MockUSDC.sol/MockUSDC.json:MockUSDC"
    "YieldStrategy.sol/YieldStrategy.json:YieldStrategy"
    "SimpleCrossChainYield.sol/SimpleCrossChainYield.json:SimpleCrossChainYield"
)

# Extract ABIs
for contract_mapping in "${contracts[@]}"; do
    artifact_path="${contract_mapping%:*}"
    contract_name="${contract_mapping#*:}"
    full_path="$ARTIFACTS_DIR/$artifact_path"
    extract_abi "$full_path" "$contract_name"
done

# Generate the TypeScript ABI file
echo "📝 Generating TypeScript ABI file..."

cat > "$FRONTEND_CONTRACTS_DIR/abis.ts" << 'EOF'
// Auto-generated contract ABIs
// Run npm run copy-abis to update

EOF

for contract_mapping in "${contracts[@]}"; do
    contract_name="${contract_mapping#*:}"
    if [ -f "/tmp/${contract_name}_abi.json" ]; then
        echo "export const ${contract_name}ABI = " >> "$FRONTEND_CONTRACTS_DIR/abis.ts"
        cat "/tmp/${contract_name}_abi.json" >> "$FRONTEND_CONTRACTS_DIR/abis.ts"
        echo " as const;" >> "$FRONTEND_CONTRACTS_DIR/abis.ts"
        echo "" >> "$FRONTEND_CONTRACTS_DIR/abis.ts"
        
        # Clean up temp file
        rm "/tmp/${contract_name}_abi.json"
    else
        echo "export const ${contract_name}ABI = [] as const;" >> "$FRONTEND_CONTRACTS_DIR/abis.ts"
        echo "" >> "$FRONTEND_CONTRACTS_DIR/abis.ts"
    fi
done

echo "✅ ABIs copied successfully!"
echo "📍 File location: $FRONTEND_CONTRACTS_DIR/abis.ts"
