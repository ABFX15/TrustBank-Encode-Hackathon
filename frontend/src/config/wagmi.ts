'use client';

import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { http } from 'viem';
import { mainnet, sepolia, hardhat } from 'viem/chains';

// Define Etherlink Testnet
export const etherlinkTestnet = {
    id: 128123,
    name: 'Etherlink Testnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://node.ghostnet.etherlink.com'] },
    },
    blockExplorers: {
        default: { name: 'Etherlink Explorer', url: 'https://testnet.explorer.etherlink.com' },
    },
    testnet: true,
} as const;

// 1. Get projectId from https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID'

// 2. Create a metadata object - optional
const metadata = {
    name: 'TrustBank',
    description: 'Trust-Based DeFi Banking Protocol',
    url: 'https://trustbank.defi', // origin must match your domain & subdomain
    icons: ['https://trustbank.defi/icon.png']
}

// 3. Set the networks
const networks = [
    etherlinkTestnet,
    ...(process.env.NODE_ENV === 'development' ? [hardhat, sepolia] : []),
]

// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
    networks,
    projectId,
    ssr: true
})

// 5. Create modal
createAppKit({
    adapters: [wagmiAdapter],
    networks,
    projectId,
    metadata,
    features: {
        analytics: true, // Optional - defaults to your Cloud configuration
    }
})

export const config = wagmiAdapter.wagmiConfig

// Contract addresses (these will be populated after deployment)
export const CONTRACT_ADDRESSES = {
    [etherlinkTestnet.id]: {
        MockUSDC: '0x687F68C22fbA79DbF6f45526d0a69cc9528302e2',
        TrustBankCore: '0x93AdBDd7c4af41ADe02dDF64c19660185B716467',
        TrustBankCreditEngine: '0x93AdBDd7c4af41ADe02dDF64c19660185B716467', // Same as TrustBankCore
        YieldStrategy: '0x3Bd6A15837D15cd87cA0db6dEBE4Dd3A1C5428ae',
        LiquidityPool: '0xc6AC40b9D695bDd472d84c0170f18C545a1B29b1',
        CrossChainInfra: '0x384B345a9E4561cB03d19FeBA12fCECD3A7bDa92',
        SimpleCrossChainYield: '0x0C319b5d3e894A60607c113bE97e482129De52AF',
        TrustBankCCIPCrossChain: '0x687F68C22fbA79DbF6f45526d0a69cc9528302e2',
    },
    // Local hardhat network addresses
    [1337]: {
        MockUSDC: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        TrustBankCore: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        TrustBankCreditEngine: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
        YieldStrategy: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
        LiquidityPool: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
        CrossChainInfra: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
        SimpleCrossChainYield: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
        TrustBankCCIPCrossChain: 'REPLACE_WITH_DEPLOYED_CCIP_ADDRESS',
    },
    // Add other networks as needed
} as const;

export const SUPPORTED_CHAINS = [etherlinkTestnet.id, 1337] as const;
export type SupportedChainId = typeof SUPPORTED_CHAINS[number];
