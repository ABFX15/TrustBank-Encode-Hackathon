const fs = require('fs');
const path = require('path');

console.log('🔄 Extracting contract ABIs...');

// Define contract mappings
const contracts = [
    { file: 'TrustBankCore.sol/TrustBankCore.json', name: 'TrustBankCore' },
    { file: 'LiquidityPool.sol/LiquidityPool.json', name: 'LiquidityPool' },
    { file: 'TrustBankCreditEngine.sol/TrustBankCreditEngine.json', name: 'TrustBankCreditEngine' },
    { file: 'MockUSDC.sol/MockUSDC.json', name: 'MockUSDC' },
    { file: 'YieldStrategy.sol/YieldStrategy.json', name: 'YieldStrategy' },
    { file: 'SimpleCrossChainYield.sol/SimpleCrossChainYield.json', name: 'SimpleCrossChainYield' }
];

// Create output directory
const outputDir = path.join(__dirname, '..', 'frontend', 'src', 'contracts');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Start the TypeScript file
let output = `// Auto-generated contract ABIs
// Run npm run copy-abis to update

`;

// Extract each ABI
for (const contract of contracts) {
    const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', contract.file);

    try {
        if (fs.existsSync(artifactPath)) {
            console.log(`Extracting ABI for ${contract.name}...`);
            const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
            output += `export const ${contract.name}ABI = ${JSON.stringify(artifact.abi, null, 2)} as const;\n\n`;
        } else {
            console.log(`⚠️ Artifact not found for ${contract.name}`);
            output += `export const ${contract.name}ABI = [] as const;\n\n`;
        }
    } catch (error) {
        console.error(`Error processing ${contract.name}:`, error.message);
        output += `export const ${contract.name}ABI = [] as const;\n\n`;
    }
}

// Write the output file
const outputPath = path.join(outputDir, 'abis.ts');
fs.writeFileSync(outputPath, output);

console.log('✅ ABIs extracted successfully!');
console.log(`📍 File location: ${outputPath}`);
