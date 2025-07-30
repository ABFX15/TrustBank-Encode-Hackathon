'use client'

// Import the properly extracted ABIs
import { TrustBankCoreABI, LiquidityPoolABI, MockUSDCABI } from '../../../src/contracts/abis';

// Contract addresses - NEWLY DEPLOYED with proper initialization
export const CONTRACTS = {
    MockUSDC: "0x8beC0937A6668FAA3a844047F1A9BaE0dCe0c759", // Existing working MockUSDC
    TrustBankCore: "0xEDD7B8c0084B9196F5a30ff89bB40e95638c2894", // ✅ Freshly deployed with proper setup
    YieldStrategy: "0xdd99dE366D7F3Bab80e8f5aD1fCdBF82621b0c10", // ✅ Freshly deployed with proper setup  
    LiquidityPool: "0x1d40b9B4B2801aa00C252e10cE8073103498b773", // ✅ Freshly deployed with proper setup
} as const;

// Use the properly extracted ABIs
export const MOCK_USDC_ABI = MockUSDCABI;
export const LIQUIDITY_POOL_ABI = LiquidityPoolABI;
export const TRUSTBANK_CORE_ABI = TrustBankCoreABI; 