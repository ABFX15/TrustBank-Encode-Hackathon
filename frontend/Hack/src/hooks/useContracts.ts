'use client'

// Contract addresses from Etherlink deployment
export const CONTRACTS = {
    MockUSDC: "0x8beC0937A6668FAA3a844047F1A9BaE0dCe0c759",
    TrustBankCore: "0x93AdBDd7c4af41ADe02dDF64c19660185B716467",
    YieldStrategy: "0x3Bd6A15837D15cd87cA0db6dEBE4Dd3A1C5428ae",
    LiquidityPool: "0xc6AC40b9D695bDd472d84c0170f18C545a1B29b1",
} as const;

// Simplified ABIs for the functions we need
export const MOCK_USDC_ABI = [
    {
        "inputs": [{ "name": "spender", "type": "address" }, { "name": "amount", "type": "uint256" }],
        "name": "approve",
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "account", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "faucet",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

export const LIQUIDITY_POOL_ABI = [
    {
        "inputs": [{ "name": "amount", "type": "uint256" }],
        "name": "addLiquidity",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "lpTokenAmount", "type": "uint256" }],
        "name": "removeLiquidity",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "user", "type": "address" }],
        "name": "userDeposits",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "name": "user", "type": "address" }],
        "name": "getClaimableYield",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "claimYield",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

export const TRUSTBANK_CORE_ABI = [
    {
        "inputs": [{ "name": "to", "type": "address" }, { "name": "amount", "type": "uint256" }, { "name": "message", "type": "string" }],
        "name": "sendPayment",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "user", "type": "address" }, { "name": "amount", "type": "uint256" }],
        "name": "vouchForUser",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "user", "type": "address" }],
        "name": "getUserTrustScore",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const; 